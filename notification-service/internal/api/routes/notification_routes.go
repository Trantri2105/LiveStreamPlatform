package routes

import (
	"notification-service/internal/api/handler"

	"github.com/gin-gonic/gin"
)

func SetUpNotificationRoutes(r *gin.Engine, h handler.NotificationHandler) {
	privateNotifRoutes := r.Group("/notifications")
	privateNotifRoutes.GET("", h.GetNotifications())
	privateNotifRoutes.PUT("/read", h.MarkNotificationsAsRead())
}
