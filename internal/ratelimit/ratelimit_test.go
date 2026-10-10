package ratelimit

import (
	"context"
	"testing"
)

func TestLimiter(t *testing.T) {
	l := New()
	for i := 0; i < 3; i++ {
		if ok, _ := l.Check(context.Background(), "1.1.1.1", "pull", 3, 60); !ok {
			t.Fatalf("hit %d should pass", i+1)
		}
	}
	if ok, retry := l.Check(context.Background(), "1.1.1.1", "pull", 3, 60); ok || retry < 1 {
		t.Fatalf("4th hit should be limited, got ok=%v retry=%d", ok, retry)
	}
	if ok, _ := l.Check(context.Background(), "2.2.2.2", "pull", 3, 60); !ok {
		t.Fatal("other IP must have its own quota")
	}
	if ok, _ := l.Check(context.Background(), "1.1.1.1", "push", 3, 60); !ok {
		t.Fatal("other scope must have its own quota")
	}
}
