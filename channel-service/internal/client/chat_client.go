package client

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
)

type ChatClient interface {
	CreateRoomChat(ctx context.Context, jwtToken string, streamID string, endpoint string) (string, error)
}

type chatClient struct {
	client        *http.Client
	chatServerURL string
}

func (c *chatClient) CreateRoomChat(ctx context.Context, jwtToken string, streamID string, endpoint string) (string, error) {
	requestUrl := fmt.Sprintf("%s%s", c.chatServerURL, endpoint)
	body := struct {
		StreamID string `json:"stream_id"`
	}{
		StreamID: streamID,
	}
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(body); err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, requestUrl, bytes.NewBuffer(buf.Bytes()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+jwtToken)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", errors.New("failed to create room chat")
	}
	var result struct {
		WsURL string `json:"ws_url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	return result.WsURL, nil
}

func NewChatClient(chatServerURL string) ChatClient {
	return &chatClient{
		client:        &http.Client{},
		chatServerURL: chatServerURL,
	}
}
