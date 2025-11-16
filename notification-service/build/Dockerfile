FROM golang:latest AS builder
LABEL authors="trint"
WORKDIR /app
COPY ./notification-service .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/notification-service ./cmd/

FROM alpine:latest
WORKDIR /app
COPY --from=builder /bin/notification-service ./bin/notification-service
CMD ["./bin/notification-service"]