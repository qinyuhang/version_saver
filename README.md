# Version Saver

一个基于Go和PostgreSQL的文本版本管理HTTP服务，支持编辑器长文本内容的版本保存和检索。

## 功能特性

- ✅ 接收客户端发送的长文本内容
- ✅ 自动版本管理（每次保存创建新版本）
- ✅ 使用PostgreSQL存储
- ✅ 基于Gin框架的RESTful API
- ✅ React + TypeScript 前端界面
- ✅ Docker容器化部署（前后端分离）

## API接口

### 1. 保存文本（创建新版本）
```http
POST /api/v1/save
Content-Type: application/json

{
  "content": "你的长文本内容..."
}
```

响应：
```json
{
  "id": 1,
  "created_at": "2026-01-28T10:00:00Z",
  "updated_at": "2026-01-28T10:00:00Z",
  "content": "你的长文本内容..."
}
```

### 2. 获取最新版本
```http
GET /api/v1/latest
```

### 3. 根据ID获取版本
```http
GET /api/v1/version/:id
```

### 4. 列出所有版本
```http
GET /api/v1/versions?limit=50&offset=0
```

响应：
```json
{
  "versions": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

## 快速开始

### 使用Docker Compose（推荐）

```bash
# 构建并启动所有服务（后端、前端、数据库）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

服务访问地址（通过Caddy统一入口）：
- 统一入口: `http://localhost` (端口80)
  - 前端界面: `http://localhost/`
  - 后端API: `http://localhost/api/v1/*`
- PostgreSQL: `localhost:5432` (仅内部访问)

### 本地开发（推荐使用开发环境配置）

#### 一键启动开发环境

使用 `docker-compose.dev.yml` 一键启动完整的开发环境（数据库、后端、前端、Caddy）：

```bash
# 启动所有开发服务
docker-compose -f docker-compose.dev.yml up -d

# 查看所有服务日志
docker-compose -f docker-compose.dev.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.dev.yml logs -f app
docker-compose -f docker-compose.dev.yml logs -f client

# 停止开发环境
docker-compose -f docker-compose.dev.yml down
```

#### 开发环境特点

- **一键启动**：所有服务（PostgreSQL、后端、前端、Caddy）自动启动
- **热重载支持**：源代码挂载到容器，修改代码自动重新加载
- **统一入口**：通过 Caddy 统一访问（`http://localhost`）
  - 前端界面: `http://localhost/`
  - 后端API: `http://localhost/api/v1/*`
- **独立环境**：使用独立的 volumes，与生产环境完全隔离
- **开发模式**：后端使用 `GIN_MODE=debug`，前端使用 Vite 开发服务器

#### 服务说明

- **postgres**: PostgreSQL 数据库（端口 5432）
- **app**: Go 后端服务，使用 `go run main.go` 运行（端口 8080）
- **client**: React 前端服务，使用 `npm run dev` 运行（端口 5173）
- **caddy**: 反向代理，统一前后端访问入口（端口 80）

#### 开发环境配置

- 后端代码挂载：`./server:/app`
- 前端代码挂载：`./client:/app`
- 后端环境变量：`GIN_MODE=debug`（启用详细日志）
- 前端环境变量：自动配置 API 代理

#### 仅启动数据库（可选）

如果只想启动数据库，可以单独启动：

```bash
docker-compose -f docker-compose.dev.yml up -d postgres
```

然后在本地分别运行前后端（参考下面的"本地开发"部分）。

## 环境变量

### 后端（Server）

- `DATABASE_URL`: PostgreSQL连接字符串（默认: `postgres://postgres:postgres@localhost:5432/version_saver?sslmode=disable`）
- `PORT`: 服务端口（默认: `8080`）
- `GIN_MODE`: Gin运行模式（`debug`/`release`，默认: `release`）

### 前端（Client）

- `VITE_API_BASE_URL`: API基础URL（开发环境使用vite代理，生产环境需要配置）

## 项目结构

```
.
├── server/                 # 后端服务（Go + Gin）
│   ├── main.go            # 应用入口
│   ├── Dockerfile         # Docker构建文件
│   ├── go.mod             # Go模块依赖
│   └── internal/
│       ├── config/        # 配置管理
│       ├── database/      # 数据库连接和迁移
│       ├── model/         # 数据模型
│       ├── service/       # 业务逻辑层
│       └── handler/       # HTTP处理器
├── client/                # 前端应用（React + TypeScript + Vite）
│   ├── src/
│   │   ├── api/           # API客户端
│   │   ├── components/   # React组件
│   │   ├── types/         # TypeScript类型定义
│   │   └── App.tsx        # 主应用组件
│   ├── Dockerfile         # Docker构建文件
│   └── package.json       # 前端依赖
└── docker-compose.yml     # Docker编排配置
```

## 测试示例

使用curl测试API：

```bash
# 保存文本
curl -X POST http://localhost:8080/api/v1/save \
  -H "Content-Type: application/json" \
  -d '{"content": "这是第一版内容"}'

# 获取最新版本
curl http://localhost:8080/api/v1/latest

# 列出所有版本
curl http://localhost:8080/api/v1/versions
```
