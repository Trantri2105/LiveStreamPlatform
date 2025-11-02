package route

import (
	"channel-service/internal/api/handler"

	"github.com/gin-gonic/gin"
)

func SetUpStreamRoutes(r *gin.Engine, h handler.StreamHandler) {
	publicStreamRoutes := r.Group("/public/streams")
	publicStreamRoutes.GET("/:id", h.GetStreamByID())
	publicStreamRoutes.POST("/search", h.GetStreamBySearchText())
	publicStreamRoutes.GET("/channels/:id", h.GetStreamByChannelID())

	privateStreamRoutes := r.Group("/streams")
	privateStreamRoutes.POST("", h.CreateStream())
	privateStreamRoutes.POST("/notify", h.OVMNotify())
}
