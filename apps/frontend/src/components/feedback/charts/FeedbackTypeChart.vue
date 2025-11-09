<template>
  <div class="type-chart">
    <div class="chart-placeholder">
      <div class="chart-icon">🥧</div>
      <div class="chart-text">反馈类型分布</div>
    </div>

    <!-- 简易饼图显示 -->
    <div class="simple-pie">
      <div class="pie-legend">
        <div
          v-for="item in data"
          :key="item.type"
          class="legend-item"
        >
          <div class="legend-color" :style="{ backgroundColor: getTypeColor(item.type) }"></div>
          <div class="legend-info">
            <div class="legend-name">{{ getTypeName(item.type) }}</div>
            <div class="legend-value">{{ item.count }} ({{ item.percentage.toFixed(1) }}%)</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps<{
  data: Array<{ type: string; count: number; percentage: number }>
}>()

const _getTypeColor = (type: string) => {
  const colors = {
    experience: '#3182ce',
    bug: '#e53e3e',
    feature: '#38a169'
  }
  return colors[type] || '#718096'
}

const _getTypeName = (type: string) => {
  const names = {
    experience: '体验反馈',
    bug: '问题报告',
    feature: '功能建议'
  }
  return names[type] || type
}
</script>

<style scoped>
.type-chart {
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

.simple-pie {
  margin-top: 20px;
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-info {
  flex: 1;
}

.legend-name {
  font-weight: 500;
  color: #2d3748;
  margin-bottom: 4px;
}

.legend-value {
  font-size: 14px;
  color: #718096;
}
</style>
