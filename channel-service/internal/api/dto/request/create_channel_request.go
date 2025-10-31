package request

type CreateChannelRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
}
