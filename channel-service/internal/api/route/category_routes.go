package route

import (
	"channel-service/internal/api/handler"

	"github.com/gin-gonic/gin"
)

func SetUpCategoryRoutes(r *gin.Engine, h handler.CategoryHandler) {
	channelRoutes := r.Group("/public/categories")
	channelRoutes.GET("/:id", h.GetCategoryByID())
	channelRoutes.POST("/search", h.GetCategoryBySearchText())
}
