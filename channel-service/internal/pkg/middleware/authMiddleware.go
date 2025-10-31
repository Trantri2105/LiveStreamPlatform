package middleware

import "github.com/gin-gonic/gin"

type AuthMiddleware interface {
	ValidateAndExtractJwt() gin.HandlerFunc
	CheckUserPermission(requiredRole string) gin.HandlerFunc
}

// Role Admin, User
// UserID

const (
	JWTClaimsContextKey = "JWTClaimsContextKey"
)

type authMiddleware struct{}

func (a authMiddleware) ValidateAndExtractJwt() gin.HandlerFunc {
	//TODO implement me
	panic("implement me")
}

func (a authMiddleware) CheckUserPermission(requiredRole string) gin.HandlerFunc {
	//TODO implement me
	panic("implement me")
}

func NewAuthMiddleware() AuthMiddleware {
	return &authMiddleware{}
}
