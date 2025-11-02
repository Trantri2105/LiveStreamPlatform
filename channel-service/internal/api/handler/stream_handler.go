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
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"
)

type StreamHandler interface {
	CreateStream() gin.HandlerFunc
	GetStreamByID() gin.HandlerFunc
	GetStreamByChannelID() gin.HandlerFunc
	GetStreamBySearchText() gin.HandlerFunc
	OVMNotify() gin.HandlerFunc
}

type streamHandler struct {
	logger        *zap.Logger
	streamService service.StreamService
}

func (*streamHandler) formatValidationError(err validator.FieldError) string {
	switch err.Tag() {
	case "required":
		return fmt.Sprintf("the %s field is required", err.Field())
	default:
		return fmt.Sprintf("validation failed for %s with tag %s.", err.Field(), err.Tag())
	}
}

func (s *streamHandler) CreateStream() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req request.StreamRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			var validatorError validator.ValidationErrors
			if errors.As(err, &validatorError) {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: s.formatValidationError(validatorError[0]),
				})
			} else {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: "invalid request body",
				})
			}
			return
		}
		id := c.GetHeader("X-User-Id")
		stream := model.Stream{
			Title:       req.Title,
			Description: req.Description,
		}
		stream.Category.ID = req.CategoryID
		stream.Channel.ID = id

		authHeader := c.GetHeader("Authorization")
		token := strings.TrimPrefix(authHeader, "Bearer ")
		token = strings.TrimSpace(token)
		newStream, err := s.streamService.CreateStream(c, stream, token)
		if err != nil {
			s.logger.Error("error creating stream", zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: err.Error(),
			})
			return
		}
		c.JSON(http.StatusCreated, response.StreamResponse{
			ID:           newStream.ID,
			Title:        newStream.Title,
			HlsURL:       newStream.HlsURL,
			LiveChatURL:  newStream.LiveChatURL,
			SrtServerURL: newStream.SrtServerURL,
			Description:  newStream.Description,
			Status:       newStream.Status,
			StreamKey:    newStream.StreamKey,
			Channel: struct {
				ID    string `json:"id"`
				Title string `json:"title"`
			}{
				ID:    newStream.Channel.ID,
				Title: newStream.Channel.Title,
			},
			Category: struct {
				ID    string `json:"id"`
				Title string `json:"title"`
			}{
				ID:    newStream.Category.ID,
				Title: newStream.Category.Title,
			},
		})
	}
}

func (s *streamHandler) GetStreamByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		stream, err := s.streamService.GetStreamByID(c, id)
		if err != nil {
			if errors.Is(err, apperrors.ErrStreamNotFound) {
				c.JSON(http.StatusNotFound, response.Response{
					Error: "stream not found",
				})
			} else {
				s.logger.Error("get stream failed", zap.String("id", id), zap.Error(err))
				c.JSON(http.StatusInternalServerError, response.Response{
					Error: "internal server error",
				})
			}
			return
		}
		c.JSON(http.StatusOK, response.StreamResponse{
			ID:           stream.ID,
			Title:        stream.Title,
			HlsURL:       stream.HlsURL,
			LiveChatURL:  stream.LiveChatURL,
			SrtServerURL: stream.SrtServerURL,
			Description:  stream.Description,
			Status:       stream.Status,
			Channel: struct {
				ID    string `json:"id"`
				Title string `json:"title"`
			}{
				ID:    stream.Channel.ID,
				Title: stream.Channel.Title,
			},
			Category: struct {
				ID    string `json:"id"`
				Title string `json:"title"`
			}{
				ID:    stream.Category.ID,
				Title: stream.Category.Title,
			},
		})
	}
}

func (s *streamHandler) GetStreamByChannelID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		status := c.Query("status")
		limit := c.DefaultQuery("limit", "10")
		offset := c.DefaultQuery("offset", "0")

		limitInt, err := strconv.Atoi(limit)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Error: "invalid limit",
			})
			return
		}
		offsetInt, err := strconv.Atoi(offset)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Error: "invalid offset",
			})
		}

		if limitInt <= 0 || limitInt > 50 {
			limitInt = 50
		}

		if offsetInt <= 0 {
			offsetInt = 0
		}
		streams, err := s.streamService.GetStreamByChannelID(c, id, status, limitInt, offsetInt)
		if err != nil {
			s.logger.Error("get stream by channel id failed", zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Error: "internal server error",
			})
			return
		}
		res := make([]response.StreamResponse, 0)
		for _, stream := range streams {
			res = append(res, response.StreamResponse{
				ID:           stream.ID,
				Title:        stream.Title,
				HlsURL:       stream.HlsURL,
				LiveChatURL:  stream.LiveChatURL,
				SrtServerURL: stream.SrtServerURL,
				Description:  stream.Description,
				Status:       stream.Status,
				Channel: struct {
					ID    string `json:"id"`
					Title string `json:"title"`
				}{
					ID:    stream.Channel.ID,
					Title: stream.Channel.Title,
				},
				Category: struct {
					ID    string `json:"id"`
					Title string `json:"title"`
				}{
					ID:    stream.Category.ID,
					Title: stream.Category.Title,
				},
			})

		}
		c.JSON(http.StatusOK, res)
	}
}

func (s *streamHandler) GetStreamBySearchText() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req request.StreamSearchRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Error: "invalid body",
			})
			return
		}
		if req.Limit <= 0 || req.Limit > 50 {
			req.Limit = 50
		}
		if req.Offset <= 0 {
			req.Offset = 0
		}
		streams, err := s.streamService.GetStreamBySearchText(c, req.SearchText, req.Status, req.Limit, req.Offset)
		if err != nil {
			s.logger.Error("get stream by search text failed", zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Error: "internal server error",
			})
			return
		}
		res := make([]response.StreamResponse, 0)
		for _, stream := range streams {
			res = append(res, response.StreamResponse{
				ID:           stream.ID,
				Title:        stream.Title,
				HlsURL:       stream.HlsURL,
				LiveChatURL:  stream.LiveChatURL,
				SrtServerURL: stream.SrtServerURL,
				Description:  stream.Description,
				Status:       stream.Status,
				Channel: struct {
					ID    string `json:"id"`
					Title string `json:"title"`
				}{
					ID:    stream.Channel.ID,
					Title: stream.Channel.Title,
				},
				Category: struct {
					ID    string `json:"id"`
					Title string `json:"title"`
				}{
					ID:    stream.Category.ID,
					Title: stream.Category.Title,
				},
			})

		}
		c.JSON(http.StatusOK, res)
	}
}

func (s *streamHandler) OVMNotify() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req request.OVMRequest
		if err := c.ShouldBind(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		res, err := s.streamService.HandleOVMNotify(c, req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, res)
	}
}

func NewStreamHandler(logger *zap.Logger, streamService service.StreamService) StreamHandler {
	return &streamHandler{
		logger:        logger,
		streamService: streamService,
	}
}
