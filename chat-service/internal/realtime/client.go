package realtime

import (
	"encoding/json"
	"strings"
	"thanhnt208/chat-service/internal/models"
	"time"

	"github.com/gorilla/websocket"
)

type ClockCfg struct {
	MaxWSReadBytes int64
	ReadDeadline   time.Duration
	WriteDeadline  time.Duration
	PingPeriod     time.Duration
}

type Client struct {
	conn     *websocket.Conn
	streamID string
	userID   string
	role     string
	send     chan []byte
	clock    ClockCfg
	hub      *Hub
}

func NewClient(conn *websocket.Conn, streamID, userID, role string, clk ClockCfg, hub *Hub) *Client {
	return &Client{
		conn:     conn,
		streamID: streamID,
		userID:   userID,
		role:     role,
		send:     make(chan []byte, 256),
		clock:    clk,
		hub:      hub,
	}
}

func (c *Client) ReadPump(th *ThreadHub) {
	defer func() {
		th.unregister <- c
		_ = c.conn.Close()
	}()

	c.conn.SetReadLimit(c.clock.MaxWSReadBytes)
	_ = c.conn.SetReadDeadline(time.Now().Add(c.clock.ReadDeadline))
	c.conn.SetPongHandler(func(string) error {
		_ = c.conn.SetReadDeadline(time.Now().Add(c.clock.ReadDeadline))
		return nil
	})

	for {
		mt, message, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		if mt != websocket.TextMessage {
			continue
		}

		var msg map[string]any
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}
		content, _ := msg["content"].(string)
		content = strings.TrimSpace(content)
		if content == "" {
			continue
		}
		if len(content) > 4000 {
			content = content[:4000]
		}

		go SaveMessage(c.hub, models.Message{
			StreamID:  c.streamID,
			UserID:    c.userID,
			Username:  c.role,
			Content:   content,
			CreatedAt: time.Now(),
		})

		broadcast := map[string]any{
			"type":      "message",
			"user_id":   c.userID,
			"role":      c.role,
			"content":   content,
			"timestamp": time.Now().Unix(),
		}
		if b, err := json.Marshal(broadcast); err == nil {
			th.broadcast <- b
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(c.clock.PingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(c.clock.WriteDeadline))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			if _, err := w.Write(msg); err != nil {
				_ = w.Close()
				return
			}
			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(c.clock.WriteDeadline))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
