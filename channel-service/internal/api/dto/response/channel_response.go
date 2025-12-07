package response

import "time"

type ChannelResponse struct {
	ID                string    `json:"id"`
	Title             string    `json:"title"`
	Description       string    `json:"description"`
	AvatarURL         string    `json:"avatar_url"`
	BackgroundURL     string    `json:"background_url"`
	SubscriptionCount int       `json:"subscription_count"`
	IsLive            *bool     `json:"is_live"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}
