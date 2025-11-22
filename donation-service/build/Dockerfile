FROM golang:latest AS builder
LABEL authors="trint"
WORKDIR /app
COPY ./donation-service .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/donation-service ./cmd/

FROM alpine:latest
WORKDIR /app
COPY --from=builder /bin/donation-service ./bin/donation-service
CMD ["./bin/donation-service"]