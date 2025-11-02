package routes

import (
	"auth-service/internal/api/handler"
	"auth-service/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

func SetUpAuthRoutes(r *gin.Engine, handler handler.AuthHandler, m middleware.AuthMiddleware) {
	authRoutes := r.Group("/auth")
	authRoutes.POST("/register", handler.Register())
	authRoutes.POST("/login", handler.Login())
	authRoutes.POST("/logout", m.ValidateAndExtractJwt(), handler.Logout())
	authRoutes.POST("/refresh", handler.Refresh())
	authRoutes.GET("/verify", m.ValidateAndExtractJwt(), handler.VerifyToken())
}
