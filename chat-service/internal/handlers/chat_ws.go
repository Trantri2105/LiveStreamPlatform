package handlers

import (
	"net/http"
	"thanhnt208/chat-service/internal/auth"
	"thanhnt208/chat-service/internal/models"
	"thanhnt208/chat-service/internal/realtime"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

type ChatWS struct {
	DB       *gorm.DB
	Hub      *realtime.Hub
	Upgrader websocket.Upgrader
	Clock    realtime.ClockCfg
	JWTKey   []byte
}

func NewChatWS(db *gorm.DB, hub *realtime.Hub, up websocket.Upgrader, clk realtime.ClockCfg, jwtKey []byte) *ChatWS {
	return &ChatWS{DB: db, Hub: hub, Upgrader: up, Clock: clk, JWTKey: jwtKey}
}

func (h *ChatWS) Handle(w http.ResponseWriter, r *http.Request) {
	streamID := mux.Vars(r)["streamId"]

	var thread models.ChatThread
	if err := h.DB.First(&thread, "stream_id = ? AND active = ?", streamID, true).Error; err != nil {
		http.Error(w, "Stream not found", http.StatusNotFound)
		return
	}

	claims, err := auth.ParseJWTFromRequest(r, h.JWTKey)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	conn, err := h.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	client := realtime.NewClient(conn, streamID, claims.UserID, claims.Username, h.Clock, h.Hub)
	th := h.Hub.GetOrCreateThreadHub(streamID)
	th.Register <- client

	go realtime.SendHistory(h.Hub, client, streamID, 50)
	go client.WritePump()
	go client.ReadPump(th)
}
