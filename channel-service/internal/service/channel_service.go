package service

import (
	apperrors "channel-service/internal/error"
	"channel-service/internal/model"
	"channel-service/internal/repo"
	"context"
	"errors"
	"mime/multipart"
	"time"

	"github.com/minio/minio-go/v7"
	"go.uber.org/zap"
)

const imagesBucket = "images"

type ChannelService interface {
	CreateChannel(ctx context.Context, channel model.Channel) error
	UpdateChannelByID(ctx context.Context, channel model.Channel) error
	GetChannelByID(ctx context.Context, channelID string) (model.Channel, error)
	GetChannelBySearchText(ctx context.Context, searchText string, limit, offset int) ([]model.Channel, error)
	SetChannelAvatar(ctx context.Context, fileHeader *multipart.FileHeader, channelID string) error
}

type channelService struct {
	channelRepo   repo.ChannelRepository
	minioClient   *minio.Client
	logger        *zap.Logger
	minioEndpoint string
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
	return c.channelRepo.CreateChannel(ctx, channel)
}

func (c *channelService) UpdateChannelByID(ctx context.Context, channel model.Channel) error {
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

func NewChannelService(channelRepo repo.ChannelRepository, logger *zap.Logger, minioClient *minio.Client, minioEndpoint string) ChannelService {
	return &channelService{
		channelRepo:   channelRepo,
		logger:        logger,
		minioClient:   minioClient,
		minioEndpoint: minioEndpoint,
	}
}
