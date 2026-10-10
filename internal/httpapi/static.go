package httpapi

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"io/fs"
	"mime"
	"net/http"
	"path"
	"strconv"
	"strings"
	"sync"

	"github.com/ShirahaTobisa/z-dnd/web"
)

const (
	launchArtPath = "assets/art/generated/launch-ritual-moon-archive-v1.webp"
	launchPreload = "</assets/art/generated/launch-ritual-moon-archive-v1.webp>; rel=preload; as=image; type=image/webp; fetchpriority=high"
)

// staticAliases maps request paths that cannot be embedded under their original
// name to an embeddable on-disk name. go:embed rejects file names containing
// non-letter Unicode punctuation (golang.org/issue/54003), so the default BGM
// asset is stored as rainy-alley-night.mp3 and aliased back to its runtime URL.
var staticAliases = map[string]string{
	"assets/audio/雨夜（街巷）.mp3": "assets/audio/rainy-alley-night.mp3",
}

// canonicalStaticName resolves a request-relative path through staticAliases.
func canonicalStaticName(name string) string {
	if alias, ok := staticAliases[name]; ok {
		return alias
	}
	return name
}

// staticCacheControl 决定浏览器缓存方式。页面、脚本、样式、数据文件的网址不带版本号，
// 必须每次和服务器核对（没变回 304），否则更新后新页面会配上旧脚本而黑屏；图片、字体、音乐长缓存。
func staticCacheControl(name string) string {
	if name == launchArtPath {
		return "public, max-age=31536000, immutable"
	}
	switch strings.ToLower(strings.TrimPrefix(path.Ext(name), ".")) {
	case "html", "js", "css", "json", "webmanifest":
		return "no-cache"
	case "svg", "webp", "png", "jpg", "jpeg", "gif", "woff2", "mp3":
		return "public, max-age=604800, stale-while-revalidate=86400"
	default:
		return ""
	}
}

// applyStaticSecurityHeaders mirrors the security headers from the old
// root .htaccess. CSP intentionally omits script-src because the app loads
// Vue/marked/DOMPurify and friends from CDNs.
func applyStaticSecurityHeaders(h http.Header) {
	h.Set("X-Content-Type-Options", "nosniff")
	h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
	h.Set("X-Frame-Options", "SAMEORIGIN")
	h.Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
	h.Set("X-Permitted-Cross-Domain-Policies", "none")
	h.Set("Content-Security-Policy", "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'")
}

// staticContentType resolves the MIME type for an embedded file name.
func staticContentType(name string) string {
	if ct := mime.TypeByExtension(strings.ToLower(path.Ext(name))); ct != "" {
		return ct
	}
	return "application/octet-stream"
}

// isCompressible reports whether the response type should be gzip-compressed.
// Already-compressed binary types are excluded.
func isCompressible(name, contentType string) bool {
	switch strings.ToLower(strings.TrimPrefix(path.Ext(name), ".")) {
	case "webp", "png", "jpg", "jpeg", "gif", "mp3", "woff2":
		return false
	}
	mediaType := contentType
	if i := strings.IndexByte(mediaType, ';'); i >= 0 {
		mediaType = strings.TrimSpace(mediaType[:i])
	}
	return strings.HasPrefix(mediaType, "text/") ||
		mediaType == "application/json" ||
		mediaType == "application/javascript" ||
		mediaType == "image/svg+xml" ||
		mediaType == "application/manifest+json"
}

// resolveStaticPath maps a URL path to an embedded file name.
func resolveStaticPath(urlPath string) string {
	cleaned := path.Clean("/" + strings.TrimPrefix(urlPath, "/"))
	name := strings.TrimPrefix(cleaned, "/")
	if name == "" {
		return "index.html"
	}
	if strings.HasSuffix(urlPath, "/") {
		name = path.Join(name, "index.html")
	}
	return name
}

// openStatic opens an embedded file, resolving directories to their index.html.
func openStatic(name string) (fs.File, fs.FileInfo, bool) {
	f, err := web.FS.Open(name)
	if err != nil {
		return nil, nil, false
	}
	info, err := f.Stat()
	if err != nil {
		_ = f.Close()
		return nil, nil, false
	}
	if info.IsDir() {
		_ = f.Close()
		f, err = web.FS.Open(path.Join(name, "index.html"))
		if err != nil {
			return nil, nil, false
		}
		info, err = f.Stat()
		if err != nil {
			_ = f.Close()
			return nil, nil, false
		}
	}
	return f, info, true
}

// isNavigation reports whether an unknown path should fall back to the SPA
// shell (extensionless paths) rather than a 404 page.
func isNavigation(urlPath string) bool {
	base := path.Base(urlPath)
	if base == "/" || base == "." {
		return true
	}
	return path.Ext(base) == ""
}

// handleStatic serves the embedded frontend at the URL root. API and .php
// paths are never served as static files.
func (s *Server) handleStatic(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		errorJSON(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	if strings.HasSuffix(r.URL.Path, ".php") {
		errorJSON(w, http.StatusNotFound, "Not found")
		return
	}

	name := canonicalStaticName(resolveStaticPath(r.URL.Path))
	f, info, ok := openStatic(name)
	if !ok {
		if isNavigation(r.URL.Path) {
			name = "index.html"
			f, info, ok = openStatic(name)
		}
		if !ok {
			s.serve404Page(w, r)
			return
		}
	}
	s.serveEmbedded(w, r, name, f, info)
}

// staticEntry 是一个嵌入文件的内容、gzip 版本和 ETag，第一次请求时算好后一直复用。
type staticEntry struct {
	raw, gz []byte
	etag    string
}

var staticCache sync.Map // name → *staticEntry

func loadStatic(name string, f fs.File, compressible bool) (*staticEntry, error) {
	if v, ok := staticCache.Load(name); ok {
		return v.(*staticEntry), nil
	}
	raw, err := io.ReadAll(f)
	if err != nil {
		return nil, err
	}
	sum := sha256.Sum256(raw)
	e := &staticEntry{raw: raw, etag: `"` + hex.EncodeToString(sum[:8]) + `"`}
	if compressible {
		if gz, err := gzipBytes(raw); err == nil && len(gz) < len(raw) {
			e.gz = gz
		}
	}
	v, _ := staticCache.LoadOrStore(name, e)
	return v.(*staticEntry), nil
}

// serveEmbedded writes one embedded file with caching, security and
// compression headers applied. 浏览器带着相同 ETag 来核对时回 304。
func (s *Server) serveEmbedded(w http.ResponseWriter, r *http.Request, name string, f fs.File, info fs.FileInfo) {
	defer f.Close()

	contentType := staticContentType(name)
	entry, err := loadStatic(name, f, isCompressible(name, contentType))
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "Internal server error")
		return
	}
	h := w.Header()
	applyStaticSecurityHeaders(h)
	if cc := staticCacheControl(name); cc != "" {
		h.Set("Cache-Control", cc)
	}
	h.Set("Content-Type", contentType)
	h.Set("ETag", entry.etag)
	if name == "index.html" {
		h.Set("Link", launchPreload)
	}

	if entry.gz == nil {
		// 不压缩的文件（图片、音乐）交给 ServeContent：处理 304 和分段请求（音乐拖动进度）
		http.ServeContent(w, r, name, info.ModTime(), bytes.NewReader(entry.raw))
		return
	}
	h.Set("Vary", "Accept-Encoding")
	if strings.Contains(r.Header.Get("If-None-Match"), entry.etag) {
		w.WriteHeader(http.StatusNotModified)
		return
	}
	body := entry.raw
	if strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
		h.Set("Content-Encoding", "gzip")
		body = entry.gz
	}
	h.Set("Content-Length", strconv.Itoa(len(body)))
	w.WriteHeader(http.StatusOK)
	if r.Method != http.MethodHead {
		_, _ = w.Write(body)
	}
}

// serve404Page serves web/404.html with a 404 status when available.
func (s *Server) serve404Page(w http.ResponseWriter, r *http.Request) {
	f, info, ok := openStatic("404.html")
	if !ok {
		http.NotFound(w, r)
		return
	}
	defer f.Close()
	applyStaticSecurityHeaders(w.Header())
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Content-Type", staticContentType("404.html"))
	w.WriteHeader(http.StatusNotFound)
	if r.Method == http.MethodHead {
		return
	}
	raw, err := io.ReadAll(f)
	if err != nil {
		return
	}
	_, _ = w.Write(raw)
	_ = info
}

// gzipBytes compresses data with gzip.
func gzipBytes(data []byte) ([]byte, error) {
	var buf bytes.Buffer
	zw := gzip.NewWriter(&buf)
	if _, err := zw.Write(data); err != nil {
		return nil, err
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
