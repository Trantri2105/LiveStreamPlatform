package config

import (
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type AppConfig struct {
	Server   ServerConfig
	Postgres PostgresConfig
	Kafka    KafkaConfig
	VNPay    VNPayClient
}

type ServerConfig struct {
	Port                string `envconfig:"SERVER_PORT" default:"8080"`
	FrontendRedirectURL string `envconfig:"SERVER_FRONTEND_REDIRECT_URL" required:"true"`
}

type PostgresConfig struct {
	Host     string `envconfig:"POSTGRES_HOST" required:"true"`
	Port     int    `envconfig:"POSTGRES_PORT" required:"true"`
	User     string `envconfig:"POSTGRES_USER" required:"true"`
	Password string `envconfig:"POSTGRES_PASSWORD" required:"true"`
	DBName   string `envconfig:"POSTGRES_DB" required:"true"`
}

type KafkaConfig struct {
	Brokers              []string `envconfig:"KAFKA_BROKERS" required:"true"`
	ChannelTopic         string   `envconfig:"KAFKA_CHANNEL_TOPIC" required:"true"`
	ChannelConsumerGroup string   `envconfig:"KAFKA_CHANNEL_CONSUMER_GROUP" required:"true"`
	PublishDonateTopic   string   `envconfig:"KAFKA_PUBLISH_DONATE_TOPIC" required:"true"`
}

type VNPayClient struct {
	TmnCode    string `envconfig:"VNPAY_TMN_CODE" required:"true"`
	HashSecret string `envconfig:"VNPAY_HASH_SECRET" required:"true"`
	PayURL     string `envconfig:"VNPAY_PAY_URL" required:"true"`
	ReturnURL  string `envconfig:"VNPAY_RETURN_URL" required:"true"`
}

func LoadConfig(path string) (AppConfig, error) {
	_ = godotenv.Load(path)

	var cfg AppConfig
	err := envconfig.Process("", &cfg)
	return cfg, err
}
