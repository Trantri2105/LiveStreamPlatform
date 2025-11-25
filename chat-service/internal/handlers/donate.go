package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"thanhnt208/chat-service/internal/models"
	"thanhnt208/chat-service/internal/realtime"
	"time"
)

type DonateTransaction struct {
	ID             string    `json:"id"`
	ChannelID      string    `json:"channel_id"`
	StreamID       string    `json:"stream_id"`
	Amount         int64     `json:"amount"`
	DonorChannelID string    `json:"donor_channel_id"`
	DonateMessage  string    `json:"donate_message"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func HandleDonateMessage(donate DonateTransaction, hub *realtime.Hub) {
	th := hub.GetOrCreateThreadHub(donate.StreamID)
	if th == nil {
		log.Printf("streamID=%s not found for donate=%s", donate.StreamID, donate.ID)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	username, err := fetchChannelTitle(ctx, donate.DonorChannelID)
	if err != nil {
		log.Printf("fetch username for donorChannelID=%s failed: %v", donate.DonorChannelID, err)
		username = "unknown"
	}

	content := strings.TrimSpace(donate.DonateMessage)
	if content == "" {
		content = fmt.Sprintf("donated %d coins", donate.Amount)
	}

	msg := map[string]any{
		"type":      "donate",
		"user_id":   donate.DonorChannelID,
		"username":  username,
		"amount":    donate.Amount,
		"content":   content,
		"timestamp": donate.CreatedAt.Unix(),
		"id":        donate.ID,
	}

	b, _ := json.Marshal(msg)
	th.Broadcast(b)

	go realtime.SaveMessage(hub, models.Message{
		StreamID:  donate.StreamID,
		UserID:    donate.DonorChannelID,
		Username:  username,
		Content:   content,
		CreatedAt: donate.CreatedAt,
	})
}
