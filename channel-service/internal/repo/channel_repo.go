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
	CreateSubscription(ctx context.Context, subscription model.Subscription) error
	DeleteSubscription(ctx context.Context, subscription model.Subscription) error
	GetChannelFollower(ctx context.Context, channelID string, limit int, offset int) ([]model.Channel, error)
	GetFollowingChannel(ctx context.Context, channelID string, limit int, offset int) ([]model.Channel, error)
	GetLiveFollowingChannel(ctx context.Context, channelID string, limit int, offset int) ([]model.Channel, error)
	UpdateSubscription(ctx context.Context, subscription model.Subscription) error
	WithTransaction(tx *gorm.DB) ChannelRepository
	GetChannelNotifyFollower(ctx context.Context, channelID string, limit int, offset int) ([]model.Channel, error)
}

type channelRepository struct {
	db *gorm.DB
	es *elasticsearch.Client
}

func (c *channelRepository) GetChannelNotifyFollower(ctx context.Context, channelID string, limit int, offset int) ([]model.Channel, error) {
	var channels []model.Channel
	err := c.db.WithContext(ctx).Table("subscriptions AS s").Joins("JOIN channels ON s.follower_id = channels.id").Where("s.channel_id = ? and s.notification_enabled = ?", channelID, true).Select("channels.*").Limit(limit).Offset(offset).Order("channels.id DESC").Scan(&channels).Error
	if err != nil {
		return nil, fmt.Errorf("get channel follower: %w", err)
	}
	return channels, nil
}

func (c *channelRepository) WithTransaction(tx *gorm.DB) ChannelRepository {
	return &channelRepository{
		db: tx,
		es: c.es,
	}
}

func (c *channelRepository) UpdateSubscription(ctx context.Context, subscription model.Subscription) error {
	result := c.db.WithContext(ctx).Where("channel_id = ? and follower_id = ?", subscription.ChannelID, subscription.FollowerID).Updates(&subscription)
	if result.Error != nil {
		return fmt.Errorf("update subscription notification: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return apperrors.ErrSubscriptionNotFound
	}
	return nil
}

func (c *channelRepository) GetChannelFollower(ctx context.Context, channelID string, limit int, offset int) ([]model.Channel, error) {
	var channels []model.Channel
	err := c.db.WithContext(ctx).Table("subscriptions AS s").Joins("JOIN channels ON s.follower_id = channels.id").Where("s.channel_id = ?", channelID).Select("channels.*").Limit(limit).Offset(offset).Order("channels.id DESC").Scan(&channels).Error
	if err != nil {
		return nil, fmt.Errorf("get channel follower: %w", err)
	}
	return channels, nil
}

func (c *channelRepository) GetFollowingChannel(ctx context.Context, channelID string, limit int, offset int) ([]model.Channel, error) {
	var channels []model.Channel
	err := c.db.WithContext(ctx).Table("subscriptions AS s").Joins("JOIN channels ON s.channel_id = channels.id").Where("s.follower_id = ?", channelID).Select("channels.*").Limit(limit).Offset(offset).Order("channels.id DESC").Scan(&channels).Error
	if err != nil {
		return nil, fmt.Errorf("get following channel: %w", err)
	}
	return channels, nil
}

func (c *channelRepository) GetLiveFollowingChannel(ctx context.Context, channelID string, limit int, offset int) ([]model.Channel, error) {
	var channels []model.Channel
	err := c.db.WithContext(ctx).Table("subscriptions AS s").Joins("JOIN channels ON s.channel_id = channels.id").Where("s.follower_id = ? AND channels.is_live = ?", channelID, true).Select("channels.*").Limit(limit).Offset(offset).Order("channels.id DESC").Scan(&channels).Error
	if err != nil {
		return nil, fmt.Errorf("get following live channel: %w", err)
	}
	return channels, nil
}

func (c *channelRepository) CreateSubscription(ctx context.Context, subscription model.Subscription) error {
	err := c.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res := c.db.Create(&subscription)
		if res.Error != nil {
			var pgErr *pgconn.PgError
			if errors.As(res.Error, &pgErr) && pgErr.Code == "23505" {
				if pgErr.ConstraintName == "subscriptions_pkey" {
					return apperrors.ErrSubscriptionAlreadyExists
				} else {
					return apperrors.ErrChannelNotFound
				}
			}
			return fmt.Errorf("channelRepository.CreateSubscription: %w", res.Error)
		}
		res = c.db.Exec("UPDATE channels SET subscription_count = subscription_count + 1 WHERE id = ?", subscription.ChannelID)
		if res.Error != nil {
			if errors.Is(res.Error, gorm.ErrRecordNotFound) {
				return apperrors.ErrChannelNotFound
			}
			return fmt.Errorf("channelRepository.CreateSubscription: %w", res.Error)
		}
		return nil
	})
	return err
}

func (c *channelRepository) DeleteSubscription(ctx context.Context, subscription model.Subscription) error {
	err := c.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res := c.db.Where("channel_id = ? and follower_id = ?", subscription.ChannelID, subscription.FollowerID).Delete(&model.Subscription{})
		if res.Error != nil {
			return fmt.Errorf("channelRepository.DeleteSubscription: %w", res.Error)
		}
		if res.RowsAffected > 0 {
			res = c.db.Exec("UPDATE channels SET subscription_count = subscription_count - 1 WHERE id = ?", subscription.ChannelID)
			if res.Error != nil {
				if errors.Is(res.Error, gorm.ErrRecordNotFound) {
					return apperrors.ErrChannelNotFound
				}
				return fmt.Errorf("channelRepository.CreateSubscription: %w", res.Error)
			}
		}
		return nil
	})
	return err
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
				"minimum_should_match": 1,
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
			Hits []struct {
				Source model.Channel `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("channelRepository.GetChannelBySearchText : %w", err)
	}
	var channels []model.Channel
	for _, hit := range data.Hits.Hits {
		channels = append(channels, hit.Source)
	}
	return channels, nil
}

func (c *channelRepository) CreateChannel(ctx context.Context, channel model.Channel) error {
	result := c.db.WithContext(ctx).Create(&channel)
	if result.Error != nil {
		var pgErr *pgconn.PgError
		if errors.As(result.Error, &pgErr) && pgErr.Code == "23505" {
			if pgErr.ConstraintName == "channels_pkey" {
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
