<template>
  <div class="multimodal-narrative-editor">
    <div class="editor-header">
      <h2>{{ isEditing ? '编辑叙事' : '创建新叙事' }}</h2>
      <div class="header-actions">
        <button @click="saveNarrative" class="btn-primary">
          💾 保存
        </button>
        <button @click="previewNarrative" class="btn-secondary">
          👁️ 预览
        </button>
        <button @click="exportNarrative" class="btn-secondary">
          📤 导出
        </button>
      </div>
    </div>

    <div class="editor-content">
      <!-- 基本信息 -->
      <div class="basic-info-section">
        <div class="form-group">
          <label>标题</label>
          <input v-model="narrative.title" type="text" placeholder="输入叙事标题">
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea v-model="narrative.description" placeholder="输入叙事描述"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>作者</label>
            <input v-model="narrative.author" type="text">
          </div>
          <div class="form-group">
            <label>语言</label>
            <select v-model="narrative.metadata.language">
              <option value="zh-CN">中文</option>
              <option value="en-US">英文</option>
              <option value="ja-JP">日文</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 片段列表 -->
      <div class="segments-section">
        <div class="section-header">
          <h3>叙事片段</h3>
          <button @click="addSegment" class="btn-add">
            ➕ 添加片段
          </button>
        </div>

        <div class="segments-list">
          <div
            v-for="(segment, index) in narrative.segments"
            :key="segment.id"
            class="segment-item"
            :class="{ active: activeSegmentIndex === index }"
            @click="setActiveSegment(index)"
          >
            <div class="segment-header">
              <span class="segment-type">{{ getSegmentTypeIcon(segment.type) }}</span>
              <span class="segment-title">{{ getSegmentTitle(segment, index) }}</span>
              <div class="segment-actions">
                <button @click.stop="moveSegmentUp(index)" :disabled="index === 0">⬆️</button>
                <button @click.stop="moveSegmentDown(index)" :disabled="index === narrative.segments.length - 1">⬇️</button>
                <button @click.stop="duplicateSegment(index)">📋</button>
                <button @click.stop="deleteSegment(index)" class="btn-delete">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 片段编辑器 -->
      <div v-if="activeSegmentIndex !== null" class="segment-editor">
        <SegmentEditor
          :segment="activeSegment"
          :index="activeSegmentIndex"
          @update="updateSegment"
          @generate="generateContent"
        />
      </div>
    </div>

    <!-- 预览模态框 -->
    <div v-if="showPreview" class="preview-modal" @click="closePreview">
      <div class="preview-content" @click.stop>
        <div class="preview-header">
          <h3>叙事预览</h3>
          <button @click="closePreview">✕</button>
        </div>
        <div class="preview-body" ref="previewContainer"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { MultimodalNarrativeService } from '../../services/multimodal/MultimodalNarrativeService'
import { MultimodalNarrative, NarrativeSegment, MultimodalType } from '../../services/multimodal/types'
import SegmentEditor from './SegmentEditor.vue'

interface Props {
  narrativeId?: string
}

const props = defineProps<Props>()

const service = new MultimodalNarrativeService()
const narrative = ref<MultimodalNarrative>({
  id: '',
  title: '',
  description: '',
  author: '当前用户',
  version: '1.0.0',
  segments: [],
  metadata: {
    genre: [],
    themes: [],
    targetAudience: 'general',
    language: 'zh-CN',
    estimatedDuration: 0,
    difficulty: 'medium',
    interactiveElements: false,
    aiGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  settings: {
    autoplay: false,
    showCaptions: true,
    enableVoice: false,
    visualStyle: 'realistic',
    colorScheme: 'auto',
    fontSize: 'medium',
    accessibility: {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      captions: true
    }
  },
  variables: {},
  assets: []
})

const isEditing = computed(() => !!props.narrativeId)
const activeSegmentIndex = ref<number | null>(null)
const showPreview = ref(false)
const previewContainer = ref<HTMLElement>()

onMounted(async () => {
  if (props.narrativeId) {
    const loaded = await service.loadNarrative(props.narrativeId)
    if (loaded) {
      narrative.value = loaded
    }
  } else {
    // 创建新叙事
    const newNarrative = await service.createNarrative('', '')
    narrative.value = newNarrative
  }
})

const activeSegment = computed(() => {
  return activeSegmentIndex.value !== null
    ? narrative.value.segments[activeSegmentIndex.value]
    : null
})

const addSegment = () => {
  const newSegment: NarrativeSegment = {
    id: `segment-${Date.now()}`,
    type: 'text',
    content: '新的叙事片段内容...',
    metadata: {
      author: narrative.value.author,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      aiGenerated: false
    }
  }

  narrative.value.segments.push(newSegment)
  activeSegmentIndex.value = narrative.value.segments.length - 1
}

const setActiveSegment = (index: number) => {
  activeSegmentIndex.value = index
}

const updateSegment = (segment: NarrativeSegment) => {
  if (activeSegmentIndex.value !== null) {
    narrative.value.segments[activeSegmentIndex.value] = segment
  }
}

const deleteSegment = (index: number) => {
  if (confirm('确定要删除这个片段吗？')) {
    narrative.value.segments.splice(index, 1)
    if (activeSegmentIndex.value === index) {
      activeSegmentIndex.value = null
    } else if (activeSegmentIndex.value !== null && activeSegmentIndex.value > index) {
      activeSegmentIndex.value--
    }
  }
}

const duplicateSegment = (index: number) => {
  const segment = narrative.value.segments[index]
  const duplicated: NarrativeSegment = {
    ...segment,
    id: `segment-${Date.now()}`,
    metadata: {
      ...segment.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  narrative.value.segments.splice(index + 1, 0, duplicated)
}

const moveSegmentUp = (index: number) => {
  if (index > 0) {
    const segment = narrative.value.segments.splice(index, 1)[0]
    narrative.value.segments.splice(index - 1, 0, segment)
    if (activeSegmentIndex.value === index) {
      activeSegmentIndex.value = index - 1
    }
  }
}

const moveSegmentDown = (index: number) => {
  if (index < narrative.value.segments.length - 1) {
    const segment = narrative.value.segments.splice(index, 1)[0]
    narrative.value.segments.splice(index + 1, 0, segment)
    if (activeSegmentIndex.value === index) {
      activeSegmentIndex.value = index + 1
    }
  }
}

const generateContent = async (type: MultimodalType, prompt: string) => {
  if (activeSegmentIndex.value === null) return

  try {
    const generated = await service.generateContent(type, prompt)
    const segment = narrative.value.segments[activeSegmentIndex.value]

    if (generated.text) {
      segment.content = generated.text
    } else if (generated.image) {
      segment.type = 'image'
      segment.content = generated
    } else if (generated.audio) {
      segment.type = 'audio'
      segment.content = generated
    } else if (generated.video) {
      segment.type = 'video'
      segment.content = generated
    }

    segment.metadata.aiGenerated = true
    segment.metadata.updatedAt = new Date()
  } catch (error) {
    console.error('生成内容失败:', error)
    alert('生成内容失败，请重试')
  }
}

const saveNarrative = async () => {
  try {
    await service.saveNarrative(narrative.value)
    alert('叙事已保存')
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败，请重试')
  }
}

const previewNarrative = async () => {
  if (!previewContainer.value) return

  showPreview.value = true

  try {
    await service.playNarrative(narrative.value.id, previewContainer.value)
  } catch (error) {
    console.error('预览失败:', error)
  }
}

const closePreview = () => {
  showPreview.value = false
  if (previewContainer.value) {
    service.getPlaybackState(narrative.value.id)?.isPlaying && service.pauseNarrative(narrative.value.id)
  }
}

const exportNarrative = async () => {
  try {
    const exported = await service.exportNarrative(narrative.value.id, 'html')
    const blob = new Blob([exported], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${narrative.value.title}.html`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败，请重试')
  }
}

const getSegmentTypeIcon = (type: MultimodalType): string => {
  const icons = {
    text: '📝',
    image: '🖼️',
    audio: '🎵',
    video: '🎬',
    interactive: '🎮'
  }
  return icons[type] || '📄'
}

const getSegmentTitle = (segment: NarrativeSegment, index: number): string => {
  if (segment.type === 'text' && typeof segment.content === 'string') {
    return segment.content.substring(0, 50) + (segment.content.length > 50 ? '...' : '')
  }
  return `片段 ${index + 1} (${segment.type})`
}
</script>

<style scoped>
.multimodal-narrative-editor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.editor-header h2 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-add {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-delete {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.basic-info-section {
  margin-bottom: 40px;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.segments-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: #333;
}

.segments-list {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.segment-item {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.segment-item:hover {
  background-color: #f8f9fa;
}

.segment-item.active {
  background-color: #e3f2fd;
  border-left: 4px solid #007bff;
}

.segment-item:last-child {
  border-bottom: none;
}

.segment-header {
  display: flex;
  align-items: center;
  gap: 15px;
}

.segment-type {
  font-size: 18px;
}

.segment-title {
  flex: 1;
  font-weight: 500;
}

.segment-actions {
  display: flex;
  gap: 5px;
}

.segment-actions button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.segment-actions button:hover {
  background-color: #f0f0f0;
}

.segment-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.segment-editor {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background-color: #fafafa;
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.preview-header h3 {
  margin: 0;
}

.preview-header button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.preview-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}
</style>
