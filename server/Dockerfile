# 构建阶段
FROM golang:1.25-alpine AS builder

WORKDIR /app

# 复制go mod文件
COPY go.mod ./
RUN go mod download && go mod tidy

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o version-saver .

# 运行阶段
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# 从构建阶段复制二进制文件
COPY --from=builder /app/version-saver .

# 暴露端口
EXPOSE 8080

# 运行应用
CMD ["./version-saver"]
