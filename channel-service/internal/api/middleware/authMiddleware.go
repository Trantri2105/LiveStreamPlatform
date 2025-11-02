package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type AuthMiddleware interface {
	CheckUserPermission(requiredRole string) gin.HandlerFunc
}

const (
	JWTClaimsContextKey = "JWTClaimsContextKey"
)

type authMiddleware struct{}

func (a authMiddleware) CheckUserPermission(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.Request.Header.Get("X-User-Role")
		if len(role) == 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message": "X-User-Role header is empty",
			})
			return
		}
		if role != requiredRole {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message": "Permission denied",
			})
			return
		}
		c.Next()
	}
}

func NewAuthMiddleware() AuthMiddleware {
	return &authMiddleware{}
}
