package service

import (
	apperrors "channel-service/internal/error"
	"channel-service/internal/model"
	"channel-service/internal/repo"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"mime/multipart"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

const imagesBucket = "images"

type ChannelService interface {
	CreateChannel(ctx context.Context, channel model.Channel) error
	UpdateChannelByID(ctx context.Context, channel model.Channel, tx *gorm.DB) error
	GetChannelByID(ctx context.Context, channelID string) (model.Channel, error)
	GetChannelBySearchText(ctx context.Context, searchText string, limit, offset int) ([]model.Channel, error)
	SetChannelAvatar(ctx context.Context, fileHeader *multipart.FileHeader, channelID string) error
	CreateSubscription(ctx context.Context, subscription model.Subscription) error
	DeleteSubscription(ctx context.Context, subscription model.Subscription) error
	GetChannelFollower(ctx context.Context, channelID string, limit int, offset int) ([]model.Channel, error)
	GetFollowingChannel(ctx context.Context, channelID string, limit int, offset int) ([]model.Channel, error)
	GetLiveFollowingChannel(ctx context.Context, channelID string, limit int, offset int) ([]model.Channel, error)
	UpdateSubscription(ctx context.Context, subscription model.Subscription) error
	NotifyLiveStream(stream model.Stream) error
}

type channelService struct {
	channelRepo   repo.ChannelRepository
	minioClient   *minio.Client
	logger        *zap.Logger
	kafkaWriter   *kafka.Writer
	minioEndpoint string
}

type Notification struct {
	ID        string            `json:"id"`
	ChannelID string            `json:"channelID_id"`
	Type      string            `json:"type"`
	Title     string            `json:"title"`
	Body      string            `json:"body"`
	Data      datatypes.JSONMap `json:"data" gorm:"type:jsonb"`
}

func (c *channelService) NotifyLiveStream(stream model.Stream) error {
	channelID := stream.ChannelID
	currentOffset := 0
	batchSize := 10000
	for {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
		channels, err := c.GetChannelFollower(ctx, channelID, batchSize, currentOffset)
		cancel()
		if err != nil {
			return err
		}
		if len(channels) == 0 {
			break
		}
		var messages []kafka.Message
		for _, channel := range channels {
			notification := Notification{
				ID:        uuid.NewString(),
				ChannelID: channel.ID,
				Type:      "Channel Live",
				Title:     fmt.Sprintf("Channel %s is live!", stream.ChannelTitle),
				Body:      stream.Title,
				Data: datatypes.JSONMap{
					"channel_id": stream.ChannelID,
					"stream_id":  stream.ID,
				},
			}
			b, err := json.Marshal(notification)
			if err != nil {
				c.logger.Error("failed to marshal notification", zap.Error(err))
				continue
			}
			messages = append(messages, kafka.Message{
				Key:   []byte(notification.ID),
				Value: b,
			})
		}
		err = c.kafkaWriter.WriteMessages(context.Background(), messages...)
		if err != nil {
			c.logger.Error("failed to write messages", zap.Error(err))
			return err
		}
		currentOffset += len(channels)
		if len(channels) < batchSize {
			break
		}
	}
	return nil
}

func (c *channelService) UpdateSubscription(ctx context.Context, subscription model.Subscription) error {
	return c.channelRepo.UpdateSubscription(ctx, subscription)
}

func (c *channelService) CreateSubscription(ctx context.Context, subscription model.Subscription) error {
	return c.channelRepo.CreateSubscription(ctx, subscription)
}

func (c *channelService) DeleteSubscription(ctx context.Context, subscription model.Subscription) error {
	return c.channelRepo.DeleteSubscription(ctx, subscription)
}

func (c *channelService) GetChannelFollower(ctx context.Context, channelID string, limit int, offset int) ([]model.Channel, error) {
	return c.channelRepo.GetChannelFollower(ctx, channelID, limit, offset)
}

func (c *channelService) GetFollowingChannel(ctx context.Context, channelID string, limit int, offset int) ([]model.Channel, error) {
	return c.channelRepo.GetFollowingChannel(ctx, channelID, limit, offset)
}

func (c *channelService) GetLiveFollowingChannel(ctx context.Context, channelID string, limit int, offset int) ([]model.Channel, error) {
	return c.channelRepo.GetLiveFollowingChannel(ctx, channelID, limit, offset)
}

func (c *channelService) SetChannelAvatar(ctx context.Context, fileHeader *multipart.FileHeader, channelID string) error {
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
		channelID,
		file,
		fileHeader.Size,
		minio.PutObjectOptions{
			ContentType: contentType,
		},
	)
	return err
}

func (c *channelService) CreateChannel(ctx context.Context, channel model.Channel) error {
	channel.SubscriptionCount = 0
	channel.IsLive = false
	return c.channelRepo.CreateChannel(ctx, channel)
}

func (c *channelService) UpdateChannelByID(ctx context.Context, channel model.Channel, tx *gorm.DB) error {
	if tx != nil {
		return c.channelRepo.WithTransaction(tx).UpdateChannelByID(ctx, channel)
	}
	return c.channelRepo.UpdateChannelByID(ctx, channel)
}

func (c *channelService) GetChannelByID(ctx context.Context, channelID string) (model.Channel, error) {
	channel, err := c.channelRepo.GetChannelByID(ctx, channelID)
	if err != nil {
		return model.Channel{}, err
	}
	avatarURL, err := c.getPresignedURL(ctx, channelID)
	if err != nil {
		c.logger.Error("failed to get avatar url", zap.Error(err))
	} else {
		channel.AvatarURL = avatarURL
	}
	return channel, nil
}

func (c *channelService) getPresignedURL(ctx context.Context, key string) (string, error) {
	_, err := c.minioClient.StatObject(ctx, imagesBucket, key, minio.StatObjectOptions{})
	if err != nil {
		if minio.ToErrorResponse(err).Code == "NoSuchKey" {
			return "", apperrors.ErrMinioKeyNotFound
		}
		return "", err
	}
	u, err := c.minioClient.PresignedGetObject(ctx, imagesBucket, key, 15*time.Minute, nil)
	if err != nil {
		return "", err
	}
	return u.String(), nil
}

func (c *channelService) GetChannelBySearchText(ctx context.Context, searchText string, limit, offset int) ([]model.Channel, error) {
	channels, err := c.channelRepo.GetChannelBySearchText(ctx, searchText, limit, offset)
	if err != nil {
		return nil, err
	}
	for i := range channels {
		avatarURL, err := c.getPresignedURL(ctx, channels[i].ID)
		if err != nil {
			c.logger.Error("failed to get avatar url", zap.Error(err))
			if !errors.Is(err, apperrors.ErrMinioKeyNotFound) {
				break
			}
			continue
		}
		channels[i].AvatarURL = avatarURL
	}
	return channels, nil
}

func NewChannelService(channelRepo repo.ChannelRepository, logger *zap.Logger, minioClient *minio.Client, minioEndpoint string, kafkaWriter *kafka.Writer) ChannelService {
	return &channelService{
		channelRepo:   channelRepo,
		logger:        logger,
		minioClient:   minioClient,
		minioEndpoint: minioEndpoint,
		kafkaWriter:   kafkaWriter,
	}
}
