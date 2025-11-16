package service

import (
	"context"
	"notification-service/internal/model"
	"notification-service/internal/repo"
)

type NotificationService interface {
	CreateNotification(ctx context.Context, notification model.Notification) error
	MarkNotificationAsRead(ctx context.Context, notificationID []string, channelID string) error
	GetNotification(ctx context.Context, channelID string, limit, offset int) ([]model.Notification, error)
}

type notificationService struct {
	repo repo.NotificationRepo
}

func (n *notificationService) CreateNotification(ctx context.Context, notification model.Notification) error {
	return n.repo.CreateNotification(ctx, notification)
}

func (n *notificationService) MarkNotificationAsRead(ctx context.Context, notificationID []string, channelID string) error {
	return n.repo.MarkNotificationAsRead(ctx, notificationID, channelID)
}

func (n *notificationService) GetNotification(ctx context.Context, channelID string, limit, offset int) ([]model.Notification, error) {
	return n.repo.GetNotification(ctx, channelID, limit, offset)
}

func NewNotificationService(repo repo.NotificationRepo) NotificationService {
	return &notificationService{
		repo: repo,
	}
}
