// Package ratelimit 是按「IP + 用途」计数的固定窗口限速，计数放在内存里。
// 只跑一个实例，不需要放数据库；原来每次请求要读写两次 api_rate_limits 表，并发时还会漏算。
package ratelimit

import (
	"context"
	"sync"
	"time"
)

type bucket struct {
	start time.Time
	hits  int
}

type Limiter struct {
	mu      sync.Mutex
	buckets map[string]*bucket
	swept   time.Time
}

func New() *Limiter {
	return &Limiter{buckets: make(map[string]*bucket)}
}

// Check 记一次访问；超过 limit 时返回 false 和需要等待的秒数。
func (l *Limiter) Check(_ context.Context, ip, scope string, limit, windowSeconds int) (allowed bool, retryAfter int) {
	if limit < 1 {
		limit = 1
	}
	if windowSeconds < 10 {
		windowSeconds = 10
	}
	window := time.Duration(windowSeconds) * time.Second
	now := time.Now()
	key := ip + ":" + scope

	l.mu.Lock()
	defer l.mu.Unlock()
	// 每分钟清一次过期的计数，防止内存一直涨
	if now.Sub(l.swept) > time.Minute {
		for k, b := range l.buckets {
			if now.Sub(b.start) > time.Hour {
				delete(l.buckets, k)
			}
		}
		l.swept = now
	}
	b := l.buckets[key]
	if b == nil || now.Sub(b.start) >= window {
		l.buckets[key] = &bucket{start: now, hits: 1}
		return true, 0
	}
	if b.hits >= limit {
		return false, max(1, int((window - now.Sub(b.start)).Seconds()))
	}
	b.hits++
	return true, 0
}
