<template>
  <div class="narrative-interface" :class="{ 'immersive-mode': immersiveMode }">
    <!-- 沉浸式叙事容器 -->
    <div class="narrative-container" ref="narrativeContainer">

      <!-- 叙事头部 -->
      <div class="narrative-header" v-if="!immersiveMode">
        <div class="story-info">
          <h2 class="story-title">{{ currentStory.title || '未命名故事' }}</h2>
          <div class="story-meta">
            <span class="chapter-info">第 {{ currentChapter }} 章</span>
            <span class="progress-info">{{ storyProgress }}% 完成</span>
          </div>
        </div>

        <div class="narrative-controls">
          <button
            @click="toggleImmersiveMode"
            class="control-btn immersive-btn"
            :title="immersiveMode ? '退出沉浸模式' : '进入沉浸模式'"
          >
            <span class="btn-icon">{{ immersiveMode ? '📖' : '🎭' }}</span>
          </button>

          <button
            @click="toggleAutoPlay"
            class="control-btn autoplay-btn"
            :class="{ active: autoPlay }"
            :title="autoPlay ? '停止自动播放' : '开始自动播放'"
          >
            <span class="btn-icon">{{ autoPlay ? '⏸️' : '▶️' }}</span>
          </button>

          <button
            @click="showSettings"
            class="control-btn settings-btn"
            title="阅读设置"
          >
            <span class="btn-icon">⚙️</span>
          </button>
        </div>
      </div>

      <!-- 叙事内容区域 -->
      <div class="narrative-content" :class="{ 'fade-in': contentTransition }">
        <!-- AI思考指示器 -->
        <div v-if="isAIThinking" class="ai-thinking-indicator">
          <div class="thinking-animation">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <span class="thinking-text">{{ currentThinkingStep }}</span>
        </div>

        <!-- 叙事文本 -->
        <div
          v-if="currentNarrative"
          class="narrative-text"
          :class="{ 'text-reveal': textRevealEffect }"
        >
          <div
            v-for="(paragraph, index) in currentNarrative.paragraphs"
            :key="index"
            class="narrative-paragraph"
            :style="{ animationDelay: `${index * 0.5}s` }"
          >
            {{ paragraph }}
          </div>
        </div>

        <!-- 角色对话 -->
        <div v-if="currentDialogue" class="dialogue-section">
          <div
            v-for="line in currentDialogue"
            :key="line.id"
            class="dialogue-line"
            :class="{ 'player-line': line.isPlayer, 'narrator-line': line.isNarrator }"
          >
            <div class="character-name" v-if="line.character">
              {{ line.character }}:
            </div>
            <div class="dialogue-text">
              {{ displayedText[line.id] || '' }}
            </div>
          </div>
        </div>

        <!-- 选择分支 -->
        <div v-if="currentChoices && currentChoices.length > 0" class="choices-section">
          <div class="choices-prompt">请选择：</div>
          <div class="choices-list">
            <button
              v-for="choice in currentChoices"
              :key="choice.id"
              @click="makeChoice(choice)"
              class="choice-btn"
              :class="{ 'highlighted': choice.recommended }"
              :disabled="isAIThinking"
            >
              <span class="choice-text">{{ choice.text }}</span>
              <span v-if="choice.consequences" class="choice-consequences">
                {{ choice.consequences }}
              </span>
            </button>
          </div>
        </div>

        <!-- 场景描述 -->
        <div v-if="currentScene" class="scene-description">
          <div class="scene-visual" v-if="currentScene.image">
            <img :src="currentScene.image" :alt="currentScene.alt" class="scene-image" />
          </div>
          <div class="scene-text">
            {{ currentScene.description }}
          </div>
        </div>
      </div>

      <!-- 沉浸式控制面板 -->
      <div v-if="immersiveMode" class="immersive-controls">
        <button @click="previousSection" class="nav-btn prev-btn" :disabled="!hasPrevious">
          ‹ 上一段
        </button>

        <div class="progress-indicator">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${storyProgress}%` }"></div>
          </div>
          <span class="progress-text">{{ storyProgress }}%</span>
        </div>

        <button @click="nextSection" class="nav-btn next-btn" :disabled="!hasNext && !currentChoices">
          下一段 ›
        </button>
      </div>

      <!-- 快速操作面板 -->
      <div v-if="!immersiveMode" class="quick-actions">
        <button @click="saveProgress" class="action-btn save-btn">
          <span class="btn-icon">💾</span>
          保存进度
        </button>

        <button @click="showHistory" class="action-btn history-btn">
          <span class="btn-icon">📜</span>
          历史记录
        </button>

        <button @click="showNotes" class="action-btn notes-btn">
          <span class="btn-icon">📝</span>
          笔记
        </button>

        <button @click="shareStory" class="action-btn share-btn">
          <span class="btn-icon">📤</span>
          分享
        </button>
      </div>
    </div>

    <!-- 阅读设置面板 -->
    <div v-if="showSettingsPanel" class="settings-panel">
      <div class="settings-overlay" @click="hideSettings"></div>
      <div class="settings-content">
        <h3 class="settings-title">阅读设置</h3>

        <div class="settings-section">
          <h4>显示设置</h4>
          <div class="setting-item">
            <label class="setting-label">
              <input v-model="settings.textSize" type="range" min="12" max="24" />
              字体大小: {{ settings.textSize }}px
            </label>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input v-model="settings.lineHeight" type="range" min="1.2" max="2.0" step="0.1" />
              行高: {{ settings.lineHeight }}
            </label>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input v-model="settings.textReveal" type="checkbox" />
              文字渐显效果
            </label>
          </div>
        </div>

        <div class="settings-section">
          <h4>播放设置</h4>
          <div class="setting-item">
            <label class="setting-label">
              <input v-model="settings.autoPlay" type="checkbox" />
              自动播放
            </label>
          </div>

          <div class="setting-item" v-if="settings.autoPlay">
            <label class="setting-label">
              <input v-model="settings.autoPlaySpeed" type="range" min="1" max="10" />
              播放速度: {{ settings.autoPlaySpeed }}x
            </label>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input v-model="settings.soundEnabled" type="checkbox" />
              背景音乐
            </label>
          </div>
        </div>

        <div class="settings-actions">
          <button @click="applySettings" class="btn btn-primary">应用设置</button>
          <button @click="resetSettings" class="btn btn-secondary">重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  story: {
    type: Object,
    default: () => ({
      id: null,
      title: '',
      chapters: [],
      currentChapter: 1,
      currentSection: 0,
    }),
  },
  narrative: {
    type: Object,
    default: () => null,
  },
  dialogue: {
    type: Array,
    default: () => [],
  },
  choices: {
    type: Array,
    default: () => [],
  },
  scene: {
    type: Object,
    default: () => null,
  },
  aiThinking: {
    type: Boolean,
    default: false,
  },
  thinkingStep: {
    type: String,
    default: 'AI正在思考...',
  },
})

// Emits
const emit = defineEmits([
  'choice-made',
  'next-section',
  'previous-section',
  'save-progress',
  'toggle-immersive',
  'settings-changed',
])

// 响应式数据
const immersiveMode = ref(false)
const autoPlay = ref(false)
const textRevealEffect = ref(true)
const contentTransition = ref(false)
const showSettingsPanel = ref(false)
const displayedText = ref({})
const thinkingSteps = ref([
  'AI正在分析你的选择...',
  'AI正在构建故事逻辑...',
  'AI正在生成叙事内容...',
  'AI正在润色文字表达...',
])

// 阅读设置
const settings = ref({
  textSize: 16,
  lineHeight: 1.6,
  textReveal: true,
  autoPlay: false,
  autoPlaySpeed: 3,
  soundEnabled: false,
})

// 计算属性
const currentStory = computed(() => props.story)
const currentNarrative = computed(() => props.narrative)
const currentDialogue = computed(() => props.dialogue)
const currentChoices = computed(() => props.choices)
const currentScene = computed(() => props.scene)
const isAIThinking = computed(() => props.aiThinking)
const currentThinkingStep = computed(() => props.thinkingStep || thinkingSteps.value[0])

const currentChapter = computed(() => props.story.currentChapter || 1)
const storyProgress = computed(() => {
  if (!props.story.chapters || props.story.chapters.length === 0) return 0
  const totalSections = props.story.chapters.reduce(
    (sum, chapter) => sum + chapter.sections.length,
    0
  )
  const completedSections =
    props.story.chapters
      .slice(0, props.story.currentChapter - 1)
      .reduce((sum, chapter) => sum + chapter.sections.length, 0) + props.story.currentSection
  return Math.round((completedSections / totalSections) * 100)
})

const hasPrevious = computed(() => props.story.currentSection > 0)
const hasNext = computed(() => {
  const currentChapter = props.story.chapters?.[props.story.currentChapter - 1]
  return currentChapter && props.story.currentSection < currentChapter.sections.length - 1
})

// 方法
const toggleImmersiveMode = () => {
  immersiveMode.value = !immersiveMode.value
  emit('toggle-immersive', immersiveMode.value)
}

const toggleAutoPlay = () => {
  autoPlay.value = !autoPlay.value
  if (autoPlay.value) {
    startAutoPlay()
  } else {
    stopAutoPlay()
  }
}

const startAutoPlay = () => {
  // 自动播放逻辑
  const playNext = () => {
    if (autoPlay.value && hasNext.value && !currentChoices.value.length) {
      setTimeout(() => {
        nextSection()
        if (autoPlay.value) playNext()
      }, settings.value.autoPlaySpeed * 1000)
    }
  }
  playNext()
}

const stopAutoPlay = () => {
  autoPlay.value = false
}

const makeChoice = (choice) => {
  emit('choice-made', choice)
  displayedText.value = {} // 重置显示文本
}

const nextSection = () => {
  if (hasNext.value) {
    emit('next-section')
    contentTransition.value = true
    setTimeout(() => (contentTransition.value = false), 500)
  }
}

const previousSection = () => {
  if (hasPrevious.value) {
    emit('previous-section')
    contentTransition.value = true
    setTimeout(() => (contentTransition.value = false), 500)
  }
}

const showSettings = () => {
  showSettingsPanel.value = true
}

const hideSettings = () => {
  showSettingsPanel.value = false
}

const applySettings = () => {
  textRevealEffect.value = settings.value.textReveal
  emit('settings-changed', { ...settings.value })
  hideSettings()
}

const resetSettings = () => {
  settings.value = {
    textSize: 16,
    lineHeight: 1.6,
    textReveal: true,
    autoPlay: false,
    autoPlaySpeed: 3,
    soundEnabled: false,
  }
  applySettings()
}

const saveProgress = () => {
  emit('save-progress')
}

const showHistory = () => {
  // TODO: 显示历史记录
  console.log('Show history')
}

const showNotes = () => {
  // TODO: 显示笔记
  console.log('Show notes')
}

const shareStory = () => {
  // TODO: 分享故事
  console.log('Share story')
}

// 文字渐显效果
const revealText = (text, elementId, speed = 50) => {
  let index = 0
  displayedText.value[elementId] = ''

  const timer = setInterval(() => {
    if (index < text.length) {
      displayedText.value[elementId] += text[index]
      index++
    } else {
      clearInterval(timer)
    }
  }, speed)
}

// 监听对话变化，开始文字渐显
watch(
  () => currentDialogue.value,
  (newDialogue) => {
    if (newDialogue && textRevealEffect.value) {
      newDialogue.forEach((line) => {
        if (line.text) {
          revealText(line.text, line.id, 30)
        }
      })
    }
  },
  { deep: true }
)

// 键盘快捷键
const handleKeydown = (event) => {
  if (showSettingsPanel.value) return

  switch (event.key) {
    case 'ArrowRight':
    case ' ':
      if (hasNext.value || currentChoices.value.length > 0) {
        event.preventDefault()
        if (currentChoices.value.length === 1) {
          makeChoice(currentChoices.value[0])
        } else {
          nextSection()
        }
      }
      break
    case 'ArrowLeft':
      if (hasPrevious.value) {
        event.preventDefault()
        previousSection()
      }
      break
    case 'i':
    case 'I':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        toggleImmersiveMode()
      }
      break
    case 'p':
    case 'P':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        toggleAutoPlay()
      }
      break
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)

  // 从localStorage加载设置
  const savedSettings = localStorage.getItem('narrative-settings')
  if (savedSettings) {
    try {
      Object.assign(settings.value, JSON.parse(savedSettings))
    } catch (e) {
      console.warn('Failed to load narrative settings')
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  stopAutoPlay()
})

// 保存设置到localStorage
watch(
  settings,
  (newSettings) => {
    localStorage.setItem('narrative-settings', JSON.stringify(newSettings))
  },
  { deep: true }
)
</script>

<style scoped>
.narrative-interface {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.immersive-mode {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  border-radius: 0;
  box-shadow: none;
}

.narrative-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.narrative-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.story-info {
  flex: 1;
}

.story-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
}

.story-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #718096;
}

.narrative-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.control-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.control-btn.active {
  background: #667eea;
  color: white;
}

.btn-icon {
  font-size: 18px;
}

.narrative-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.ai-thinking-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f0fff4;
  border-radius: 8px;
  border-left: 4px solid #48bb78;
}

.thinking-animation {
  display: flex;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #48bb78;
  animation: thinking 1.4s ease-in-out infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes thinking {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.6; }
  40% { transform: scale(1); opacity: 1; }
}

.thinking-text {
  color: #2d3748;
  font-weight: 500;
}

.narrative-text {
  line-height: 1.8;
  color: #2d3748;
}

.text-reveal .narrative-paragraph {
  opacity: 0;
  animation: textReveal 0.8s ease forwards;
}

@keyframes textReveal {
  to { opacity: 1; }
}

.narrative-paragraph {
  margin-bottom: 16px;
  font-size: 18px;
}

.dialogue-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dialogue-line {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #f8fafc;
}

.player-line {
  background: #ebf8ff;
  border-left: 4px solid #3182ce;
}

.narrator-line {
  background: #f0fff4;
  border-left: 4px solid #48bb78;
  font-style: italic;
}

.character-name {
  font-weight: 600;
  color: #2d3748;
  min-width: 80px;
}

.dialogue-text {
  flex: 1;
  line-height: 1.6;
}

.choices-section {
  margin-top: 24px;
}

.choices-prompt {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 16px;
}

.choices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-btn {
  padding: 16px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  font-size: 16px;
}

.choice-btn:hover:not(:disabled) {
  border-color: #667eea;
  background: #f8f9ff;
  transform: translateY(-1px);
}

.choice-btn.highlighted {
  border-color: #48bb78;
  background: #f0fff4;
}

.choice-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.choice-text {
  display: block;
  font-weight: 500;
}

.choice-consequences {
  display: block;
  font-size: 14px;
  color: #718096;
  margin-top: 4px;
}

.scene-description {
  margin-top: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
}

.scene-visual {
  margin-bottom: 16px;
}

.scene-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.scene-text {
  line-height: 1.6;
  color: #4a5568;
}

.immersive-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.nav-btn {
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  max-width: 200px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #718096;
}

.quick-actions {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.settings-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.settings-content {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.settings-title {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
}

.settings-section {
  margin-bottom: 32px;
}

.settings-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.setting-item {
  margin-bottom: 16px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #4a5568;
  cursor: pointer;
}

.setting-label input[type="range"] {
  flex: 1;
  max-width: 150px;
}

.setting-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #667eea;
}

.settings-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
}

.btn-secondary {
  background: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #edf2f7;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .narrative-interface {
    margin: 0;
    border-radius: 0;
  }

  .narrative-header {
    padding: 16px;
  }

  .story-title {
    font-size: 20px;
  }

  .narrative-controls {
    gap: 4px;
  }

  .control-btn {
    width: 36px;
    height: 36px;
  }

  .narrative-content {
    padding: 16px;
  }

  .quick-actions {
    padding: 12px 16px;
    overflow-x: auto;
  }

  .action-btn {
    min-width: 80px;
  }

  .immersive-controls {
    padding: 12px 16px;
  }

  .nav-btn {
    padding: 8px 12px;
    font-size: 13px;
  }

  .settings-content {
    margin: 16px;
    padding: 20px;
  }
}
</style>
