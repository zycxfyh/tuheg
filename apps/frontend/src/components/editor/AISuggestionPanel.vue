<template>
  <div class="ai-suggestion-panel" :class="{ visible: isVisible }">
    <div class="panel-header">
      <div class="header-content">
        <div class="ai-icon">🤖</div>
        <div class="header-text">
          <h4>AI 写作助手</h4>
          <span class="status" :class="currentStatus">
            {{ statusText }}
          </span>
        </div>
      </div>
      <button @click="closePanel" class="close-btn" title="关闭">
        ✕
      </button>
    </div>

    <div class="panel-content">
      <!-- 建议列表 -->
      <div v-if="suggestions.length > 0" class="suggestions-section">
        <div class="section-header">
          <h5>💡 智能建议</h5>
          <button @click="clearSuggestions" class="clear-btn">清空</button>
        </div>
        <div class="suggestions-list">
          <div
            v-for="(suggestion, index) in suggestions"
            :key="suggestion.id"
            class="suggestion-item"
            :class="{ applied: suggestion.applied }"
            @click="applySuggestion(suggestion)"
          >
            <div class="suggestion-header">
              <div class="suggestion-type" :class="suggestion.type">
                {{ getTypeIcon(suggestion.type) }} {{ getTypeText(suggestion.type) }}
              </div>
              <div class="suggestion-confidence">
                <div class="confidence-bar">
                  <div
                    class="confidence-fill"
                    :style="{ width: `${suggestion.confidence * 100}%` }"
                  ></div>
                </div>
                <span class="confidence-text">{{ Math.round(suggestion.confidence * 100) }}%</span>
              </div>
            </div>
            <div class="suggestion-content">
              <p>{{ suggestion.text }}</p>
              <div v-if="suggestion.explanation" class="suggestion-explanation">
                {{ suggestion.explanation }}
              </div>
            </div>
            <div class="suggestion-actions">
              <button @click.stop="acceptSuggestion(suggestion)" class="action-btn accept">
                ✓ 应用
              </button>
              <button @click.stop="dismissSuggestion(suggestion)" class="action-btn dismiss">
                ✕ 忽略
              </button>
              <button @click.stop="modifySuggestion(suggestion)" class="action-btn modify">
                ✏ 修改
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 写作分析 -->
      <div class="analysis-section">
        <div class="section-header">
          <h5>📊 写作分析</h5>
        </div>
        <div class="analysis-content">
          <div class="analysis-item">
            <span class="label">可读性:</span>
            <span class="value">{{ analysis.readability }}/10</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${analysis.readability * 10}%` }"></div>
            </div>
          </div>
          <div class="analysis-item">
            <span class="label">情感倾向:</span>
            <span class="value">{{ analysis.sentiment }}</span>
          </div>
          <div class="analysis-item">
            <span class="label">主题一致性:</span>
            <span class="value">{{ Math.round(analysis.coherence * 100) }}%</span>
          </div>
          <div class="analysis-item">
            <span class="label">语言复杂度:</span>
            <span class="value">{{ analysis.complexity }}/10</span>
          </div>
        </div>
      </div>

      <!-- 实时建议触发器 -->
      <div class="triggers-section">
        <div class="section-header">
          <h5>⚡ 智能触发</h5>
        </div>
        <div class="triggers-list">
          <button
            v-for="trigger in availableTriggers"
            :key="trigger.id"
            @click="activateTrigger(trigger)"
            :disabled="trigger.disabled"
            class="trigger-btn"
            :class="{ active: trigger.active }"
          >
            <span class="trigger-icon">{{ trigger.icon }}</span>
            <span class="trigger-text">{{ trigger.name }}</span>
          </button>
        </div>
      </div>

      <!-- 个性化设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h5>⚙️ 个性化设置</h5>
        </div>
        <div class="settings-content">
          <div class="setting-item">
            <label class="setting-label">
              <input
                type="checkbox"
                v-model="settings.autoSuggest"
                @change="updateSettings"
              />
              自动建议
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-label">
              <input
                type="checkbox"
                v-model="settings.realTimeAnalysis"
                @change="updateSettings"
              />
              实时分析
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-label">
              写作风格:
              <select v-model="settings.writingStyle" @change="updateSettings">
                <option value="formal">正式</option>
                <option value="casual">随意</option>
                <option value="creative">创意</option>
                <option value="technical">技术性</option>
              </select>
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-label">
              建议频率:
              <select v-model="settings.suggestionFrequency" @change="updateSettings">
                <option value="low">低</option>
                <option value="medium">中等</option>
                <option value="high">高</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>AI 正在思考中...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { useToast } from '@/composables/useToast'

interface Props {
  visible: boolean
  content: string
  cursorPosition?: number
  selectedText?: string
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'suggestion-applied', suggestion: any): void
  (e: 'content-changed', content: string): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  content: '',
  cursorPosition: 0,
  selectedText: '',
})

const emit = defineEmits<Emits>()

const { show: showToast } = useToast()

// 状态
const isVisible = ref(props.visible)
const suggestions = ref<any[]>([])
const isLoading = ref(false)
const analysis = ref({
  readability: 7.5,
  sentiment: '中性',
  coherence: 0.85,
  complexity: 6.2,
})

// 设置
const settings = ref({
  autoSuggest: true,
  realTimeAnalysis: true,
  writingStyle: 'casual',
  suggestionFrequency: 'medium',
})

// 当前状态
const currentStatus = ref<'idle' | 'thinking' | 'analyzing' | 'suggesting'>('idle')
const statusText = computed(() => {
  switch (currentStatus.value) {
    case 'thinking': return '正在思考...'
    case 'analyzing': return '分析内容中...'
    case 'suggesting': return '生成建议...'
    default: return '准备就绪'
  }
})

// 可用触发器
const availableTriggers = ref([
  {
    id: 'grammar_check',
    name: '语法检查',
    icon: '🔍',
    active: false,
    disabled: false,
  },
  {
    id: 'style_improvement',
    name: '风格改进',
    icon: '✨',
    active: false,
    disabled: false,
  },
  {
    id: 'content_expansion',
    name: '内容扩展',
    icon: '📝',
    active: false,
    disabled: false,
  },
  {
    id: 'tone_adjustment',
    name: '语调调整',
    icon: '🎭',
    active: false,
    disabled: false,
  },
  {
    id: 'fact_checking',
    name: '事实核查',
    icon: '✅',
    active: false,
    disabled: false,
  },
  {
    id: 'seo_optimization',
    name: 'SEO优化',
    icon: '🔍',
    active: false,
    disabled: false,
  },
])

// 监听visible变化
watch(() => props.visible, (newVisible) => {
  isVisible.value = newVisible
  if (newVisible && props.content) {
    analyzeContent()
  }
})

// 监听内容变化
watch(() => props.content, (newContent) => {
  if (isVisible.value && settings.value.realTimeAnalysis && newContent) {
    analyzeContent()
  }
})

// 方法
const closePanel = () => {
  isVisible.value = false
  emit('update:visible', false)
}

const clearSuggestions = () => {
  suggestions.value = []
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    grammar: '🔍',
    style: '✨',
    content: '📝',
    tone: '🎭',
    fact: '✅',
    seo: '🔍',
    creativity: '🎨',
    structure: '🏗️',
  }
  return icons[type] || '💡'
}

const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    grammar: '语法',
    style: '风格',
    content: '内容',
    tone: '语调',
    fact: '事实',
    seo: 'SEO',
    creativity: '创意',
    structure: '结构',
  }
  return texts[type] || type
}

const applySuggestion = (suggestion: any) => {
  // 标记为已应用
  suggestion.applied = true

  emit('suggestion-applied', suggestion)

  showToast(`应用了AI建议: ${suggestion.text.slice(0, 30)}...`, 'success')
}

const acceptSuggestion = (suggestion: any) => {
  applySuggestion(suggestion)
}

const dismissSuggestion = (suggestion: any) => {
  const index = suggestions.value.indexOf(suggestion)
  if (index > -1) {
    suggestions.value.splice(index, 1)
  }
  showToast('已忽略此建议', 'info')
}

const modifySuggestion = (suggestion: any) => {
  // 这里可以打开修改对话框
  showToast('修改功能开发中...', 'info')
}

const activateTrigger = async (trigger: any) => {
  if (trigger.disabled) return

  trigger.active = !trigger.active

  if (trigger.active) {
    await requestAISuggestions(trigger.id)
  }
}

const requestAISuggestions = async (triggerType: string) => {
  if (isLoading.value) return

  isLoading.value = true
  currentStatus.value = 'thinking'

  try {
    const response = await axios.post('/api/advanced-ai/reasoning/perform', {
      input: props.content,
      options: {
        reasoningTypes: ['analogical', 'causal'],
        strategy: 'heuristic',
        context: {
          domain: 'creative_writing',
          goal: 'improve_content',
          trigger: triggerType,
        },
        constraints: ['keep_original_meaning', 'enhance_quality'],
      },
    })

    currentStatus.value = 'suggesting'

    // 生成模拟建议
    const newSuggestions = generateMockSuggestions(triggerType)

    suggestions.value.push(...newSuggestions)

    showToast(`生成了 ${newSuggestions.length} 个AI建议`, 'success')

  } catch (error) {
    console.error('AI suggestion failed:', error)
    showToast('AI建议获取失败', 'error')
  } finally {
    isLoading.value = false
    currentStatus.value = 'idle'
  }
}

const generateMockSuggestions = (triggerType: string) => {
  const suggestionTemplates: Record<string, any[]> = {
    grammar_check: [
      {
        id: `grammar_${Date.now()}`,
        type: 'grammar',
        text: '发现一个可能的语法错误，建议检查主谓一致',
        explanation: '在英语中，主语和谓语需要保持一致的数量形式',
        confidence: 0.85,
      },
    ],
    style_improvement: [
      {
        id: `style_${Date.now()}`,
        type: 'style',
        text: '可以使用更生动活泼的表达方式',
        explanation: '考虑使用比喻或拟人手法来增强描述的感染力',
        confidence: 0.78,
      },
    ],
    content_expansion: [
      {
        id: `content_${Date.now()}`,
        type: 'content',
        text: '可以添加更多具体细节来丰富这个描述',
        explanation: '具体细节能让读者更容易产生共鸣和理解',
        confidence: 0.82,
      },
    ],
    tone_adjustment: [
      {
        id: `tone_${Date.now()}`,
        type: 'tone',
        text: '当前语调可能过于正式，建议稍微放松一些',
        explanation: '根据受众特点调整语调能提高内容亲和力',
        confidence: 0.75,
      },
    ],
    fact_checking: [
      {
        id: `fact_${Date.now()}`,
        type: 'fact',
        text: '建议核实这个数据的准确性',
        explanation: '确保内容的客观性和可靠性非常重要',
        confidence: 0.90,
      },
    ],
    seo_optimization: [
      {
        id: `seo_${Date.now()}`,
        type: 'seo',
        text: '可以添加更相关的关键词来优化SEO',
        explanation: '合适的关键词能提高内容在搜索引擎中的排名',
        confidence: 0.88,
      },
    ],
  }

  return suggestionTemplates[triggerType] || []
}

const analyzeContent = async () => {
  if (!props.content) return

  currentStatus.value = 'analyzing'

  try {
    // 模拟分析过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 更新分析数据
    analysis.value = {
      readability: Math.random() * 4 + 6, // 6-10
      sentiment: ['积极', '中性', '消极'][Math.floor(Math.random() * 3)],
      coherence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      complexity: Math.random() * 4 + 4, // 4-8
    }

    currentStatus.value = 'idle'

  } catch (error) {
    console.error('Content analysis failed:', error)
    currentStatus.value = 'idle'
  }
}

const updateSettings = () => {
  // 保存设置到本地存储
  localStorage.setItem('ai-suggestion-settings', JSON.stringify(settings.value))
  showToast('设置已保存', 'success')
}

const loadSettings = () => {
  const saved = localStorage.getItem('ai-suggestion-settings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      settings.value = { ...settings.value, ...parsed }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }
}

// 生命周期
onMounted(() => {
  loadSettings()

  // 如果内容不为空且启用实时分析，开始分析
  if (props.content && settings.value.realTimeAnalysis) {
    analyzeContent()
  }
})

onUnmounted(() => {
  // 清理定时器等
})
</script>

<style scoped>
.ai-suggestion-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 380px;
  max-height: 80vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid #e1e5e9;
  z-index: 1000;
  overflow: hidden;
  transform: translateX(420px);
  transition: transform 0.3s ease;
}

.ai-suggestion-panel.visible {
  transform: translateX(0);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e1e5e9;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-icon {
  font-size: 24px;
}

.header-text h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status.idle {
  background: rgba(255, 255, 255, 0.2);
}

.status.thinking,
.status.analyzing,
.status.suggesting {
  background: rgba(255, 255, 255, 0.3);
  animation: pulse 2s infinite;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.panel-content {
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 8px 20px;
}

.section-header h5 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.clear-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.clear-btn:hover {
  background: #f0f0f0;
}

.suggestions-list {
  padding: 0 20px 16px 20px;
}

.suggestion-item {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.suggestion-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.suggestion-item.applied {
  border-color: #28a745;
  background: #f8fff8;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.suggestion-type {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
  background: #f0f0f0;
  color: #666;
}

.suggestion-type.grammar { background: #fff3cd; color: #856404; }
.suggestion-type.style { background: #d1ecf1; color: #0c5460; }
.suggestion-type.content { background: #d4edda; color: #155724; }
.suggestion-type.tone { background: #f8d7da; color: #721c24; }
.suggestion-type.fact { background: #e2e3e5; color: #383d41; }
.suggestion-type.seo { background: #cce5ff; color: #004085; }

.suggestion-confidence {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.confidence-bar {
  width: 60px;
  height: 4px;
  background: #e1e5e9;
  border-radius: 2px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745 0%, #ffc107 50%, #dc3545 100%);
  transition: width 0.3s ease;
}

.suggestion-content p {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.4;
  color: #333;
}

.suggestion-explanation {
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.suggestion-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.action-btn {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.accept {
  border-color: #28a745;
  color: #28a745;
}

.action-btn.accept:hover {
  background: #28a745;
  color: white;
}

.action-btn.dismiss {
  border-color: #dc3545;
  color: #dc3545;
}

.action-btn.dismiss:hover {
  background: #dc3545;
  color: white;
}

.action-btn.modify {
  border-color: #007bff;
  color: #007bff;
}

.action-btn.modify:hover {
  background: #007bff;
  color: white;
}

.analysis-content {
  padding: 0 20px 16px 20px;
}

.analysis-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.analysis-item:last-child {
  border-bottom: none;
}

.analysis-item .label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  min-width: 80px;
}

.analysis-item .value {
  font-size: 14px;
  color: #666;
  flex: 1;
}

.progress-bar {
  width: 80px;
  height: 6px;
  background: #e1e5e9;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745 0%, #ffc107 50%, #dc3545 100%);
  transition: width 0.3s ease;
}

.triggers-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 0 20px 16px 20px;
}

.trigger-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.trigger-btn:hover:not(:disabled) {
  border-color: #667eea;
  background: #f8f9ff;
}

.trigger-btn.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.trigger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.trigger-icon {
  font-size: 16px;
}

.settings-content {
  padding: 0 20px 16px 20px;
}

.setting-item {
  margin-bottom: 12px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.setting-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.setting-label select {
  margin-left: 8px;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px auto;
}

.loading-content p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-suggestion-panel {
    width: 340px;
    right: 10px;
    transform: translateX(360px);
  }

  .triggers-list {
    grid-template-columns: 1fr;
  }

  .suggestion-actions {
    flex-wrap: wrap;
  }
}
</style>
