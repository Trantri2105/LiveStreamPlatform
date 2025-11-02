package db

import (
	"log"
	"thanhnt208/chat-service/internal/models"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Init(dsn string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatal("Failed to connect DB:", err)
	}

	if err := db.AutoMigrate(&models.ChatThread{}, &models.Message{}); err != nil {
		log.Fatal("AutoMigrate failed:", err)
	}

	_ = db.Exec(`CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON messages (stream_id, created_at DESC)`)

	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	return db
}
