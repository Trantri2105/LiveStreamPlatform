package model

import "time"

type Channel struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
