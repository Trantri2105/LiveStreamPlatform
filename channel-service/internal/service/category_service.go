package service

import (
	"channel-service/internal/model"
	"channel-service/internal/repo"
	"context"
)

type CategoryService interface {
	GetCategoryByID(ctx context.Context, id string) (model.Category, error)
	GetCategoryBySearchText(ctx context.Context, searchText string, offset int, limit int) ([]model.Category, error)
	CreateCategory(ctx context.Context, category model.Category) error
	DeleteCategory(ctx context.Context, id string) error
}

type categoryService struct {
	categoryRepo repo.CategoryRepository
}

func (c *categoryService) CreateCategory(ctx context.Context, category model.Category) error {
	return c.categoryRepo.CreateCategory(ctx, category)
}

func (c *categoryService) DeleteCategory(ctx context.Context, id string) error {
	return c.categoryRepo.DeleteCategory(ctx, id)
}

func (c *categoryService) GetCategoryByID(ctx context.Context, id string) (model.Category, error) {
	return c.categoryRepo.GetCategoryByID(ctx, id)
}

func (c *categoryService) GetCategoryBySearchText(ctx context.Context, searchText string, offset int, limit int) ([]model.Category, error) {
	return c.categoryRepo.GetCategoryBySearchText(ctx, searchText, offset, limit)
}

func NewCategoryService(categoryRepo repo.CategoryRepository) CategoryService {
	return &categoryService{
		categoryRepo: categoryRepo,
	}
}
