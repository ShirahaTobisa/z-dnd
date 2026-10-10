package httpapi

import (
	"net/http/httptest"
	"testing"
)

func TestClientIPBehindProxy(t *testing.T) {
	cases := []struct{ remote, xff, want string }{
		{"203.0.113.9:5000", "1.2.3.4", "203.0.113.9"},               // 直连公网：不信任请求头
		{"172.19.0.3:5000", "198.51.100.7", "198.51.100.7"},          // 经内网代理：取真实地址
		{"172.19.0.3:5000", "6.6.6.6, 198.51.100.7", "198.51.100.7"}, // 客户端伪造的左侧地址不采用
		{"127.0.0.1:5000", "", "127.0.0.1"},
	}
	for _, c := range cases {
		r := httptest.NewRequest("GET", "/", nil)
		r.RemoteAddr = c.remote
		if c.xff != "" {
			r.Header.Set("X-Forwarded-For", c.xff)
		}
		if got := clientIP(r); got != c.want {
			t.Errorf("clientIP(%s, %q) = %s, want %s", c.remote, c.xff, got, c.want)
		}
	}
}

func TestStaticCacheControl(t *testing.T) {
	for name, want := range map[string]string{
		"index.html":                  "no-cache",
		"assets/js/dnd/commands.js":   "no-cache",
		"assets/css/tailwind.css":     "no-cache",
		"assets/data/items-2014.json": "no-cache",
		"favicon.svg":                 "public, max-age=604800, stale-while-revalidate=86400",
		launchArtPath:                 "public, max-age=31536000, immutable",
	} {
		if got := staticCacheControl(name); got != want {
			t.Errorf("staticCacheControl(%s) = %q, want %q", name, got, want)
		}
	}
}
