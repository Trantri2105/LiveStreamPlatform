package infra

import (
	"channel-service/internal/config"
	"context"
	"time"

	"github.com/elastic/go-elasticsearch/v9"
)

func NewElasticSearchConnection(cfg config.ElasticsearchConfig) (*elasticsearch.Client, error) {
	es, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: cfg.Addresses,
	})

	if err != nil {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = es.Ping(es.Ping.WithContext(ctx))
	if err != nil {
		return nil, err
	}
	return es, nil
}
