package model

import "time"

const (
	StatusStreamInit = "init"
	StatusStreamLive = "live"
	StatusStreamEnd  = "end"
)

type Stream struct {
	ID             string    `json:"id"`
	Title          string    `json:"title"`
	HlsURL         string    `json:"hls_url"`
	RecordURL      string    `json:"record_url"`
	LiveChatURL    string    `json:"live_chat_url"`
	SrtServerURL   string    `json:"srt_server_url"`
	StreamKey      string    `json:"stream_key"`
	Description    string    `json:"description,omitempty"`
	Status         string    `json:"status"`
	ChannelID      string    `json:"channel_id"`
	ChannelTitle   string    `json:"channel_title" gorm:"-"`
	CategoryID     string    `json:"category_id"`
	CategoryTitle  string    `json:"category_title" gorm:"-"`
	ThumbnailURL   string    `json:"thumbnail_url" gorm:"-"`
	ToxicThreshold float64   `json:"toxic_threshold" gorm:"default:0.5"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

