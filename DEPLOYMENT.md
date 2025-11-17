# Creation Ring 部署指南

本文档介绍如何使用GitHub Actions进行Creation Ring项目的自动化部署和测试。

## 📋 前置要求

### 系统要求
- Node.js 18+ 和 pnpm 8+
- Docker 和 Docker Compose
- Kubernetes 集群 (支持 k3s, minikube, EKS 等)
- kubectl 和 helm
- GitHub 账户和仓库

### 环境准备

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-org/creation-ring.git
   cd creation-ring
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   创建 `.env` 文件：
   ```bash
   # 数据库配置
   DATABASE_URL=postgresql://user:password@localhost:5432/creation_ring

   # Redis配置
   REDIS_URL=redis://localhost:6379

   # JWT配置
   JWT_SECRET=your-jwt-secret

   # AI配置
   OPENAI_API_KEY=your-openai-key
   ```

## 🚀 GitHub Actions 工作流

### 主要工作流

#### 1. CI/CD Pipeline (`.github/workflows/ci-cd.yaml`)

**触发条件：**
- 推送到 `main` 或 `develop` 分支
- 推送包含 `apps/`, `packages/`, `infrastructure/` 的更改
- Pull Request 到 `main` 或 `develop` 分支

**工作流步骤：**

1. **测试阶段**
   - 在 Node.js 18 和 20 上运行
   - 安装依赖和类型检查
   - 代码 linting
   - 单元测试 (带 PostgreSQL 和 Redis 服务)
   - 上传测试覆盖率

2. **安全扫描**
   - 使用 Trivy 进行漏洞扫描
   - 上传安全事件到 GitHub

3. **构建阶段**
   - 构建后端 Docker 镜像
   - 构建前端 Docker 镜像
   - 推送到 GitHub Container Registry

4. **部署阶段**
   - **Staging**: 推送到 `develop` 分支时自动部署
   - **Production**: 推送到 `main` 分支时执行蓝绿部署

#### 2. 本地部署测试 (`.github/workflows/local-deploy-test.yaml`)

**触发条件：**
- 手动触发 (`workflow_dispatch`)

**用途：**
- 验证配置文件的正确性
- 测试本地构建和 Docker 镜像
- 验证 Kubernetes manifest
- 模拟部署过程

### 手动触发部署测试

1. 进入 GitHub 仓库的 Actions 标签页
2. 选择 "Local Deploy Test" 工作流
3. 点击 "Run workflow"
4. 选择环境 (staging/production)
5. 选择是否跳过测试

## 🐳 本地开发和测试

### 使用 Docker Compose 进行本地开发

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### Docker Compose 配置

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: creation_ring
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend-gateway:
    build:
      context: ./apps/backend-gateway
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/creation_ring
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    depends_on:
      - backend-gateway

volumes:
  postgres_data:
  redis_data:
```

## ☸️ Kubernetes 部署

### 前置要求

1. **安装 kubectl**
   ```bash
   # macOS
   brew install kubectl

   # Ubuntu
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   chmod +x kubectl && sudo mv kubectl /usr/local/bin/
   ```

2. **安装 Helm**
   ```bash
   curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
   ```

3. **配置 Kubernetes 集群**

   **选项1: Minikube (本地开发)**
   ```bash
   # 安装 Minikube
   curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube

   # 启动集群
   minikube start

   # 启用 Ingress
   minikube addons enable ingress
   ```

   **选项2: k3s (轻量级生产)**
   ```bash
   curl -sfL https://get.k3s.io | sh -
   ```

### 部署步骤

1. **克隆仓库并进入目录**
   ```bash
   git clone https://github.com/your-org/creation-ring.git
   cd creation-ring
   ```

2. **使用部署脚本**
   ```bash
   # 部署到 staging 环境
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh staging

   # 或者部署到 production
   ./scripts/deploy.sh production
   ```

3. **手动部署 (可选)**
   ```bash
   # 创建命名空间
   kubectl apply -f infrastructure/k8s/base/namespace.yaml

   # 部署配置
   kubectl apply -f infrastructure/k8s/base/

   # 部署 Istio 配置
   kubectl apply -f infrastructure/istio/

   # 部署应用
   kubectl apply -f infrastructure/k8s/

   # 检查部署状态
   kubectl get pods -n creation-ring
   kubectl get services -n creation-ring
   ```

4. **访问应用**
   ```bash
   # 端口转发
   kubectl port-forward -n creation-ring svc/frontend 8080:80

   # 访问应用
   open http://localhost:8080
   ```

## 🔧 配置管理

### 环境变量

使用 ConfigMap 和 Secret 管理配置：

```bash
# 查看配置
kubectl get configmap -n creation-ring
kubectl get secret -n creation-ring

# 编辑配置
kubectl edit configmap backend-gateway-config -n creation-ring
```

### 数据库迁移

```bash
# 在 Kubernetes 中运行迁移
kubectl exec -n creation-ring deployment/backend-gateway -- npm run migration:run

# 或者本地运行
cd apps/backend-gateway
npm run migration:run
```

## 📊 监控和日志

### Prometheus 和 Grafana

```bash
# 安装 kube-prometheus-stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring

# 访问 Grafana
kubectl port-forward -n monitoring svc/monitoring-grafana 8080:80
# 用户名: admin
# 密码: prom-operator
```

### 日志收集

```bash
# 查看应用日志
kubectl logs -n creation-ring -l app=backend-gateway -f

# 查看所有组件日志
kubectl logs -n creation-ring -f deployment/backend-gateway
kubectl logs -n creation-ring -f deployment/frontend
```

## 🧪 测试策略

### 单元测试
```bash
# 运行所有单元测试
pnpm test

# 运行带覆盖率的测试
pnpm test:coverage
```

### 集成测试
```bash
# 运行后端集成测试
cd apps/backend-gateway
npm run test:e2e
```

### 端到端测试
```bash
# 使用 Playwright 进行 E2E 测试
npx playwright test
```

## 🔒 安全考虑

### 密钥管理

1. **使用 Kubernetes Secrets**
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: database-secret
   type: Opaque
   data:
     url: <base64-encoded-url>
   ```

2. **使用外部密钥管理器**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault

### 网络安全

1. **启用 Istio mTLS**
   ```bash
   kubectl apply -f infrastructure/istio/security/
   ```

2. **配置网络策略**
   ```bash
   kubectl apply -f infrastructure/k8s/network-policies/
   ```

## 🚨 故障排除

### 常见问题

1. **Pod 无法启动**
   ```bash
   # 查看 Pod 详情
   kubectl describe pod <pod-name> -n creation-ring

   # 查看日志
   kubectl logs <pod-name> -n creation-ring
   ```

2. **服务无法访问**
   ```bash
   # 检查服务
   kubectl get svc -n creation-ring

   # 检查端点
   kubectl get endpoints -n creation-ring
   ```

3. **数据库连接问题**
   ```bash
   # 检查数据库 Pod
   kubectl get pods -n creation-ring -l app=postgresql

   # 检查数据库日志
   kubectl logs -n creation-ring -l app=postgresql
   ```

### 回滚策略

1. **快速回滚**
   ```bash
   # 回滚到上一个版本
   kubectl rollout undo deployment/backend-gateway -n creation-ring
   ```

2. **蓝绿部署回滚**
   ```bash
   # 切换回蓝色环境
   kubectl apply -f infrastructure/k8s/blue/
   ```

## 📚 相关文档

- [Kubernetes 官方文档](https://kubernetes.io/docs/)
- [Helm 用户指南](https://helm.sh/docs/)
- [Istio 文档](https://istio.io/latest/docs/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

请确保所有更改都通过了 CI/CD 流水线测试。
