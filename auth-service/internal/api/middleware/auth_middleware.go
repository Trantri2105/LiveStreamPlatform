package middleware

import (
	"auth-service/internal/api/dto/response"
	"auth-service/internal/jwt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	jwt2 "github.com/golang-jwt/jwt"
)

type AuthMiddleware interface {
	ValidateAndExtractJwt() gin.HandlerFunc
	CheckUserRole(requiredRole string) gin.HandlerFunc
}

const (
	JWTClaimsContextKey = "JWTClaimsContextKey"
)

type authMiddleware struct {
	jwt jwt.Utils
}

func (a *authMiddleware) ValidateAndExtractJwt() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if len(authHeader) == 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, response.Response{Message: "Authorization header is empty"})
			return
		}
		header := strings.Fields(authHeader)
		if len(header) != 2 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, response.Response{Message: "Authorization header is invalid"})
			return
		}
		if header[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, response.Response{Message: "Authorization header is invalid"})
			return
		}
		accessToken := header[1]
		claims, err := a.jwt.VerifyToken(accessToken)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, response.Response{Message: "Invalid access token"})
			return
		}
		c.Set(JWTClaimsContextKey, claims)
		c.Next()
	}
}

func (a *authMiddleware) CheckUserRole(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims := c.Value(JWTClaimsContextKey).(jwt2.MapClaims)
		role := claims["role"].(string)
		if role != requiredRole {
			c.AbortWithStatusJSON(http.StatusUnauthorized, response.Response{Message: "Permission denied"})
			return
		}
		c.Next()
	}
}

func NewAuthMiddleware(jwt jwt.Utils) AuthMiddleware {
	return &authMiddleware{jwt: jwt}
}
