package routes

import (
	"auth-service/internal/api/handler"
	"auth-service/internal/api/middleware"
	"auth-service/internal/model"

	"github.com/gin-gonic/gin"
)

func SetUpUserRoutes(r *gin.Engine, h handler.UserHandler, m middleware.AuthMiddleware) {
	userRoutes := r.Group("/users")
	userRoutes.GET("/:id", m.ValidateAndExtractJwt(), m.CheckUserRole(model.RoleAdmin), h.GetUserByID())
	userRoutes.GET("/me", m.ValidateAndExtractJwt(), h.GetMe())
	userRoutes.PUT("/me/password", m.ValidateAndExtractJwt(), h.UpdateUserPassword())
	userRoutes.PATCH("/me", m.ValidateAndExtractJwt(), h.UpdateUserInfo())
	userRoutes.GET("", m.ValidateAndExtractJwt(), m.CheckUserRole(model.RoleAdmin), h.GetUsers())
}
