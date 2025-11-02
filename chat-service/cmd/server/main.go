package main

import (
	"log"
	"thanhnt208/chat-service/internal/config"
	"thanhnt208/chat-service/internal/db"
	"thanhnt208/chat-service/internal/httpserver"
	"thanhnt208/chat-service/internal/realtime"
)

func main() {
	cfg := config.Load()

	gormDB := db.Init(cfg.DBDSN)
	hub := realtime.NewHub(gormDB)

	srv := httpserver.New(cfg, gormDB, hub)

	log.Println("Chat server starting on", cfg.ServerAddr)
	if err := srv.Start(); err != nil {
		log.Fatal(err)
	}
}
