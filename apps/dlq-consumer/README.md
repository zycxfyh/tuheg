# DLQ Consumer (死信队列消费者) - 系统故障监控服务

## 📋 概述

DLQ Consumer是创世星环系统的死信队列监控服务，专门处理RabbitMQ中失败的消息。当消息在所有重试尝试后仍然失败时，它们会被发送到死信队列(DLQ)，该服务负责：

1. **监控所有DLQ** - 监听creation、logic和narrative代理的死信队列
2. **发送告警** - 在消息永久失败时通知监控系统
3. **存储失败消息** - 持久化失败消息以供人工审核
4. **提供可观测性** - 记录详细的失败信息和系统状态

[![System Reliability](https://img.shields.io/badge/reliability-critical-red.svg)](../../docs/System-Technical-Specification.md)
[![Error Handling](https://img.shields.io/badge/error--handling-✅-brightgreen.svg)](../../industrial-test-results/)

## 🏗️ 技术栈

- **框架**: NestJS + 微服务
- **消息队列**: RabbitMQ (AMQP)
- **数据库**: PostgreSQL (失败消息存储)
- **监控**: Sentry + 自定义告警系统
- **事件总线**: Redis-backed事件总线
- **测试**: Jest

## 架构设计

### 目录结构

```text
apps/dlq-consumer/
├── src/
│   ├── dlq-consumer.service.ts    # 核心DLQ处理服务
│   ├── dlq-consumer.module.ts     # 模块定义
│   ├── alert.service.ts           # 告警服务
│   └── main.ts                    # 应用入口
├── test/                          # 单元测试
├── package.json
└── README.md
```

### 核心组件架构

#### 1. DLQ Consumer Service (死信队列消费者服务)

**功能职责**:

- 监听所有代理的死信队列
- 解析失败消息的内容和元数据
- 提取失败信息（userId、gameId、错误详情）
- 存储失败消息到数据库
- 触发告警通知

**核心处理流程**:

```typescript
async handleFailedMessage(message: FailedMessage): Promise<void> {
  // 1. 解析消息内容
  const failureInfo = this.parseFailureMessage(message);

  // 2. 存储到数据库
  await this.storeFailedMessage(failureInfo);

  // 3. 发送告警
  await this.alertService.sendAlert('DLQ_ALERT', {
    type: 'message_failure',
    severity: 'high',
    data: failureInfo
  });

  // 4. 确认消息处理完成
  await this.acknowledgeMessage(message);
}
```

#### 2. Alert Service (告警服务)

**功能职责**:

- 生成结构化告警信息
- 通过多种渠道发送告警
- 实现告警去重和聚合
- 支持告警升级策略

**告警类型**:

```typescript
enum AlertType {
  DLQ_ALERT = 'dlq_alert',           // 死信队列告警
  SYSTEM_ALERT = 'system_alert',     // 系统告警
  PERFORMANCE_ALERT = 'performance_alert' // 性能告警
}

enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
```

## 监控的队列

### 代理死信队列

| 队列名称 | 描述 | 失败原因示例 |
| -------- | ---- | ------------ |
| `creation_queue_dead` | 创建代理失败请求 | AI生成超时、数据库约束冲突 |
| `logic_agent_dlq` | 逻辑代理处理失败任务 | AI推理错误、规则引擎异常 |
| `narrative_agent_dlq` | 叙事代理生成失败任务 | AI生成失败、格式验证错误 |

### 消息处理流程

```mermaid
graph TD
    A[消息失败] --> B[发送到DLQ]
    B --> C[DLQ Consumer接收]
    C --> D[解析消息内容]
    D --> E[提取失败信息]
    E --> F[存储到数据库]
    F --> G[发送告警]
    G --> H[确认消息]
```

## 告警系统

### 告警类型定义

#### DLQ_ALERT (死信队列告警)

**触发条件**: 消息进入死信队列
**严重程度**: 高
**处理方式**: 立即通知运维团队

```typescript
interface DlqAlert {
  type: 'dlq_alert';
  severity: 'high';
  data: {
    queueName: string;
    originalMessage: any;
    failureReason: string;
    userId?: string;
    gameId?: string;
    timestamp: Date;
  };
}
```

#### SYSTEM_ALERT (系统告警)

**触发条件**: 系统级问题（如连接失败、资源不足）
**严重程度**: 中等到严重
**处理方式**: 根据严重程度自动或手动处理

### 告警渠道

- **Email**: 发送给运维团队
- **Slack**: 实时通知到监控频道
- **SMS**: 严重告警的短信通知
- **内部事件总线**: 发布到系统事件总线供其他服务消费

## 数据存储

### 失败消息表结构

```sql
CREATE TABLE failed_messages (
  id SERIAL PRIMARY KEY,
  queue_name VARCHAR(255) NOT NULL,
  message_content JSONB NOT NULL,
  failure_reason TEXT,
  user_id VARCHAR(255),
  game_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending_review',
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(255),
  resolution_notes TEXT
);

-- 索引优化
CREATE INDEX idx_failed_messages_status ON failed_messages(status);
CREATE INDEX idx_failed_messages_queue ON failed_messages(queue_name);
CREATE INDEX idx_failed_messages_created ON failed_messages(created_at);
```

### 人工审核流程

1. **消息状态管理**:
   - `pending_review`: 待审核
   - `under_review`: 审核中
   - `resolved`: 已解决
   - `ignored`: 已忽略

2. **审核操作**:
   - **重新处理**: 将消息重新发送到原始队列
   - **标记解决**: 记录问题原因和解决方案
   - **系统性问题**: 触发代码修复或配置调整

## 集成关系

### 内部集成

- **EventBus**: 发布告警事件到系统事件总线
- **PrismaService**: 数据库操作和失败消息存储
- **Sentry**: 错误追踪和性能监控

### 外部集成

- **RabbitMQ**: DLQ消息消费
- **PostgreSQL**: 失败消息持久化存储
- **监控系统**: 告警通知和指标收集

## 配置管理

### 环境变量

```bash
# RabbitMQ配置
RABBITMQ_URL=amqp://localhost:5672

# 数据库配置
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# 监控配置
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# 告警配置
ALERT_EMAIL_RECIPIENTS=ops@tuheg.dev,admin@tuheg.dev
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SMS_API_KEY=your_sms_api_key

# 应用配置
NODE_ENV=production
```

### 队列配置

```typescript
// DLQ消费者配置
const dlqConsumers = [
  {
    queue: 'creation_queue_dead',
    exchange: 'creation_agent_dlx',
    routingKey: 'creation_queue_dlq'
  },
  {
    queue: 'logic_agent_dlq',
    exchange: 'logic_agent_dlx',
    routingKey: 'logic_agent_dlq'
  },
  {
    queue: 'narrative_agent_dlq',
    exchange: 'narrative_agent_dlx',
    routingKey: 'narrative_agent_dlq'
  }
];
```

## 性能优化

### 异步处理

- **消息异步消费**: 非阻塞的消息处理
- **批量数据库操作**: 减少数据库连接次数
- **告警异步发送**: 不阻塞核心消息处理流程

### 资源管理

```typescript
@Injectable()
export class DlqConsumerService {
  private readonly messageBatchSize = 10;
  private readonly processingTimeout = 30000; // 30秒超时

  // 批量处理优化
  async processBatch(messages: FailedMessage[]): Promise<void> {
    const batches = chunk(messages, this.messageBatchSize);

    for (const batch of batches) {
      await Promise.all(
        batch.map(msg => this.processMessageWithTimeout(msg))
      );
    }
  }
}
```

## 监控和可观测性

### 指标收集

- **处理延迟**: 消息从接收到完成的耗时
- **处理成功率**: 消息处理成功率统计
- **告警频率**: 各类告警的触发频率
- **队列积压**: DLQ中的消息积压数量

### 健康检查

```typescript
@Injectable()
export class DlqHealthIndicator implements HealthIndicator {
  async isHealthy(): Promise<HealthIndicatorResult> {
    // 检查RabbitMQ连接
    // 检查数据库连接
    // 检查告警渠道可用性
    // 返回健康状态
  }
}
```

## 测试策略

### 单元测试

```typescript
describe('DlqConsumerService', () => {
  let service: DlqConsumerService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [DlqConsumerService],
    }).compile();

    service = module.get<DlqConsumerService>(DlqConsumerService);
  });

  it('should parse failure message correctly', () => {
    const rawMessage = createMockFailedMessage();
    const parsed = service.parseFailureMessage(rawMessage);

    expect(parsed.userId).toBeDefined();
    expect(parsed.failureReason).toBeDefined();
  });
});
```

### 集成测试

- **RabbitMQ集成**: DLQ消息消费测试
- **数据库集成**: 失败消息存储测试
- **告警系统集成**: 告警发送测试

## 部署和扩展

### Docker部署

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 水平扩展

- **单实例部署**: 通常只需要一个实例
- **高可用**: 可以部署多个实例，但需要考虑告警去重
- **配置一致性**: 环境变量统一管理

### 资源配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dlq-consumer
spec:
  replicas: 1  # 通常单实例
  template:
    spec:
      containers:
        - name: dlq-consumer
          resources:
            requests:
              memory: '128Mi'
              cpu: '100m'
            limits:
              memory: '256Mi'
              cpu: '200m'
```

## 故障排查

### 常见问题

1. **RabbitMQ连接失败**
   - 检查RABBITMQ_URL配置
   - 验证RabbitMQ服务状态
   - 查看网络连接和防火墙设置

2. **数据库连接超时**
   - 检查DATABASE_URL配置
   - 验证PostgreSQL服务可用性
   - 监控连接池使用情况

3. **告警发送失败**
   - 检查告警渠道配置（Email/Slack/SMS）
   - 验证API密钥和访问令牌
   - 查看告警服务日志

### 调试技巧

```typescript
// 启用详细日志
const logger = new Logger('DlqConsumer');
logger.debug('Processing message:', message);
logger.debug('Parsed failure info:', failureInfo);

// 手动触发告警测试
await alertService.sendTestAlert();
```

## 扩展规划

### 计划功能

- **智能告警聚合**: 基于模式的告警分组和去重
- **自动修复**: 针对常见失败模式的自动修复策略
- **历史分析**: 失败模式的历史趋势分析
- **告警升级**: 基于频率和影响的告警升级机制
- **多渠道告警**: 支持更多告警通知渠道

### 架构演进

当前架构可以演进为：

- **事件驱动告警**: 更丰富的事件类型和处理逻辑
- **机器学习**: 使用ML预测和分类失败模式
- **分布式处理**: 支持大规模消息处理的分布式架构
- **实时仪表板**: 失败监控的实时可视化仪表板

## 相关文档

- [系统架构文档](../../docs/development/ARCHITECTURE.md)
- [监控和告警](../../deployment/monitoring/)
- [RabbitMQ配置](../../docs/environment-variables.md)
- [事件总线文档](../../packages/common-backend/src/event-bus/)
