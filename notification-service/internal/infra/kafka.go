package infra

import (
	"notification-service/internal/config"

	"github.com/segmentio/kafka-go"
)

func NewKafkaReader(cfg config.KafkaConfig) *kafka.Reader {
	return kafka.NewReader(kafka.ReaderConfig{
		Brokers:       cfg.Brokers,
		GroupID:       cfg.GroupID,
		Topic:         cfg.Topic,
		QueueCapacity: 1000,
	})
}
