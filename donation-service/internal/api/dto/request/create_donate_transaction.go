package request

type CreateDonateTransactionRequest struct {
	ChannelID     string `json:"channel_id" binding:"required"`
	StreamID      string `json:"stream_id" binding:"required"`
	Amount        *int64 `json:"amount" binding:"required"`
	DonateMessage string `json:"donate_message" binding:"required"`
}
