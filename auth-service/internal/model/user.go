package model

import "time"

const (
	RoleUser  = "user"
	RoleAdmin = "admin"
)

type User struct {
	ID        string `gorm:"default:(-)"`
	Email     string
	Password  string
	FirstName string
	LastName  string
	Role      string
	CreatedAt time.Time
	UpdatedAt time.Time
}
