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
	"go.uber.org/zap"
)

type CategoryHandler interface {
	GetCategoryByID() gin.HandlerFunc
	GetCategoryBySearchText() gin.HandlerFunc
	CreateCategory() gin.HandlerFunc
	DeleteCategory() gin.HandlerFunc
	SetImage() gin.HandlerFunc
}

type categoryHandler struct {
	logger          *zap.Logger
	categoryService service.CategoryService
}

func (ca *categoryHandler) SetImage() gin.HandlerFunc {
	return func(c *gin.Context) {
		categoryID := c.Param("id")
		fileHeader, err := c.FormFile("image")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		_, err = ca.categoryService.GetCategoryByID(c, categoryID)
		if err != nil {
			c.JSON(http.StatusNotFound, response.Response{
				Message: "category not found",
			})
			return
		}
		err = ca.categoryService.SetImage(c, fileHeader, categoryID)
		if err != nil {
			if errors.Is(err, apperrors.ErrInvalidFile) {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			} else {
				ca.logger.Error(fmt.Sprintf("failed to set image for category %s", categoryID), zap.Error(err))
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}
		c.JSON(http.StatusOK, response.Response{
			Message: "thumbnail set successfully",
		})
	}
}

func (ca *categoryHandler) CreateCategory() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req request.CreateCategoryRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "invalid request body",
			})
			return
		}
		newCategory := model.Category{
			Title: req.Title,
		}
		err := ca.categoryService.CreateCategory(c, newCategory)
		if err != nil {
			ca.logger.Error("failed to create category", zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "internal server error",
			})
			return
		}
		c.JSON(http.StatusOK, response.Response{
			Message: "success",
		})
	}
}

func (ca *categoryHandler) DeleteCategory() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		err := ca.categoryService.DeleteCategory(c, id)
		if err != nil {
			ca.logger.Error("failed to delete category", zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "internal server error",
			})
			return
		}
		c.JSON(http.StatusOK, response.Response{
			Message: "success",
		})
	}
}

func (ca *categoryHandler) GetCategoryByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		category, err := ca.categoryService.GetCategoryByID(c, id)
		if err != nil {
			if errors.Is(err, apperrors.ErrCategoryNotFound) {
				c.JSON(http.StatusNotFound, response.Response{
					Message: "category not found",
				})
			} else {
				c.JSON(http.StatusInternalServerError, response.Response{
					Message: "internal server error",
				})
			}
			return
		}
		c.JSON(http.StatusOK, response.CategoryResponse{
			ID:        category.ID,
			Title:     category.Title,
			ImageURL:  category.ImageURL,
			CreatedAt: category.CreatedAt,
			UpdatedAt: category.UpdatedAt,
		})
	}
}

func (ca *categoryHandler) GetCategoryBySearchText() gin.HandlerFunc {
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
		categories, err := ca.categoryService.GetCategoryBySearchText(c, req.SearchText, req.Offset, req.Limit)
		if err != nil {
			ca.logger.Error(err.Error())
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "internal server error",
			})
			return
		}
		categoriesRes := make([]response.CategoryResponse, 0)
		for _, category := range categories {
			categoriesRes = append(categoriesRes, response.CategoryResponse{
				ID:        category.ID,
				Title:     category.Title,
				ImageURL:  category.ImageURL,
				CreatedAt: category.CreatedAt,
				UpdatedAt: category.UpdatedAt,
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
