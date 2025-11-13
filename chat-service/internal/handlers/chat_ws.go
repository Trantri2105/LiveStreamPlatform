package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"thanhnt208/chat-service/internal/auth"
	"thanhnt208/chat-service/internal/models"
	"thanhnt208/chat-service/internal/realtime"
	"time"

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

	client := realtime.NewClient(conn, streamID, claims.UserID, h.Clock, h.Hub)
	th := h.Hub.GetOrCreateThreadHub(streamID)
	th.Register <- client

	userID := claims.UserID

	go func(uid string) {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if username, err := fetchChannelTitle(ctx, uid); err != nil {
			log.Printf("fetch username by channelId(userID=%s) failed: %v", uid, err)
			return
		} else {
			client.Username = username
		}
	}(userID)

	go realtime.SendHistory(h.Hub, client, streamID, 50)
	go client.WritePump()
	go client.ReadPump(th)
}

const channelAPIBase = "http://channel-service:8080"

var sharedHTTPClient = &http.Client{Timeout: 2 * time.Second}

func fetchChannelTitle(ctx context.Context, channelID string) (string, error) {
	url := fmt.Sprintf("%s/public/channels/%s", channelAPIBase, channelID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}

	resp, err := sharedHTTPClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		io.Copy(io.Discard, resp.Body)
		return "", fmt.Errorf("channel api status %d", resp.StatusCode)
	}

	var payload struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return "", fmt.Errorf("decode body: %w", err)
	}
	return payload.Title, nil
}
