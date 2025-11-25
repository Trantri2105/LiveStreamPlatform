package config

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerAddr           string
	DBDSN                string
	JWTSecret            []byte
	CORSOrigins          []string
	CORSAllowCredentials bool

	MaxWSReadBytes int64
	ReadDeadline   time.Duration
	WriteDeadline  time.Duration
	PingPeriod     time.Duration

	// Kafka
	Brokers            []string
	ChannelTopic       string
	ChatConsumerGroup  string
	PublishDonateTopic string
}

func Load() Config {
	godotenv.Load()

	addr := getEnv("SERVER_ADDR", ":8001")
	dsn := getEnv(
		"DB_DSN",
		"postgres://postgres:postgres@pg-chat-service:5432/chatdb?sslmode=disable",
	)

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Fatal("JWT_SECRET is required")
	}

	origins := []string{"*"}
	if s := strings.TrimSpace(os.Getenv("CORS_ORIGINS")); s != "" {
		origins = splitAndTrim(s, ",")
	}
	allowCreds := strings.EqualFold(os.Getenv("CORS_ALLOW_CREDENTIALS"), "true")

	// Kafka
	brokers := []string{}
	if s := strings.TrimSpace(os.Getenv("KAFKA_BROKERS")); s != "" {
		brokers = splitAndTrim(s, ",")
	}
	if len(brokers) == 0 {
		log.Fatal("KAFKA_BROKERS is required")
	}

	chatConsumerGroup := getEnv("KAFKA_CHAT_CONSUMER_GROUP", "")
	if chatConsumerGroup == "" {
		log.Fatal("KAFKA_CHAT_CONSUMER_GROUP is required")
	}

	publishDonateTopic := getEnv("KAFKA_PUBLISH_DONATE_TOPIC", "")
	if publishDonateTopic == "" {
		log.Fatal("KAFKA_PUBLISH_DONATE_TOPIC is required")
	}

	return Config{
		ServerAddr:           addr,
		DBDSN:                dsn,
		JWTSecret:            []byte(secret),
		CORSOrigins:          origins,
		CORSAllowCredentials: allowCreds,
		MaxWSReadBytes:       1 << 20, // 1MB
		ReadDeadline:         60 * time.Second,
		WriteDeadline:        10 * time.Second,
		PingPeriod:           54 * time.Second,
		Brokers:              brokers,
		ChatConsumerGroup:    chatConsumerGroup,
		PublishDonateTopic:   publishDonateTopic,
	}
}

func getEnv(k, def string) string {
	if v := strings.TrimSpace(os.Getenv(k)); v != "" {
		return v
	}
	return def
}

func splitAndTrim(s, sep string) []string {
	parts := strings.Split(s, sep)
	var out []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
