package model

import (
	"time"

	"gorm.io/datatypes"
)

type Notification struct {
	ID        string            `json:"id"`
	ChannelID string            `json:"channelID_id"`
	Type      string            `json:"type"`
	Title     string            `json:"title"`
	Body      string            `json:"body"`
	Data      datatypes.JSONMap `json:"data" gorm:"type:jsonb"`
	IsRead    bool              `json:"is_read"`
	CreatedAt time.Time         `json:"created_at"`
	UpdatedAt time.Time         `json:"updated_at"`
}
