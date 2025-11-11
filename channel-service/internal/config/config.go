package config

import (
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type AppConfig struct {
	Server   ServerConfig
	Postgres PostgresConfig
	Elastic  ElasticsearchConfig
	Minio    MinioConfig
}

type ServerConfig struct {
	Port          string `envconfig:"SERVER_PORT" default:"8080"`
	ChatServerUrl string `envconfig:"SERVER_CHAT_SERVER_URL" required:"true"`
	SrtServerUrl  string `envconfig:"SERVER_SRT_SERVER_URL" required:"true"`
	HlsServerUrl  string `envconfig:"SERVER_HLS_SERVER_URL" required:"true"`
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

type MinioConfig struct {
	Endpoint  string `envconfig:"MINIO_ENDPOINT" required:"true"`
	AccessKey string `envconfig:"MINIO_ACCESS_KEY" required:"true"`
	SecretKey string `envconfig:"MINIO_SECRET_KEY" required:"true"`
}

func LoadConfig(path string) (AppConfig, error) {
	_ = godotenv.Load(path)

	var cfg AppConfig
	err := envconfig.Process("", &cfg)
	return cfg, err
}
