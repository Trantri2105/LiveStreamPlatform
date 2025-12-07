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
	"gorm.io/gorm"
)

type StreamRepository interface {
	CreateStream(ctx context.Context, stream model.Stream) error
	GetStreamByID(ctx context.Context, id string) (model.Stream, error)
	GetStreamByChannelID(ctx context.Context, channelID string, status string, limit int, offset int) ([]model.Stream, error)
	UpdateStreamById(ctx context.Context, stream model.Stream) error
	GetStreamBySearchText(ctx context.Context, searchText string, status string, limit int, offset int) ([]model.Stream, error)
	WithTransaction(tx *gorm.DB) StreamRepository
}

type streamRepository struct {
	db *gorm.DB
	es *elasticsearch.Client
}

func (s *streamRepository) WithTransaction(tx *gorm.DB) StreamRepository {
	return &streamRepository{
		db: tx,
		es: s.es,
	}
}

const streamsIndex = "streams"

func (s *streamRepository) CreateStream(ctx context.Context, stream model.Stream) error {
	err := s.db.WithContext(ctx).Create(&stream).Error
	if err != nil {
		return fmt.Errorf("create stream: %w", err)
	}
	return nil
}

func (s *streamRepository) GetStreamByID(ctx context.Context, id string) (model.Stream, error) {
	req := esapi.GetRequest{
		Index:      streamsIndex,
		DocumentID: id,
	}
	resp, err := req.Do(ctx, s.es)
	if err != nil {
		return model.Stream{}, fmt.Errorf("streamRepo.GetStreamByID: %w", err)
	}
	defer resp.Body.Close()
	if resp.IsError() {
		var e EsErrorResponse
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return model.Stream{}, fmt.Errorf("streamRepo.GetStreamByID: %w", err)
		}
		if resp.StatusCode == 404 && e.Error.Type == "" {
			return model.Stream{}, apperrors.ErrStreamNotFound
		}
		return model.Stream{}, apperrors.NewElasticSearchError(resp.StatusCode, e.Error.Type, e.Error.Reason)
	}
	var data struct {
		Source struct {
			model.Stream
		} `json:"_source"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return model.Stream{}, fmt.Errorf("streamRepo.GetStreamByID: %w", err)
	}
	return data.Source.Stream, nil
}

func (s *streamRepository) GetStreamByChannelID(ctx context.Context, channelID string, status string, limit int, offset int) ([]model.Stream, error) {
	must := make([]map[string]interface{}, 0, 2)

	must = append(must, map[string]interface{}{
		"term": map[string]interface{}{
			"channel_id": channelID,
		},
	})

	if status != "" {
		must = append(must, map[string]interface{}{
			"term": map[string]interface{}{
				"status": status,
			},
		})
	}

	query := map[string]interface{}{
		"query": map[string]interface{}{
			"bool": map[string]interface{}{
				"must": must,
			},
		},
		"from": offset,
		"size": limit,
		"sort": []map[string]interface{}{
			{
				"created_at": "desc",
			},
		},
	}

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(query); err != nil {
		return nil, fmt.Errorf("streamRepo.GetStreamByChannelID: %w", err)
	}
	res, err := s.es.Search(
		s.es.Search.WithContext(ctx),
		s.es.Search.WithIndex(streamsIndex),
		s.es.Search.WithBody(&buf))
	if err != nil {
		return nil, fmt.Errorf("streamRepo.GetStreamByChannelID: %w", err)
	}
	defer res.Body.Close()
	if res.IsError() {
		var e EsErrorResponse
		if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("streamRepo.GetStreamByChannelID: %w", err)
		}
		return nil, apperrors.NewElasticSearchError(res.StatusCode, e.Error.Type, e.Error.Reason)
	}
	var data struct {
		Hits struct {
			Hits []struct {
				Source model.Stream `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("streamRepo.GetStreamByChannelID: %w", err)
	}
	var streams []model.Stream
	for _, hit := range data.Hits.Hits {
		streams = append(streams, hit.Source)
	}
	return streams, nil
}

func (s *streamRepository) UpdateStreamById(ctx context.Context, stream model.Stream) error {
	res := s.db.WithContext(ctx).Updates(&stream)
	if res.Error != nil {
		return fmt.Errorf("streamRepo.UpdateStreamById: %w", res.Error)
	}
	if res.RowsAffected == 0 {
		return apperrors.ErrStreamNotFound
	}
	return nil
}

func (s *streamRepository) GetStreamBySearchText(ctx context.Context, searchText string, status string, limit int, offset int) ([]model.Stream, error) {
	must := make([]map[string]interface{}, 0, 3)

	if searchText != "" {
		must = append(must, map[string]interface{}{
			"multi_match": map[string]interface{}{
				"query": searchText,
				"fields": []string{
					"title^2",
					"description",
					"channel_title",
					"category_title",
				},
				"type":                 "best_fields",
				"fuzziness":            "AUTO",
				"minimum_should_match": 1,
			},
		})
	} else {
		must = append(must, map[string]interface{}{
			"match_all": map[string]interface{}{},
		})
	}

	if status != "" {
		must = append(must, map[string]interface{}{
			"term": map[string]interface{}{
				"status": status,
			},
		})
	}

	body := map[string]interface{}{
		"query": map[string]interface{}{
			"bool": map[string]interface{}{
				"must": must,
			},
		},
		"from": offset,
		"size": limit,
	}

	if searchText == "" {
		body["sort"] = []map[string]interface{}{
			{
				"created_at": "desc",
			},
		}
	}
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(body); err != nil {
		return nil, fmt.Errorf("streamRepo.GetStreamBySearchText: %w", err)
	}
	res, err := s.es.Search(
		s.es.Search.WithContext(ctx),
		s.es.Search.WithIndex(streamsIndex),
		s.es.Search.WithBody(&buf))
	if err != nil {
		return nil, fmt.Errorf("streamRepo.GetStreamBySearchText: %w", err)
	}
	defer res.Body.Close()
	if res.IsError() {
		var e EsErrorResponse
		if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("streamRepo.GetStreamBySearchText: %w", err)
		}
		return nil, apperrors.NewElasticSearchError(res.StatusCode, e.Error.Type, e.Error.Reason)
	}
	var data struct {
		Hits struct {
			Hits []struct {
				Source model.Stream `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("streamRepo.GetStreamBySearchText: %w", err)
	}
	var streams []model.Stream
	for _, hit := range data.Hits.Hits {
		streams = append(streams, hit.Source)
	}
	return streams, nil
}

func NewStreamRepository(es *elasticsearch.Client, db *gorm.DB) StreamRepository {
	return &streamRepository{
		es: es,
		db: db,
	}
}
