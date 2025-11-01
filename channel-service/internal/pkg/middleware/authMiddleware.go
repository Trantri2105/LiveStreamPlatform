package middleware

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"net/http"
	"strings"
)

type AuthMiddleware interface {
	ValidateAndExtractJwt() gin.HandlerFunc
	CheckUserPermission(requiredRole string) gin.HandlerFunc
}

// Role Admin, User
// UserID
// accessToken =eyJhbGciOiJSUzI1NiIsImtpZCI6ImNlcnQtYnVpbHQtaW4iLCJ0eXAiOiJKV1QifQ.eyJvd25lciI6ImJ1aWx0LWluIiwibmFtZSI6ImFkbWluIiwiY3JlYXRlZFRpbWUiOiIyMDI1LTExLTAxVDE0OjQwOjI4WiIsInVwZGF0ZWRUaW1lIjoiIiwiZGVsZXRlZFRpbWUiOiIiLCJpZCI6ImM4Y2UzMGNjLTk5OGUtNDcyMS04MTljLWNiZWU2OGE2M2IyMiIsInR5cGUiOiJub3JtYWwtdXNlciIsInBhc3N3b3JkIjoiIiwicGFzc3dvcmRTYWx0IjoiIiwicGFzc3dvcmRUeXBlIjoicGxhaW4iLCJkaXNwbGF5TmFtZSI6IkFkbWluIiwiZmlyc3ROYW1lIjoiIiwibGFzdE5hbWUiOiIiLCJhdmF0YXIiOiJodHRwczovL2Nkbi5jYXNiaW4ub3JnL2ltZy9jYXNiaW4uc3ZnIiwiYXZhdGFyVHlwZSI6IiIsInBlcm1hbmVudEF2YXRhciI6IiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJlbWFpbFZlcmlmaWVkIjpmYWxzZSwicGhvbmUiOiIxMjM0NTY3ODkxMCIsImNvdW50cnlDb2RlIjoiVVMiLCJyZWdpb24iOiIiLCJsb2NhdGlvbiI6IiIsImFkZHJlc3MiOltdLCJhZmZpbGlhdGlvbiI6IkV4YW1wbGUgSW5jLiIsInRpdGxlIjoiIiwiaWRDYXJkVHlwZSI6IiIsImlkQ2FyZCI6IiIsImhvbWVwYWdlIjoiIiwiYmlvIjoiIiwibGFuZ3VhZ2UiOiIiLCJnZW5kZXIiOiIiLCJiaXJ0aGRheSI6IiIsImVkdWNhdGlvbiI6IiIsInNjb3JlIjoyMDAwLCJrYXJtYSI6MCwicmFua2luZyI6MSwiaXNEZWZhdWx0QXZhdGFyIjpmYWxzZSwiaXNPbmxpbmUiOmZhbHNlLCJpc0FkbWluIjp0cnVlLCJpc0ZvcmJpZGRlbiI6ZmFsc2UsImlzRGVsZXRlZCI6ZmFsc2UsInNpZ251cEFwcGxpY2F0aW9uIjoiYXBwLWJ1aWx0LWluIiwiaGFzaCI6IiIsInByZUhhc2giOiIiLCJyZWdpc3RlclR5cGUiOiJBZGQgVXNlciIsInJlZ2lzdGVyU291cmNlIjoiYnVpbHQtaW4vYWRtaW4iLCJhY2Nlc3NLZXkiOiIiLCJhY2Nlc3NTZWNyZXQiOiIiLCJnaXRodWIiOiIiLCJnb29nbGUiOiIiLCJxcSI6IiIsIndlY2hhdCI6IiIsImZhY2Vib29rIjoiIiwiZGluZ3RhbGsiOiIiLCJ3ZWlibyI6IiIsImdpdGVlIjoiIiwibGlua2VkaW4iOiIiLCJ3ZWNvbSI6IiIsImxhcmsiOiIiLCJnaXRsYWIiOiIiLCJjcmVhdGVkSXAiOiIxMjcuMC4wLjEiLCJsYXN0U2lnbmluVGltZSI6IiIsImxhc3RTaWduaW5JcCI6IiIsInByZWZlcnJlZE1mYVR5cGUiOiIiLCJyZWNvdmVyeUNvZGVzIjpudWxsLCJ0b3RwU2VjcmV0IjoiIiwibWZhUGhvbmVFbmFibGVkIjpmYWxzZSwibWZhRW1haWxFbmFibGVkIjpmYWxzZSwibGRhcCI6IiIsInByb3BlcnRpZXMiOnt9LCJyb2xlcyI6W10sInBlcm1pc3Npb25zIjpbXSwiZ3JvdXBzIjpbXSwibGFzdFNpZ25pbldyb25nVGltZSI6IiIsInNpZ25pbldyb25nVGltZXMiOjAsIm1hbmFnZWRBY2NvdW50cyI6bnVsbCwidG9rZW5UeXBlIjoiYWNjZXNzLXRva2VuIiwidGFnIjoic3RhZmYiLCJzY29wZSI6InByb2ZpbGUiLCJhenAiOiI1NjI0MmM4NTg5ZjE5ZGUzY2M2YyIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMCIsInN1YiI6ImM4Y2UzMGNjLTk5OGUtNDcyMS04MTljLWNiZWU2OGE2M2IyMiIsImF1ZCI6WyI1NjI0MmM4NTg5ZjE5ZGUzY2M2YyJdLCJleHAiOjE3NjI2MTI5NjYsIm5iZiI6MTc2MjAwODE2NiwiaWF0IjoxNzYyMDA4MTY2LCJqdGkiOiJhZG1pbi9iZjljNGNkMy1hNzEwLTRkYWUtYTdhMi1lOWMzYThjZDM3ODkifQ.K-BxhpYXBKauxFvadD14NpEPaFgcRnbLG7ZOeJNnlA7iHrYoGVeq8v9spBkgtoW9PsJuzSW3Omvmk1RSa1dr8Tvz-lQF9cGZtqQwBISrKG1vooWHUKTd-mSqzh0dqV2gNT5txg7szPNw2AmxFMevqY5jT9WQDGEl9MZCXJ7n9CUrzJhIeOoMlpYV5DdI5WF_8oo6MDRsErKycTAeFemZ0LSdnBbvEiTh53I_P3yxmvLGUGpbF5DbUTgspvtm1-tVRWyNGBWUedffXazeNCnGbGtHIIY_ls2oJDukmru6CnlPxnsSu05eoTYWL-tfra9Uiu6YxNXuiDXFDdUknQZT5qgfQ3FJqYPQW99x1LNKXvhm7dpoH6vriDnrzHarSk2DfsJpF71tJ3xJyG5TjpmVQAgsPlsUGmNppzKcUrEy0D51vV0X5kUWU0Ak7ycwflLlyG40Pt8sEtSVaugU2-T4yG6UL96FPUwFjOMS0rnXAyH87mI-zSdjBs6A0Hlu-rZ39E00urXpwwnPZZ6YVlwxKywv3TLp9IIgEX2vWyGN191v-v7_kP0IVnHigMDoCeZAzjTw4T0VrHIdhUgZBQzcjQFCYxYs6TtC5Bw7W9slvAbPcYY2JfAS2i6pFyrZjTK-7pkxVMCu6sXUalkLvcJak7IxqqZ21lUUNoLJa7ivQBo
const (
	JWTClaimsContextKey = "JWTClaimsContextKey"
	JWTPublicKey        = "-----BEGIN CERTIFICATE-----\nMIIE3TCCAsWgAwIBAgIDAeJAMA0GCSqGSIb3DQEBCwUAMCgxDjAMBgNVBAoTBWFk\nbWluMRYwFAYDVQQDEw1jZXJ0LWJ1aWx0LWluMB4XDTI1MTEwMTE0NDAzNFoXDTQ1\nMTEwMTE0NDAzNFowKDEOMAwGA1UEChMFYWRtaW4xFjAUBgNVBAMTDWNlcnQtYnVp\nbHQtaW4wggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQCtxl1BQ8rzhXcE\nJEJQvbQhG91H/Vh657zxZ0Ap+UdAmVKJQj5yPZqxHGmuY1jNTo80A3vsK8pzFIW0\nw4b7DDEsCX85v7OLsZeD72qA48Y//sSPgte0EiMtfAWRQ14J1FymK1tEg6SVku5w\naskfORgIboeX6yTqtc1aNgvXxzq17Y9pOHuPyPD4hNyDDkflOHytRL4jBD2TWZYy\nHY0fhJpcrVwrgTH5q4uBGjQ4C3lTq3NctD1xRqy9ZLsZxBodIWgYo6NWOlnYd0Dl\nwZjxyCmdCydkopK3qL+usVelctme+8XeWaFoTxjBebUhP6hb6389n7tFloYv9vFi\nM3xB4NKC5twUTd/NUPKPoH7GKIAIxD0WhNwKPOKskeAIlYsj6HGf4jMcZgZI6X9V\nQmJDmiGwi0K0Lh2u2Zq6PS56nXiHLhAY7K4LmmXvAc/bNPqIj9M5kVIL0f5NcGzg\nYcXLGDvB/kgRNf8mIGNXcu7Bo9VLggZwfSO+LR5wFjtdjpnefue72BPM8Pd2FRvp\nyZzn/d/cIch582TKJNj/vUiPlXE3d0tIU7lFaGD6QZQZJpKPoaQbm+1dWZEI++Fw\nXw6TAcr/XUyagm2QGSgYLKKqmorDTZhNZH0r0i51c4hb36tW867CdDN3DVsugpje\nBfYNKU322dQ6Ry7cRX30tVTK4BW82wIDAQABoxAwDjAMBgNVHRMBAf8EAjAAMA0G\nCSqGSIb3DQEBCwUAA4ICAQBq+4zExsQaz6Sf2L7q0rUpQ56RY4h8HTIRmx466cqO\nDSoYKK3SKtJ9J3I6T9+YOcgy4B2tudIZcoXKhDNzuUaw9eaDK0LdQHl/RDYacPwH\nWmWTTziu/OfVSJfEmQRK0nxhdAtZINpli9jTZTqgX5nldtRvPWqKxsZguFmA/gJe\nnbZobBUFjCO1oFPs4WjTAHrQ6NLLkE/xx6HJIJDRLuaADyousI8e0e9GlvgsYpOM\nqTLuVW/qVl9GYgBuN9KEA8gBB2bS+PwYc/UvrmKODODPTWzpDe2At6jDiTH1x6iK\ns1a4skkvluMk7c7m+PZY18d4xng1CzALVFLBhTmKmkD8gDQdBMvRJDJOE9j9Qs9L\nxDh/x6aTXXaJHXjq8FD3P/U/aPrdJJU6BEnDpD7jP2dLrN+Hbf4dZeN8u8GMB2gp\n+V5pcXeOcFiH6mJ2Gk/Ajz1fA2vaA+H3eSX1fPhtmEKdooGx5tBrQGld0E7Sg4Ej\nZZjaf7wbJiZoLwjoWdIToLdLuEvExrXTG+cXGecODdR/WHKWxmoYiLLrhWF1lRWM\ndqbPI+VSq7OJ601gj1QSlJ38Om3Kb37yzrmKaAv/Ued/M148fJvoVlC6pAMQJ57T\n2VJlw3cmZDC5qXGkx3kWFBh8islsa9HcR78xExSx+Cp9buc7bfxj8JCC0OSRHgle\nvg==\n-----END CERTIFICATE-----"
)

type authMiddleware struct{}

func parseRSAPublicKeyFromCert(pemStr string) (*rsa.PublicKey, error) {
	block, _ := pem.Decode([]byte(pemStr))
	if block == nil {
		return nil, errors.New("failed to decode PEM block")
	}
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return nil, err
	}
	publicKey, ok := cert.PublicKey.(*rsa.PublicKey)
	if !ok {
		return nil, errors.New("failed to parse RSA public key")
	}
	return publicKey, nil
}

func parseToken(tokenString string) (jwt.MapClaims, error) {
	if tokenString == "" {
		return nil, errors.New("missing accessToken")
	}
	publickey, err := parseRSAPublicKeyFromCert(JWTPublicKey)
	if err != nil {
		return nil, err
	}
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}
		return publickey, nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, errors.New("Invalid token, claims")

}
func (a authMiddleware) ValidateAndExtractJwt() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid Authorization header"})
			return
		}
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		claims, err := parseToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}
		c.Set(JWTClaimsContextKey, claims)
		c.Next()
	}
}

func (a authMiddleware) CheckUserPermission(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		value, exists := c.Get(JWTClaimsContextKey)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing claims"})
			return
		}
		claims, ok := value.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid claims type"})
			return
		}

		rolesValue, ok := claims["roles"]
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "no roles"})
			return
		}

		switch roles := rolesValue.(type) {
		case []interface{}:
			for _, r := range roles {
				if role, ok := r.(string); ok && strings.EqualFold(role, requiredRole) {
					c.Next()
					return
				}
			}
		case []string:
			for _, role := range roles {
				if strings.EqualFold(role, requiredRole) {
					c.Next()
					return
				}
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "permission denied"})
	}
}

func NewAuthMiddleware() AuthMiddleware {
	return &authMiddleware{}
}
