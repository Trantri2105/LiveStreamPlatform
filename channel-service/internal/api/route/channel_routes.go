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
}
