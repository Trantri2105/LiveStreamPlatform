package repo

import (
	apperrors "channel-service/internal/error"
	"channel-service/internal/model"
	"context"
	"encoding/json"
	"fmt"

	"github.com/elastic/go-elasticsearch/v9"
	"github.com/elastic/go-elasticsearch/v9/esapi"
)

type CategoryRepository interface {
	GetCategoryByID(ctx context.Context, id string) (model.Category, error)
	GetCategoryBySearchText(ctx context.Context, searchText string) (model.Category, error)
}

const categoriesIndex = "categories"

type categoryRepository struct {
	es *elasticsearch.Client
}

func (c *categoryRepository) GetCategoryByID(ctx context.Context, id string) (model.Category, error) {
	req := esapi.GetRequest{
		Index:      categoriesIndex,
		DocumentID: id,
	}
	resp, err := req.Do(ctx, c.es)
	if err != nil {
		return model.Category{}, fmt.Errorf("categoryRepository.GetCategoryByID: %w", err)
	}
	defer resp.Body.Close()
	if resp.IsError() {
		var e EsErrorResponse
		if err = json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return model.Category{}, fmt.Errorf("categoryRepository.GetCategoryByID: %w", err)
		}
		if resp.StatusCode == 404 && e.Error.Type == "" {
			return model.Category{}, apperrors.ErrCategoryNotFound
		}
		return model.Category{}, apperrors.NewElasticSearchError(resp.StatusCode, e.Error.Type, e.Error.Reason)
	}
	var data struct {
		Source struct {
			model.Category
		} `json:"_source"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return model.Category{}, fmt.Errorf("categoryRepository.GetCategoryByID: %w", err)
	}
	return data.Source.Category, nil
}

func (c *categoryRepository) GetCategoryBySearchText(ctx context.Context, searchText string) (model.Category, error) {
	//TODO implement me
	panic("implement me")
}

func NewCategoryRepository(es *elasticsearch.Client) CategoryRepository {
	return &categoryRepository{
		es: es,
	}
}
