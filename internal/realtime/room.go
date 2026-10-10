package realtime

import (
	"context"
	"sort"
	"sync"
	"time"

	"github.com/ShirahaTobisa/z-dnd/internal/store"
	"github.com/coder/websocket"
)

// client 是一条活跃的 WebSocket 连接。发送走带缓冲的 send 通道，由写泵串行写出，
// 避免多 goroutine 并发写同一连接。
type client struct {
	ws        *websocket.Conn
	roomID    string
	userID    string
	hostToken string
	roomInfo  *store.Room // hello 时抓取的房间快照（主机鉴权用）
	send      chan []byte
	cancel    context.CancelFunc
	closed    chan struct{}
	closeOnce sync.Once

	// 发送限速（固定窗口），只在读泵里读写
	windowStart time.Time
	sent        int
}

// enqueue 非阻塞投递一帧；缓冲满（慢消费者）直接断开连接。
func (c *client) enqueue(data []byte) bool {
	select {
	case <-c.closed:
		return false
	default:
	}
	select {
	case c.send <- data:
		return true
	case <-c.closed:
		return false
	default:
		c.close()
		return false
	}
}

// enqueueWait 等缓冲有空位再投递（续传补发用）：一次补发几百条会超过缓冲，
// 用 enqueue 会被当成慢消费者断开，断线重连后永远补不完。
func (c *client) enqueueWait(ctx context.Context, data []byte) bool {
	select {
	case c.send <- data:
		return true
	case <-c.closed:
		return false
	case <-ctx.Done():
		return false
	}
}

// close 幂等地取消上下文、关闭底层连接，从而结束读写泵。
func (c *client) close() {
	c.closeOnce.Do(func() {
		close(c.closed)
		c.cancel()
		_ = c.ws.CloseNow()
	})
}

// room 是一个房间在本实例内的连接集合。
type room struct {
	id      string
	mu      sync.Mutex
	clients map[*client]struct{}
}

func newRoom(id string) *room {
	return &room{id: id, clients: make(map[*client]struct{})}
}

func (r *room) add(c *client) {
	r.mu.Lock()
	r.clients[c] = struct{}{}
	r.mu.Unlock()
}

// remove 移除连接并报告房间是否已空。
func (r *room) remove(c *client) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.clients, c)
	return len(r.clients) == 0
}

// snapshot 返回当前连接的副本，避免持锁发送。
func (r *room) snapshot() []*client {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := make([]*client, 0, len(r.clients))
	for c := range r.clients {
		out = append(out, c)
	}
	return out
}

// broadcast 向房间内所有连接投递一帧。
func (r *room) broadcast(data []byte) {
	for _, c := range r.snapshot() {
		c.enqueue(data)
	}
}

// connectedUsers 返回当前有活跃连接的成员（去重）。
func (r *room) connectedUsers() []string {
	seen := map[string]bool{}
	var out []string
	for _, c := range r.snapshot() {
		if !seen[c.userID] {
			seen[c.userID] = true
			out = append(out, c.userID)
		}
	}
	return out
}

// closeAll 断开房间内所有连接。
func (r *room) closeAll() {
	for _, c := range r.snapshot() {
		c.close()
	}
}

func sortMembers(members []Member) {
	sort.Slice(members, func(i, j int) bool { return members[i].UserID < members[j].UserID })
}
