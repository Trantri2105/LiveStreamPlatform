FROM golang:latest AS builder
LABEL authors="trint"
WORKDIR /app
COPY ./auth-service .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/auth-service ./cmd/

FROM alpine:latest
WORKDIR /app
COPY --from=builder /bin/auth-service ./bin/auth-service
CMD ["./bin/auth-service"]