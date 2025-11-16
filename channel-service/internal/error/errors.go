package apperrors

import (
	"errors"
	"fmt"
)

var (
	ErrChannelNotFound           = errors.New("channel not found")
	ErrChannelAlreadyExists      = errors.New("channel already exists")
	ErrCategoryNotFound          = errors.New("category not found")
	ErrStreamNotFound            = errors.New("stream not found")
	ErrInvalidFile               = errors.New("invalid file")
	ErrMinioKeyNotFound          = errors.New("minio key not found")
	ErrSubscriptionAlreadyExists = errors.New("subscription already exists")
	ErrSubscriptionNotFound      = errors.New("subscription not found")
)

type ElasticSearchError struct {
	StatusCode int
	Type       string
	Reason     string
}

func (e *ElasticSearchError) Error() string {
	return fmt.Sprintf("[%d] %s: %s", e.StatusCode, e.Type, e.Reason)
}

func NewElasticSearchError(statusCode int, typeReason string, reason string) error {
	return &ElasticSearchError{
		StatusCode: statusCode,
		Type:       typeReason,
		Reason:     reason,
	}
}
