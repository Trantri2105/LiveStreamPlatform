package request

type OVMRequest struct {
	Request struct {
		Direction string
		Protocol  string
		Status    string
		Url       string
		NewUrl    string
	} `json:"request"`
}
