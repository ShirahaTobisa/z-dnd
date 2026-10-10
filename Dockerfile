FROM golang:1.26-alpine AS build
ARG GOPROXY=https://proxy.golang.org,https://goproxy.cn,direct
ENV GOPROXY=${GOPROXY}
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/z-dnd ./cmd/server

FROM alpine:3.20
RUN adduser -D -H -u 10001 app
COPY --from=build /out/z-dnd /z-dnd
USER app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1
ENTRYPOINT ["/z-dnd"]
