package model

import "time"

type Wallet struct {
	ChannelID string `json:"channel_id"`
	Amount    int64  `json:"amount"`
	Currency  string `json:"currency"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
