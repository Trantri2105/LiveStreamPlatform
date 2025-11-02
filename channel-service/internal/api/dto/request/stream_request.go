package request

type StreamRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	CategoryID  string `json:"category_id"`
}
