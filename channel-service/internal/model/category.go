package model

import "time"

type Category struct {
	ID        string `json:"id" gorm:"default:(-)"`
	Title     string `json:"title"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
