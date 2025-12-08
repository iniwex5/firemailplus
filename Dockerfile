# syntax=docker/dockerfile:1.6
# 多阶段构建 Dockerfile for FireMail
# 阶段1: 构建后端Go应用
FROM golang:1.24-alpine AS backend-builder

# 安装必要的构建工具
RUN apk add --no-cache gcc musl-dev sqlite-dev

WORKDIR /app/backend
ENV GOMODCACHE=/go/pkg/mod
ENV GOCACHE=/root/.cache/go-build

# 复制Go模块文件
COPY backend/go.mod backend/go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build go mod download

COPY backend/ ./

RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -ldflags '-s -w -extldflags "-static"' -o firemail cmd/firemail/main.go

# 验证构建结果
RUN ls -la firemail

# 阶段2: 构建前端Next.js应用
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
ENV PNPM_HOME=/root/.pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

# 复制package文件
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.pnpm-store pnpm install --frozen-lockfile

# 复制前端源代码
COPY --link frontend/ ./

# 设置构建时环境变量
ENV NEXT_PUBLIC_API_BASE_URL=/api/v1
ENV NODE_ENV=production

RUN pnpm build

# 阶段3: 最终运行镜像
FROM node:20-alpine
RUN apk add --no-cache \
    ca-certificates-bundle \
    tzdata \
    caddy \
    supervisor

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建应用目录
WORKDIR /app

# 创建必要的目录
RUN mkdir -p /app/backend /app/frontend /app/data /app/logs /etc/supervisor/conf.d

# 从构建阶段复制文件
COPY --from=backend-builder /app/backend/firemail /app/backend/
COPY --from=backend-builder /app/backend/web /app/backend/web/
COPY --from=backend-builder /app/backend/database /app/backend/database/

# 复制前端文件 - standalone模式
COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend/
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/.next/static/
COPY --from=frontend-builder /app/frontend/public /app/frontend/public/

# 复制package.json以便Node.js能正确运行
COPY --from=frontend-builder /app/frontend/package.json /app/frontend/

COPY ops/Caddyfile /etc/caddy/Caddyfile

COPY ops/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 复制启动脚本
COPY start.sh /app/start.sh

# 设置权限
RUN chmod +x /app/backend/firemail /app/start.sh && \
    mkdir -p /app/data /app/logs /app/data/backups && \
    chmod -R 777 /app/data && \
    chmod -R 755 /app/logs

# 暴露端口
EXPOSE 3000

# 创建数据目录的卷
VOLUME ["/app/data", "/app/logs"]

# 启动脚本
CMD ["/app/start.sh"]
