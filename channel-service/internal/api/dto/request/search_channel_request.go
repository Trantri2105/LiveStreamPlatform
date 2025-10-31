package request

type SearchChannelRequest struct {
	SearchText string `json:"search_text"`
	Limit      int    `json:"limit"`
	Offset     int    `json:"offset"`
}
