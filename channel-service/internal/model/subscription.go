package model

import "time"

type Subscription struct {
	FollowerID          string `json:"follower_id"`
	ChannelID           string `json:"channel_id"`
	NotificationEnabled *bool  `json:"notification_enabled"`
	CreatedAt           time.Time
	UpdatedAt           time.Time
}
