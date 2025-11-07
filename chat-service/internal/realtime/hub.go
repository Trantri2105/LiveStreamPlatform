package realtime

import (
	"encoding/json"
	"log"
	"sync"
	"thanhnt208/chat-service/internal/models"

	"gorm.io/gorm"
)

type Hub struct {
	threads map[string]*ThreadHub
	mu      sync.RWMutex
	DB      *gorm.DB
}

type ThreadHub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	Register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub(db *gorm.DB) *Hub {
	return &Hub{
		threads: make(map[string]*ThreadHub),
		DB:      db,
	}
}

func (h *Hub) GetOrCreateThreadHub(streamID string) *ThreadHub {
	h.mu.Lock()
	defer h.mu.Unlock()

	if th, ok := h.threads[streamID]; ok {
		return th
	}
	th := &ThreadHub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		Register:   make(chan *Client),
		unregister: make(chan *Client),
	}
	h.threads[streamID] = th
	go th.run()
	return th
}

func (th *ThreadHub) run() {
	for {
		select {
		case c := <-th.Register:
			th.mu.Lock()
			th.clients[c] = true
			n := len(th.clients)
			th.mu.Unlock()
			log.Printf("[thread %s] +client (total=%d)", c.streamID, n)

		case c := <-th.unregister:
			th.mu.Lock()
			if _, ok := th.clients[c]; ok {
				delete(th.clients, c)
				close(c.send)
			}
			n := len(th.clients)
			th.mu.Unlock()
			log.Printf("[thread %s] -client (total=%d)", c.streamID, n)

		case msg := <-th.broadcast:
			th.mu.RLock()
			for c := range th.clients {
				select {
				case c.send <- msg:
				default:
					close(c.send)
					delete(th.clients, c)
				}
			}
			th.mu.RUnlock()
		}
	}
}

func SendHistory(h *Hub, c *Client, streamID string, limit int) {
	var messages []models.Message
	if err := h.DB.Where("stream_id = ?", streamID).
		Order("created_at DESC").Limit(limit).Find(&messages).Error; err != nil {
		log.Println("history load error:", err)
		return
	}
	for i := len(messages) - 1; i >= 0; i-- {
		payload := map[string]any{
			"type":      "history",
			"user_id":   messages[i].UserID,
			"content":   messages[i].Content,
			"timestamp": messages[i].CreatedAt.Unix(),
		}
		if b, err := json.Marshal(payload); err == nil {
			select {
			case c.send <- b:
			default:
				return
			}
		}
	}
}

func SaveMessage(h *Hub, m models.Message) {
	if err := h.DB.Create(&m).Error; err != nil {
		log.Println("DB create message error:", err)
	}
}
