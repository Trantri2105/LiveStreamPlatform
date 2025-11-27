package response

import "time"

type DonateTxRes struct {
	ID             string    `json:"id"`
	ChannelID      string    `json:"channel_id"`
	StreamID       string    `json:"stream_id"`
	Amount         int64     `json:"amount"`
	DonorChannelID string    `json:"donor_channel_id"`
	DonateMessage  string    `json:"donate_message"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
}
