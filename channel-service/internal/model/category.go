package model

import "time"

type Category struct {
	ID        string    `json:"id" gorm:"default:(-)"`
	Title     string    `json:"title"`
	ImageURL  string    `json:"image_url" gorm:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
