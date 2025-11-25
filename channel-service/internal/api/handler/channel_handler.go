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
	"strconv"

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
	CreateSubscription() gin.HandlerFunc
	DeleteSubscription() gin.HandlerFunc
	GetChannelFollower() gin.HandlerFunc
	GetFollowingChannel() gin.HandlerFunc
	UpdateSubscription() gin.HandlerFunc
	GetSubscriptionByChannelID() gin.HandlerFunc
	SetBackgroundImage() gin.HandlerFunc
}

type channelHandler struct {
	logger         *zap.Logger
	channelService service.ChannelService
}

func (ch *channelHandler) SetBackgroundImage() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader("X-User-Id")
		fileHeader, err := c.FormFile("image")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		err = ch.channelService.SetBackgroundImage(c, fileHeader, id)
		if err != nil {
			if errors.Is(err, apperrors.ErrInvalidFile) {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			} else {
				ch.logger.Error(fmt.Sprintf("failed to set background for channel %s", id), zap.Error(err))
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}
		c.JSON(http.StatusOK, response.Response{
			Message: "background set successfully",
		})
	}
}

func (ch *channelHandler) GetSubscriptionByChannelID() gin.HandlerFunc {
	return func(c *gin.Context) {
		channelID := c.Param("id")
		followerID := c.GetHeader("X-User-Id")
		subscription, err := ch.channelService.GetSubscriptionByChannelID(c, channelID, followerID)
		if err != nil {
			if errors.Is(err, apperrors.ErrSubscriptionNotFound) {
				c.JSON(http.StatusNotFound, response.Response{
					Message: "subscription not found",
				})
				return
			}
		}
		c.JSON(http.StatusOK, response.SubscriptionResponse{
			ChannelID:           subscription.ChannelID,
			FollowerID:          subscription.FollowerID,
			NotificationEnabled: subscription.NotificationEnabled,
		})
	}
}

func (ch *channelHandler) UpdateSubscription() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req request.UpdateSubscriptionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "invalid request body",
			})
			return
		}
		channelId := c.Param("id")
		followerId := c.GetHeader("X-User-Id")
		sub := model.Subscription{
			ChannelID:           channelId,
			FollowerID:          followerId,
			NotificationEnabled: req.NotificationEnabled,
		}
		err := ch.channelService.UpdateSubscription(c, sub)
		if err != nil {
			if errors.Is(err, apperrors.ErrSubscriptionNotFound) {
				c.JSON(http.StatusNotFound, response.Response{
					Message: "subscription not found",
				})
			} else {
				ch.logger.Error("error updating subscription", zap.Error(err))
				c.JSON(http.StatusInternalServerError, response.Response{
					Message: "internal server error",
				})
			}
			return
		}
		c.JSON(http.StatusOK, response.Response{
			Message: "subscription updated",
		})
	}
}

func (ch *channelHandler) CreateSubscription() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req request.CreateSubscriptionRequest
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

		sub := model.Subscription{
			ChannelID:           req.ChannelID,
			NotificationEnabled: req.NotificationEnabled,
			FollowerID:          c.GetHeader("X-User-Id"),
		}
		err := ch.channelService.CreateSubscription(c, sub)
		if err != nil {
			switch {
			case errors.Is(err, apperrors.ErrSubscriptionAlreadyExists):
				c.JSON(http.StatusConflict, response.Response{
					Message: "subscription already exists",
				})
			case errors.Is(err, apperrors.ErrChannelNotFound):
				c.JSON(http.StatusNotFound, response.Response{
					Message: "channel not found",
				})
			default:
				ch.logger.Error("error creating subscription", zap.Error(err))
				c.JSON(http.StatusInternalServerError, response.Response{
					Message: "internal server error",
				})
			}
			return
		}
		c.JSON(http.StatusCreated, response.Response{
			Message: "subscription created",
		})
	}
}

func (ch *channelHandler) DeleteSubscription() gin.HandlerFunc {
	return func(c *gin.Context) {
		channelId := c.Param("id")
		followerId := c.GetHeader("X-User-Id")
		sub := model.Subscription{
			ChannelID:  channelId,
			FollowerID: followerId,
		}
		err := ch.channelService.DeleteSubscription(c, sub)
		if err != nil {
			ch.logger.Error("error deleting subscription", zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "internal server error",
			})
			return
		}
		c.JSON(http.StatusOK, response.Response{
			Message: "subscription deleted",
		})
	}
}

func (ch *channelHandler) GetChannelFollower() gin.HandlerFunc {
	return func(c *gin.Context) {
		channelId := c.GetHeader("X-User-Id")
		offset := c.DefaultQuery("offset", "0")
		o, err := strconv.Atoi(offset)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "Offset must be an integer",
			})
			return
		}
		limit := c.DefaultQuery("limit", "10")
		l, err := strconv.Atoi(limit)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "Limit must be an integer",
			})
			return
		}
		if o < 0 {
			o = 0
		}
		if l <= 0 {
			l = 10
		}
		channels, err := ch.channelService.GetChannelFollower(c, channelId, l, o)
		if err != nil {
			ch.logger.Error("error getting follower channel", zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "internal server error",
			})
			return
		}
		channelRes := make([]response.ChannelResponse, len(channels))
		for i, channel := range channels {
			channelRes[i] = response.ChannelResponse{
				ID:                channel.ID,
				Title:             channel.Title,
				Description:       channel.Description,
				AvatarURL:         channel.AvatarURL,
				BackgroundURL:     channel.BackgroundURL,
				SubscriptionCount: channel.SubscriptionCount,
				IsLive:            channel.IsLive,
			}
		}
		c.JSON(http.StatusOK, channelRes)
	}
}

func (ch *channelHandler) GetFollowingChannel() gin.HandlerFunc {
	return func(c *gin.Context) {
		channelId := c.GetHeader("X-User-Id")
		offset := c.DefaultQuery("offset", "0")
		o, err := strconv.Atoi(offset)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "Offset must be an integer",
			})
			return
		}
		limit := c.DefaultQuery("limit", "10")
		l, err := strconv.Atoi(limit)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "Limit must be an integer",
			})
			return
		}
		if o < 0 {
			o = 0
		}
		if l <= 0 {
			l = 10
		}
		channels, err := ch.channelService.GetFollowingChannel(c, channelId, l, o)
		if err != nil {
			ch.logger.Error("error getting following channel", zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "internal server error",
			})
			return
		}
		channelRes := make([]response.ChannelResponse, len(channels))
		for i, channel := range channels {
			channelRes[i] = response.ChannelResponse{
				ID:                channel.ID,
				Title:             channel.Title,
				Description:       channel.Description,
				AvatarURL:         channel.AvatarURL,
				BackgroundURL:     channel.BackgroundURL,
				SubscriptionCount: channel.SubscriptionCount,
				IsLive:            channel.IsLive,
			}
		}
		c.JSON(http.StatusOK, channelRes)
	}
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
				Message: "internal server error",
			})
			return
		}
		channelRes := make([]response.ChannelResponse, 0)
		for _, channel := range channels {
			channelRes = append(channelRes, response.ChannelResponse{
				ID:                channel.ID,
				Title:             channel.Title,
				Description:       channel.Description,
				AvatarURL:         channel.AvatarURL,
				BackgroundURL:     channel.BackgroundURL,
				SubscriptionCount: channel.SubscriptionCount,
				IsLive:            channel.IsLive,
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
					Message: "channel already exists",
				})
			default:
				ch.logger.Error(err.Error())
				c.JSON(http.StatusInternalServerError, response.Response{
					Message: "internal server error",
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
		err := ch.channelService.UpdateChannelByID(c, updatedChannel, nil)
		if err != nil {
			switch {
			case errors.Is(err, apperrors.ErrChannelNotFound):
				c.JSON(http.StatusNotFound, response.Response{
					Message: "channel not found",
				})
			default:
				ch.logger.Error(err.Error())
				c.JSON(http.StatusInternalServerError, response.Response{
					Message: "internal server error",
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
					Message: "channel not found",
				})
			default:
				ch.logger.Error(err.Error())
				c.JSON(http.StatusInternalServerError, response.Response{
					Message: "internal server error",
				})
			}
			return
		}
		c.JSON(http.StatusOK, response.ChannelResponse{
			ID:                channel.ID,
			Title:             channel.Title,
			Description:       channel.Description,
			AvatarURL:         channel.AvatarURL,
			BackgroundURL:     channel.BackgroundURL,
			SubscriptionCount: channel.SubscriptionCount,
			IsLive:            channel.IsLive,
		})
	}
}

func NewChannelHandler(logger *zap.Logger, channelService service.ChannelService) ChannelHandler {
	return &channelHandler{
		logger:         logger,
		channelService: channelService,
	}
}
