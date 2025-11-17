<template>
  <div class="chart-visualizer">
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
    <div class="chart-controls">
      <select v-model="chartType" @change="updateChart">
        <option value="bar">柱状图</option>
        <option value="line">线图</option>
        <option value="pie">饼图</option>
      </select>
      <label>
        <input type="checkbox" v-model="showLegend" @change="updateChart" />
        显示图例
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

interface Props {
  content: string
  statistics?: any
}

interface Emits {
  (e: 'chart-type-change', type: string): void
}

const props = withDefaults(defineProps<Props>(), {
  statistics: () => ({
    wordCount: 1200,
    sentenceCount: 45,
    paragraphCount: 12,
    readabilityScore: 7.2,
  }),
})

const emit = defineEmits<Emits>()

const chartCanvas = ref<HTMLCanvasElement>()
const chartType = ref('bar')
const showLegend = ref(true)

const updateChart = () => {
  emit('chart-type-change', chartType.value)
  // 这里可以实现图表更新逻辑
}

onMounted(() => {
  updateChart()
})

watch(() => props.statistics, () => {
  updateChart()
})
</script>

<style scoped>
.chart-visualizer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.chart-container {
  flex: 1;
  padding: 20px;
}

.chart-controls {
  padding: 12px 20px;
  border-top: 1px solid #e1e5e9;
  display: flex;
  gap: 16px;
  align-items: center;
}

.chart-controls select {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.chart-controls label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}
</style>
