package request

type ReadNotificationReq struct {
	NotificationIDs []string `json:"notification_ids" binding:"required"`
}
