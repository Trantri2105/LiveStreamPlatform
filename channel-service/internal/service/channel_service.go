package service

import (
	"channel-service/internal/model"
	"channel-service/internal/repo"
	"context"
)

type ChannelService interface {
	CreateChannel(ctx context.Context, channel model.Channel) error
	UpdateChannelByID(ctx context.Context, channel model.Channel) error
	GetChannelByID(ctx context.Context, channelID string) (model.Channel, error)
	GetChannelBySearchText(ctx context.Context, searchText string, limit, offset int) ([]model.Channel, error)
}

type channelService struct {
	channelRepo repo.ChannelRepository
}

func (c *channelService) CreateChannel(ctx context.Context, channel model.Channel) error {
	return c.channelRepo.CreateChannel(ctx, channel)
}

func (c *channelService) UpdateChannelByID(ctx context.Context, channel model.Channel) error {
	return c.channelRepo.UpdateChannelByID(ctx, channel)
}

func (c *channelService) GetChannelByID(ctx context.Context, channelID string) (model.Channel, error) {
	return c.channelRepo.GetChannelByID(ctx, channelID)
}

func (c *channelService) GetChannelBySearchText(ctx context.Context, searchText string, limit, offset int) ([]model.Channel, error) {
	return c.channelRepo.GetChannelBySearchText(ctx, searchText, limit, offset)
}

func NewChannelService(channelRepo repo.ChannelRepository) ChannelService {
	return &channelService{
		channelRepo: channelRepo,
	}
}
