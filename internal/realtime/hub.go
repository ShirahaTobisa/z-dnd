package realtime

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/url"
	"runtime/debug"
	"sync"
	"time"

	"github.com/ShirahaTobisa/z-dnd/internal/config"
	"github.com/ShirahaTobisa/z-dnd/internal/roommsg"
	"github.com/ShirahaTobisa/z-dnd/internal/store"
	"github.com/ShirahaTobisa/z-dnd/internal/validate"
	"github.com/coder/websocket"
)

const (
	sendBufferSize = 256
	pingInterval   = 30 * time.Second // 服务端 WS ping 周期
	pongTimeout    = 60 * time.Second // 约 2 个心跳周期内未收到 pong 即断开
	writeTimeout   = 10 * time.Second
	helloTimeout   = 10 * time.Second // 连上后必须在这段时间内发 hello

	// 在线状态：每 30 秒把在线连接写进 coc_room_presence 并续房间寿命，
	// 这样 HTTP 轮询方、大厅列表和过期清理看到的在线状态与 WS 一致。
	presenceInterval = 30 * time.Second
	onlineWindow     = 180 * time.Second // 与前端判断离线的阈值一致

	// 每条连接的发送限速：与 HTTP push 的 600 次 / 5 分钟同量级
	sendWindow = time.Minute
	sendLimit  = 120

	resumeMaxPages = 20 // 续传最多补发 20 页（每页 PollLimit 条）
	roomCloseDelay = 500 * time.Millisecond
)

// Hub 是本实例的房间连接注册表：map[roomID]*room。
type Hub struct {
	mu     sync.Mutex
	rooms  map[string]*room
	closed bool
	done   chan struct{}

	cfg     *config.Config
	store   *store.Store
	logger  *slog.Logger
	origins []string // AcceptOptions.OriginPatterns 需要的是主机名，不是完整 Origin

	wg sync.WaitGroup
}

// New 构造一个每实例唯一的 Hub，并启动在线状态刷新。
func New(cfg *config.Config, st *store.Store, logger *slog.Logger) *Hub {
	h := &Hub{
		rooms:   make(map[string]*room),
		done:    make(chan struct{}),
		cfg:     cfg,
		store:   st,
		logger:  logger,
		origins: originHosts(cfg.AllowedOrigins),
	}
	h.wg.Add(1)
	go func() {
		defer h.wg.Done()
		h.presenceLoop()
	}()
	return h
}

// originHosts 把 "https://example.com"、"capacitor://localhost" 这类完整 Origin 转成主机名。
func originHosts(origins []string) []string {
	out := make([]string, 0, len(origins))
	for _, o := range origins {
		if u, err := url.Parse(o); err == nil && u.Host != "" {
			out = append(out, u.Host)
		} else {
			out = append(out, o)
		}
	}
	return out
}

// ServeHTTP 处理 /room_ws 的 WebSocket 升级与整条连接生命周期。
func (h *Hub) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// 允许同源；跨域仅放行 APP_ALLOWED_ORIGINS 中的来源。
	ws, err := websocket.Accept(w, r, &websocket.AcceptOptions{OriginPatterns: h.origins})
	if err != nil {
		return
	}
	h.serveConn(ws)
}

func (h *Hub) serveConn(ws *websocket.Conn) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	defer ws.CloseNow()
	defer func() {
		if rec := recover(); rec != nil {
			h.logger.Error("realtime panic recovered", "panic", rec, "stack", string(debug.Stack()))
		}
	}()

	ws.SetReadLimit(h.cfg.MaxPayloadBytes + 32768)

	if h.isClosed() {
		h.reject(ctx, ws, roommsg.CodeRoomNotFound, "Server shutting down")
		return
	}

	hf, err := h.readHello(ctx, ws)
	if err != nil {
		h.reject(ctx, ws, roommsg.CodeInvalidMessage, "Expected hello frame")
		return
	}
	roomID, ok := validate.RoomID(hf.RoomID)
	if !ok {
		h.reject(ctx, ws, roommsg.CodeInvalidMessage, "Invalid room id")
		return
	}
	userID, ok := validate.SenderID(hf.UserID)
	if !ok {
		h.reject(ctx, ws, roommsg.CodeInvalidMessage, "Invalid sender")
		return
	}
	info, err := h.store.GetActiveRoom(ctx, roomID, h.cfg.RoomTTLHours)
	if err != nil || info == nil {
		h.reject(ctx, ws, roommsg.CodeRoomNotFound, "Room not found or expired")
		return
	}
	_ = h.store.TouchRoom(ctx, roomID)
	_ = h.store.UpsertPresence(ctx, roomID, userID)
	lastID, err := h.store.MaxMessageID(ctx, roomID)
	if err != nil {
		lastID = 0
	}

	c := &client{
		ws:        ws,
		roomID:    roomID,
		userID:    userID,
		hostToken: hf.HostToken,
		roomInfo:  info,
		send:      make(chan []byte, sendBufferSize),
		cancel:    cancel,
		closed:    make(chan struct{}),
	}

	rm := h.register(c)
	if rm == nil {
		h.reject(ctx, ws, roommsg.CodeRoomNotFound, "Server shutting down")
		return
	}

	sendFrame(c, readyFrame{Type: TypeReady, LastID: lastID, Members: h.members(ctx, rm)})
	h.broadcastPresence(ctx, roomID)

	go func() {
		defer h.wg.Done()
		defer h.recoverPump()
		h.writePump(ctx, c)
	}()
	go func() {
		defer h.wg.Done()
		defer h.recoverPump()
		h.pingPump(ctx, c)
	}()

	h.readPump(ctx, c)

	h.removeClient(c)
	c.close()
}

// readHello 读取首帧并要求其为 hello；超时未收到就断开，避免空连接一直占着。
func (h *Hub) readHello(ctx context.Context, ws *websocket.Conn) (clientFrame, error) {
	hctx, cancel := context.WithTimeout(ctx, helloTimeout)
	defer cancel()
	for {
		typ, data, err := ws.Read(hctx)
		if err != nil {
			return clientFrame{}, err
		}
		if typ != websocket.MessageText {
			continue
		}
		var f clientFrame
		if err := json.Unmarshal(data, &f); err != nil {
			return clientFrame{}, err
		}
		if f.Type != TypeHello {
			return clientFrame{}, errors.New("expected hello frame")
		}
		return f, nil
	}
}

// readPump 串行读取并分发后续帧；ctx 结束或读错误时返回。
func (h *Hub) readPump(ctx context.Context, c *client) {
	for {
		typ, data, err := c.ws.Read(ctx)
		if err != nil {
			return
		}
		if typ != websocket.MessageText {
			continue
		}
		h.handleFrame(ctx, c, data)
	}
}

func (h *Hub) handleFrame(ctx context.Context, c *client, data []byte) {
	var f clientFrame
	if err := json.Unmarshal(data, &f); err != nil {
		sendFrame(c, errorFrame{Type: TypeError, Code: roommsg.CodeInvalidMessage, Message: "Invalid JSON"})
		return
	}
	switch f.Type {
	case TypePing:
		sendFrame(c, controlFrame{Type: TypePong})
	case TypeSend:
		h.handleSend(ctx, c, f)
	case TypeResume:
		h.handleResume(ctx, c, f)
	default:
		sendFrame(c, errorFrame{Type: TypeError, Code: roommsg.CodeInvalidMessage, Message: "Unknown frame type"})
	}
}

// allowSend 是每条连接的固定窗口限速（只在读泵里调用，无需加锁）。
func (c *client) allowSend(now time.Time) bool {
	if now.Sub(c.windowStart) >= sendWindow {
		c.windowStart, c.sent = now, 0
	}
	c.sent++
	return c.sent <= sendLimit
}

func (h *Hub) handleSend(ctx context.Context, c *client, f clientFrame) {
	if !c.allowSend(time.Now()) {
		sendFrame(c, errorFrame{Type: TypeError, Code: "RATE_LIMITED", Message: "Too many requests"})
		return
	}
	var raw any
	present := len(f.Payload) > 0
	if present {
		if err := json.Unmarshal(f.Payload, &raw); err != nil {
			sendFrame(c, errorFrame{Type: TypeError, Code: roommsg.CodeInvalidMessage, Message: "Invalid payload"})
			return
		}
	}
	_, payloadJSON, verr := roommsg.ValidatePush(
		raw, present, c.userID, c.hostToken,
		c.roomInfo.HostID, c.roomInfo.HostTokenHash, h.cfg.MaxPayloadBytes,
	)
	if verr != nil {
		sendFrame(c, errorFrame{Type: TypeError, Code: verr.Code, Message: verr.Message})
		return
	}

	newID, err := h.store.InsertMessage(ctx, c.roomID, c.userID, string(payloadJSON))
	if err != nil {
		sendFrame(c, errorFrame{Type: TypeError, Code: roommsg.CodeInvalidMessage, Message: "Message send failed"})
		return
	}
	_ = h.store.PruneMessages(ctx, c.roomID, h.cfg.MaxRoomMessages)
	_ = h.store.TouchRoom(ctx, c.roomID)
	h.Publish(c.roomID, newID, c.userID, payloadJSON)
}

// Publish 把一条已落库的消息推给该房间的所有 WS 连接。
// HTTP push 写库后也要调用，否则走 HTTP 回退的玩家发的消息 WS 玩家收不到。
func (h *Hub) Publish(roomID string, id int64, senderID string, payloadJSON []byte) {
	data, err := marshalFrame(messageFrame{Type: TypeMessage, ID: id, SenderID: senderID, Payload: json.RawMessage(payloadJSON)})
	if err != nil {
		return
	}
	h.broadcast(roomID, data)
}

// CloseRoom 通知并断开房间里的所有 WS 连接（房主解散、管理员关闭房间时调用）。
// 前端收到 ROOM_NOT_FOUND 后会像 HTTP 拉取到 404 一样退出房间。
func (h *Hub) CloseRoom(roomID string) {
	h.mu.Lock()
	rm := h.rooms[roomID]
	delete(h.rooms, roomID)
	h.mu.Unlock()
	if rm == nil {
		return
	}
	if data, err := marshalFrame(errorFrame{Type: TypeError, Code: roommsg.CodeRoomNotFound, Message: "Room closed"}); err == nil {
		rm.broadcast(data)
	}
	// 稍等再断开：立刻断开会把还在发送队列里的通知丢掉，前端就不知道房间没了
	time.AfterFunc(roomCloseDelay, rm.closeAll)
}

// handleResume 补发 since 之后的消息；消息多于一页时继续翻页，避免断线久了漏消息。
func (h *Hub) handleResume(ctx context.Context, c *client, f clientFrame) {
	lastID := f.Since
	if lastID < 0 {
		lastID = 0
	}
	for page := 0; page < resumeMaxPages; page++ {
		rows, err := h.store.ListMessages(ctx, c.roomID, lastID, h.cfg.PollLimit)
		if err != nil {
			sendFrame(c, errorFrame{Type: TypeError, Code: roommsg.CodeRoomNotFound, Message: "Room not found or expired"})
			return
		}
		for _, row := range rows {
			if frame, err := marshalFrame(messageFrame{Type: TypeMessage, ID: row.ID, SenderID: row.SenderID, Payload: rawPayload(row.Payload)}); err == nil {
				if !c.enqueueWait(ctx, frame) {
					return
				}
			}
			lastID = row.ID
		}
		if len(rows) < h.cfg.PollLimit {
			break
		}
	}
	sendFrame(c, resumedFrame{Type: TypeResumed, LastID: lastID})
}

// writePump 串行把 send 通道中的帧写到连接。
func (h *Hub) writePump(ctx context.Context, c *client) {
	for {
		select {
		case <-ctx.Done():
			return
		case <-c.closed:
			return
		case data := <-c.send:
			wctx, cancel := context.WithTimeout(ctx, writeTimeout)
			err := c.ws.Write(wctx, websocket.MessageText, data)
			cancel()
			if err != nil {
				c.close()
				return
			}
		}
	}
}

// pingPump 周期性发送 WS ping，超时未收到 pong 则断开连接。
func (h *Hub) pingPump(ctx context.Context, c *client) {
	ticker := time.NewTicker(pingInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-c.closed:
			return
		case <-ticker.C:
			pctx, cancel := context.WithTimeout(ctx, pongTimeout)
			err := c.ws.Ping(pctx)
			cancel()
			if err != nil {
				c.close()
				return
			}
		}
	}
}

// presenceLoop 定时刷新各房间在线连接的 presence、续房间寿命，并广播合并后的在线名单。
func (h *Hub) presenceLoop() {
	ticker := time.NewTicker(presenceInterval)
	defer ticker.Stop()
	for {
		select {
		case <-h.done:
			return
		case <-ticker.C:
			ctx, cancel := context.WithTimeout(context.Background(), presenceInterval)
			h.mu.Lock()
			rooms := make([]*room, 0, len(h.rooms))
			for _, rm := range h.rooms {
				rooms = append(rooms, rm)
			}
			h.mu.Unlock()
			for _, rm := range rooms {
				for _, userID := range rm.connectedUsers() {
					_ = h.store.UpsertPresence(ctx, rm.id, userID)
				}
				_ = h.store.TouchRoom(ctx, rm.id)
				h.broadcastPresence(ctx, rm.id)
			}
			cancel()
		}
	}
}

// members 合并两种在线来源：本实例的 WS 连接，以及数据库里最近活跃的成员（走 HTTP 轮询的玩家）。
func (h *Hub) members(ctx context.Context, rm *room) []Member {
	online := map[string]bool{}
	if rows, err := h.store.ListPresence(ctx, rm.id); err == nil {
		cutoff := time.Now().Add(-onlineWindow).Unix()
		for _, p := range rows {
			online[p.UserID] = p.SeenAt >= cutoff
		}
	}
	for _, userID := range rm.connectedUsers() {
		online[userID] = true
	}
	out := make([]Member, 0, len(online))
	for userID, on := range online {
		out = append(out, Member{UserID: userID, Online: on})
	}
	sortMembers(out)
	return out
}

// register 把连接归组到对应房间；Hub 已关闭时返回 nil。
func (h *Hub) register(c *client) *room {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.closed {
		return nil
	}
	rm := h.rooms[c.roomID]
	if rm == nil {
		rm = newRoom(c.roomID)
		h.rooms[c.roomID] = rm
	}
	rm.add(c)
	h.wg.Add(2)
	return rm
}

func (h *Hub) removeClient(c *client) {
	h.mu.Lock()
	rm := h.rooms[c.roomID]
	empty := false
	if rm != nil {
		empty = rm.remove(c)
		if empty {
			delete(h.rooms, c.roomID)
		}
	}
	h.mu.Unlock()
	if rm != nil && !empty {
		ctx, cancel := context.WithTimeout(context.Background(), writeTimeout)
		h.broadcastPresence(ctx, c.roomID)
		cancel()
	}
}

func (h *Hub) broadcast(roomID string, data []byte) {
	h.mu.Lock()
	rm := h.rooms[roomID]
	h.mu.Unlock()
	if rm != nil {
		rm.broadcast(data)
	}
}

func (h *Hub) broadcastPresence(ctx context.Context, roomID string) {
	h.mu.Lock()
	rm := h.rooms[roomID]
	h.mu.Unlock()
	if rm == nil {
		return
	}
	data, err := marshalFrame(presenceFrame{Type: TypePresence, Members: h.members(ctx, rm)})
	if err != nil {
		return
	}
	rm.broadcast(data)
}

func (h *Hub) isClosed() bool {
	h.mu.Lock()
	defer h.mu.Unlock()
	return h.closed
}

// Close 停止 Hub 的所有连接与后台 goroutine。
func (h *Hub) Close() {
	h.mu.Lock()
	if h.closed {
		h.mu.Unlock()
		return
	}
	h.closed = true
	close(h.done)
	rooms := make([]*room, 0, len(h.rooms))
	for _, r := range h.rooms {
		rooms = append(rooms, r)
	}
	h.rooms = make(map[string]*room)
	h.mu.Unlock()

	for _, r := range rooms {
		r.closeAll()
	}
	h.wg.Wait()
}

// reject 发送错误帧后以策略关闭握手，用于 hello 阶段失败。
func (h *Hub) reject(ctx context.Context, ws *websocket.Conn, code, message string) {
	if data, err := marshalFrame(errorFrame{Type: TypeError, Code: code, Message: message}); err == nil {
		wctx, cancel := context.WithTimeout(ctx, writeTimeout)
		_ = ws.Write(wctx, websocket.MessageText, data)
		cancel()
	}
	_ = ws.Close(websocket.StatusPolicyViolation, code)
}

func (h *Hub) recoverPump() {
	if rec := recover(); rec != nil {
		h.logger.Error("realtime pump panic recovered", "panic", rec, "stack", string(debug.Stack()))
	}
}

func sendFrame(c *client, v any) {
	data, err := marshalFrame(v)
	if err != nil {
		return
	}
	c.enqueue(data)
}

// rawPayload 透传落库的 payload 文本；非法 JSON 退回 null（对齐 HTTP pull）。
func rawPayload(s string) json.RawMessage {
	if json.Valid([]byte(s)) {
		return json.RawMessage(s)
	}
	return json.RawMessage("null")
}

// marshalFrame 紧凑编码并禁用 HTML 转义，保持与落库 payload 一致。
func marshalFrame(v any) ([]byte, error) {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(v); err != nil {
		return nil, err
	}
	return bytes.TrimRight(buf.Bytes(), "\n"), nil
}
