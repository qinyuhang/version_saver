# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 运行阶段
FROM caddy:2-alpine

# 复制构建产物到Caddy
COPY --from=builder /app/dist /usr/share/caddy

# 复制Caddyfile配置
COPY Caddyfile /etc/caddy/Caddyfile

# 暴露端口
EXPOSE 80

# 启动Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
