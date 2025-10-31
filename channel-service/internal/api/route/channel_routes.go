package route

import (
	"channel-service/internal/api/handler"
	"channel-service/internal/pkg/middleware"

	"github.com/gin-gonic/gin"
)

func SetUpChannelRoutes(r *gin.Engine, h handler.ChannelHandler, m middleware.AuthMiddleware) {
	channelRoutes := r.Group("/channels")
	channelRoutes.POST("", m.ValidateAndExtractJwt(), m.CheckUserPermission("admin"), h.CreateChannel())
	channelRoutes.PATCH("/self", m.ValidateAndExtractJwt(), h.UpdateChannelByID())
	channelRoutes.GET("/:id", h.GetChannelByID())
	channelRoutes.POST("/search", h.GetChannelBySearchText())
}
