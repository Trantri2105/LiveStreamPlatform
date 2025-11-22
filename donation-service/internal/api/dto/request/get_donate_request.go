package request

type GetDonateRequest struct {
	FromTime string `json:"fromTime" binding:"required,datetime=2006-01-02"`
	ToTime   string `json:"toTime" binding:"required,datetime=2006-01-02"`
	Limit    int    `json:"limit" binding:"required,gte=1,lte=50"`
	Offset   int    `json:"offset" binding:"gte=0"`
}
