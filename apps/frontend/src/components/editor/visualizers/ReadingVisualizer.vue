<template>
  <div class="reading-visualizer">
    <div class="reading-layout">
      <!-- 阅读进度条 -->
      <div class="reading-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${readingProgress.percentage}%` }"
          ></div>
        </div>
        <div class="progress-text">
          {{ Math.round(readingProgress.percentage) }}% •
          {{ readingProgress.currentWord }} / {{ readingProgress.totalWords }} 字
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="reading-content" ref="contentArea">
        <div class="content-wrapper" v-html="formattedContent"></div>
      </div>

      <!-- 阅读控制 -->
      <div class="reading-controls">
        <button @click="previousSection" :disabled="!hasPrevious" class="nav-btn">
          ⬅ 上一节
        </button>

        <div class="reading-settings">
          <select v-model="fontSize" @change="updateReadingSettings">
            <option value="14">小</option>
            <option value="16">中</option>
            <option value="18">大</option>
            <option value="20">特大</option>
          </select>

          <select v-model="lineHeight" @change="updateReadingSettings">
            <option value="1.4">紧凑</option>
            <option value="1.6">标准</option>
            <option value="1.8">宽松</option>
            <option value="2.0">超宽</option>
          </select>

          <button @click="toggleNightMode" class="mode-btn">
            {{ isNightMode ? '☀️' : '🌙' }}
          </button>
        </div>

        <button @click="nextSection" :disabled="!hasNext" class="nav-btn">
          下一节 ➡
        </button>
      </div>

      <!-- 注解面板 -->
      <div v-if="showAnnotations" class="annotations-panel">
        <div class="annotations-header">
          <h4>📝 笔记与注解</h4>
          <button @click="addAnnotation" class="add-btn">+ 添加</button>
        </div>
        <div class="annotations-list">
          <div
            v-for="annotation in readingAnnotations"
            :key="annotation.id"
            class="annotation-item"
          >
            <div class="annotation-content">
              <p>{{ annotation.text }}</p>
              <div class="annotation-meta">
                <span class="timestamp">{{ formatTimestamp(annotation.timestamp) }}</span>
                <span class="position">第{{ annotation.position }}段</span>
              </div>
            </div>
            <div class="annotation-actions">
              <button @click="editAnnotation(annotation)" class="edit-btn">✏</button>
              <button @click="deleteAnnotation(annotation)" class="delete-btn">🗑</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface Props {
  content: string
  readingProgress?: any
  annotations?: any[]
}

interface Emits {
  (e: 'progress-update', progress: any): void
  (e: 'annotation-add', annotation: any): void
}

const props = withDefaults(defineProps<Props>(), {
  readingProgress: () => ({
    currentWord: 0,
    totalWords: 1000,
    percentage: 0,
    currentSection: 1,
    totalSections: 5,
  }),
  annotations: () => [],
})

const emit = defineEmits<Emits>()

const contentArea = ref<HTMLElement>()
const fontSize = ref(16)
const lineHeight = ref(1.6)
const isNightMode = ref(false)
const showAnnotations = ref(true)
const currentSection = ref(1)

// 计算属性
const formattedContent = computed(() => {
  // 格式化内容为阅读模式
  return props.content
    .split('\n\n')
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('')
})

const hasPrevious = computed(() => currentSection.value > 1)
const hasNext = computed(() => currentSection.value < props.readingProgress.totalSections)

const readingAnnotations = computed(() => props.annotations)

// 方法
const previousSection = () => {
  if (hasPrevious.value) {
    currentSection.value--
    updateProgress()
  }
}

const nextSection = () => {
  if (hasNext.value) {
    currentSection.value++
    updateProgress()
  }
}

const updateProgress = () => {
  const progress = {
    ...props.readingProgress,
    currentSection: currentSection.value,
    percentage: (currentSection.value / props.readingProgress.totalSections) * 100,
  }
  emit('progress-update', progress)
}

const updateReadingSettings = () => {
  if (contentArea.value) {
    contentArea.value.style.fontSize = `${fontSize.value}px`
    contentArea.value.style.lineHeight = lineHeight.value.toString()
  }
}

const toggleNightMode = () => {
  isNightMode.value = !isNightMode.value
  document.body.classList.toggle('night-mode', isNightMode.value)
}

const addAnnotation = () => {
  const annotation = {
    id: Date.now().toString(),
    text: '新的笔记...',
    position: currentSection.value,
    timestamp: new Date(),
  }
  emit('annotation-add', annotation)
}

const editAnnotation = (annotation: any) => {
  // 编辑注解逻辑
}

const deleteAnnotation = (annotation: any) => {
  // 删除注解逻辑
}

const formatTimestamp = (timestamp: Date) => {
  return timestamp.toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  updateReadingSettings()
})

watch([fontSize, lineHeight], () => {
  updateReadingSettings()
})
</script>

<style scoped>
.reading-visualizer {
  height: 100%;
  display: flex;
  background: #f8f9fa;
}

.reading-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
  background: white;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

.reading-progress {
  padding: 16px 24px;
  border-bottom: 1px solid #e1e5e9;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e1e5e9;
  border-radius: 2px;
  margin-bottom: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.reading-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  line-height: 1.6;
}

.content-wrapper {
  max-width: 100%;
  font-size: 16px;
}

.content-wrapper p {
  margin-bottom: 1.5em;
  text-align: justify;
}

.reading-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #e1e5e9;
  background: #f8f9fa;
}

.nav-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reading-settings {
  display: flex;
  gap: 8px;
  align-items: center;
}

.reading-settings select {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
}

.mode-btn {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.annotations-panel {
  width: 300px;
  border-left: 1px solid #e1e5e9;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.annotations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e1e5e9;
}

.annotations-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.add-btn {
  padding: 4px 8px;
  border: 1px solid #667eea;
  border-radius: 4px;
  background: #667eea;
  color: white;
  font-size: 12px;
  cursor: pointer;
}

.annotations-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.annotation-item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.annotation-content p {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.4;
}

.annotation-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #666;
}

.annotation-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.edit-btn,
.delete-btn {
  padding: 4px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  background: #ffc107;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

/* 夜间模式 */
:global(.night-mode) .reading-layout {
  background: #1a202c;
  color: #e2e8f0;
}

:global(.night-mode) .reading-content {
  background: #1a202c;
  color: #e2e8f0;
}

:global(.night-mode) .reading-controls {
  background: #2d3748;
  border-color: #4a5568;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reading-layout {
    max-width: 100%;
  }

  .reading-content {
    padding: 16px;
  }

  .reading-controls {
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
  }

  .reading-settings {
    order: -1;
  }

  .annotations-panel {
    display: none; /* 在移动端隐藏注解面板 */
  }
}
</style>
