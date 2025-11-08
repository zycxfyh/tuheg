<template>
  <div class="satisfaction-chart">
    <div class="chart-placeholder">
      <div class="chart-icon">⭐</div>
      <div class="chart-text">满意度趋势</div>
    </div>

    <!-- 简易趋势线显示 -->
    <div class="simple-line">
      <div class="line-container">
        <svg class="trend-line" viewBox="0 0 300 100" preserveAspectRatio="none">
          <polyline
            :points="getLinePoints()"
            fill="none"
            stroke="#667eea"
            stroke-width="2"
          />
        </svg>
      </div>
      <div class="line-labels">
        <div class="rating-info">
          <div class="current-rating">
            当前评分: <strong>{{ currentRating.toFixed(1) }}/5.0</strong>
          </div>
          <div class="trend-indicator" :class="{ positive: trend > 0, negative: trend < 0 }">
            {{ trend > 0 ? '↗️ 上升' : trend < 0 ? '↘️ 下降' : '→ 稳定' }}
            {{ Math.abs(trend).toFixed(1) }} 点
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps<{
  data: Array<{ date: string; rating: number }>
}>()

const currentRating = computed(() => {
  if (!props.data.length) return 0
  return props.data[props.data.length - 1].rating
})

const trend = computed(() => {
  if (props.data.length < 2) return 0
  const recent = props.data.slice(-7) // 最近7天
  if (recent.length < 2) return 0

  const first = recent[0].rating
  const last = recent[recent.length - 1].rating
  return last - first
})

const getLinePoints = () => {
  if (!props.data.length) return ''

  const points = props.data.map((item, index) => {
    const x = (index / (props.data.length - 1)) * 280 + 10 // 10px margin
    const y = 90 - ((item.rating - 1) / 4) * 80 // Scale to 1-5 range
    return `${x},${y}`
  })

  return points.join(' ')
}
</script>

<style scoped>
.satisfaction-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  text-align: center;
}

.chart-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.chart-text {
  font-size: 18px;
  font-weight: 500;
}

.simple-line {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.line-container {
  height: 120px;
  margin-bottom: 16px;
}

.trend-line {
  width: 100%;
  height: 100%;
}

.line-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rating-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.current-rating {
  font-size: 16px;
  color: #2d3748;
}

.trend-indicator {
  font-size: 14px;
  font-weight: 500;
}

.trend-indicator.positive {
  color: #38a169;
}

.trend-indicator.negative {
  color: #e53e3e;
}
</style>
