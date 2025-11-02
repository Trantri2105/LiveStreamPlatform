FROM golang:latest AS builder
LABEL authors="trint"
WORKDIR /app
COPY ./channel-service .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/channel-service ./cmd/

FROM alpine:latest
WORKDIR /app
COPY --from=builder /bin/channel-service ./bin/channel-service
CMD ["./bin/channel-service"]