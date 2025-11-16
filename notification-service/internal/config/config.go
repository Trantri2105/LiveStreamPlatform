package config

import (
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type AppConfig struct {
	Server      ServerConfig
	Postgres    PostgresConfig
	KafkaConfig KafkaConfig
}

type ServerConfig struct {
	Port string `envconfig:"SERVER_PORT" default:"8080"`
}

type PostgresConfig struct {
	Host     string `envconfig:"POSTGRES_HOST" required:"true"`
	Port     int    `envconfig:"POSTGRES_PORT" required:"true"`
	User     string `envconfig:"POSTGRES_USER" required:"true"`
	Password string `envconfig:"POSTGRES_PASSWORD" required:"true"`
	DBName   string `envconfig:"POSTGRES_DB" required:"true"`
}

type KafkaConfig struct {
	Brokers []string `envconfig:"KAFKA_BROKERS" required:"true"`
	GroupID string   `envconfig:"KAFKA_GROUP_ID" required:"true"`
	Topic   string   `envconfig:"KAFKA_TOPIC" required:"true"`
}

func LoadConfig(path string) (AppConfig, error) {
	_ = godotenv.Load(path)

	var cfg AppConfig
	err := envconfig.Process("", &cfg)
	return cfg, err
}
