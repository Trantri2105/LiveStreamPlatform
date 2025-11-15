package main

import (
	"auth-service/internal/api/handler"
	"auth-service/internal/api/middleware"
	"auth-service/internal/api/routes"
	"auth-service/internal/config"
	"auth-service/internal/infra"
	"auth-service/internal/jwt"
	"auth-service/internal/repository"
	"auth-service/internal/service"
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

	zapLogger, err := zap.NewProduction()
	if err != nil {
		log.Fatal(fmt.Sprintf("create zap logger error: %v", err))
	}
	defer zapLogger.Sync()

	//set up database
	db, err := infra.NewPostgresConnection(appConfig.Postgres)
	if err != nil {
		zapLogger.Fatal("failed to connect to postgres", zap.Error(err))
	} else {
		zapLogger.Info("connected to postgres successfully")
	}
	sqlDB, err := db.DB()
	if err != nil {
		zapLogger.Fatal("failed to get sql.DB from gorm:", zap.Error(err))
	}
	defer sqlDB.Close()

	// set up redis
	redisClient, err := infra.NewRedisConnection(appConfig.Redis)
	if err != nil {
		zapLogger.Fatal("failed to connect to redis", zap.Error(err))
	} else {
		zapLogger.Info("connected to redis successfully")
	}
	defer redisClient.Close()

	tokenRepo := repository.NewRefreshTokenRepository(redisClient)
	userRepo := repository.NewUserRepository(db)

	jwtUtils := jwt.NewJwtUtils(appConfig.JWT.SecretKey, appConfig.JWT.AccessTokenTTL, appConfig.JWT.RefreshTokenTTL)

	userService := service.NewUserService(userRepo)
	authService := service.NewAuthService(userService, jwtUtils, tokenRepo, appConfig.Server.UserSessionTTL)

	m := middleware.NewAuthMiddleware(jwtUtils)

	handlerLogger := handler.NewLogger(zapLogger)
	userHandler := handler.NewUserHandler(userService, handlerLogger)
	authHandler := handler.NewAuthHandler(authService, handlerLogger)

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	routes.SetUpUserRoutes(r, userHandler, m)
	routes.SetUpAuthRoutes(r, authHandler, m)

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", appConfig.Server.Port),
		Handler: r,
	}
	go func() {
		zapLogger.Info(fmt.Sprintf("starting server on %s", srv.Addr))
		if e := srv.ListenAndServe(); e != nil && !errors.Is(e, http.ErrServerClosed) {
			zapLogger.Fatal("failed to start server", zap.Error(e))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	zapLogger.Info("shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err = srv.Shutdown(ctx); err != nil {
		zapLogger.Error("server forced to shutdown:", zap.Error(err))
	}
	zapLogger.Info("server exiting")
}
