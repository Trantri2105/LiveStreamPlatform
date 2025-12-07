package response

import "time"

type CategoryResponse struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	ImageURL  string    `json:"image_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
