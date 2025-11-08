<template>
  <div class="metric-card" :class="`color-${color}`">
    <div class="metric-icon">
      {{ icon }}
    </div>
    <div class="metric-content">
      <div class="metric-value">{{ value }}</div>
      <div class="metric-title">{{ title }}</div>
      <div class="metric-change" :class="{ positive: change > 0, negative: change < 0 }">
        <span class="change-indicator">
          {{ change > 0 ? '↑' : change < 0 ? '↓' : '→' }}
        </span>
        <span class="change-value">{{ Math.abs(change) }}%</span>
        <span class="change-period">vs 上期</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps<{
  title: string
  value: string | number
  change: number
  icon: string
  color?: 'blue' | 'yellow' | 'green' | 'purple' | 'red'
}>()
</script>

<style scoped>
.metric-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.metric-icon {
  font-size: 32px;
  opacity: 0.8;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 4px;
}

.metric-title {
  font-size: 14px;
  color: #718096;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.metric-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.metric-change.positive {
  color: #38a169;
}

.metric-change.negative {
  color: #e53e3e;
}

.change-indicator {
  font-size: 14px;
}

.change-value {
  margin-right: 4px;
}

.change-period {
  color: #a0aec0;
}

/* Color variations */
.color-blue .metric-icon {
  color: #3182ce;
}

.color-yellow .metric-icon {
  color: #d69e2e;
}

.color-green .metric-icon {
  color: #38a169;
}

.color-purple .metric-icon {
  color: #805ad5;
}

.color-red .metric-icon {
  color: #e53e3e;
}
</style>
