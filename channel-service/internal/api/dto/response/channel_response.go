package response

type ChannelResponse struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	AvatarURL   string `json:"avatar_url"`
}
