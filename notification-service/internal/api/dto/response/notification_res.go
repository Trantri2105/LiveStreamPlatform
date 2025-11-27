package response

import (
	"time"

	"gorm.io/datatypes"
)

type NotificationResp struct {
	ID        string            `json:"id"`
	ChannelID string            `json:"channel_id"`
	Type      string            `json:"type"`
	Title     string            `json:"title"`
	Body      string            `json:"body"`
	Data      datatypes.JSONMap `json:"data" gorm:"type:jsonb"`
	IsRead    bool              `json:"is_read"`
	CreatedAt time.Time         `json:"created_at"`
}
