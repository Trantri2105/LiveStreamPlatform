package response

type SubscriptionResponse struct {
	FollowerID          string `json:"follower_id"`
	ChannelID           string `json:"channel_id"`
	NotificationEnabled *bool  `json:"notification_enabled"`
}
