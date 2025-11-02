FROM golang:1.25.0 AS builder
WORKDIR /app
COPY ./chat-service .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/chat-service ./cmd/server/

FROM alpine:latest
WORKDIR /app
COPY --from=builder /bin/chat-service ./bin/chat-service
CMD ["./bin/chat-service"]
