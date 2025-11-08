<template>
  <div class="insight-card" :class="`impact-${insight.impact}`">
    <div class="insight-header">
      <div class="insight-icon">
        💡
      </div>
      <div class="insight-status" :class="insight.status">
        {{ getStatusLabel(insight.status) }}
      </div>
    </div>

    <div class="insight-content">
      <h4 class="insight-title">{{ insight.title }}</h4>
      <p class="insight-description">{{ insight.description }}</p>

      <div class="insight-metrics">
        <div class="metric-item">
          <span class="metric-label">影响程度:</span>
          <span class="metric-value" :class="`impact-${insight.impact}`">
            {{ getImpactLabel(insight.impact) }}
          </span>
        </div>
        <div class="metric-item">
          <span class="metric-label">置信度:</span>
          <span class="metric-value">
            {{ Math.round(insight.confidence * 100) }}%
          </span>
        </div>
      </div>

      <div class="insight-recommendation">
        <strong>建议:</strong> {{ insight.recommendation }}
      </div>
    </div>

    <div class="insight-actions">
      <button
        @click="$emit('implement')"
        :disabled="insight.status === 'implemented'"
        class="implement-button"
      >
        {{ insight.status === 'implemented' ? '已实施' : '开始实施' }}
      </button>
      <button @click="$emit('dismiss')" class="dismiss-button">
        忽略
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps<{
  insight: {
    id: string
    title: string
    description: string
    impact: 'low' | 'medium' | 'high'
    confidence: number
    recommendation: string
    status: 'pending' | 'in-progress' | 'implemented' | 'dismissed'
  }
}>()

defineEmits<{
  implement: []
  dismiss: []
}>()

const getStatusLabel = (status: string) => {
  const labels = {
    pending: '待处理',
    'in-progress': '进行中',
    implemented: '已实施',
    dismissed: '已忽略'
  }
  return labels[status] || status
}

const getImpactLabel = (impact: string) => {
  const labels = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return labels[impact] || impact
}
</script>

<style scoped>
.insight-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #667eea;
  transition: transform 0.2s, box-shadow 0.2s;
}

.insight-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.insight-card.impact-high {
  border-left-color: #e53e3e;
}

.insight-card.impact-medium {
  border-left-color: #d69e2e;
}

.insight-card.impact-low {
  border-left-color: #38a169;
}

.insight-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.insight-icon {
  font-size: 20px;
}

.insight-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.insight-status.pending {
  background: #fef5e7;
  color: #d69e2e;
}

.insight-status.in-progress {
  background: #ebf8ff;
  color: #3182ce;
}

.insight-status.implemented {
  background: #f0fff4;
  color: #38a169;
}

.insight-status.dismissed {
  background: #fed7d7;
  color: #e53e3e;
}

.insight-content {
  margin-bottom: 20px;
}

.insight-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.insight-description {
  margin: 0 0 16px 0;
  color: #4a5568;
  line-height: 1.5;
  font-size: 14px;
}

.insight-metrics {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
}

.metric-value.impact-high {
  color: #e53e3e;
}

.metric-value.impact-medium {
  color: #d69e2e;
}

.metric-value.impact-low {
  color: #38a169;
}

.insight-recommendation {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  color: #2d3748;
  line-height: 1.4;
}

.insight-actions {
  display: flex;
  gap: 8px;
}

.implement-button,
.dismiss-button {
  flex: 1;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.implement-button {
  background: #667eea;
  color: white;
}

.implement-button:hover:not(:disabled) {
  background: #5a67d8;
}

.implement-button:disabled {
  background: #cbd5e0;
  color: #a0aec0;
  cursor: not-allowed;
}

.dismiss-button {
  background: #f7fafc;
  color: #4a5568;
  border: 1px solid #e1e5e9;
}

.dismiss-button:hover {
  background: #edf2f7;
}

/* Responsive design */
@media (max-width: 640px) {
  .insight-metrics {
    flex-direction: column;
    gap: 8px;
  }

  .insight-actions {
    flex-direction: column;
  }
}
</style>
