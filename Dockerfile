# =========================================
# ---------- Stage: base ----------
FROM node:20 AS base

# 安装系统依赖，解决rollup Linux二进制兼容性问题
RUN apt-get update && apt-get install -y \
    libc6-dev \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 安装pnpm
RUN npm install -g pnpm@9.6.0

WORKDIR /app

# ---------- Stage: dependencies ----------
FROM base AS dependencies

# 设置为开发环境以安装所有依赖
ENV NODE_ENV=development
ENV TURBO_CACHE_DIR=/app/.turbo

# 创建turbo缓存目录
RUN mkdir -p /app/.turbo

# 复制workspace配置文件
COPY pnpm-workspace.yaml ./

# 复制根配置文件
COPY package.json pnpm-lock.yaml ./
COPY turbo.json tsconfig.json ./

# 创建目录结构
RUN mkdir -p packages/common-backend apps/backend-gateway apps/creation-agent apps/logic-agent apps/narrative-agent apps/frontend

# 复制所有package.json
COPY packages/common-backend/package.json packages/common-backend/
COPY apps/backend-gateway/package.json apps/backend-gateway/
COPY apps/creation-agent/package.json apps/creation-agent/
COPY apps/logic-agent/package.json apps/logic-agent/
COPY apps/narrative-agent/package.json apps/narrative-agent/
COPY apps/frontend/package.json apps/frontend/

# 安装所有依赖（包括devDependencies）
RUN pnpm install --frozen-lockfile --dev

# ---------- Stage: builder ----------
FROM dependencies AS builder

# 复制所有源代码
COPY packages/ ./packages/
COPY apps/ ./apps/

# 清理并重新安装依赖，解决rollup依赖问题
RUN rm -rf node_modules && pnpm install --frozen-lockfile --dev

# 手动安装rollup Linux二进制依赖
RUN npm install @rollup/rollup-linux-x64-gnu --save-optional

# 构建所有服务
RUN pnpm exec turbo run build

# ---------- Stage: production images ----------

# --- backend-gateway ---
FROM node:20-slim AS backend-gateway-prod

# 安装pnpm
RUN npm install -g pnpm@9.6.0

WORKDIR /app
ENV NODE_ENV=production

# 复制构建产物和配置
COPY --from=builder /app/apps/backend-gateway/dist ./dist
COPY --from=builder /app/apps/backend-gateway/package.json ./package.json

# 复制workspace依赖
COPY --from=builder /app/packages/common-backend/dist ./node_modules/@tuheg/common-backend/dist
COPY --from=builder /app/packages/common-backend/package.json ./node_modules/@tuheg/common-backend/

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

CMD ["node", "dist/main.js"]

# --- creation-agent ---
FROM node:20-slim AS creation-agent-prod

# 安装pnpm
RUN npm install -g pnpm@9.6.0

WORKDIR /app
ENV NODE_ENV=production

# 复制构建产物和配置
COPY --from=builder /app/apps/creation-agent/dist ./dist
COPY --from=builder /app/apps/creation-agent/package.json ./package.json

# 复制workspace依赖
COPY --from=builder /app/packages/common-backend/dist ./node_modules/@tuheg/common-backend/dist
COPY --from=builder /app/packages/common-backend/package.json ./node_modules/@tuheg/common-backend/

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

CMD ["node", "dist/main.js"]

# --- logic-agent ---
FROM node:20-slim AS logic-agent-prod

# 安装pnpm
RUN npm install -g pnpm@9.6.0

WORKDIR /app
ENV NODE_ENV=production

# 复制构建产物和配置
COPY --from=builder /app/apps/logic-agent/dist ./dist
COPY --from=builder /app/apps/logic-agent/package.json ./package.json

# 复制workspace依赖
COPY --from=builder /app/packages/common-backend/dist ./node_modules/@tuheg/common-backend/dist
COPY --from=builder /app/packages/common-backend/package.json ./node_modules/@tuheg/common-backend/

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

CMD ["node", "dist/main.js"]

# --- narrative-agent ---
FROM node:20-slim AS narrative-agent-prod

# 安装pnpm
RUN npm install -g pnpm@9.6.0

WORKDIR /app
ENV NODE_ENV=production

# 复制构建产物和配置
COPY --from=builder /app/apps/narrative-agent/dist ./dist
COPY --from=builder /app/apps/narrative-agent/package.json ./package.json

# 复制workspace依赖
COPY --from=builder /app/packages/common-backend/dist ./node_modules/@tuheg/common-backend/dist
COPY --from=builder /app/packages/common-backend/package.json ./node_modules/@tuheg/common-backend/

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

CMD ["node", "dist/main.js"]

# --- frontend ---
FROM nginx:stable-alpine AS frontend-prod
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY --from=builder /app/apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
