package repo

import (
	"bytes"
	apperrors "channel-service/internal/error"
	"channel-service/internal/model"
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/elastic/go-elasticsearch/v9"
	"github.com/elastic/go-elasticsearch/v9/esapi"
	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

type ChannelRepository interface {
	CreateChannel(ctx context.Context, channel model.Channel) error
	UpdateChannelByID(ctx context.Context, channel model.Channel) error
	GetChannelByID(ctx context.Context, id string) (model.Channel, error)
	GetChannelBySearchText(ctx context.Context, searchText string, limit, offset int) ([]model.Channel, error)
}

type channelRepository struct {
	db *gorm.DB
	es *elasticsearch.Client
}

const channelsIndex = "channels"

type EsErrorResponse struct {
	Error struct {
		Type   string `json:"type"`
		Reason string `json:"reason"`
	}
}

func (c *channelRepository) GetChannelBySearchText(ctx context.Context, searchText string, limit, offset int) ([]model.Channel, error) {
	query := map[string]interface{}{
		"from": offset,
		"size": limit,
	}

	if len(searchText) > 0 {
		query["query"] = map[string]interface{}{
			"multi_match": map[string]interface{}{
				"query":                searchText,
				"fields":               []string{"title^2", "description"},
				"type":                 "best_fields",
				"fuzziness":            "AUTO",
				"minimum_should_match": "75%",
			},
		}
	} else {
		query["sort"] = []map[string]interface{}{
			{
				"created_at": "desc",
			},
		}
	}

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(query); err != nil {
		return nil, fmt.Errorf("channelRepository.GetChannelBySearchText : %w", err)
	}

	res, err := c.es.Search(
		c.es.Search.WithContext(ctx),
		c.es.Search.WithIndex(channelsIndex),
		c.es.Search.WithBody(&buf),
	)
	if err != nil {
		return nil, fmt.Errorf("channelRepository.GetChannelBySearchText : %w", err)
	}
	defer res.Body.Close()
	if res.IsError() {
		var e EsErrorResponse
		if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("channelRepository.GetChannelBySearchText : %w", err)
		}
		return nil, apperrors.NewElasticSearchError(res.StatusCode, e.Error.Type, e.Error.Reason)
	}
	var data struct {
		Hits struct {
			Hits []model.Channel `json:"hits"`
		} `json:"hits"`
	}
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("channelRepository.GetChannelBySearchText : %w", err)
	}
	return data.Hits.Hits, nil
}

func (c *channelRepository) CreateChannel(ctx context.Context, channel model.Channel) error {
	result := c.db.WithContext(ctx).Create(&channel)
	if result.Error != nil {
		var pgErr *pgconn.PgError
		if errors.As(result.Error, &pgErr) && pgErr.Code == "23505" {
			if pgErr.ConstraintName == "channels_id_key" {
				return apperrors.ErrChannelAlreadyExists
			}
		}
		return fmt.Errorf("channelRepository.CreateChannel: %w", result.Error)
	}
	return nil
}

func (c *channelRepository) UpdateChannelByID(ctx context.Context, channel model.Channel) error {
	result := c.db.WithContext(ctx).Updates(&channel)
	if result.Error != nil {
		return fmt.Errorf("channelRepository.UpdateChannelByID: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return apperrors.ErrChannelNotFound
	}
	return nil
}

func (c *channelRepository) GetChannelByID(ctx context.Context, id string) (model.Channel, error) {
	req := esapi.GetRequest{
		Index:      channelsIndex,
		DocumentID: id,
	}
	resp, err := req.Do(ctx, c.es)
	if err != nil {
		return model.Channel{}, fmt.Errorf("channelRepository.GetChannelByID: %w", err)
	}
	defer resp.Body.Close()
	if resp.IsError() {
		var e EsErrorResponse
		if err = json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return model.Channel{}, fmt.Errorf("channelRepository.GetChannelByID: %w", err)
		}
		if resp.StatusCode == 404 && e.Error.Type == "" {
			return model.Channel{}, apperrors.ErrChannelNotFound
		}
		return model.Channel{}, apperrors.NewElasticSearchError(resp.StatusCode, e.Error.Type, e.Error.Reason)
	}
	var data struct {
		Source struct {
			model.Channel
		} `json:"_source"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return model.Channel{}, fmt.Errorf("channelRepository.GetChannelByID: %w", err)
	}
	return data.Source.Channel, nil
}

func NewChannelRepository(db *gorm.DB, es *elasticsearch.Client) ChannelRepository {
	return &channelRepository{
		db: db,
		es: es,
	}
}
