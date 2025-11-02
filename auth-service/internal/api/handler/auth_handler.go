package handler

import (
	"auth-service/internal/api/dto/request"
	"auth-service/internal/api/dto/response"
	"auth-service/internal/api/middleware"
	apperrors "auth-service/internal/error"
	"auth-service/internal/model"
	"auth-service/internal/service"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt"
	"go.uber.org/zap"
)

type AuthHandler interface {
	Register() gin.HandlerFunc
	Login() gin.HandlerFunc
	Logout() gin.HandlerFunc
	Refresh() gin.HandlerFunc
	VerifyToken() gin.HandlerFunc
}

type authHandler struct {
	authService service.AuthService
	logger      Logger
}

func (*authHandler) formatValidationError(err validator.FieldError) string {
	switch err.Tag() {
	case "required":
		return fmt.Sprintf("The %s field is required", err.Field())
	case "email":
		return fmt.Sprintf("The %s field is not a valid email", err.Field())
	case "uuid":
		return fmt.Sprintf("The %s field is not a valid uuid", err.Field())
	default:
		return fmt.Sprintf("Validation failed for %s with tag %s.", err.Field(), err.Tag())
	}
}

func (a *authHandler) Register() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req request.RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			var validatorError validator.ValidationErrors
			if errors.As(err, &validatorError) {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: a.formatValidationError(validatorError[0]),
				})
			} else {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: "Invalid request body",
				})
			}
			return
		}
		newUser := model.User{
			Email:     req.Email,
			Password:  req.Password,
			FirstName: req.FirstName,
			LastName:  req.LastName,
		}
		res, err := a.authService.Register(c, newUser)
		if err != nil {
			if errors.Is(err, apperrors.ErrUserMailAlreadyExists) {
				c.JSON(http.StatusConflict, response.Response{
					Message: "Email already exists",
				})
			} else {
				err = fmt.Errorf("AuthHandler.Register: %w", err)
				a.logger.LoggingError(c, err, "failed to register an user", zap.ErrorLevel)
				c.JSON(http.StatusInternalServerError, response.Response{
					Message: "Internal server error",
				})
			}
			return
		}
		c.JSON(http.StatusOK, response.UserInfoResponse{
			ID:        res.ID,
			Email:     res.Email,
			FirstName: res.FirstName,
			LastName:  res.LastName,
			Role:      res.Role,
		})
	}
}

func (a *authHandler) Login() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req request.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			var validatorError validator.ValidationErrors
			if errors.As(err, &validatorError) {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: a.formatValidationError(validatorError[0]),
				})
			} else {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: "Invalid request body",
				})
			}
			return
		}
		auth, err := a.authService.Login(c, req.Email, req.Password)
		if err != nil {
			switch {
			case errors.Is(err, apperrors.ErrUserNotFound):
				c.JSON(http.StatusNotFound, response.Response{
					Message: "User not found",
				})
			case errors.Is(err, apperrors.ErrInvalidPassword):
				c.JSON(http.StatusBadRequest, response.Response{
					Message: "Invalid password",
				})
			default:
				err = fmt.Errorf("AuthHandler.Login: %w", err)
				a.logger.LoggingError(c, err, "failed to login", zap.ErrorLevel)
				c.JSON(http.StatusInternalServerError, response.Response{
					Message: "Internal server error",
				})
			}
			return
		}
		c.SetCookie("refresh_token", auth.RefreshToken, int(auth.RefreshTokenTTL.Seconds()), "/auth/refresh", "", false, true)
		c.JSON(http.StatusOK, response.AuthenticationResponse{
			AccessToken: auth.AccessToken,
			TokenType:   "Bearer",
			ExpiresIn:   int(auth.AccessTokenTTL.Seconds()),
		})
	}
}

func (a *authHandler) Logout() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims := c.Value(middleware.JWTClaimsContextKey).(jwt.MapClaims)
		userID := claims["user_id"].(string)
		err := a.authService.Logout(c, userID)
		if err != nil {
			err = fmt.Errorf("AuthHandler.Logout: %w", err)
			a.logger.LoggingError(c, err, "failed to logout", zap.ErrorLevel)
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "Internal server error",
			})
			return
		}
		c.SetCookie("refresh_token", "", -1, "/auth/refresh", "", false, true)
		c.JSON(http.StatusOK, response.Response{
			Message: "Logout successfully",
		})
	}
}

func (a *authHandler) Refresh() gin.HandlerFunc {
	return func(c *gin.Context) {
		refreshToken, err := c.Cookie("refresh_token")
		if err != nil {
			c.JSON(http.StatusUnauthorized, response.Response{
				Message: "Cookie not found",
			})
			return
		}
		auth, err := a.authService.Refresh(c, refreshToken)
		if err != nil {
			switch {
			case errors.Is(err, apperrors.ErrInvalidToken):
				c.JSON(http.StatusUnauthorized, response.Response{
					Message: "Invalid refresh token",
				})
			case errors.Is(err, apperrors.ErrRefreshTokenNotFound):
				c.JSON(http.StatusUnauthorized, response.Response{
					Message: "Invalid refresh token",
				})
			case errors.Is(err, apperrors.ErrUserNotFound):
				c.JSON(http.StatusNotFound, response.Response{
					Message: "User not found",
				})
			default:
				err = fmt.Errorf("AuthHandler.Refresh: %w", err)
				a.logger.LoggingError(c, err, "failed to refresh token", zap.ErrorLevel)
				c.JSON(http.StatusInternalServerError, response.Response{
					Message: "Internal server error",
				})
			}
			return
		}
		c.SetCookie("refresh_token", auth.RefreshToken, int(auth.RefreshTokenTTL.Seconds()), "/auth/refresh", "", false, true)
		c.JSON(http.StatusOK, response.AuthenticationResponse{
			AccessToken: auth.AccessToken,
			TokenType:   "Bearer",
			ExpiresIn:   int(auth.AccessTokenTTL.Seconds()),
		})
	}
}

func (a *authHandler) VerifyToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims := c.Value(middleware.JWTClaimsContextKey).(jwt.MapClaims)
		userID := claims["user_id"].(string)
		role := claims["role"].(string)
		c.Header("X-User-Id", userID)
		c.Header("X-User-Role", role)
		c.Status(http.StatusNoContent)
	}
}

func NewAuthHandler(authService service.AuthService, logger Logger) AuthHandler {
	return &authHandler{
		authService: authService,
		logger:      logger,
	}
}
