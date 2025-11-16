package repo

import (
	"context"
	"notification-service/internal/model"

	"gorm.io/gorm"
)

type NotificationRepo interface {
	CreateNotification(ctx context.Context, notification model.Notification) error
	MarkNotificationAsRead(ctx context.Context, notificationID []string, channelID string) error
	GetNotification(ctx context.Context, channelID string, limit, offset int) ([]model.Notification, error)
}

type notificationRepo struct {
	db *gorm.DB
}

func (n *notificationRepo) CreateNotification(ctx context.Context, notification model.Notification) error {
	return n.db.WithContext(ctx).Create(&notification).Error
}

func (n *notificationRepo) MarkNotificationAsRead(ctx context.Context, notificationID []string, channelID string) error {
	return n.db.WithContext(ctx).Model(&model.Notification{}).Where("id IN ? AND channel_id = ?", notificationID, channelID).Update("is_read", true).Error
}

func (n *notificationRepo) GetNotification(ctx context.Context, channelID string, limit, offset int) ([]model.Notification, error) {
	var notifications []model.Notification

	err := n.db.WithContext(ctx).Model(&model.Notification{}).Where("channel_id = ?", channelID).Order("created_at DESC").Limit(limit).Offset(offset).Find(&notifications).Error

	if err != nil {
		return nil, err
	}

	return notifications, nil
}

func NewNotificationRepo(db *gorm.DB) NotificationRepo {
	return &notificationRepo{
		db: db,
	}
}
