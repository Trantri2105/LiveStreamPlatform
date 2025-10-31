package main

import (
	"channel-service/internal/api/handler"
	"channel-service/internal/api/route"
	"channel-service/internal/config"
	"channel-service/internal/infra"
	"channel-service/internal/pkg/middleware"
	"channel-service/internal/repo"
	"channel-service/internal/service"
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
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

	logger, _ := zap.NewProduction()
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

	esClient, err := infra.NewElasticSearchConnection(appConfig.Elastic)
	if err != nil {
		logger.Fatal("failed to connect to elasticsearch", zap.Error(err))
	} else {
		logger.Info("connected to elasticsearch successfully")
	}

	channelRepo := repo.NewChannelRepository(db, esClient)
	channelService := service.NewChannelService(channelRepo)
	channelHandler := handler.NewChannelHandler(logger, channelService)

	m := middleware.NewAuthMiddleware()

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	route.SetUpChannelRoutes(r, channelHandler, m)

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

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err = srv.Shutdown(ctx); err != nil {
		logger.Error("server forced to shutdown:", zap.Error(err))
	}
	logger.Info("server exiting")
}
