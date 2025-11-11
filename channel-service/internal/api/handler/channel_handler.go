package handler

import (
	"channel-service/internal/api/dto/request"
	"channel-service/internal/api/dto/response"
	apperrors "channel-service/internal/error"
	"channel-service/internal/model"
	"channel-service/internal/service"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"
)

type ChannelHandler interface {
	CreateChannel() gin.HandlerFunc
	UpdateChannelByID() gin.HandlerFunc
	GetChannelByID() gin.HandlerFunc
	GetChannelBySearchText() gin.HandlerFunc
	SetChannelAvatar() gin.HandlerFunc
}

type channelHandler struct {
	logger         *zap.Logger
	channelService service.ChannelService
}

func (*channelHandler) formatValidationError(err validator.FieldError) string {
	switch err.Tag() {
	case "required":
		return fmt.Sprintf("the %s field is required", err.Field())
	default:
		return fmt.Sprintf("validation failed for %s with tag %s.", err.Field(), err.Tag())
	}
}

func (ch *channelHandler) SetChannelAvatar() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader("X-User-Id")
		fileHeader, err := c.FormFile("image")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		err = ch.channelService.SetChannelAvatar(c, fileHeader, id)
		if err != nil {
			if errors.Is(err, apperrors.ErrInvalidFile) {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			} else {
				ch.logger.Error(fmt.Sprintf("failed to set avatar for channel %s", id), zap.Error(err))
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}
		c.JSON(http.StatusOK, response.Response{
			Message: "avatar set successfully",
		})
	}
}

func (ch *channelHandler) GetChannelBySearchText() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req request.SearchRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "invalid request body",
			})
			return
		}
		if req.Limit <= 0 || req.Limit > 50 {
			req.Limit = 10
		}
		if req.Offset < 0 {
			req.Offset = 0
		}
		channels, err := ch.channelService.GetChannelBySearchText(c, req.SearchText, req.Limit, req.Offset)
		if err != nil {
			ch.logger.Error(err.Error())
			c.JSON(http.StatusInternalServerError, response.Response{
				Error: "internal server error",
			})
			return
		}
		channelRes := make([]response.ChannelResponse, 0)
		for _, channel := range channels {
			channelRes = append(channelRes, response.ChannelResponse{
				ID:          channel.ID,
				Title:       channel.Title,
				Description: channel.Description,
				AvatarURL:   channel.AvatarURL,
			})
		}
		c.JSON(http.StatusOK, channelRes)
	}
}

func (ch *channelHandler) CreateChannel() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req request.CreateChannelRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			var validatorError validator.ValidationErrors
			if errors.As(err, &validatorError) {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: ch.formatValidationError(validatorError[0]),
				})
			} else {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: "invalid request body",
				})
			}
			return
		}
		id := c.GetHeader("X-User-Id")
		newChannel := model.Channel{
			ID:          id,
			Title:       req.Title,
			Description: req.Description,
		}
		err := ch.channelService.CreateChannel(c, newChannel)
		if err != nil {
			switch {
			case errors.Is(err, apperrors.ErrChannelAlreadyExists):
				c.JSON(http.StatusConflict, response.Response{
					Error: "channel already exists",
				})
			default:
				ch.logger.Error(err.Error())
				c.JSON(http.StatusInternalServerError, response.Response{
					Error: "internal server error",
				})
			}
			return
		}
		c.JSON(http.StatusCreated, response.Response{
			Message: "channel created successfully",
		})
	}
}

func (ch *channelHandler) UpdateChannelByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req request.UpdateChannelRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "invalid request body",
			})
			return
		}
		id := c.GetHeader("X-User-Id")
		updatedChannel := model.Channel{
			ID:          id,
			Title:       req.Title,
			Description: req.Description,
		}
		err := ch.channelService.UpdateChannelByID(c, updatedChannel)
		if err != nil {
			switch {
			case errors.Is(err, apperrors.ErrChannelNotFound):
				c.JSON(http.StatusNotFound, response.Response{
					Error: "channel not found",
				})
			default:
				ch.logger.Error(err.Error())
				c.JSON(http.StatusInternalServerError, response.Response{
					Error: "internal server error",
				})
			}
			return
		}
		c.JSON(http.StatusCreated, response.Response{
			Message: "channel updated successfully",
		})
	}
}

func (ch *channelHandler) GetChannelByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		channel, err := ch.channelService.GetChannelByID(c, id)
		if err != nil {
			switch {
			case errors.Is(err, apperrors.ErrChannelNotFound):
				c.JSON(http.StatusNotFound, response.Response{
					Error: "channel not found",
				})
			default:
				ch.logger.Error(err.Error())
				c.JSON(http.StatusInternalServerError, response.Response{
					Error: "internal server error",
				})
			}
			return
		}
		c.JSON(http.StatusOK, response.ChannelResponse{
			ID:          channel.ID,
			Title:       channel.Title,
			Description: channel.Description,
			AvatarURL:   channel.AvatarURL,
		})
	}
}

func NewChannelHandler(logger *zap.Logger, channelService service.ChannelService) ChannelHandler {
	return &channelHandler{
		logger:         logger,
		channelService: channelService,
	}
}
