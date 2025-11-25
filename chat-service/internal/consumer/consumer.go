package consumer

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
	"thanhnt208/chat-service/internal/realtime"
	"thanhnt208/chat-service/internal/handlers"
)

func StartDonateConsumer(brokerAddr, topic, groupID string, hub *realtime.Hub) {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:   []string{brokerAddr},
		GroupID:   groupID,
		Topic:     topic,
		MinBytes:  10e3,
		MaxBytes:  10e6,
	})
	log.Printf("Kafka donate consumer started for topic=%s", topic)

	for {
		m, err := r.ReadMessage(context.Background())
		if err != nil {
			log.Printf("kafka read error: %v", err)
			time.Sleep(time.Second)
			continue
		}

		var donate handlers.DonateTransaction
		if err := json.Unmarshal(m.Value, &donate); err != nil {
			log.Printf("invalid donate payload: %v", err)
			continue
		}

		go handlers.HandleDonateMessage(donate, hub)
	}
}
