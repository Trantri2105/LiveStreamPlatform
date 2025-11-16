package request

type CreateSubscriptionRequest struct {
	ChannelID           string `json:"channel_id" binding:"required"`
	NotificationEnabled bool   `json:"notification_enabled" binding:"required"`
}
