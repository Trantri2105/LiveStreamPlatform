package httpserver

import (
	"context"
	"errors"
	"log"
	"net"
	"net/http"
	"thanhnt208/chat-service/internal/config"
	chatHandlers "thanhnt208/chat-service/internal/handlers"
	"thanhnt208/chat-service/internal/httpserver/middleware"
	"thanhnt208/chat-service/internal/realtime"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

type Server struct {
	cfg  config.Config
	db   *gorm.DB
	hub  *realtime.Hub
	http *http.Server
}

func New(cfg config.Config, db *gorm.DB, hub *realtime.Hub) *Server {
	return &Server{cfg: cfg, db: db, hub: hub}
}

func (s *Server) Start() error {
	r := mux.NewRouter()

	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return middleware.CheckRequestOrigin(r, s.cfg.CORSOrigins)
		},
	}

	chatHTTP := chatHandlers.NewChatHTTP(s.db)
	chatWS := chatHandlers.NewChatWS(s.db, s.hub, upgrader, realtime.ClockCfg{
		MaxWSReadBytes: s.cfg.MaxWSReadBytes,
		ReadDeadline:   s.cfg.ReadDeadline,
		WriteDeadline:  s.cfg.WriteDeadline,
		PingPeriod:     s.cfg.PingPeriod,
	}, s.cfg.JWTSecret)

	api := r.PathPrefix("/api").Subrouter()
	api.Use(middleware.AuthRequired(s.cfg.JWTSecret))
	api.HandleFunc("/chat/thread", chatHTTP.CreateChatThread).Methods("POST", "OPTIONS")
	api.HandleFunc("/chat/thread/{streamId}/messages", chatHTTP.GetThreadMessages).Methods("GET", "OPTIONS")
	api.HandleFunc("/chat/thread/{streamId}/close", chatHTTP.CloseThread).Methods("POST", "OPTIONS")

	r.HandleFunc("/ws/chat/{streamId}", chatWS.Handle)

	corsOpts := []handlers.CORSOption{
		handlers.AllowedMethods([]string{"GET", "POST", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
	}
	if len(s.cfg.CORSOrigins) == 1 && s.cfg.CORSOrigins[0] == "*" {
		corsOpts = append(corsOpts, handlers.AllowedOrigins([]string{"*"}))
	} else {
		corsOpts = append(corsOpts, handlers.AllowedOrigins(s.cfg.CORSOrigins))
	}
	if s.cfg.CORSAllowCredentials {
		corsOpts = append(corsOpts, handlers.AllowCredentials())
	}
	handler := handlers.CORS(corsOpts...)(loggingMiddleware(r))

	s.http = &http.Server{
		Addr:         s.cfg.ServerAddr,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  90 * time.Second,
		BaseContext: func(net.Listener) context.Context {
			return context.Background()
		},
	}

	errCh := make(chan error, 1)
	go func() {
		if err := s.http.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	err := <-errCh
	return err
}

func (s *Server) Shutdown(ctx context.Context) {
	if s.http != nil {
		if err := s.http.Shutdown(ctx); err != nil {
			log.Println("Server forced to shutdown:", err)
		}
	}
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}
