package request

type StreamSearchRequest struct {
	SearchText string `json:"search_text"`
	Status     string `json:"status"`
	Limit      int    `json:"limit"`
	Offset     int    `json:"offset"`
}
