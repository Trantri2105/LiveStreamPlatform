package handler

import (
	"channel-service/internal/api/dto/request"
	"channel-service/internal/api/dto/response"
	apperrors "channel-service/internal/error"
	"channel-service/internal/service"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type CategoryHandler interface {
	GetCategoryByID() gin.HandlerFunc
	GetCategoryBySearchText() gin.HandlerFunc
}

type categoryHandler struct {
	logger          *zap.Logger
	categoryService service.CategoryService
}

func (ca *categoryHandler) GetCategoryByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		category, err := ca.categoryService.GetCategoryByID(c, id)
		if err != nil {
			if errors.Is(err, apperrors.ErrCategoryNotFound) {
				c.JSON(http.StatusNotFound, response.Response{
					Error: "category not found",
				})
			} else {
				c.JSON(http.StatusInternalServerError, response.Response{
					Error: "internal server error",
				})
			}
			return
		}
		c.JSON(http.StatusOK, response.CategoryResponse{
			ID:    category.ID,
			Title: category.Title,
		})
	}
}

func (ca *categoryHandler) GetCategoryBySearchText() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req request.SearchRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Error: "invalid request body",
			})
			return
		}
		if req.Limit <= 0 || req.Limit > 50 {
			req.Limit = 10
		}
		if req.Offset < 0 {
			req.Offset = 0
		}
		categories, err := ca.categoryService.GetCategoryBySearchText(c, req.SearchText, req.Offset, req.Limit)
		if err != nil {
			ca.logger.Error(err.Error())
			c.JSON(http.StatusInternalServerError, response.Response{
				Error: "internal server error",
			})
			return
		}
		categoriesRes := make([]response.CategoryResponse, 0)
		for _, category := range categories {
			categoriesRes = append(categoriesRes, response.CategoryResponse{
				ID:    category.ID,
				Title: category.Title,
			})
		}
		c.JSON(http.StatusOK, categoriesRes)
	}
}

func NewCategoryHandler(logger *zap.Logger, categoryService service.CategoryService) CategoryHandler {
	return &categoryHandler{
		logger:          logger,
		categoryService: categoryService,
	}
}
