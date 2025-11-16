package consumer

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"notification-service/internal/model"
	"notification-service/internal/service"
	"time"

	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
)

type NotificationConsumer interface {
	Start()
	Stop()
}

type notificationConsumer struct {
	logger              *zap.Logger
	kafkaReader         *kafka.Reader
	notificationService service.NotificationService
}

func (n *notificationConsumer) Start() {
	go func() {
		for {
			m, err := n.kafkaReader.FetchMessage(context.Background())
			if err != nil {
				if errors.Is(err, io.EOF) {
					return
				}
				err = fmt.Errorf("NotificationConsumer.Start: %w", err)
				n.logger.Log(zap.ErrorLevel, "failed to fetch message", zap.Error(err))
				continue
			}
			if m.Value == nil {
				err = n.kafkaReader.CommitMessages(context.Background(), m)
				if err != nil {
					err = fmt.Errorf("NotificationConsumer.Start: %w", err)
					n.logger.Log(zap.ErrorLevel, "failed to commit messages", zap.Error(err))
				}
				continue
			}
			var event model.Notification
			if err = json.Unmarshal(m.Value, &event); err != nil {
				err = fmt.Errorf("NotificationConsumer.Start: %w", err)
				n.logger.Log(zap.ErrorLevel, "failed to unmarshal message", zap.Error(err))
				err = n.kafkaReader.CommitMessages(context.Background(), m)
				if err != nil {
					err = fmt.Errorf("NotificationConsumer.Start: %w", err)
					n.logger.Log(zap.ErrorLevel, "failed to commit messages", zap.Error(err))
				}
				continue
			}
			event.IsRead = false
			ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
			err = n.notificationService.CreateNotification(ctx, event)
			cancel()
			if err != nil {
				err = fmt.Errorf("NotificationConsumer.Start: %w", err)
				n.logger.Log(zap.ErrorLevel, "failed to create notification", zap.Error(err))
			}
		}
	}()
}

func (n *notificationConsumer) Stop() {
	n.kafkaReader.Close()
}

func NewNotificationConsumer(logger *zap.Logger, kafkaReader *kafka.Reader) NotificationConsumer {
	return &notificationConsumer{
		kafkaReader: kafkaReader,
		logger:      logger,
	}
}
