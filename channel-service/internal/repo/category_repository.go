package repo

import (
	"bytes"
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
	GetCategoryBySearchText(ctx context.Context, searchText string, offset int, limit int) ([]model.Category, error)
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

func (c *categoryRepository) GetCategoryBySearchText(ctx context.Context, searchText string, offset int, limit int) ([]model.Category, error) {
	query := map[string]interface{}{
		"from": offset,
		"size": limit,
	}

	if len(searchText) > 0 {
		query["query"] = map[string]interface{}{
			"match": map[string]interface{}{
				"title": map[string]interface{}{
					"query":                searchText,
					"fuzziness":            "AUTO",
					"minimum_should_match": 1,
				},
			},
		}
	} else {
		query["sort"] = []map[string]interface{}{
			{
				"id": "desc",
			},
		}
	}

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(query); err != nil {
		return nil, fmt.Errorf("categoryRepository.GetCategoryBySearchText : %w", err)
	}

	res, err := c.es.Search(
		c.es.Search.WithContext(ctx),
		c.es.Search.WithIndex(categoriesIndex),
		c.es.Search.WithBody(&buf),
	)
	if err != nil {
		return nil, fmt.Errorf("categoryRepository.GetCategoryBySearchText : %w", err)
	}
	defer res.Body.Close()
	if res.IsError() {
		var e EsErrorResponse
		if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("categoryRepository.GetCategoryBySearchText : %w", err)
		}
		return nil, apperrors.NewElasticSearchError(res.StatusCode, e.Error.Type, e.Error.Reason)
	}
	var data struct {
		Hits struct {
			Hits []struct {
				Source model.Category `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("categoryRepository.GetCategoryBySearchText : %w", err)
	}
	var categories []model.Category
	for _, hit := range data.Hits.Hits {
		categories = append(categories, hit.Source)
	}
	return categories, nil
}

func NewCategoryRepository(es *elasticsearch.Client) CategoryRepository {
	return &categoryRepository{
		es: es,
	}
}
