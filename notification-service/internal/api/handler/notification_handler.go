package handler

import (
	"errors"
	"fmt"
	"net/http"
	"notification-service/internal/api/dto/request"
	"notification-service/internal/api/dto/response"
	"notification-service/internal/service"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"
)

type NotificationHandler interface {
	GetNotifications() gin.HandlerFunc
	MarkNotificationsAsRead() gin.HandlerFunc
}

type notificationHandler struct {
	logger              *zap.Logger
	notificationService service.NotificationService
}

func (*notificationHandler) formatValidationError(err validator.FieldError) string {
	switch err.Tag() {
	case "required":
		return fmt.Sprintf("the %s field is required", err.Field())
	default:
		return fmt.Sprintf("validation failed for %s with tag %s.", err.Field(), err.Tag())
	}
}

func (n *notificationHandler) GetNotifications() gin.HandlerFunc {
	return func(c *gin.Context) {
		channelID := c.GetHeader("X-User-Id")
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
		notifications, err := n.notificationService.GetNotification(c, channelID, l, o)
		if err != nil {
			n.logger.Error("Failed to get notification", zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "Failed to get notification",
			})
			return
		}
		notifRes := make([]response.NotificationResp, len(notifications))
		for i, notif := range notifications {
			notifRes[i] = response.NotificationResp{
				ID:        notif.ID,
				ChannelID: notif.ChannelID,
				Type:      notif.Type,
				Title:     notif.Title,
				Body:      notif.Body,
				Data:      notif.Data,
				IsRead:    notif.IsRead,
			}
		}
		c.JSON(http.StatusOK, notifRes)
	}
}

func (n *notificationHandler) MarkNotificationsAsRead() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req request.ReadNotificationReq
		if err := c.ShouldBindJSON(&req); err != nil {
			var validatorError validator.ValidationErrors
			if errors.As(err, &validatorError) {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: n.formatValidationError(validatorError[0]),
				})
			} else {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: "invalid request body",
				})
			}
			return
		}
		channelID := c.GetHeader("X-User-Id")
		err := n.notificationService.MarkNotificationAsRead(c, req.NotificationIDs, channelID)
		if err != nil {
			n.logger.Error("Failed to mark notification as read", zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "Failed to mark notification as read",
			})
			return
		}
		c.JSON(http.StatusOK, response.Response{
			Message: "Marked notification as read",
		})
	}
}

func NewNotificationHandler(logger *zap.Logger, notificationService service.NotificationService) NotificationHandler {
	return &notificationHandler{
		logger:              logger,
		notificationService: notificationService,
	}
}
