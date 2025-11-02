FROM golang:1.25.0 AS builder
WORKDIR /app
COPY . .

RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o chat-service cmd/server/main.go

FROM alpine:latest

RUN apk add --no-cache ca-certificates && update-ca-certificates

WORKDIR /app

EXPOSE 8001

COPY --from=builder /app/chat-service .
COPY internal/config/ ./config/

CMD ["./chat-service"]