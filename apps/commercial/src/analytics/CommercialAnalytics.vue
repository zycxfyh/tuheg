<template>
  <div class="commercial-analytics">
    <div class="analytics-header">
      <h2 class="analytics-title">商业模式分析面板</h2>
      <div class="analytics-controls">
        <select v-model="timeRange" @change="refreshAnalytics" class="time-select">
          <option value="7d">最近7天</option>
          <option value="30d">最近30天</option>
          <option value="90d">最近90天</option>
          <option value="1y">最近一年</option>
        </select>
        <button @click="refreshAnalytics" :disabled="isLoading" class="refresh-btn">
          <span v-if="isLoading" class="loading-spinner">⏳</span>
          刷新数据
        </button>
        <button @click="exportReport" class="export-btn">
          📊 导出报告
        </button>
      </div>
    </div>

    <!-- 关键指标概览 -->
    <div class="metrics-overview">
      <div class="metric-cards">
        <MetricCard
          title="月度经常性收入 (MRR)"
          :value="`¥${analytics.mrr.toLocaleString()}`"
          :change="analytics.mrrChange"
          icon="💰"
          color="green"
        />
        <MetricCard
          title="年度经常性收入 (ARR)"
          :value="`¥${analytics.arr.toLocaleString()}`"
          :change="analytics.arrChange"
          icon="📈"
          color="blue"
        />
        <MetricCard
          title="客户获取成本 (CAC)"
          :value="`¥${analytics.cac}`"
          :change="analytics.cacChange"
          icon="🎯"
          color="orange"
        />
        <MetricCard
          title="客户终身价值 (LTV)"
          :value="`¥${analytics.ltv}`"
          :change="analytics.ltvChange"
          icon="👑"
          color="purple"
        />
        <MetricCard
          title="LTV/CAC比率"
          :value="analytics.ltvCacRatio.toFixed(1)"
          :change="analytics.ltvCacRatioChange"
          icon="⚖️"
          color="teal"
        />
        <MetricCard
          title="月活用户 (MAU)"
          :value="analytics.mau.toLocaleString()"
          :change="analytics.mauChange"
          icon="👥"
          color="indigo"
        />
      </div>
    </div>

    <!-- 订阅分析 -->
    <div class="subscription-analysis">
      <h3 class="section-title">订阅分析</h3>
      <div class="analysis-grid">
        <div class="chart-container">
          <h4 class="chart-title">订阅计划分布</h4>
          <div class="chart-placeholder">
            <SubscriptionPlanChart :data="subscriptionPlanData" />
          </div>
        </div>

        <div class="chart-container">
          <h4 class="chart-title">订阅生命周期</h4>
          <div class="chart-placeholder">
            <SubscriptionLifecycleChart :data="subscriptionLifecycleData" />
          </div>
        </div>

        <div class="chart-container">
          <h4 class="chart-title">续订率趋势</h4>
          <div class="chart-placeholder">
            <RetentionTrendChart :data="retentionTrendData" />
          </div>
        </div>
      </div>
    </div>

    <!-- 插件市场分析 -->
    <div class="plugin-market-analysis">
      <h3 class="section-title">插件市场分析</h3>
      <div class="market-stats">
        <div class="stat-grid">
          <div class="stat-item">
            <div class="stat-label">插件总数</div>
            <div class="stat-value">{{ pluginStats.totalPlugins }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">总下载量</div>
            <div class="stat-value">{{ pluginStats.totalDownloads.toLocaleString() }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">市场收入</div>
            <div class="stat-value">¥{{ pluginStats.totalRevenue.toLocaleString() }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均评分</div>
            <div class="stat-value">{{ pluginStats.averageRating.toFixed(1) }}/5.0</div>
          </div>
        </div>
      </div>

      <div class="analysis-grid">
        <div class="chart-container">
          <h4 class="chart-title">插件下载趋势</h4>
          <div class="chart-placeholder">
            <PluginDownloadChart :data="pluginDownloadData" />
          </div>
        </div>

        <div class="chart-container">
          <h4 class="chart-title">插件分类分布</h4>
          <div class="chart-placeholder">
            <PluginCategoryChart :data="pluginCategoryData" />
          </div>
        </div>

        <div class="chart-container">
          <h4 class="chart-title">开发者收入排行</h4>
          <div class="developer-leaderboard">
            <div
              v-for="(developer, index) in topDevelopers"
              :key="developer.id"
              class="leaderboard-item"
            >
              <div class="rank">{{ index + 1 }}</div>
              <div class="developer-info">
                <div class="developer-name">{{ developer.name }}</div>
                <div class="developer-stats">
                  {{ developer.pluginsCount }} 个插件 · ¥{{ developer.revenue.toLocaleString() }} 收入
                </div>
              </div>
              <div class="developer-rating">⭐ {{ developer.rating.toFixed(1) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 定价策略分析 -->
    <div class="pricing-analysis">
      <h3 class="section-title">定价策略分析</h3>

      <div class="pricing-grid">
        <div class="pricing-item">
          <h4>价格弹性分析</h4>
          <div class="elasticity-chart">
            <div class="elasticity-point" v-for="point in priceElasticityData" :key="point.price">
              <div class="price">¥{{ point.price }}</div>
              <div class="demand">{{ point.demand }}</div>
              <div class="elasticity">{{ point.elasticity.toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <div class="pricing-item">
          <h4>转化漏斗</h4>
          <div class="conversion-funnel">
            <div class="funnel-step">
              <div class="step-name">免费试用</div>
              <div class="step-value">{{ conversionFunnel.freeTrial }}</div>
              <div class="step-percentage">100%</div>
            </div>
            <div class="funnel-step">
              <div class="step-name">付费转化</div>
              <div class="step-value">{{ conversionFunnel.paidConversion }}</div>
              <div class="step-percentage">{{ ((conversionFunnel.paidConversion / conversionFunnel.freeTrial) * 100).toFixed(1) }}%</div>
            </div>
            <div class="funnel-step">
              <div class="step-name">月度续订</div>
              <div class="step-value">{{ conversionFunnel.monthlyRenewal }}</div>
              <div class="step-percentage">{{ ((conversionFunnel.monthlyRenewal / conversionFunnel.paidConversion) * 100).toFixed(1) }}%</div>
            </div>
          </div>
        </div>

        <div class="pricing-item">
          <h4>A/B测试结果</h4>
          <div class="ab-test-results">
            <div class="test-variant" v-for="variant in abTestResults" :key="variant.name">
              <div class="variant-name">{{ variant.name }}</div>
              <div class="variant-metrics">
                <div class="metric">
                  <span class="label">转化率:</span>
                  <span class="value">{{ variant.conversionRate.toFixed(1) }}%</span>
                </div>
                <div class="metric">
                  <span class="label">平均收入:</span>
                  <span class="value">¥{{ variant.avgRevenue }}</span>
                </div>
                <div class="metric" v-if="variant.isWinner">
                  <span class="winner-badge">🏆 胜出</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 竞争分析 -->
    <div class="competition-analysis">
      <h3 class="section-title">竞争分析</h3>
      <div class="competition-matrix">
        <div class="matrix-headers">
          <div class="header-cell">功能特性</div>
          <div class="header-cell">创世星环</div>
          <div class="header-cell">竞品A</div>
          <div class="header-cell">竞品B</div>
          <div class="header-cell">竞品C</div>
        </div>
        <div
          v-for="feature in competitionMatrix"
          :key="feature.name"
          class="matrix-row"
        >
          <div class="feature-name">{{ feature.name }}</div>
          <div class="feature-value ours" :class="{ advantage: feature.ours === '优势' }">
            {{ feature.ours }}
          </div>
          <div class="feature-value">{{ feature.competitorA }}</div>
          <div class="feature-value">{{ feature.competitorB }}</div>
          <div class="feature-value">{{ feature.competitorC }}</div>
        </div>
      </div>
    </div>

    <!-- 商业洞察和建议 -->
    <div class="business-insights">
      <h3 class="section-title">商业洞察与建议</h3>
      <div class="insights-grid">
        <InsightCard
          v-for="insight in businessInsights"
          :key="insight.id"
          :insight="insight"
          @implement="implementInsight"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

// Props
const props = defineProps({
  autoRefresh: {
    type: Boolean,
    default: true,
  },
  refreshInterval: {
    type: Number,
    default: 300000, // 5分钟
  },
})

// 响应式数据
const timeRange = ref('30d')
const isLoading = ref(false)
const analytics = ref({
  mrr: 0,
  mrrChange: 0,
  arr: 0,
  arrChange: 0,
  cac: 0,
  cacChange: 0,
  ltv: 0,
  ltvChange: 0,
  ltvCacRatio: 0,
  ltvCacRatioChange: 0,
  mau: 0,
  mauChange: 0,
})

const subscriptionPlanData = ref([])
const subscriptionLifecycleData = ref([])
const retentionTrendData = ref([])
const pluginStats = ref({
  totalPlugins: 0,
  totalDownloads: 0,
  totalRevenue: 0,
  averageRating: 0,
})
const pluginDownloadData = ref([])
const pluginCategoryData = ref([])
const topDevelopers = ref([])
const priceElasticityData = ref([])
const conversionFunnel = ref({
  freeTrial: 0,
  paidConversion: 0,
  monthlyRenewal: 0,
})
const abTestResults = ref([])
const competitionMatrix = ref([])
const businessInsights = ref([])

// 方法
const refreshAnalytics = async () => {
  try {
    isLoading.value = true

    // 模拟数据获取
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // 更新关键指标
    analytics.value = {
      mrr: 45600,
      mrrChange: 15.2,
      arr: 547200,
      arrChange: 18.7,
      cac: 120,
      cacChange: -8.5,
      ltv: 2400,
      ltvChange: 12.3,
      ltvCacRatio: 20.0,
      ltvCacRatioChange: 23.4,
      mau: 12500,
      mauChange: 22.1,
    }

    // 更新订阅数据
    subscriptionPlanData.value = [
      { plan: '免费版', users: 8500, percentage: 68.0, revenue: 0 },
      { plan: '创作者', users: 3200, percentage: 25.6, revenue: 92800 },
      { plan: '工作室', users: 650, percentage: 5.2, revenue: 19750 },
      { plan: '企业版', users: 150, percentage: 1.2, revenue: 27000 },
    ]

    subscriptionLifecycleData.value = [
      { stage: '试用', users: 1200, percentage: 100 },
      { stage: '付费', users: 400, percentage: 33.3 },
      { stage: '活跃', users: 320, percentage: 26.7 },
      { stage: '续订', users: 280, percentage: 23.3 },
    ]

    retentionTrendData.value = [
      { month: '1月', retention: 85 },
      { month: '2月', retention: 78 },
      { month: '3月', retention: 82 },
      { month: '4月', retention: 79 },
      { month: '5月', retention: 84 },
      { month: '6月', retention: 81 },
    ]

    // 更新插件数据
    pluginStats.value = {
      totalPlugins: 145,
      totalDownloads: 45600,
      totalRevenue: 125000,
      averageRating: 4.3,
    }

    pluginDownloadData.value = generatePluginDownloadData()
    pluginCategoryData.value = [
      { category: '世界构建', plugins: 35, downloads: 12000 },
      { category: '角色创建', plugins: 28, downloads: 9800 },
      { category: '故事生成', plugins: 22, downloads: 8200 },
      { category: '叙事工具', plugins: 18, downloads: 6100 },
      { category: 'UI主题', plugins: 15, downloads: 4500 },
      { category: '语言包', plugins: 12, downloads: 3200 },
      { category: '集成工具', plugins: 10, downloads: 2800 },
      { category: '实用工具', plugins: 5, downloads: 1000 },
    ]

    topDevelopers.value = [
      { id: 'dev1', name: '奇幻大师工作室', pluginsCount: 8, revenue: 45000, rating: 4.8 },
      { id: 'dev2', name: '叙事工具专家', pluginsCount: 12, revenue: 38000, rating: 4.7 },
      { id: 'dev3', name: 'UI设计工作室', pluginsCount: 6, revenue: 25000, rating: 4.5 },
      { id: 'dev4', name: '集成工具开发商', pluginsCount: 4, revenue: 18000, rating: 4.6 },
      { id: 'dev5', name: '语言专家团队', pluginsCount: 5, revenue: 15000, rating: 4.4 },
    ]

    // 更新定价数据
    priceElasticityData.value = [
      { price: 19, demand: 1000, elasticity: -1.2 },
      { price: 29, demand: 800, elasticity: -0.8 },
      { price: 39, demand: 600, elasticity: -0.6 },
      { price: 49, demand: 450, elasticity: -0.4 },
    ]

    conversionFunnel.value = {
      freeTrial: 1200,
      paidConversion: 400,
      monthlyRenewal: 280,
    }

    abTestResults.value = [
      { name: '原价 ¥29/月', conversionRate: 12.5, avgRevenue: 29, isWinner: false },
      { name: '折扣 ¥19/月', conversionRate: 18.7, avgRevenue: 19, isWinner: true },
      { name: '年付 8折', conversionRate: 15.3, avgRevenue: 24.8, isWinner: false },
    ]

    // 更新竞争矩阵
    competitionMatrix.value = [
      {
        name: '多Agent协作',
        ours: '优势',
        competitorA: '无',
        competitorB: '基础',
        competitorC: '无',
      },
      {
        name: '插件生态',
        ours: '完整',
        competitorA: '基础',
        competitorB: '丰富',
        competitorC: '无',
      },
      {
        name: 'AI质量',
        ours: '高级',
        competitorA: '中等',
        competitorB: '高级',
        competitorC: '基础',
      },
      {
        name: '用户体验',
        ours: '优秀',
        competitorA: '良好',
        competitorB: '优秀',
        competitorC: '基础',
      },
      {
        name: '定价策略',
        ours: '灵活',
        competitorA: '固定',
        competitorB: '固定',
        competitorC: '低价',
      },
      {
        name: '技术支持',
        ours: '7*24',
        competitorA: '工作日',
        competitorB: '7*24',
        competitorC: '有限',
      },
    ]

    // 生成商业洞察
    generateBusinessInsights()
  } catch (error) {
    console.error('Failed to refresh analytics:', error)
  } finally {
    isLoading.value = false
  }
}

const generatePluginDownloadData = () => {
  const data = []
  const now = Date.now()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000)
    data.push({
      date: date.toISOString().split('T')[0],
      downloads: 800 + Math.random() * 400 + Math.sin(i / 7) * 200,
    })
  }

  return data
}

const generateBusinessInsights = () => {
  businessInsights.value = [
    {
      id: 'pricing-optimization',
      type: '定价策略',
      impact: 'high',
      title: '价格弹性优化建议',
      description: '数据显示 ¥19/月的折扣价格带来了18.7%的转化率提升，建议扩大折扣策略的应用范围',
      confidence: 0.89,
      recommendation: '实施更灵活的定价策略，包括季节性折扣和用户分层定价',
    },
    {
      id: 'plugin-market-growth',
      type: '插件经济',
      impact: 'high',
      title: '插件市场高速增长',
      description: '插件下载量月均增长15%，市场收入已达12.5万元，建议加大对优质开发者的扶持',
      confidence: 0.94,
      recommendation: '建立开发者激励计划，包括分成比例提升和营销资源支持',
    },
    {
      id: 'retention-improvement',
      type: '用户留存',
      impact: 'medium',
      title: '续订率需要提升',
      description: '月度续订率稳定在75-80%区间，相比行业平均85%有提升空间',
      confidence: 0.76,
      recommendation: '优化用户 onboarding 流程，增加用户成功指导和定期价值提醒',
    },
    {
      id: 'expansion-opportunity',
      type: '市场扩张',
      impact: 'medium',
      title: '企业市场机会',
      description: '企业版用户贡献了27%的ARR，但渗透率仅1.2%，企业市场潜力巨大',
      confidence: 0.82,
      recommendation: '加强企业营销策略，包括行业定制解决方案和企业级功能开发',
    },
    {
      id: 'competition-advantage',
      type: '竞争优势',
      impact: 'low',
      title: '技术领先优势明显',
      description: '在多Agent协作和AI质量方面具有明显竞争优势，建议加大技术品牌建设',
      confidence: 0.91,
      recommendation: '通过技术博客、行业会议等渠道强化技术领先形象',
    },
  ]
}

const _exportReport = () => {
  const reportData = {
    timestamp: new Date().toISOString(),
    timeRange: timeRange.value,
    analytics: analytics.value,
    subscriptionData: subscriptionPlanData.value,
    pluginStats: pluginStats.value,
    pricingAnalysis: {
      priceElasticity: priceElasticityData.value,
      conversionFunnel: conversionFunnel.value,
      abTestResults: abTestResults.value,
    },
    competitionAnalysis: competitionMatrix.value,
    insights: businessInsights.value,
  }

  const dataStr = JSON.stringify(reportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = `commercial-analytics-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

const _implementInsight = (insight) => {
  // TODO: 实现洞察应用逻辑
  console.log('Implementing insight:', insight)
}

// 自动刷新定时器
let refreshTimer = null

const startAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      refreshAnalytics()
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
  refreshAnalytics()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.commercial-analytics {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.analytics-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.analytics-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.analytics-controls {
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
}

.metrics-overview {
  margin-bottom: 40px;
}

.metric-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.subscription-analysis,
.plugin-market-analysis {
  margin-bottom: 40px;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-top: 20px;
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
  height: 250px;
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
}

.market-stats {
  margin-bottom: 24px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #718096;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
}

.developer-leaderboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.rank {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.developer-info {
  flex: 1;
}

.developer-name {
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 4px;
}

.developer-stats {
  font-size: 12px;
  color: #718096;
}

.developer-rating {
  font-size: 14px;
  color: #d69e2e;
}

.pricing-analysis {
  margin-bottom: 40px;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

.pricing-item {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pricing-item h4 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.elasticity-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.elasticity-point {
  display: grid;
  grid-template-columns: 80px 100px 1fr;
  gap: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  align-items: center;
}

.price {
  font-weight: 600;
  color: #1a202c;
}

.demand {
  color: #4a5568;
}

.elasticity {
  text-align: right;
  color: #2d3748;
  font-weight: 500;
}

.conversion-funnel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.funnel-step {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.step-name {
  font-weight: 500;
  color: #2d3748;
}

.step-value {
  font-weight: 600;
  color: #1a202c;
}

.step-percentage {
  color: #48bb78;
  font-weight: 500;
}

.ab-test-results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.test-variant {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px solid transparent;
}

.test-variant .variant-metrics .metric:has(.winner-badge) {
  border-color: #48bb78;
  background: #f0fff4;
}

.variant-name {
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 12px;
}

.variant-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: #718096;
}

.value {
  font-weight: 500;
  color: #1a202c;
}

.winner-badge {
  background: #48bb78;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.competition-analysis {
  margin-bottom: 40px;
}

.competition-matrix {
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.matrix-headers {
  display: grid;
  grid-template-columns: 200px repeat(4, 1fr);
  gap: 1px;
  background: #f8fafc;
}

.header-cell {
  padding: 16px;
  font-weight: 600;
  color: #2d3748;
  background: white;
  text-align: center;
}

.matrix-row {
  display: grid;
  grid-template-columns: 200px repeat(4, 1fr);
  gap: 1px;
  background: #f8fafc;
}

.feature-name {
  padding: 16px;
  font-weight: 500;
  color: #2d3748;
  background: white;
}

.feature-value {
  padding: 16px;
  text-align: center;
  background: white;
  font-weight: 500;
}

.feature-value.ours.advantage {
  background: #f0fff4;
  color: #38a169;
  font-weight: 600;
}

.business-insights {
  margin-bottom: 40px;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

/* Responsive design */
@media (max-width: 1024px) {
  .metric-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .analysis-grid {
    grid-template-columns: 1fr;
  }

  .matrix-headers,
  .matrix-row {
    grid-template-columns: 150px repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .analytics-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .analytics-controls {
    width: 100%;
    justify-content: space-between;
  }

  .metric-cards {
    grid-template-columns: 1fr;
  }

  .pricing-grid {
    grid-template-columns: 1fr;
  }

  .matrix-headers,
  .matrix-row {
    grid-template-columns: 120px repeat(4, 1fr);
  }

  .header-cell,
  .feature-name,
  .feature-value {
    padding: 8px 4px;
    font-size: 12px;
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }
}
</style>
