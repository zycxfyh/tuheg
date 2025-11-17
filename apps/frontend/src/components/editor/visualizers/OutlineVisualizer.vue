<template>
  <div class="outline-visualizer">
    <div class="outline-tree">
      <div
        v-for="section in visibleSections"
        :key="section.id"
        :class="['outline-item', `level-${section.level}`, { selected: section.selected }]"
        :style="{ paddingLeft: `${section.level * 20}px` }"
        @click="selectSection(section)"
      >
        <div class="item-header">
          <div class="item-icon">
            {{ getLevelIcon(section.level) }}
          </div>
          <div class="item-content">
            <h5 class="item-title">{{ section.title }}</h5>
            <div class="item-meta">
              <span class="word-count">{{ section.wordCount }}字</span>
              <span class="char-count">{{ section.charCount }}字符</span>
              <span v-if="showWordCount" class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${Math.min(100, (section.wordCount / maxWords) * 100)}%` }"
                ></div>
              </span>
            </div>
          </div>
          <div class="item-actions">
            <button @click.stop="expandSection(section)" class="action-btn">
              {{ section.expanded ? '−' : '+' }}
            </button>
          </div>
        </div>

        <div v-if="section.description" class="item-description">
          {{ section.description }}
        </div>

        <div v-if="section.children && section.children.length > 0 && section.expanded" class="item-children">
          <!-- 子项递归渲染 -->
        </div>
      </div>
    </div>

    <div class="outline-stats" v-if="showStats">
      <div class="stat-item">
        <span class="stat-label">总字数:</span>
        <span class="stat-value">{{ totalWordCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">段落数:</span>
        <span class="stat-value">{{ totalSections }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">平均段落长度:</span>
        <span class="stat-value">{{ averageSectionLength }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">复杂度:</span>
        <span class="stat-value">{{ outlineComplexity }}/10</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  content: string
  structure?: any
  maxDepth?: number
  showWordCount?: boolean
  showStats?: boolean
}

interface Emits {
  (e: 'section-select', section: any): void
  (e: 'structure-update', structure: any): void
}

const props = withDefaults(defineProps<Props>(), {
  maxDepth: 3,
  showWordCount: true,
  showStats: true,
})

const emit = defineEmits<Emits>()

const sections = ref<any[]>([])
const selectedSection = ref<any>(null)

// 计算属性
const visibleSections = computed(() => {
  return sections.value.filter(section => section.level <= props.maxDepth)
})

const totalWordCount = computed(() => {
  return sections.value.reduce((sum, section) => sum + section.wordCount, 0)
})

const totalSections = computed(() => sections.value.length)

const averageSectionLength = computed(() => {
  return totalSections.value > 0 ? Math.round(totalWordCount.value / totalSections.value) : 0
})

const outlineComplexity = computed(() => {
  const depthScore = Math.min(10, sections.value.reduce((max, s) => Math.max(max, s.level), 0) * 2)
  const branchingScore = Math.min(10, sections.value.filter(s => s.children?.length > 3).length)
  return Math.round((depthScore + branchingScore) / 2)
})

const maxWords = computed(() => {
  return Math.max(...sections.value.map(s => s.wordCount), 100)
})

// 方法
const getLevelIcon = (level: number) => {
  const icons = ['📄', '📑', '📋', '📝', '📓', '📒']
  return icons[level] || '📄'
}

const selectSection = (section: any) => {
  sections.value.forEach(s => s.selected = false)
  section.selected = true
  selectedSection.value = section

  emit('section-select', section)
}

const expandSection = (section: any) => {
  section.expanded = !section.expanded
}

const parseContent = (content: string) => {
  const lines = content.split('\n').filter(line => line.trim())
  const parsedSections: any[] = []
  let currentSection: any = null

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // 检测标题（以#开头或大写字母开头）
    if (trimmed.startsWith('#') || /^[A-Z]/.test(trimmed)) {
      if (currentSection) {
        parsedSections.push(currentSection)
      }

      const level = trimmed.startsWith('#')
        ? trimmed.split('#').length - 1
        : 1

      currentSection = {
        id: `section_${index}`,
        title: trimmed.replace(/^#+\s*/, ''),
        level: Math.min(level, 6),
        content: [],
        wordCount: 0,
        charCount: 0,
        expanded: level <= 2,
        selected: false,
        children: [],
      }
    } else if (currentSection && trimmed) {
      currentSection.content.push(trimmed)
      currentSection.wordCount += trimmed.split(/\s+/).length
      currentSection.charCount += trimmed.length
    }
  })

  if (currentSection) {
    parsedSections.push(currentSection)
  }

  // 构建层次结构
  buildHierarchy(parsedSections)

  sections.value = parsedSections
}

const buildHierarchy = (flatSections: any[]) => {
  const rootSections = flatSections.filter(s => s.level === 1)

  flatSections.forEach(section => {
    if (section.level < 6) {
      const nextLevel = section.level + 1
      section.children = flatSections.filter(s =>
        s.level === nextLevel &&
        flatSections.indexOf(s) > flatSections.indexOf(section) &&
        (!flatSections[flatSections.indexOf(s) - 1] ||
         flatSections[flatSections.indexOf(s) - 1].level <= section.level)
      )
    }
  })
}

// 监听内容变化
watch(() => props.content, (newContent) => {
  if (newContent) {
    parseContent(newContent)
  }
}, { immediate: true })

watch(() => props.structure, (newStructure) => {
  if (newStructure) {
    sections.value = newStructure
  }
})
</script>

<style scoped>
.outline-visualizer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.outline-tree {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.outline-item {
  margin-bottom: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.outline-item:hover {
  background: #f8f9fa;
}

.outline-item.selected {
  background: #e3f2fd;
  border: 1px solid #2196f3;
}

.outline-item.level-1 {
  border-left: 4px solid #1976d2;
}

.outline-item.level-2 {
  border-left: 4px solid #42a5f5;
}

.outline-item.level-3 {
  border-left: 4px solid #90caf9;
}

.outline-item.level-4 {
  border-left: 4px solid #bbdefb;
}

.outline-item.level-5 {
  border-left: 4px solid #e3f2fd;
}

.outline-item.level-6 {
  border-left: 4px solid #f3e5f5;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.item-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.word-count,
.char-count {
  font-weight: 500;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  max-width: 60px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50 0%, #ff9800 70%, #f44336 100%);
  transition: width 0.3s ease;
}

.item-actions {
  flex-shrink: 0;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.item-description {
  padding: 0 12px 8px 44px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.outline-stats {
  border-top: 1px solid #e1e5e9;
  padding: 12px 16px;
  background: #f8f9fa;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .outline-tree {
    padding: 12px;
  }

  .item-header {
    padding: 6px 8px;
  }

  .item-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .outline-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}
</style>
