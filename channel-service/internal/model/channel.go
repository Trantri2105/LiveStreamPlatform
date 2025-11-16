package model

import "time"

type Channel struct {
	ID                string `json:"id"`
	Title             string `json:"title"`
	Description       string `json:"description"`
	AvatarURL         string `json:"avatar_url" gorm:"-"`
	SubscriptionCount int    `json:"subscription_count"`
	IsLive            bool   `json:"is_live"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
}
