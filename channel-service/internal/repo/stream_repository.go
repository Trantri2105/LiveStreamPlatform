package repo

import (
	"bytes"
	apperrors "channel-service/internal/error"
	"channel-service/internal/model"
	"context"
	"encoding/json"
	"fmt"

	"github.com/elastic/go-elasticsearch/v9"
	"github.com/elastic/go-elasticsearch/v9/esapi"
)

type StreamRepository interface {
	CreateStream(ctx context.Context, stream model.Stream) error
	GetStreamByID(ctx context.Context, id string) (model.Stream, error)
	GetStreamByChannelID(ctx context.Context, channelID string, status string, limit int, offset int) ([]model.Stream, error)
	UpdateStreamById(ctx context.Context, stream model.Stream) error
	GetStreamBySearchText(ctx context.Context, searchText string, status string, limit int, offset int) ([]model.Stream, error)
}

type streamRepository struct {
	es *elasticsearch.Client
}

const streamsIndex = "streams"

func (s *streamRepository) CreateStream(ctx context.Context, stream model.Stream) error {
	body, err := json.Marshal(stream)
	if err != nil {
		return fmt.Errorf("streamRepo.CreateStream err encode stream: %w", err)
	}
	res, err := s.es.Index(
		streamsIndex,
		bytes.NewReader(body),
		s.es.Index.WithDocumentID(stream.ID),
		s.es.Index.WithContext(ctx),
	)
	if err != nil {
		return fmt.Errorf("streamRepo.CreateStream: %w", err)
	}
	defer res.Body.Close()
	if res.IsError() {
		var e EsErrorResponse
		if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
			return fmt.Errorf("streamRepo.CreateStream: %w", err)
		}
		return fmt.Errorf("streamRepo.CreateStream: %w", err)
	}
	return nil
}

func (s *streamRepository) GetStreamByID(ctx context.Context, id string) (model.Stream, error) {
	req := esapi.GetRequest{
		Index:      streamsIndex,
		DocumentID: id,
	}
	resp, err := req.Do(ctx, s.es)
	if err != nil {
		return model.Stream{}, fmt.Errorf("streamRepo.GetStreamByID: %w", err)
	}
	defer resp.Body.Close()
	if resp.IsError() {
		var e EsErrorResponse
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return model.Stream{}, fmt.Errorf("streamRepo.GetStreamByID: %w", err)
		}
		if resp.StatusCode == 404 && e.Error.Type == "" {
			return model.Stream{}, apperrors.ErrStreamNotFound
		}
		return model.Stream{}, apperrors.NewElasticSearchError(resp.StatusCode, e.Error.Type, e.Error.Reason)
	}
	var data struct {
		Source struct {
			model.Stream
		} `json:"_source"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return model.Stream{}, fmt.Errorf("streamRepo.GetStreamByID: %w", err)
	}
	return data.Source.Stream, nil
}

func (s *streamRepository) GetStreamByChannelID(ctx context.Context, channelID string, status string, limit int, offset int) ([]model.Stream, error) {
	must := make([]map[string]interface{}, 0, 2)

	must = append(must, map[string]interface{}{
		"nested": map[string]interface{}{
			"path": "channel",
			"query": map[string]interface{}{
				"term": map[string]interface{}{
					"channel.id": channelID,
				},
			},
		},
	})

	if status != "" {
		must = append(must, map[string]interface{}{
			"term": map[string]interface{}{
				"status": status,
			},
		})
	}

	query := map[string]interface{}{
		"query": map[string]interface{}{
			"bool": map[string]interface{}{
				"must": must,
			},
		},
		"from": offset,
		"size": limit,
		"sort": []map[string]interface{}{
			{
				"id": "desc",
			},
		},
	}

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(query); err != nil {
		return nil, fmt.Errorf("streamRepo.GetStreamByChannelID: %w", err)
	}
	res, err := s.es.Search(
		s.es.Search.WithContext(ctx),
		s.es.Search.WithIndex(streamsIndex),
		s.es.Search.WithBody(&buf))
	if err != nil {
		return nil, fmt.Errorf("streamRepo.GetStreamByChannelID: %w", err)
	}
	defer res.Body.Close()
	if res.IsError() {
		var e EsErrorResponse
		if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("streamRepo.GetStreamByChannelID: %w", err)
		}
		return nil, apperrors.NewElasticSearchError(res.StatusCode, e.Error.Type, e.Error.Reason)
	}
	var data struct {
		Hits struct {
			Hits []struct {
				Source model.Stream `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("streamRepo.GetStreamByChannelID: %w", err)
	}
	var streams []model.Stream
	for _, hit := range data.Hits.Hits {
		streams = append(streams, hit.Source)
	}
	return streams, nil
}

func (s *streamRepository) UpdateStreamById(ctx context.Context, stream model.Stream) error {
	doc := make(map[string]interface{})
	if stream.Title != "" {
		doc["title"] = stream.Title
	}
	if stream.HlsURL != "" {
		doc["hls_url"] = stream.HlsURL
	}
	if stream.LiveChatURL != "" {
		doc["live_chat_url"] = stream.LiveChatURL
	}
	if stream.SrtServerURL != "" {
		doc["srt_server_url"] = stream.SrtServerURL
	}
	if stream.StreamKey != "" {
		doc["stream_key"] = stream.StreamKey
	}
	if stream.Description != "" {
		doc["description"] = stream.Description
	}
	if stream.Status != "" {
		doc["status"] = stream.Status
	}
	if stream.Channel.ID != "" || stream.Channel.Title != "" {
		doc["channel"] = stream.Channel
	}
	if stream.Category.ID != "" || stream.Category.Title != "" {
		doc["category"] = stream.Category
	}
	if len(doc) == 0 {
		return nil
	}
	body := map[string]interface{}{
		"doc": doc,
	}
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(body); err != nil {
		return fmt.Errorf("streamRepo.UpdateStreamById: %w", err)
	}
	res, err := s.es.Update(
		streamsIndex,
		stream.ID,
		bytes.NewReader(buf.Bytes()),
		s.es.Update.WithContext(ctx),
	)
	if err != nil {
		return fmt.Errorf("streamRepo.UpdateStreamById: %w", err)
	}
	defer res.Body.Close()
	if res.IsError() {
		var e EsErrorResponse
		if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
			return fmt.Errorf("streamRepo.UpdateStreamById: %w", err)
		}
		return apperrors.NewElasticSearchError(res.StatusCode, e.Error.Type, e.Error.Reason)
	}
	return nil
}

func (s *streamRepository) GetStreamBySearchText(ctx context.Context, searchText string, status string, limit int, offset int) ([]model.Stream, error) {
	must := make([]map[string]interface{}, 0, 3)

	if searchText != "" {
		should := make([]map[string]interface{}, 0, 4)

		should = append(should, map[string]interface{}{
			"multi_match": map[string]interface{}{
				"query":     searchText,
				"fields":    []string{"title^2", "description"},
				"fuzziness": "AUTO",
			},
		})

		should = append(should, map[string]interface{}{
			"nested": map[string]interface{}{
				"path": "channel",
				"query": map[string]interface{}{
					"match": map[string]interface{}{
						"channel.title": map[string]interface{}{
							"query":     searchText,
							"fuzziness": "AUTO",
						},
					},
				},
			},
		})

		should = append(should, map[string]interface{}{
			"nested": map[string]interface{}{
				"path": "category",
				"query": map[string]interface{}{
					"match": map[string]interface{}{
						"category.title": map[string]interface{}{
							"query":     searchText,
							"fuzziness": "AUTO",
						},
					},
				},
			},
		})

		must = append(must, map[string]interface{}{
			"bool": map[string]interface{}{
				"should":               should,
				"minimum_should_match": 1,
			},
		})
	} else {
		must = append(must, map[string]interface{}{
			"match_all": map[string]interface{}{},
		})
	}

	if status != "" {
		must = append(must, map[string]interface{}{
			"term": map[string]interface{}{
				"status": status,
			},
		})
	}

	body := map[string]interface{}{
		"query": map[string]interface{}{
			"bool": map[string]interface{}{
				"must": must,
			},
		},
		"from": offset,
		"size": limit,
	}

	if searchText == "" {
		body["sort"] = []map[string]interface{}{
			{
				"id": "desc",
			},
		}
	}

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(body); err != nil {
		return nil, fmt.Errorf("streamRepo.GetStreamBySearchText: %w", err)
	}
	res, err := s.es.Search(
		s.es.Search.WithContext(ctx),
		s.es.Search.WithIndex(streamsIndex),
		s.es.Search.WithBody(&buf))
	if err != nil {
		return nil, fmt.Errorf("streamRepo.GetStreamBySearchText: %w", err)
	}
	defer res.Body.Close()
	if res.IsError() {
		var e EsErrorResponse
		if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("streamRepo.GetStreamBySearchText: %w", err)
		}
		return nil, apperrors.NewElasticSearchError(res.StatusCode, e.Error.Type, e.Error.Reason)
	}
	var data struct {
		Hits struct {
			Hits []struct {
				Source model.Stream `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("streamRepo.GetStreamBySearchText: %w", err)
	}
	var streams []model.Stream
	for _, hit := range data.Hits.Hits {
		streams = append(streams, hit.Source)
	}
	return streams, nil
}

func NewStreamRepository(es *elasticsearch.Client) StreamRepository {
	return &streamRepository{
		es: es,
	}
}
