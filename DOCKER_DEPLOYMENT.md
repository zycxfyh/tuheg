# 🐳 Creation Ring Docker 部署指南

## 📋 概述

本指南介绍如何使用Docker和Docker Compose部署Creation Ring应用程序。系统采用微服务架构，包含前端、后端API网关、三个AI代理服务以及必要的中间件。

## 🏗️ 系统架构

```
Frontend (Nginx + Vue.js)
    ↓
Backend Gateway (NestJS)
    ↓
├── Creation Agent (AI世界创建)
├── Logic Agent (游戏逻辑推理)
└── Narrative Agent (叙事生成)
    ↓
PostgreSQL + Redis + RabbitMQ
```

## 📋 前置要求

- Docker >= 20.10
- Docker Compose >= 2.0
- 至少8GB RAM
- 至少20GB可用磁盘空间

## 🚀 快速启动

### 1. 克隆项目

```bash
git clone <repository-url>
cd creation-ring
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp docker.env .env

# 编辑环境变量（设置你的DeepSeek API密钥）
nano .env
```

### 3. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看启动状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 验证部署

```bash
# 检查服务健康状态
curl http://localhost:3000/health
curl http://localhost:4000/health
curl http://localhost:8080/api/v1/creation/creation-status
```

## 🔧 服务说明

### 端口映射

| 服务 | 端口 | 说明 |
|------|------|------|
| Frontend | 3000 | Vue.js前端应用 |
| Backend Gateway | 4000 | API网关和WebSocket |
| Creation Agent | 8080 | 世界创建AI代理 |
| Logic Agent | 8081 | 游戏逻辑AI代理 |
| Narrative Agent | 8082 | 叙事生成AI代理 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |
| RabbitMQ | 5672/15672 | 消息队列和管理界面 |

### 数据持久化

所有数据都通过Docker volumes持久化：

- `postgres_data`: 数据库数据
- `redis_data`: Redis缓存数据
- `rabbitmq_data`: 消息队列数据
- `grafana_data`: 监控仪表板数据

## 🔧 环境变量配置

### 必需的环境变量

```bash
# DeepSeek AI API密钥
DEEPSEEK_API_KEY=your-api-key-here

# 数据库配置
DATABASE_URL=postgresql://user:password@postgres:5432/creation_ring

# 加密密钥（生产环境请生成安全随机值）
ENCRYPTION_KEY=your-32-character-encryption-key-here
ENCRYPTION_SALT=your-16-character-salt-here
```

### 可选的环境变量

```bash
# 监控和日志
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# 性能调优
DB_CONNECTION_LIMIT=20
DB_POOL_TIMEOUT=20
```

## 🛠️ 开发和调试

### 查看服务日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend-gateway
docker-compose logs -f creation-agent
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend-gateway
```

### 进入容器调试

```bash
# 进入运行中的容器
docker-compose exec backend-gateway sh

# 查看容器资源使用
docker-compose top
```

### 数据库管理

```bash
# 连接到数据库
docker-compose exec postgres psql -U user -d creation_ring

# 运行数据库迁移
docker-compose exec postgres psql -U user -d creation_ring -f /docker-entrypoint-initdb.d/init.sql
```

## 📊 监控和维护

### 健康检查

所有服务都配置了健康检查，可以通过以下端点监控：

- Frontend: `GET /health`
- Backend Gateway: `GET /health`
- Agents: `GET /api/v1/{agent}/health`

### Prometheus + Grafana

系统包含完整的监控栈：

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

### 日志聚合

```bash
# 导出所有服务日志
docker-compose logs > all_services.log

# 按时间过滤日志
docker-compose logs --since "2024-01-01T00:00:00" --until "2024-01-02T00:00:00"
```

## 🔄 更新和维护

### 更新应用版本

```bash
# 停止服务
docker-compose down

# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose build --no-cache

# 启动服务
docker-compose up -d
```

### 数据库备份

```bash
# 创建数据库备份
docker-compose exec postgres pg_dump -U user creation_ring > backup.sql

# 从备份恢复
docker-compose exec -T postgres psql -U user creation_ring < backup.sql
```

## 🚨 故障排除

### 常见问题

#### 1. 服务启动失败

```bash
# 检查服务状态
docker-compose ps

# 查看详细错误日志
docker-compose logs <service-name>

# 检查端口占用
netstat -tulpn | grep :3000
```

#### 2. 数据库连接问题

```bash
# 检查数据库是否运行
docker-compose exec postgres pg_isready -U user -d creation_ring

# 重置数据库
docker-compose down -v
docker-compose up -d postgres
```

#### 3. AI API调用失败

```bash
# 检查API密钥配置
docker-compose exec backend-gateway env | grep DEEPSEEK

# 测试API连接
docker-compose exec backend-gateway curl -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Hello"}]}'
```

#### 4. 内存不足

```bash
# 检查容器资源使用
docker stats

# 增加Docker内存限制
# 在Docker Desktop设置中增加内存分配
```

### 性能优化

#### 数据库优化

```sql
-- 在PostgreSQL中运行
ANALYZE;
VACUUM;
```

#### Redis优化

```bash
# 检查Redis内存使用
docker-compose exec redis redis-cli info memory

# 清理Redis缓存
docker-compose exec redis redis-cli FLUSHALL
```

## 🔒 安全配置

### 生产环境建议

1. **更改默认密码**
   - 数据库密码
   - RabbitMQ密码
   - Grafana管理员密码

2. **配置SSL/TLS**
   ```bash
   # 使用nginx配置SSL
   # 配置数据库SSL连接
   ```

3. **网络安全**
   ```bash
   # 配置防火墙规则
   # 使用内部网络
   docker network create --internal creation-ring-internal
   ```

4. **密钥管理**
   ```bash
   # 使用Docker secrets或外部密钥管理服务
   # 定期轮换API密钥
   ```

## 📚 参考文档

- [Docker Compose文档](https://docs.docker.com/compose/)
- [NestJS部署指南](https://docs.nestjs.com/deployment)
- [PostgreSQL Docker镜像](https://hub.docker.com/_/postgres)
- [Redis Docker镜像](https://hub.docker.com/_/redis)
- [RabbitMQ Docker镜像](https://hub.docker.com/_/rabbitmq)

## 🆘 获取帮助

如果遇到问题，请：

1. 查看[故障排除](#🚨-故障排除)部分
2. 检查[GitHub Issues](https://github.com/your-org/creation-ring/issues)
3. 查看详细日志：`docker-compose logs --tail=1000`

---

**🎉 祝贺！你的Creation Ring现在已经在Docker中运行了！**
