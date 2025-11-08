<template>
  <div class="ai-service-monitor">
    <div class="monitor-header">
      <h2 class="monitor-title">AI服务监控面板</h2>
      <div class="monitor-controls">
        <select v-model="timeRange" @change="refreshData" class="time-select">
          <option value="1h">最近1小时</option>
          <option value="6h">最近6小时</option>
          <option value="24h">最近24小时</option>
          <option value="7d">最近7天</option>
        </select>
        <button @click="refreshData" :disabled="isLoading" class="refresh-btn">
          <span v-if="isLoading" class="loading-spinner">⏳</span>
          刷新数据
        </button>
        <button @click="exportReport" class="export-btn">
          📊 导出报告
        </button>
      </div>
    </div>

    <!-- 服务健康状态 -->
    <div class="health-overview">
      <h3 class="section-title">服务健康状态</h3>
      <div class="health-grid">
        <div
          v-for="service in serviceHealth"
          :key="`${service.provider}-${service.model}`"
          :class="['health-card', `status-${service.status}`]"
        >
          <div class="service-info">
            <div class="service-name">
              {{ service.provider.toUpperCase() }}
              <span class="model-name">{{ service.model }}</span>
            </div>
            <div class="service-status">
              <span class="status-indicator"></span>
              {{ getStatusText(service.status) }}
            </div>
          </div>

          <div class="service-metrics">
            <div class="metric-item">
              <span class="metric-label">延迟</span>
              <span class="metric-value">{{ service.latency }}ms</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">错误率</span>
              <span class="metric-value">{{ (service.errorRate * 100).toFixed(1) }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">连续失败</span>
              <span class="metric-value">{{ service.consecutiveFailures }}</span>
            </div>
          </div>

          <div class="last-checked">
            最后检查: {{ formatTime(service.lastChecked) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 性能指标 -->
    <div class="performance-metrics">
      <h3 class="section-title">性能指标</h3>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon">📊</div>
            <div class="metric-info">
              <div class="metric-name">请求统计</div>
              <div class="metric-description">总请求数和成功率</div>
            </div>
          </div>
          <div class="metric-values">
            <div class="metric-value primary">{{ performanceStats.totalRequests }}</div>
            <div class="metric-value secondary">
              成功率: {{ performanceStats.successRate }}%
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon">⚡</div>
            <div class="metric-info">
              <div class="metric-name">平均延迟</div>
              <div class="metric-description">所有请求的平均响应时间</div>
            </div>
          </div>
          <div class="metric-values">
            <div class="metric-value primary">{{ performanceStats.averageLatency }}ms</div>
            <div class="metric-change" :class="{ positive: performanceStats.latencyTrend < 0 }">
              {{ performanceStats.latencyTrend > 0 ? '+' : '' }}{{ performanceStats.latencyTrend }}ms
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon">💰</div>
            <div class="metric-info">
              <div class="metric-name">成本统计</div>
              <div class="metric-description">AI服务使用成本</div>
            </div>
          </div>
          <div class="metric-values">
            <div class="metric-value primary">${{ performanceStats.totalCost.toFixed(2) }}</div>
            <div class="metric-value secondary">
              本月: ${{ performanceStats.monthlyCost.toFixed(2) }}
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon">🗄️</div>
            <div class="metric-info">
              <div class="metric-name">缓存性能</div>
              <div class="metric-description">缓存命中率和效率</div>
            </div>
          </div>
          <div class="metric-values">
            <div class="metric-value primary">{{ cacheStats.hitRate }}%</div>
            <div class="metric-value secondary">
              命中: {{ cacheStats.hits }} | 未命中: {{ cacheStats.misses }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 请求分布图表 -->
    <div class="charts-section">
      <div class="chart-container">
        <h4 class="chart-title">请求类型分布</h4>
        <div class="chart-placeholder">
          <RequestTypeChart :data="requestTypeData" />
        </div>
      </div>

      <div class="chart-container">
        <h4 class="chart-title">服务使用情况</h4>
        <div class="chart-placeholder">
          <ServiceUsageChart :data="serviceUsageData" />
        </div>
      </div>

      <div class="chart-container">
        <h4 class="chart-title">延迟趋势</h4>
        <div class="chart-placeholder">
          <LatencyTrendChart :data="latencyTrendData" />
        </div>
      </div>
    </div>

    <!-- 实时请求日志 -->
    <div class="request-logs">
      <h3 class="section-title">
        实时请求日志
        <span class="live-indicator">🔴 LIVE</span>
      </h3>
      <div class="logs-container">
        <div class="logs-header">
          <div class="log-column time">时间</div>
          <div class="log-column type">类型</div>
          <div class="log-column service">服务</div>
          <div class="log-column latency">延迟</div>
          <div class="log-column cost">成本</div>
          <div class="log-column status">状态</div>
        </div>
        <div class="logs-body">
          <div
            v-for="log in recentLogs"
            :key="log.id"
            :class="['log-entry', `status-${log.status}`]"
          >
            <div class="log-column time">{{ formatTime(log.timestamp) }}</div>
            <div class="log-column type">{{ log.type }}</div>
            <div class="log-column service">{{ log.service }}</div>
            <div class="log-column latency">{{ log.latency }}ms</div>
            <div class="log-column cost">${{ log.cost.toFixed(4) }}</div>
            <div class="log-column status">
              <span :class="['status-badge', `status-${log.status}`]">
                {{ getStatusText(log.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 成本分析 -->
    <div class="cost-analysis">
      <h3 class="section-title">成本分析</h3>
      <div class="cost-breakdown">
        <div class="cost-item" v-for="cost in costBreakdown" :key="cost.service">
          <div class="cost-service">{{ cost.service }}</div>
          <div class="cost-bar">
            <div
              class="cost-fill"
              :style="{ width: `${(cost.amount / maxCost) * 100}%` }"
            ></div>
          </div>
          <div class="cost-amount">${{ cost.amount.toFixed(2) }}</div>
          <div class="cost-percentage">{{ cost.percentage.toFixed(1) }}%</div>
        </div>
      </div>

      <div class="cost-limits">
        <div class="limit-item">
          <span class="limit-label">每日限制</span>
          <span class="limit-value">$10.00 / $50.00</span>
          <div class="limit-bar">
            <div class="limit-fill" style="width: 20%"></div>
          </div>
        </div>
        <div class="limit-item">
          <span class="limit-label">每月限制</span>
          <span class="limit-value">$45.50 / $200.00</span>
          <div class="limit-bar">
            <div class="limit-fill" style="width: 22.75%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 告警和通知 -->
    <div class="alerts-section" v-if="alerts.length > 0">
      <h3 class="section-title">⚠️ 系统告警</h3>
      <div class="alerts-list">
        <div
          v-for="alert in alerts"
          :key="alert.id"
          :class="['alert-item', `severity-${alert.severity}`]"
        >
          <div class="alert-icon">{{ alert.severity === 'critical' ? '🚨' : '⚠️' }}</div>
          <div class="alert-content">
            <div class="alert-title">{{ alert.title }}</div>
            <div class="alert-description">{{ alert.description }}</div>
            <div class="alert-time">{{ formatTime(alert.timestamp) }}</div>
          </div>
          <button @click="dismissAlert(alert.id)" class="dismiss-btn">
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import LatencyTrendChart from './charts/LatencyTrendChart.vue'
import RequestTypeChart from './charts/RequestTypeChart.vue'
import ServiceUsageChart from './charts/ServiceUsageChart.vue'

// Props
const props = defineProps({
  autoRefresh: {
    type: Boolean,
    default: true,
  },
  refreshInterval: {
    type: Number,
    default: 30000, // 30秒
  },
})

// 响应式数据
const timeRange = ref('24h')
const isLoading = ref(false)
const serviceHealth = ref([])
const performanceStats = ref({
  totalRequests: 0,
  successRate: 0,
  averageLatency: 0,
  latencyTrend: 0,
  totalCost: 0,
  monthlyCost: 0,
})
const cacheStats = ref({
  hitRate: 0,
  hits: 0,
  misses: 0,
})
const requestTypeData = ref([])
const serviceUsageData = ref([])
const latencyTrendData = ref([])
const recentLogs = ref([])
const alerts = ref([])
const costBreakdown = ref([])
const maxCost = ref(0)

// 计算属性
const activeServices = computed(() => {
  return serviceHealth.value.filter((service) => service.status === 'healthy')
})

const unhealthyServices = computed(() => {
  return serviceHealth.value.filter((service) => service.status !== 'healthy')
})

// 方法
const refreshData = async () => {
  try {
    isLoading.value = true

    // 模拟数据获取
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 更新服务健康状态
    serviceHealth.value = [
      {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        status: 'healthy',
        latency: 1250,
        errorRate: 0.02,
        lastChecked: Date.now() - 30000,
        consecutiveFailures: 0,
      },
      {
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        status: 'healthy',
        latency: 1800,
        errorRate: 0.01,
        lastChecked: Date.now() - 45000,
        consecutiveFailures: 0,
      },
      {
        provider: 'local',
        model: 'llama-2-70b-chat',
        status: 'degraded',
        latency: 3200,
        errorRate: 0.05,
        lastChecked: Date.now() - 20000,
        consecutiveFailures: 1,
      },
    ]

    // 更新性能统计
    performanceStats.value = {
      totalRequests: 1247,
      successRate: 98.5,
      averageLatency: 1650,
      latencyTrend: -120,
      totalCost: 45.5,
      monthlyCost: 45.5,
    }

    // 更新缓存统计
    cacheStats.value = {
      hitRate: 73.2,
      hits: 912,
      misses: 335,
    }

    // 更新图表数据
    requestTypeData.value = [
      { type: 'creation', count: 450, percentage: 36.1 },
      { type: 'logic', count: 380, percentage: 30.5 },
      { type: 'narrative', count: 320, percentage: 25.7 },
      { type: 'analysis', count: 97, percentage: 7.7 },
    ]

    serviceUsageData.value = [
      { service: 'OpenAI GPT-4', requests: 780, cost: 28.5 },
      { service: 'Anthropic Claude', requests: 320, cost: 15.2 },
      { service: 'Local LLaMA', requests: 147, cost: 1.8 },
    ]

    latencyTrendData.value = generateLatencyTrendData()

    // 更新最近日志
    recentLogs.value = generateRecentLogs()

    // 更新成本分析
    updateCostBreakdown()

    // 检查告警
    checkAlerts()
  } catch (error) {
    console.error('Failed to refresh data:', error)
  } finally {
    isLoading.value = false
  }
}

const generateLatencyTrendData = () => {
  const data = []
  const now = Date.now()

  for (let i = 23; i >= 0; i--) {
    const time = now - i * 60 * 60 * 1000 // 每小时
    data.push({
      time,
      latency: 1500 + Math.random() * 500 + Math.sin(i / 4) * 200,
    })
  }

  return data
}

const generateRecentLogs = () => {
  const logs = []
  const types = ['creation', 'logic', 'narrative', 'analysis']
  const services = ['OpenAI GPT-4', 'Anthropic Claude', 'Local LLaMA']
  const statuses = ['success', 'success', 'success', 'error']

  for (let i = 0; i < 20; i++) {
    logs.push({
      id: `log-${i}`,
      timestamp: Date.now() - i * 60000, // 每分钟一条
      type: types[Math.floor(Math.random() * types.length)],
      service: services[Math.floor(Math.random() * services.length)],
      latency: 800 + Math.random() * 2000,
      cost: Math.random() * 0.01,
      status: statuses[Math.floor(Math.random() * statuses.length)],
    })
  }

  return logs
}

const updateCostBreakdown = () => {
  costBreakdown.value = [
    { service: 'OpenAI GPT-4', amount: 28.5, percentage: 62.6 },
    { service: 'Anthropic Claude', amount: 15.2, percentage: 33.4 },
    { service: 'Local LLaMA', amount: 1.8, percentage: 4.0 },
  ]
  maxCost.value = Math.max(...costBreakdown.value.map((c) => c.amount))
}

const checkAlerts = () => {
  const newAlerts = []

  // 检查服务健康
  unhealthyServices.value.forEach((service) => {
    newAlerts.push({
      id: `alert-${service.provider}-${service.model}`,
      severity: service.status === 'unhealthy' ? 'critical' : 'warning',
      title: `${service.provider} ${service.model} 服务异常`,
      description: `延迟: ${service.latency}ms, 错误率: ${(service.errorRate * 100).toFixed(1)}%`,
      timestamp: service.lastChecked,
    })
  })

  // 检查成本超限
  if (performanceStats.value.monthlyCost > 150) {
    newAlerts.push({
      id: 'cost-alert',
      severity: 'warning',
      title: '月度成本接近限制',
      description: `当前消耗: $${performanceStats.value.monthlyCost.toFixed(2)} / $200.00`,
      timestamp: Date.now(),
    })
  }

  // 检查性能下降
  if (performanceStats.value.averageLatency > 2500) {
    newAlerts.push({
      id: 'latency-alert',
      severity: 'warning',
      title: '平均延迟过高',
      description: `当前延迟: ${performanceStats.value.averageLatency}ms`,
      timestamp: Date.now(),
    })
  }

  alerts.value = newAlerts
}

const getStatusText = (status) => {
  const statusMap = {
    healthy: '正常',
    degraded: '降级',
    unhealthy: '异常',
  }
  return statusMap[status] || status
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const exportReport = () => {
  const reportData = {
    timestamp: new Date().toISOString(),
    timeRange: timeRange.value,
    serviceHealth: serviceHealth.value,
    performanceStats: performanceStats.value,
    cacheStats: cacheStats.value,
    costBreakdown: costBreakdown.value,
    alerts: alerts.value,
  }

  const dataStr = JSON.stringify(reportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = `ai-service-report-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

const dismissAlert = (alertId) => {
  alerts.value = alerts.value.filter((alert) => alert.id !== alertId)
}

// 自动刷新定时器
let refreshTimer = null

const startAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      refreshData()
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 生命周期
onMounted(() => {
  refreshData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.ai-service-monitor {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.monitor-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.monitor-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.time-select,
.refresh-btn,
.export-btn {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.time-select:focus,
.refresh-btn:focus,
.export-btn:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.refresh-btn:hover:not(:disabled),
.export-btn:hover {
  background: #f8fafc;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.live-indicator {
  font-size: 12px;
  color: #e53e3e;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.health-overview {
  margin-bottom: 32px;
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.health-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #48bb78;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.health-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.health-card.status-healthy {
  border-left-color: #48bb78;
}

.health-card.status-degraded {
  border-left-color: #ed8936;
}

.health-card.status-unhealthy {
  border-left-color: #e53e3e;
}

.service-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.service-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.model-name {
  display: block;
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
}

.service-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4a5568;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #48bb78;
}

.health-card.status-degraded .status-indicator {
  background: #ed8936;
}

.health-card.status-unhealthy .status-indicator {
  background: #e53e3e;
}

.service-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.metric-item {
  text-align: center;
}

.metric-label {
  display: block;
  font-size: 12px;
  color: #718096;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.last-checked {
  font-size: 12px;
  color: #a0aec0;
}

.performance-metrics {
  margin-bottom: 32px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.metric-info {
  flex: 1;
}

.metric-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 4px;
}

.metric-description {
  font-size: 14px;
  color: #718096;
}

.metric-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-value.primary {
  font-size: 32px;
  font-weight: 700;
  color: #1a202c;
}

.metric-value.secondary {
  font-size: 14px;
  color: #718096;
}

.metric-change {
  font-size: 14px;
  font-weight: 500;
}

.metric-change.positive {
  color: #48bb78;
}

.metric-change:not(.positive) {
  color: #e53e3e;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.chart-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.chart-placeholder {
  height: 200px;
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
}

.request-logs {
  margin-bottom: 32px;
}

.logs-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.logs-header,
.log-entry {
  display: grid;
  grid-template-columns: 120px 100px 140px 80px 80px 80px;
  gap: 12px;
  padding: 12px 20px;
  align-items: center;
}

.logs-header {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 12px;
  font-weight: 600;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.log-entry {
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry.status-error {
  background: #fef5e7;
}

.log-column {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-success {
  background: #f0fff4;
  color: #38a169;
}

.status-error {
  background: #fed7d7;
  color: #e53e3e;
}

.cost-analysis {
  margin-bottom: 32px;
}

.cost-breakdown {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.cost-item {
  display: grid;
  grid-template-columns: 1fr 2fr 80px 60px;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.cost-item:last-child {
  margin-bottom: 0;
}

.cost-service {
  font-weight: 500;
  color: #1a202c;
}

.cost-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.cost-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
}

.cost-amount {
  font-weight: 600;
  color: #1a202c;
  text-align: right;
}

.cost-percentage {
  font-size: 14px;
  color: #718096;
  text-align: right;
}

.cost-limits {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.limit-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.limit-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1a202c;
  margin-bottom: 8px;
}

.limit-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 12px;
}

.limit-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.limit-fill {
  height: 100%;
  background: linear-gradient(90deg, #48bb78, #38a169);
  border-radius: 3px;
}

.alerts-section {
  background: #fff5f5;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #feb2b2;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #e53e3e;
}

.alert-item.severity-warning {
  border-left-color: #ed8936;
}

.alert-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 4px;
}

.alert-description {
  color: #4a5568;
  margin-bottom: 8px;
}

.alert-time {
  font-size: 12px;
  color: #a0aec0;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.dismiss-btn:hover {
  background: #f7fafc;
  color: #2d3748;
}

/* Responsive design */
@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .logs-header,
  .log-entry {
    grid-template-columns: 100px 80px 120px 60px 60px 60px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .monitor-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .monitor-controls {
    width: 100%;
    justify-content: space-between;
  }

  .health-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .cost-limits {
    grid-template-columns: 1fr;
  }

  .logs-header,
  .log-entry {
    grid-template-columns: 80px 60px 100px 50px 50px 50px;
    padding: 8px 12px;
  }

  .log-column.time {
    font-size: 11px;
  }
}
</style>
