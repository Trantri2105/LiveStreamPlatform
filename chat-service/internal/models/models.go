package models

import "time"

type ChatThread struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	StreamID  string    `gorm:"index"     json:"stream_id"`
	CreatedAt time.Time `json:"created_at"`
	Active    bool      `json:"active"`
}

type Message struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	StreamID  string    `gorm:"index"  json:"stream_id"`
	UserID    string    `json:"user_id"`
	Username  string    `json:"username"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}
