package model

type Stream struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	HlsURL       string `json:"hls_url"`
	LiveChatURL  string `json:"live_chat_url"`
	SrtServerURL string `json:"srt_server_url"`
	StreamKey    string `json:"stream_key"`
	Description  string `json:"description"`
	Channel      struct {
		ID    string `json:"id"`
		Title string `json:"title"`
	} `json:"channel"`
	Category struct {
		ID    string `json:"id"`
		Title string `json:"title"`
	} `json:"category"`
}
