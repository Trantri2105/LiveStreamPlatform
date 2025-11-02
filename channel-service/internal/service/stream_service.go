package service

import (
	"channel-service/internal/api/dto/request"
	"channel-service/internal/client"
	"channel-service/internal/model"
	"channel-service/internal/repo"
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

type StreamService interface {
	CreateStream(ctx context.Context, stream model.Stream, userToken string) (model.Stream, error)
	GetStreamByID(ctx context.Context, id string) (model.Stream, error)
	GetStreamByChannelID(ctx context.Context, channelID string, status string, limit int, offset int) ([]model.Stream, error)
	UpdateStreamById(ctx context.Context, stream model.Stream) error
	GetStreamBySearchText(ctx context.Context, searchText string, status string, limit int, offset int) ([]model.Stream, error)
	HandleOVMNotify(ctx context.Context, request request.OVMRequest) (map[string]interface{}, error)
}

type streamService struct {
	channelService  ChannelService
	categoryService CategoryService
	chatClient      client.ChatClient
	streamRepo      repo.StreamRepository
	srtServerURL    string
	hlsServerURL    string
}

func (s *streamService) HandleOVMNotify(ctx context.Context, request request.OVMRequest) (map[string]interface{}, error) {
	streamID := strings.TrimPrefix(request.Request.Url, "srt://default/app/")
	stream, err := s.streamRepo.GetStreamByID(ctx, streamID)
	if err != nil {
		return nil, err
	}
	// closing
	if request.Request.Status == "closing" {
		stream.Status = model.StatusStreamEnd
		err = s.streamRepo.UpdateStreamById(ctx, stream)
		if err != nil {
			return nil, err
		}
		return make(map[string]interface{}), nil
	}
	// opening
	if stream.Status != model.StatusStreamInit {
		return map[string]interface{}{
			"allowed": false,
		}, nil
	}
	stream.Status = model.StatusStreamLive
	err = s.streamRepo.UpdateStreamById(ctx, stream)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"allowed": true,
	}, nil
}

func (s *streamService) CreateStream(ctx context.Context, stream model.Stream, userToken string) (model.Stream, error) {
	stream.ID = uuid.New().String()
	if stream.Category.ID != "" {
		category, err := s.categoryService.GetCategoryByID(ctx, stream.Category.ID)
		if err != nil {
			return model.Stream{}, err
		}
		stream.Category.Title = category.Title
	}
	channel, err := s.channelService.GetChannelByID(ctx, stream.Channel.ID)
	if err != nil {
		return model.Stream{}, err
	}
	stream.Channel.Title = channel.Title
	stream.SrtServerURL = s.srtServerURL
	stream.StreamKey = fmt.Sprintf("default/app/%s", stream.ID)
	stream.HlsURL = fmt.Sprintf("%s/app/%s/master.m3u8", s.hlsServerURL, stream.ID)
	stream.Status = model.StatusStreamInit
	roomChatUrl, err := s.chatClient.CreateRoomChat(ctx, userToken, stream.ID, "/api/chat/thread")
	if err != nil {
		return model.Stream{}, fmt.Errorf("create room chat failed: %w", err)
	}
	stream.LiveChatURL = roomChatUrl
	err = s.streamRepo.CreateStream(ctx, stream)
	if err != nil {
		return model.Stream{}, err
	}
	return stream, nil
}

func (s *streamService) GetStreamByID(ctx context.Context, id string) (model.Stream, error) {
	return s.streamRepo.GetStreamByID(ctx, id)
}

func (s *streamService) GetStreamByChannelID(ctx context.Context, channelID string, status string, limit int, offset int) ([]model.Stream, error) {
	return s.streamRepo.GetStreamByChannelID(ctx, channelID, status, limit, offset)
}

func (s *streamService) UpdateStreamById(ctx context.Context, stream model.Stream) error {
	return s.streamRepo.UpdateStreamById(ctx, stream)
}

func (s *streamService) GetStreamBySearchText(ctx context.Context, searchText string, status string, limit int, offset int) ([]model.Stream, error) {
	return s.streamRepo.GetStreamBySearchText(ctx, searchText, status, limit, offset)
}

func NewStreamService(channelService ChannelService, categoryService CategoryService, streamRepo repo.StreamRepository, srtServerURL string, hlsServerUrl string, chatClient client.ChatClient) StreamService {
	return &streamService{
		channelService:  channelService,
		categoryService: categoryService,
		streamRepo:      streamRepo,
		srtServerURL:    srtServerURL,
		hlsServerURL:    hlsServerUrl,
		chatClient:      chatClient,
	}
}
