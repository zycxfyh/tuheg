<template>
  <div class="segment-editor">
    <div class="editor-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="editor-content">
      <!-- 内容编辑 -->
      <div v-if="activeTab === 'content'" class="content-editor">
        <div class="form-group">
          <label>片段类型</label>
          <select v-model="segment.type">
            <option value="text">文本</option>
            <option value="image">图像</option>
            <option value="audio">音频</option>
            <option value="video">视频</option>
            <option value="interactive">互动</option>
          </select>
        </div>

        <!-- 文本内容 -->
        <div v-if="segment.type === 'text'" class="text-content">
          <textarea
            v-model="textContent"
            placeholder="输入文本内容..."
            rows="8"
          ></textarea>
          <div class="content-actions">
            <button @click="generateText" class="btn-generate">
              🤖 生成文本
            </button>
          </div>
        </div>

        <!-- 图像内容 -->
        <div v-else-if="segment.type === 'image'" class="image-content">
          <div class="image-preview" v-if="imageContent">
            <img :src="imageContent.url" :alt="imageContent.alt">
            <div class="image-info">
              <p>{{ imageContent.caption }}</p>
              <small>{{ imageContent.width }}×{{ imageContent.height }}</small>
            </div>
          </div>
          <div class="content-actions">
            <input
              v-model="generationPrompt"
              type="text"
              placeholder="描述要生成的图像..."
            >
            <button @click="generateImage" class="btn-generate">
              🎨 生成图像
            </button>
          </div>
        </div>

        <!-- 音频内容 -->
        <div v-else-if="segment.type === 'audio'" class="audio-content">
          <div v-if="audioContent" class="audio-preview">
            <audio :src="audioContent.url" controls></audio>
            <div class="audio-info">
              <p>{{ audioContent.voice }} | {{ Math.round(audioContent.duration) }}秒</p>
            </div>
          </div>
          <div class="content-actions">
            <input
              v-model="generationPrompt"
              type="text"
              placeholder="描述要生成的音频..."
            >
            <button @click="generateAudio" class="btn-generate">
              🎵 生成音频
            </button>
          </div>
        </div>

        <!-- 视频内容 -->
        <div v-else-if="segment.type === 'video'" class="video-content">
          <div v-if="videoContent" class="video-preview">
            <video :src="videoContent.url" controls :poster="videoContent.thumbnail"></video>
            <div class="video-info">
              <p>{{ Math.round(videoContent.duration) }}秒 | {{ videoContent.format }}</p>
            </div>
          </div>
          <div class="content-actions">
            <input
              v-model="generationPrompt"
              type="text"
              placeholder="描述要生成的视频..."
            >
            <button @click="generateVideo" class="btn-generate">
              🎬 生成视频
            </button>
          </div>
        </div>
      </div>

      <!-- 设置编辑 -->
      <div v-if="activeTab === 'settings'" class="settings-editor">
        <div class="form-group">
          <label>时序设置</label>
          <div class="timing-controls">
            <div>
              <label>持续时间 (秒)</label>
              <input
                v-model.number="segment.timing.duration"
                type="number"
                min="1"
                max="300"
              >
            </div>
            <div>
              <label>延迟 (秒)</label>
              <input
                v-model.number="segment.timing.delay"
                type="number"
                min="0"
              >
            </div>
            <div class="checkbox-group">
              <label>
                <input v-model="segment.timing.autoAdvance" type="checkbox">
                自动前进
              </label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>过渡效果</label>
          <select v-model="segment.timing.transition.type">
            <option value="fade">淡入淡出</option>
            <option value="slide">滑动</option>
            <option value="zoom">缩放</option>
            <option value="wipe">擦除</option>
          </select>
        </div>

        <div class="form-group">
          <label>标签</label>
          <input
            v-model="tagsInput"
            type="text"
            placeholder="输入标签，用逗号分隔"
          >
        </div>

        <div class="form-group">
          <label>情绪</label>
          <select v-model="segment.metadata.mood">
            <option value="">无</option>
            <option value="joyful">欢乐</option>
            <option value="mysterious">神秘</option>
            <option value="peaceful">平静</option>
            <option value="dramatic">戏剧性</option>
            <option value="romantic">浪漫</option>
          </select>
        </div>
      </div>

      <!-- 互动编辑 -->
      <div v-if="activeTab === 'interactions'" class="interactions-editor">
        <div class="form-group">
          <label>互动类型</label>
          <select v-model="interactionType">
            <option value="choice">选择</option>
            <option value="input">输入</option>
            <option value="gesture">手势</option>
          </select>
        </div>

        <div v-if="interactionType === 'choice'" class="choices-editor">
          <div class="choices-list">
            <div
              v-for="(choice, index) in choices"
              :key="index"
              class="choice-item"
            >
              <input
                v-model="choice.text"
                placeholder="选择文本"
              >
              <button @click="removeChoice(index)" class="btn-remove">✕</button>
            </div>
          </div>
          <button @click="addChoice" class="btn-add-choice">添加选择</button>
        </div>

        <div v-if="interactionType === 'input'" class="input-editor">
          <div class="form-group">
            <label>输入类型</label>
            <select v-model="inputType">
              <option value="text">文本</option>
              <option value="number">数字</option>
            </select>
          </div>
          <div class="form-group">
            <label>占位符</label>
            <input v-model="inputPlaceholder" type="text">
          </div>
        </div>
      </div>
    </div>

    <div class="editor-actions">
      <button @click="saveSegment" class="btn-save">
        💾 保存片段
      </button>
      <button @click="previewSegment" class="btn-preview">
        👁️ 预览
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NarrativeSegment, MultimodalType } from '../../services/multimodal/types'

interface Props {
  segment: NarrativeSegment
  index: number
}

interface Emits {
  (e: 'update', segment: NarrativeSegment): void
  (e: 'generate', type: MultimodalType, prompt: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeTab = ref('content')
const generationPrompt = ref('')
const interactionType = ref('choice')
const inputType = ref('text')
const inputPlaceholder = ref('')
const tagsInput = ref('')

const tabs = [
  { id: 'content', label: '内容' },
  { id: 'settings', label: '设置' },
  { id: 'interactions', label: '互动' }
]

const textContent = computed({
  get: () => typeof props.segment.content === 'string' ? props.segment.content : '',
  set: (value) => {
    props.segment.content = value
    emit('update', props.segment)
  }
})

const imageContent = computed(() => {
  if (typeof props.segment.content === 'object' && props.segment.content?.image) {
    return props.segment.content.image
  }
  return null
})

const audioContent = computed(() => {
  if (typeof props.segment.content === 'object' && props.segment.content?.audio) {
    return props.segment.content.audio
  }
  return null
})

const videoContent = computed(() => {
  if (typeof props.segment.content === 'object' && props.segment.content?.video) {
    return props.segment.content.video
  }
  return null
})

const choices = ref([{ text: '' }])

// 初始化时序设置
onMounted(() => {
  if (!props.segment.timing) {
    props.segment.timing = {
      duration: 3000,
      autoAdvance: true
    }
  }
  if (!props.segment.timing.transition) {
    props.segment.timing.transition = {
      type: 'fade',
      duration: 500
    }
  }

  // 初始化标签
  tagsInput.value = (props.segment.metadata.tags || []).join(', ')

  // 初始化互动
  if (props.segment.interactions && props.segment.interactions.length > 0) {
    const interaction = props.segment.interactions[0]
    if (interaction.type === 'choice' && interaction.options) {
      choices.value = interaction.options.map(opt => ({ text: opt.text }))
    }
  }
})

watch(() => props.segment.metadata.tags, (newTags) => {
  tagsInput.value = (newTags || []).join(', ')
}, { immediate: true })

const generateText = () => {
  const prompt = generationPrompt.value || '生成一段引人入胜的叙事文本'
  emit('generate', 'text', prompt)
}

const generateImage = () => {
  const prompt = generationPrompt.value || '生成一张美丽的艺术图像'
  emit('generate', 'image', prompt)
}

const generateAudio = () => {
  const prompt = generationPrompt.value || '生成一段舒缓的背景音乐'
  emit('generate', 'audio', prompt)
}

const generateVideo = () => {
  const prompt = generationPrompt.value || '生成一段动态的视频片段'
  emit('generate', 'video', prompt)
}

const addChoice = () => {
  choices.value.push({ text: '' })
}

const removeChoice = (index: number) => {
  choices.value.splice(index, 1)
}

const saveSegment = () => {
  // 更新标签
  props.segment.metadata.tags = tagsInput.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)

  // 更新互动
  if (interactionType.value === 'choice') {
    props.segment.interactions = [{
      id: `interaction-${Date.now()}`,
      type: 'choice',
      target: '#choices',
      action: { type: 'navigate' },
      options: choices.value.map(choice => ({
        id: `choice-${Date.now()}-${Math.random()}`,
        text: choice.text
      }))
    }]
  }

  emit('update', props.segment)
}

const previewSegment = () => {
  // 这里可以实现片段预览功能
  console.log('预览片段:', props.segment)
}
</script>

<style scoped>
.segment-editor {
  background: white;
  border-radius: 8px;
}

.editor-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}

.editor-tabs button {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.editor-tabs button.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.editor-tabs button:hover {
  color: #007bff;
}

.editor-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
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
  min-height: 120px;
  resize: vertical;
}

.timing-controls {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 15px;
  align-items: end;
}

.checkbox-group {
  margin-top: 24px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.image-preview,
.audio-preview,
.video-preview {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f8f9fa;
}

.image-preview img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.image-info,
.audio-info,
.video-info {
  margin-top: 10px;
  text-align: center;
}

.audio-preview audio,
.video-preview video {
  width: 100%;
  border-radius: 4px;
}

.content-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.content-actions input {
  flex: 1;
}

.btn-generate {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-generate:hover {
  background: #218838;
}

.choices-list {
  margin-bottom: 15px;
}

.choice-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.choice-item input {
  flex: 1;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-add-choice {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.editor-actions {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-save {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-preview {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
