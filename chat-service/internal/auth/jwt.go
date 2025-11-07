package auth

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type ChatClaims struct {
	UserID string `json:"user_id"`
	jwt.RegisteredClaims
}

type ctxKey string

const CtxUserKey ctxKey = "chatUser"

func ParseJWTFromRequest(r *http.Request, secret []byte) (*ChatClaims, error) {
	authz := r.Header.Get("Authorization")
	if authz == "" {
		if c, err := r.Cookie("access_token"); err == nil {
			authz = "Bearer " + c.Value
		}
	}
	if authz == "" {
		if t := r.URL.Query().Get("token"); t != "" {
			authz = "Bearer " + t
		}
	}
	if !strings.HasPrefix(authz, "Bearer ") {
		return nil, errors.New("missing bearer token")
	}

	tokenStr := strings.TrimPrefix(authz, "Bearer ")
	token, err := jwt.ParseWithClaims(tokenStr, &ChatClaims{}, func(t *jwt.Token) (interface{}, error) {
		if t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errors.New("unexpected signing method")
		}
		return secret, nil
	}, jwt.WithLeeway(10*time.Second))
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	claims, ok := token.Claims.(*ChatClaims)
	if !ok {
		return nil, errors.New("invalid claims")
	}
	if claims.UserID == "" {
		return nil, errors.New("claims missing user_id")
	}
	if claims.ExpiresAt != nil && !claims.ExpiresAt.After(time.Now()) {
		return nil, errors.New("token expired")
	}
	return claims, nil
}
