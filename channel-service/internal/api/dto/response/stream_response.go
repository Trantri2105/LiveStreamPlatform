package response

type StreamResponse struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	HlsURL       string `json:"hls_url"`
	LiveChatURL  string `json:"live_chat_url"`
	SrtServerURL string `json:"srt_server_url"`
	StreamKey    string `json:"stream_key,omitempty"`
	Description  string `json:"description,omitempty"`
	Status       string `json:"status"`
	Channel      struct {
		ID    string `json:"id"`
		Title string `json:"title"`
	} `json:"channel"`
	Category struct {
		ID    string `json:"id"`
		Title string `json:"title"`
	} `json:"category,omitempty"`
}
