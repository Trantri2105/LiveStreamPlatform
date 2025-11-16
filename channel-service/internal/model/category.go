package model

import "time"

type Category struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
