package main

import (
	"context"
	"donation-service/internal/api/handler"
	"donation-service/internal/api/route"
	"donation-service/internal/config"
	"donation-service/internal/consumer"
	"donation-service/internal/infra"
	"donation-service/internal/repo"
	"donation-service/internal/service"
	vnpay_client "donation-service/internal/vnpay-client"
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
	"go.uber.org/zap/zapcore"
)

func NewLogger() *zap.Logger {
	encodeConfig := zap.NewProductionConfig()
	encodeConfig.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	encodeConfig.EncoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder
	encodeConfig.EncoderConfig.EncodeCaller = zapcore.ShortCallerEncoder

	core := zapcore.NewCore(zapcore.NewJSONEncoder(encodeConfig.EncoderConfig), zapcore.AddSync(os.Stdout), zap.InfoLevel)
	return zap.New(core, zap.AddCaller())
}

func main() {
	appConfig, err := config.LoadConfig("./.env")
	if err != nil {
		log.Fatal(fmt.Sprintf("load config error: %v", err))
	}

	logger := NewLogger()
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

	kafkaReader := infra.NewKafkaReader(appConfig.Kafka.Brokers, appConfig.Kafka.ChannelTopic, appConfig.Kafka.ChannelConsumerGroup)
	kafkaWriter := infra.NewKafkaWriter(appConfig.Kafka.Brokers, appConfig.Kafka.PublishDonateTopic)

	donationRepo := repo.NewDonationRepository(db)
	txManager := repo.NewTransactionManager(db)

	vnPayClient := vnpay_client.NewVNPayClient(appConfig.VNPay.TmnCode, appConfig.VNPay.HashSecret, appConfig.VNPay.PayURL, appConfig.VNPay.ReturnURL)
	donationService := service.NewDonationService(txManager, kafkaWriter, donationRepo, vnPayClient, logger)

	donationHandler := handler.NewDonationHandler(donationService, appConfig.Server.FrontendRedirectURL, logger)
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	route.SetUpDonationRoutes(r, donationHandler)

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

	c := consumer.NewChannelConsumer(kafkaReader, donationService, logger)
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
