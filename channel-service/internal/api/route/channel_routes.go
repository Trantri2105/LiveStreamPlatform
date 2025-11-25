package route

import (
	"channel-service/internal/api/handler"

	"github.com/gin-gonic/gin"
)

func SetUpChannelRoutes(r *gin.Engine, h handler.ChannelHandler) {
	publicChannelRoutes := r.Group("/public/channels")
	publicChannelRoutes.GET("/:id", h.GetChannelByID())
	publicChannelRoutes.POST("/search", h.GetChannelBySearchText())

	privateChannelRoutes := r.Group("/channels")
	privateChannelRoutes.POST("", h.CreateChannel())
	privateChannelRoutes.PATCH("/self", h.UpdateChannelByID())
	privateChannelRoutes.PUT("/self/avatar", h.SetChannelAvatar())
	privateChannelRoutes.POST("/subscription", h.CreateSubscription())
	privateChannelRoutes.DELETE("/subscription/:id", h.DeleteSubscription())
	privateChannelRoutes.GET("/follower", h.GetChannelFollower())
	privateChannelRoutes.GET("/following", h.GetFollowingChannel())
	privateChannelRoutes.PATCH("/subscription/:id", h.UpdateSubscription())
	privateChannelRoutes.GET("/subscription/:id", h.GetSubscriptionByChannelID())
	privateChannelRoutes.PUT("/self/background", h.SetBackgroundImage())
}
