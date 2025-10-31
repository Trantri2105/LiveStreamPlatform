package request

type UpdateChannelRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}
