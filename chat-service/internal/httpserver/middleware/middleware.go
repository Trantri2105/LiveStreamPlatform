package middleware

import (
	"context"
	"crypto/subtle"
	"net/http"
	"thanhnt208/chat-service/internal/auth"
)

func AuthRequired(jwtKey []byte) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, err := auth.ParseJWTFromRequest(r, jwtKey)
			if err != nil {
				http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), auth.CtxUserKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func CheckRequestOrigin(r *http.Request, allowed []string) bool {
	if len(allowed) == 0 {
		return false
	}
	origin := r.Header.Get("Origin")
	if origin == "" {
		return true
	}
	for _, a := range allowed {
		if a == "*" {
			return true
		}
		if subtle.ConstantTimeCompare([]byte(origin), []byte(a)) == 1 {
			return true
		}
	}
	return false
}
