<template>
  <div class="feedback-analytics">
    <div class="analytics-header">
      <h2 class="analytics-title">反馈数据分析</h2>
      <div class="analytics-controls">
        <select v-model="timeRange" @change="loadAnalytics" class="time-range-select">
          <option value="7d">最近7天</option>
          <option value="30d">最近30天</option>
          <option value="90d">最近90天</option>
        </select>
        <button @click="refreshData" :disabled="isLoading" class="refresh-button">
          <span v-if="isLoading" class="loading-spinner">⏳</span>
          刷新数据
        </button>
      </div>
    </div>

    <!-- 关键指标卡片 -->
    <div class="metrics-grid">
      <MetricCard
        title="总反馈数"
        :value="analyticsData.totalFeedback"
        :change="analyticsData.feedbackChange"
        icon="💬"
        color="blue"
      />
      <MetricCard
        title="平均满意度"
        :value="`${analyticsData.averageRating}/5.0`"
        :change="analyticsData.ratingChange"
        icon="⭐"
        color="yellow"
      />
      <MetricCard
        title="问题解决率"
        :value="`${analyticsData.resolutionRate}%`"
        :change="analyticsData.resolutionChange"
        icon="✅"
        color="green"
      />
      <MetricCard
        title="响应时间"
        :value="`${analyticsData.averageResponseTime}h`"
        :change="analyticsData.responseTimeChange"
        icon="⏱️"
        color="purple"
      />
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-container">
        <h3 class="chart-title">反馈趋势</h3>
        <div class="chart-placeholder">
          <FeedbackTrendChart :data="analyticsData.feedbackTrend" />
        </div>
      </div>

      <div class="chart-container">
        <h3 class="chart-title">反馈类型分布</h3>
        <div class="chart-placeholder">
          <FeedbackTypeChart :data="analyticsData.feedbackTypes" />
        </div>
      </div>

      <div class="chart-container">
        <h3 class="chart-title">热门话题</h3>
        <div class="topics-list">
          <div
            v-for="(topic, index) in analyticsData.topTopics"
            :key="index"
            class="topic-item"
          >
            <span class="topic-rank">#{{ index + 1 }}</span>
            <span class="topic-name">{{ topic.name }}</span>
            <span class="topic-count">{{ topic.count }} 次</span>
          </div>
        </div>
      </div>

      <div class="chart-container">
        <h3 class="chart-title">用户满意度趋势</h3>
        <div class="chart-placeholder">
          <SatisfactionTrendChart :data="analyticsData.satisfactionTrend" />
        </div>
      </div>
    </div>

    <!-- 最新反馈列表 -->
    <div class="recent-feedback-section">
      <h3 class="section-title">最新反馈</h3>
      <div class="feedback-list">
        <div
          v-for="feedback in analyticsData.recentFeedback"
          :key="feedback.id"
          class="feedback-item"
          :class="`type-${feedback.type}`"
        >
          <div class="feedback-header">
            <div class="feedback-meta">
              <span class="feedback-type">{{ getTypeLabel(feedback.type) }}</span>
              <span class="feedback-time">{{ formatTime(feedback.createdAt) }}</span>
            </div>
            <div class="feedback-rating" v-if="feedback.rating">
              <span v-for="star in 5" :key="star" class="star" :class="{ active: star <= feedback.rating }">
                ⭐
              </span>
            </div>
          </div>
          <h4 class="feedback-title">{{ feedback.title }}</h4>
          <p class="feedback-description">{{ truncateText(feedback.description, 150) }}</p>
          <div class="feedback-actions">
            <button @click="viewFeedback(feedback)" class="action-button">
              查看详情
            </button>
            <span class="feedback-status" :class="feedback.status">
              {{ getStatusLabel(feedback.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- AI洞察建议 -->
    <div class="insights-section">
      <h3 class="section-title">AI 洞察与建议</h3>
      <div class="insights-grid">
        <InsightCard
          v-for="insight in analyticsData.insights"
          :key="insight.id"
          :insight="insight"
          @implement="implementInsight"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

// 状态
const _timeRange = ref('30d')
const isLoading = ref(false)
const analyticsData = ref({
  totalFeedback: 0,
  feedbackChange: 0,
  averageRating: 0,
  ratingChange: 0,
  resolutionRate: 0,
  resolutionChange: 0,
  averageResponseTime: 0,
  responseTimeChange: 0,
  feedbackTrend: [],
  feedbackTypes: [],
  topTopics: [],
  satisfactionTrend: [],
  recentFeedback: [],
  insights: [],
})

// 方法
const loadAnalytics = async () => {
  try {
    isLoading.value = true

    // 模拟加载分析数据
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 模拟数据
    analyticsData.value = {
      totalFeedback: 247,
      feedbackChange: 12.5,
      averageRating: 4.2,
      ratingChange: 0.3,
      resolutionRate: 78,
      resolutionChange: 5.2,
      averageResponseTime: 4.5,
      responseTimeChange: -0.8,
      feedbackTrend: generateTrendData(30),
      feedbackTypes: [
        { type: 'experience', count: 120, percentage: 48.6 },
        { type: 'bug', count: 85, percentage: 34.4 },
        { type: 'feature', count: 42, percentage: 17.0 },
      ],
      topTopics: [
        { name: 'AI响应速度', count: 45 },
        { name: '界面操作', count: 38 },
        { name: '世界构建', count: 32 },
        { name: '角色创建', count: 28 },
        { name: '故事生成', count: 25 },
      ],
      satisfactionTrend: generateSatisfactionData(30),
      recentFeedback: generateRecentFeedback(),
      insights: generateInsights(),
    }
  } catch (error) {
    console.error('Failed to load analytics:', error)
  } finally {
    isLoading.value = false
  }
}

const _refreshData = () => {
  loadAnalytics()
}

const _getTypeLabel = (type) => {
  const labels = {
    experience: '体验反馈',
    bug: '问题报告',
    feature: '功能建议',
  }
  return labels[type] || type
}

const _getStatusLabel = (status) => {
  const labels = {
    open: '待处理',
    in_progress: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  }
  return labels[status] || status
}

const _formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

const _truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return `${text.substr(0, maxLength)}...`
}

const _viewFeedback = (feedback) => {
  // TODO: 打开反馈详情模态框
  console.log('View feedback:', feedback)
}

const _implementInsight = (insight) => {
  // TODO: 标记洞察为已实施
  console.log('Implement insight:', insight)
}

// 数据生成辅助函数
const generateTrendData = (days) => {
  const data = []
  const baseValue = 15

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    data.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(baseValue + Math.random() * 10 + i * 0.5),
    })
  }

  return data
}

const generateSatisfactionData = (days) => {
  const data = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    data.push({
      date: date.toISOString().split('T')[0],
      rating: 3.8 + Math.random() * 1.2,
    })
  }

  return data
}

const generateRecentFeedback = () => {
  return [
    {
      id: '1',
      type: 'experience',
      title: '世界构建功能很棒',
      description: 'AI能够快速理解我的想法并生成丰富多彩的世界设定，非常 impressed！',
      rating: 5,
      status: 'resolved',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'bug',
      title: '角色创建时偶尔卡住',
      description: '在创建复杂角色时，界面会偶尔无响应，需要刷新页面',
      rating: null,
      status: 'in_progress',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'feature',
      title: '希望增加故事分支功能',
      description: '如果能让用户选择不同的故事发展方向会很有趣',
      rating: 4,
      status: 'open',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

const generateInsights = () => {
  return [
    {
      id: '1',
      title: 'AI响应速度优化',
      description: '用户反馈显示响应时间过长是主要痛点',
      impact: 'high',
      confidence: 0.85,
      recommendation: '实施响应时间优化策略',
      status: 'pending',
    },
    {
      id: '2',
      title: '界面操作简化',
      description: '新用户普遍反映学习曲线陡峭',
      impact: 'medium',
      confidence: 0.78,
      recommendation: '添加交互式引导教程',
      status: 'pending',
    },
    {
      id: '3',
      title: '移动端适配改进',
      description: '移动设备用户体验有待提升',
      impact: 'medium',
      confidence: 0.72,
      recommendation: '优化移动端界面和功能',
      status: 'pending',
    },
  ]
}

// 生命周期
onMounted(() => {
  loadAnalytics()
})
</script>

<style scoped>
.feedback-analytics {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.analytics-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.analytics-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
}

.analytics-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.time-range-select {
  padding: 8px 16px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

.refresh-button {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.refresh-button:hover:not(:disabled) {
  background: #5a67d8;
}

.refresh-button:disabled {
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

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.chart-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

.chart-placeholder {
  height: 250px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-style: italic;
}

.recent-feedback-section,
.insights-section {
  margin-bottom: 40px;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feedback-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #667eea;
}

.feedback-item.type-bug {
  border-left-color: #e53e3e;
}

.feedback-item.type-feature {
  border-left-color: #38a169;
}

.feedback-item.type-experience {
  border-left-color: #3182ce;
}

.feedback-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.feedback-meta {
  display: flex;
  gap: 16px;
  align-items: center;
}

.feedback-type {
  background: #edf2f7;
  color: #2d3748;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.feedback-time {
  color: #718096;
  font-size: 14px;
}

.feedback-rating {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 14px;
  opacity: 0.3;
}

.star.active {
  opacity: 1;
}

.feedback-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.feedback-description {
  margin: 0 0 16px 0;
  color: #4a5568;
  line-height: 1.5;
}

.feedback-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.action-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.action-button:hover {
  background: #5a67d8;
}

.feedback-status {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
}

.feedback-status.open {
  background: #fef5e7;
  color: #d69e2e;
}

.feedback-status.in_progress {
  background: #ebf8ff;
  color: #3182ce;
}

.feedback-status.resolved {
  background: #f0fff4;
  color: #38a169;
}

.topics-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.topic-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.topic-rank {
  font-weight: 600;
  color: #667eea;
  min-width: 24px;
}

.topic-name {
  flex: 1;
  font-weight: 500;
}

.topic-count {
  color: #718096;
  font-size: 14px;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

/* Responsive design */
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

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .feedback-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .feedback-actions {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>
