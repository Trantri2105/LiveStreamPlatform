package response

type WalletResponse struct {
	ChannelID string `json:"channel_id"`
	Amount    int64  `json:"amount"`
	Currency  string `json:"currency"`
}
