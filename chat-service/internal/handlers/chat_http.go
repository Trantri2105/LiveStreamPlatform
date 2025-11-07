package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"thanhnt208/chat-service/internal/auth"
	"thanhnt208/chat-service/internal/models"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

type ChatHTTP struct {
	DB *gorm.DB
}

func NewChatHTTP(db *gorm.DB) *ChatHTTP {
	return &ChatHTTP{DB: db}
}

func (h *ChatHTTP) CreateChatThread(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StreamID string `json:"stream_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request: "+err.Error(), http.StatusBadRequest)
		return
	}
	req.StreamID = strings.TrimSpace(req.StreamID)
	if req.StreamID == "" {
		http.Error(w, "stream_id required", http.StatusBadRequest)
		return
	}

	_ = r.Context().Value(auth.CtxUserKey)

	thread := models.ChatThread{
		ID:        uuid.NewString(),
		StreamID:  req.StreamID,
		CreatedAt: time.Now(),
		Active:    true,
	}
	if err := h.DB.Create(&thread).Error; err != nil {
		http.Error(w, "db error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	resp := map[string]string{
		"ws_url": "/ws/chat/" + thread.StreamID,
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func (h *ChatHTTP) GetThreadMessages(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	streamID := vars["streamId"]

	var messages []models.Message
	if err := h.DB.Where("stream_id = ?", streamID).
		Order("created_at DESC").Limit(100).Find(&messages).Error; err != nil {
		http.Error(w, "db error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(messages)
}

func (h *ChatHTTP) CloseThread(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	streamID := vars["streamId"]

	if err := h.DB.Model(&models.ChatThread{}).
		Where("id = ? AND active = ?", streamID, true).
		Update("active", false).Error; err != nil {
		http.Error(w, "db error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "closed"})
}
