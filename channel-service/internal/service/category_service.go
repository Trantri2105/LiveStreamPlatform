package service

import (
	apperrors "channel-service/internal/error"
	"channel-service/internal/model"
	"channel-service/internal/repo"
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"time"

	"github.com/minio/minio-go/v7"
	"go.uber.org/zap"
)

type CategoryService interface {
	GetCategoryByID(ctx context.Context, id string) (model.Category, error)
	GetCategoryBySearchText(ctx context.Context, searchText string, offset int, limit int) ([]model.Category, error)
	CreateCategory(ctx context.Context, category model.Category) error
	DeleteCategory(ctx context.Context, id string) error
	SetImage(ctx context.Context, fileHeader *multipart.FileHeader, categoryID string) error
}

type categoryService struct {
	categoryRepo repo.CategoryRepository
	minioClient  *minio.Client
	logger       *zap.Logger
}

func (c *categoryService) SetImage(ctx context.Context, fileHeader *multipart.FileHeader, categoryID string) error {
	file, err := fileHeader.Open()
	if err != nil {
		return apperrors.ErrInvalidFile
	}
	defer file.Close()

	contentType := fileHeader.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	_, err = c.minioClient.PutObject(
		ctx,
		imagesBucket,
		c.getImageID(categoryID),
		file,
		fileHeader.Size,
		minio.PutObjectOptions{
			ContentType: contentType,
		},
	)
	return err
}

func (c *categoryService) getPresignedURL(ctx context.Context, key string) (string, error) {
	_, err := c.minioClient.StatObject(ctx, imagesBucket, key, minio.StatObjectOptions{})
	if err != nil {
		if minio.ToErrorResponse(err).Code == "NoSuchKey" {
			return "", apperrors.ErrMinioKeyNotFound
		}
		return "", err
	}
	u, err := c.minioClient.PresignedGetObject(ctx, imagesBucket, key, 15*time.Hour, nil)
	if err != nil {
		return "", err
	}
	return u.String(), nil
}

func (c *categoryService) enrichStreamWithImagesURL(ctx context.Context, category *model.Category) {
	imageURL, err := c.getPresignedURL(ctx, c.getImageID(category.ID))
	if err != nil {
		if !errors.Is(err, apperrors.ErrMinioKeyNotFound) {
			c.logger.Error("failed to get avatar url", zap.Error(err))
		}
	} else {
		category.ImageURL = imageURL
	}
}

func (c *categoryService) CreateCategory(ctx context.Context, category model.Category) error {
	return c.categoryRepo.CreateCategory(ctx, category)
}

func (c *categoryService) DeleteCategory(ctx context.Context, id string) error {
	return c.categoryRepo.DeleteCategory(ctx, id)
}

func (c *categoryService) GetCategoryByID(ctx context.Context, id string) (model.Category, error) {
	category, err := c.categoryRepo.GetCategoryByID(ctx, id)
	if err != nil {
		return model.Category{}, err
	}
	c.enrichStreamWithImagesURL(ctx, &category)
	return category, nil
}

func (c *categoryService) GetCategoryBySearchText(ctx context.Context, searchText string, offset int, limit int) ([]model.Category, error) {
	categories, err := c.categoryRepo.GetCategoryBySearchText(ctx, searchText, offset, limit)
	if err != nil {
		return nil, err
	}
	for i := range categories {
		c.enrichStreamWithImagesURL(ctx, &categories[i])
	}
	return categories, nil
}

func (c *categoryService) getImageID(id string) string {
	return fmt.Sprintf("category_%s", id)
}

func NewCategoryService(categoryRepo repo.CategoryRepository, minioClient *minio.Client, logger *zap.Logger) CategoryService {
	return &categoryService{
		categoryRepo: categoryRepo,
		minioClient:  minioClient,
		logger:       logger,
	}
}
