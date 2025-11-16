package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"notification-service/internal/api/handler"
	"notification-service/internal/api/routes"
	"notification-service/internal/config"
	"notification-service/internal/consumer"
	"notification-service/internal/infra"
	"notification-service/internal/repo"
	"notification-service/internal/service"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	appConfig, err := config.LoadConfig("./.env")
	if err != nil {
		log.Fatal(fmt.Sprintf("load config error: %v", err))
	}

	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatal(fmt.Sprintf("create zap logger error: %v", err))
	}
	defer logger.Sync()

	db, err := infra.NewPostgresConnection(appConfig.Postgres)
	if err != nil {
		logger.Fatal("failed to connect to postgres", zap.Error(err))
	} else {
		logger.Info("connected to postgres successfully")
	}
	sqlDB, err := db.DB()
	if err != nil {
		logger.Fatal("failed to get sql.DB from gorm:", zap.Error(err))
	}
	defer sqlDB.Close()

	kafkaReader := infra.NewKafkaReader(appConfig.KafkaConfig)

	notifRepo := repo.NewNotificationRepo(db)
	notifService := service.NewNotificationService(notifRepo)
	notifHandler := handler.NewNotificationHandler(logger, notifService)

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	routes.SetUpNotificationRoutes(r, notifHandler)

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", appConfig.Server.Port),
		Handler: r,
	}
	go func() {
		logger.Info(fmt.Sprintf("starting server on %s", srv.Addr))
		if e := srv.ListenAndServe(); e != nil && !errors.Is(e, http.ErrServerClosed) {
			logger.Fatal("failed to start server", zap.Error(e))
		}
	}()

	c := consumer.NewNotificationConsumer(logger, kafkaReader, notifService)
	c.Start()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err = srv.Shutdown(ctx); err != nil {
		logger.Error("server forced to shutdown:", zap.Error(err))
	}
	c.Stop()
	logger.Info("server exiting")
}
