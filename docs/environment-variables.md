# 环境变量配置指南

本文档详细说明了创世星环 (Creation Ring) 项目中所有环境变量的配置方法。

## 🔐 安全提醒

- **永远不要** 将包含真实密钥的 `.env` 文件提交到版本控制系统
- 使用专用的密钥管理系统 (AWS KMS, HashiCorp Vault, Azure Key Vault) 管理生产环境密钥
- 定期轮换密钥以增强安全性
- 为不同环境使用不同的密钥

## 🛠️ 快速开始

1. **生成安全密钥**:

   ```bash
   pnpm tools:generate-env
   ```

2. **复制环境变量**:

   ```bash
   cp docs/environment-variables.md .env
   # 然后填入生成的密钥
   ```

3. **验证配置**:

   ```bash
   pnpm build  # 构建时会验证环境变量
   ```

## 📋 必需环境变量

### 加密配置 (必需)

```bash
# 使用 pnpm tools:generate-env 生成
ENCRYPTION_KEY="your-32-byte-encryption-key-base64-encoded"
ENCRYPTION_SALT="your-16-byte-salt-base64-encoded"
```

### JWT 配置 (必需)

```bash
# 使用 pnpm tools:generate-env 生成
JWT_SECRET="your-32-byte-jwt-secret-base64-encoded"
JWT_EXPIRATION_SECONDS=3600
```

### 数据库配置 (必需)

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/creation_ring"
```

### Clerk 认证配置 (生产环境必需)

```bash
CLERK_SECRET_KEY="sk_test_your_clerk_secret_key"
CLERK_PUBLISHABLE_KEY="pk_test_your_clerk_publishable_key"
CLERK_WEBHOOK_SECRET_KEY="whsec_your_clerk_webhook_secret"
```

## 🔧 可选环境变量

### 消息队列配置

```bash
RABBITMQ_URL="amqp://localhost:5672"
```

### Redis 配置

```bash
REDIS_URL="redis://localhost:6379"
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 监控配置

```bash
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0
```

### AI Provider 配置

```bash
FALLBACK_API_KEY="your-fallback-api-key"
FALLBACK_MODEL_ID=deepseek-chat
FALLBACK_BASE_URL=""
```

### 服务端口配置

```bash
BACKEND_GATEWAY_PORT=3000
CREATION_AGENT_HTTP_PORT=8080
LOGIC_AGENT_HTTP_PORT=8081
NARRATIVE_AGENT_HTTP_PORT=8082
```

### 数据库连接池配置

```bash
DB_CONNECTION_LIMIT=20
DB_POOL_TIMEOUT=20
DB_IDLE_TIMEOUT=300
```

### 向量数据库配置

```bash
QDRANT_URL="http://localhost:6333"
QDRANT_API_KEY=""
```

## 🚀 环境特定配置

### 开发环境 (.env.development)

```bash
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
DATABASE_URL="postgresql://dev:dev@localhost:5432/creation_ring_dev"
```

### 测试环境 (.env.test)

```bash
NODE_ENV=test
DATABASE_URL="postgresql://test:test@localhost:5432/creation_ring_test"
```

### 生产环境 (.env.production)

```bash
NODE_ENV=production
CORS_ORIGIN="https://your-domain.com"
DATABASE_URL="postgresql://prod:prod@prod-db:5432/creation_ring_prod"

# 使用生产级密钥管理系统
ENCRYPTION_KEY="from-key-management-system"
JWT_SECRET="from-key-management-system"

# 生产监控
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

## 🔒 密钥管理最佳实践

### 1. 密钥生成

始终使用加密安全的随机数生成器：

```bash
# 使用提供的工具
pnpm tools:generate-env

# 或手动生成
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. 密钥轮换

定期轮换密钥，特别是：

- 生产环境的JWT密钥：每3-6个月
- 加密密钥：每年或在安全事件后
- API密钥：每月或在泄露时

### 3. 密钥存储

- **开发环境**: 存储在本地 `.env` 文件（确保不提交）
- **生产环境**: 使用专用密钥管理系统
  - AWS Secrets Manager / KMS
  - HashiCorp Vault
  - Azure Key Vault
  - Google Cloud Secret Manager

### 4. 密钥访问控制

- 实施最小权限原则
- 定期审计密钥访问日志
- 监控异常访问模式

## ⚠️ 常见错误

### ENCRYPTION_KEY too short

```
Error: ENCRYPTION_KEY must be at least 32 characters long
```

**解决**: 使用 `pnpm tools:generate-env` 生成正确的密钥长度

### ENCRYPTION_SALT missing

```
Error: ENCRYPTION_SALT environment variable is required
```

**解决**: 添加 `ENCRYPTION_SALT` 环境变量

### JWT_SECRET optional but required

```
Error: JWT_SECRET must be at least 32 characters long
```

**解决**: JWT_SECRET 现在是必需的，使用工具生成

## 🔍 验证配置

运行以下命令验证配置：

```bash
# 构建项目（会验证环境变量）
pnpm build

# 运行健康检查
pnpm dev
curl http://localhost:3000/health

# 测试加密功能
pnpm tools:migrate-api-keys
```

## 📞 获取帮助

如果您在配置环境变量时遇到问题：

1. 检查错误消息中的具体问题
2. 验证所有必需的环境变量都已设置
3. 使用提供的工具生成安全密钥
4. 查看应用程序日志中的详细错误信息
