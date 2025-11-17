<template>
  <div class="relationship-visualizer">
    <div class="visualizer-placeholder">
      <div class="placeholder-icon">🔗</div>
      <h3>关系图可视化</h3>
      <p>正在开发中...</p>
      <div class="placeholder-stats">
        <div class="stat">实体数: {{ extractedEntities.length }}</div>
        <div class="stat">关系数: {{ extractedRelationships.length }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  content: string
  entities?: any[]
  relationships?: any[]
}

defineProps<Props>()
</script>

<style scoped>
.relationship-visualizer {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.visualizer-placeholder {
  text-align: center;
  color: #666;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.placeholder-stats {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 20px;
}

.stat {
  font-size: 14px;
  color: #333;
}
</style>
