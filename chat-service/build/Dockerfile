FROM golang:1.25.0 AS builder
WORKDIR /app/chat-service

COPY chat-service/ ./

RUN go mod tidy

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /app/chat-service ./cmd/server/main.go

FROM alpine:3.20
RUN apk add --no-cache ca-certificates && update-ca-certificates

WORKDIR /app
EXPOSE 8001

COPY --from=builder /app/chat-service .

COPY chat-service/internal/config/ ./config/
COPY chat-service/.env ./.env

CMD ["./chat-service"]
