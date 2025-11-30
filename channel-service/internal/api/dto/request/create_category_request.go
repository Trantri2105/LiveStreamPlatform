package request

type CreateCategoryRequest struct {
	Title string `json:"title" binding:"required"`
}
