# Justfile for version-saver project

# 启动开发环境
dev:
    @echo "🚀 启动开发环境..."
    docker-compose -f docker-compose.dev.yml up -d
    @echo "✅ 开发环境已启动"
    @echo "📝 查看日志: just logs"
    @echo "🌐 访问地址: http://localhost"

# 查看开发环境日志
logs:
    docker-compose -f docker-compose.dev.yml logs -f

# 停止开发环境
stop-dev:
    @echo "🛑 停止开发环境..."
    docker-compose -f docker-compose.dev.yml down
    @echo "✅ 开发环境已停止"

# 停止生产环境（别名）
stop-prod:
    @echo "🛑 停止生产环境..."
    docker-compose down
    @echo "✅ 生产环境已停止"

# 打包并导出镜像，压缩成zip
pack:
    @echo "📦 开始打包..."
    # 创建临时目录
    mkdir -p dist
    
    # 构建镜像
    @echo "🔨 构建所有镜像..."
    docker-compose build
    
    # 导出镜像（使用docker-compose获取镜像ID）
    @echo "💾 导出后端镜像..."
    APP_IMAGE_ID=$$(docker-compose images -q app 2>/dev/null | head -1) && \
    if [ -n "$$APP_IMAGE_ID" ]; then \
        docker save $$APP_IMAGE_ID -o dist/app.tar && echo "✅ 后端镜像导出成功"; \
    else \
        echo "❌ 无法找到后端镜像，请先运行 docker-compose build"; \
        exit 1; \
    fi
    
    @echo "💾 导出前端镜像..."
    CLIENT_IMAGE_ID=$$(docker-compose images -q client 2>/dev/null | head -1) && \
    if [ -n "$$CLIENT_IMAGE_ID" ]; then \
        docker save $$CLIENT_IMAGE_ID -o dist/client.tar && echo "✅ 前端镜像导出成功"; \
    else \
        echo "❌ 无法找到前端镜像，请先运行 docker-compose build"; \
        exit 1; \
    fi
    
    # 复制docker-compose.yml和Caddyfile
    @echo "📋 复制配置文件..."
    cp docker-compose.yml dist/
    mkdir -p dist/caddy
    cp caddy/Caddyfile dist/caddy/
    
    # 创建README说明文件
    @echo "📝 创建部署说明..."
    printf '%s\n' \
        '# 部署说明' \
        '' \
        '## 导入镜像' \
        '' \
        '```bash' \
        '# 导入后端镜像' \
        'docker load -i app.tar' \
        '' \
        '# 导入前端镜像' \
        'docker load -i client.tar' \
        '```' \
        '' \
        '## 启动服务' \
        '' \
        '```bash' \
        'docker-compose up -d' \
        '```' \
        '' \
        '## 访问地址' \
        '' \
        '- 前端界面: http://localhost/' \
        '- 后端API: http://localhost/api/v1/*' \
        '' \
        '## 停止服务' \
        '' \
        '```bash' \
        'docker-compose down' \
        '```' \
        > dist/README.md
    
    # 压缩成zip
    @echo "🗜️  压缩文件..."
    cd dist && zip -r ../version-saver-pack-$$(date +%Y%m%d-%H%M%S).zip . && cd ..
    
    # 清理临时目录
    @echo "🧹 清理临时文件..."
    rm -rf dist
    
    @echo "✅ 打包完成！压缩包已生成在项目根目录"

# 运行生产环境
run:
    @echo "🚀 启动生产环境..."
    docker-compose up -d
    @echo "✅ 生产环境已启动"
    @echo "📝 查看日志: docker-compose logs -f"
    @echo "🌐 访问地址: http://localhost"

# 停止生产环境
down:
    @echo "🛑 停止生产环境..."
    docker-compose down
    @echo "✅ 生产环境已停止"

# 查看生产环境日志
logs-prod:
    docker-compose logs -f

# 清理所有容器和镜像（谨慎使用）
clean:
    @echo "🧹 清理所有容器和镜像..."
    docker-compose -f docker-compose.dev.yml down -v
    docker-compose down -v
    @echo "✅ 清理完成"
