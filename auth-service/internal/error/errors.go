package apperrors

import "errors"

var (
	ErrUserNotFound          = errors.New("user not found")
	ErrUserMailAlreadyExists = errors.New("user mail already exists")
	ErrInvalidToken          = errors.New("invalid token")
	ErrRefreshTokenNotFound  = errors.New("refresh token not found")
	ErrInvalidPassword       = errors.New("invalid password")
	ErrInvalidRoles          = errors.New("invalid roles")
)
