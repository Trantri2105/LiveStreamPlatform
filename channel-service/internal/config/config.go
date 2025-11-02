package config

import (
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type AppConfig struct {
	Server   ServerConfig
	Postgres PostgresConfig
	Elastic  ElasticsearchConfig
}

type ServerConfig struct {
	Port          string `envconfig:"SERVER_PORT" default:"8080"`
	ChatServerUrl string `envconfig:"SERVER_CHAT_SERVER_URL"`
	SrtServerUrl  string `envconfig:"SERVER_SRT_SERVER_URL"`
	HlsServerUrl  string `envconfig:"SERVER_HLS_SERVER_URL"`
}

type PostgresConfig struct {
	Host     string `envconfig:"POSTGRES_HOST" required:"true"`
	Port     int    `envconfig:"POSTGRES_PORT" required:"true"`
	User     string `envconfig:"POSTGRES_USER" required:"true"`
	Password string `envconfig:"POSTGRES_PASSWORD" required:"true"`
	DBName   string `envconfig:"POSTGRES_DB" required:"true"`
}

type ElasticsearchConfig struct {
	Addresses []string `envconfig:"ELASTICSEARCH_ADDRESSES" required:"true"`
}

func LoadConfig(path string) (AppConfig, error) {
	_ = godotenv.Load(path)

	var cfg AppConfig
	err := envconfig.Process("", &cfg)
	return cfg, err
}
