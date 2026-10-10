package realtime

import (
	"reflect"
	"testing"
)

func TestOriginHosts(t *testing.T) {
	got := originHosts([]string{"https://dnd.mornye.uk", "capacitor://localhost", "https://localhost"})
	want := []string{"dnd.mornye.uk", "localhost", "localhost"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("originHosts = %v, want %v", got, want)
	}
}
