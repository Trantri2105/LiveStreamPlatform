package request

type SearchRequest struct {
	SearchText string `json:"search_text"`
	Limit      int    `json:"limit"`
	Offset     int    `json:"offset"`
}
