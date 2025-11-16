package response

type ChannelResponse struct {
	ID                string `json:"id"`
	Title             string `json:"title"`
	Description       string `json:"description"`
	AvatarURL         string `json:"avatar_url"`
	SubscriptionCount int    `json:"subscription_count"`
	IsLive            bool   `json:"is_live"`
}
