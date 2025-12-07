package route

import (
	"channel-service/internal/api/handler"
	"channel-service/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

const RoleAdmin = "admin"

func SetUpCategoryRoutes(r *gin.Engine, h handler.CategoryHandler) {
	m := middleware.NewAuthMiddleware()
	channelRoutes := r.Group("/public/categories")
	channelRoutes.GET("/:id", h.GetCategoryByID())
	channelRoutes.POST("/search", h.GetCategoryBySearchText())

	privateChannelRoutes := r.Group("/categories")
	privateChannelRoutes.POST("", m.CheckUserPermission(RoleAdmin), h.CreateCategory())
	privateChannelRoutes.PUT("/:id/image", m.CheckUserPermission(RoleAdmin), h.SetImage())
	privateChannelRoutes.DELETE("/:id", m.CheckUserPermission(RoleAdmin), h.DeleteCategory())
}
