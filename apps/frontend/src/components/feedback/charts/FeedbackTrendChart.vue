<template>
  <div class="trend-chart">
    <div class="chart-placeholder">
      <div class="chart-icon">📈</div>
      <div class="chart-text">反馈趋势图表</div>
      <div class="chart-note">（实际部署时可集成 Chart.js 或 D3.js）</div>
    </div>

    <!-- 简易趋势显示 -->
    <div class="simple-trend">
      <div class="trend-bars">
        <div
          v-for="(item, index) in data.slice(-7)"
          :key="index"
          class="trend-bar"
          :style="{ height: `${(item.count / maxCount) * 100}%` }"
        >
          <div class="bar-value">{{ item.count }}</div>
        </div>
      </div>
      <div class="trend-labels">
        <div
          v-for="(item, index) in data.slice(-7)"
          :key="index"
          class="trend-label"
        >
          {{ new Date(item.date).getDate() }}日
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps<{
  data: Array<{ date: string; count: number }>
}>()

const maxCount = Math.max(...(data?.map(d => d.count) || [0]))
</script>

<style scoped>
.trend-chart {
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
  margin-bottom: 8px;
}

.chart-note {
  font-size: 14px;
  font-style: italic;
}

.simple-trend {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.trend-bars {
  display: flex;
  align-items: end;
  justify-content: space-between;
  height: 120px;
  margin-bottom: 12px;
  gap: 8px;
}

.trend-bar {
  flex: 1;
  background: linear-gradient(to top, #667eea, #764ba2);
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 20px;
  transition: all 0.3s;
}

.trend-bar:hover {
  opacity: 0.8;
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 500;
  color: #2d3748;
  white-space: nowrap;
}

.trend-labels {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.trend-label {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: #718096;
}
</style>
