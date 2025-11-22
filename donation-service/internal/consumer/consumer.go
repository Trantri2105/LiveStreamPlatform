package consumer

import (
	"context"
	"donation-service/internal/model"
	"donation-service/internal/service"
	"encoding/json"
	"errors"
	"io"
	"time"

	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
)

type ChannelConsumer interface {
	Start()
	Stop()
}

type channelConsumer struct {
	kafkaReader     *kafka.Reader
	donationService service.DonationService
	logger          *zap.Logger
}

type channelEvent struct {
	Payload struct {
		Op     string `json:"op"`
		Before struct {
			Id string `json:"id"`
		} `json:"before"`
		After struct {
			Id string `json:"id"`
		} `json:"after"`
	} `json:"payload"`
}

func (c *channelConsumer) commitMessage(m kafka.Message) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	err := c.kafkaReader.CommitMessages(ctx, m)
	cancel()
	if err != nil {
		c.logger.Error("failed to commit messages", zap.Error(err))
	}
}

func (c *channelConsumer) Start() {
	go func() {
		for {
			m, err := c.kafkaReader.FetchMessage(context.Background())
			if err != nil {
				if errors.Is(err, io.EOF) {
					return
				}
				c.logger.Error("failed to fetch message", zap.Error(err))
				continue
			}
			if m.Value == nil {
				c.commitMessage(m)
				continue
			}
			var event channelEvent
			if err = json.Unmarshal(m.Value, &event); err != nil {
				c.logger.Error("failed to unmarshal message", zap.Error(err))
				c.commitMessage(m)
				continue
			}
			if event.Payload.Op == "c" {
				wallet := model.Wallet{
					ChannelID: event.Payload.Before.Id,
					Amount:    0,
					Currency:  "vnd",
				}
				ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
				err = c.donationService.CreateWallet(ctx, wallet)
				cancel()
				if err != nil {
					c.logger.Error("failed to create wallet", zap.Error(err))
					continue
				}
			}
			c.commitMessage(m)
		}
	}()
}

func (c *channelConsumer) Stop() {
	c.kafkaReader.Close()
}

func NewChannelConsumer(kafkaReader *kafka.Reader, donationService service.DonationService, logger *zap.Logger) ChannelConsumer {
	return &channelConsumer{
		kafkaReader:     kafkaReader,
		donationService: donationService,
		logger:          logger,
	}
}
