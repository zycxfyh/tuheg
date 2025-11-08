<template>
  <div class="advanced-world-builder">
    <div class="builder-header">
      <h2 class="builder-title">高级世界构建</h2>
      <div class="builder-actions">
        <button @click="saveWorld" :disabled="isSaving" class="btn btn-secondary">
          <span v-if="isSaving" class="loading-spinner">⏳</span>
          保存世界
        </button>
        <button @click="exportWorld" class="btn btn-primary">
          导出世界
        </button>
      </div>
    </div>

    <!-- 世界概览面板 -->
    <div class="world-overview">
      <div class="overview-card">
        <h3>世界基础信息</h3>
        <div class="overview-grid">
          <div class="overview-item">
            <label>世界名称</label>
            <input v-model="worldData.name" type="text" placeholder="为你的世界命名..." />
          </div>
          <div class="overview-item">
            <label>世界类型</label>
            <select v-model="worldData.type">
              <option value="fantasy">奇幻世界</option>
              <option value="scifi">科幻世界</option>
              <option value="modern">现代世界</option>
              <option value="historical">历史世界</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <div class="overview-item">
            <label>复杂度</label>
            <select v-model="worldData.complexity">
              <option value="simple">简单</option>
              <option value="medium">中等</option>
              <option value="complex">复杂</option>
              <option value="epic">史诗级</option>
            </select>
          </div>
          <div class="overview-item">
            <label>AI生成进度</label>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${generationProgress}%` }"></div>
              <span class="progress-text">{{ generationProgress }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 构建选项卡 -->
    <div class="builder-tabs">
      <div class="tab-buttons">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-button', { active: activeTab === tab.id }]"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <div class="tab-content">
        <!-- 基础设定 -->
        <div v-if="activeTab === 'basics'" class="tab-panel">
          <WorldBasicsEditor v-model="worldData.basics" />
        </div>

        <!-- 地理环境 -->
        <div v-if="activeTab === 'geography'" class="tab-panel">
          <GeographyEditor v-model="worldData.geography" />
        </div>

        <!-- 社会结构 -->
        <div v-if="activeTab === 'society'" class="tab-panel">
          <SocietyEditor v-model="worldData.society" />
        </div>

        <!-- 魔法/科技系统 -->
        <div v-if="activeTab === 'magic'" class="tab-panel">
          <MagicTechEditor v-model="worldData.magicTech" />
        </div>

        <!-- 历史背景 -->
        <div v-if="activeTab === 'history'" class="tab-panel">
          <HistoryEditor v-model="worldData.history" />
        </div>

        <!-- 自定义规则 -->
        <div v-if="activeTab === 'rules'" class="tab-panel">
          <RulesEditor v-model="worldData.rules" />
        </div>
      </div>
    </div>

    <!-- AI协作面板 -->
    <div class="ai-collaboration-panel">
      <h3>AI Agent协作状态</h3>
      <div class="agent-status-grid">
        <div
          v-for="agent in agents"
          :key="agent.id"
          :class="['agent-card', `status-${agent.status}`]"
        >
          <div class="agent-avatar">
            <span class="agent-icon">{{ agent.icon }}</span>
          </div>
          <div class="agent-info">
            <h4>{{ agent.name }}</h4>
            <p class="agent-role">{{ agent.role }}</p>
            <p class="agent-status-text">{{ agent.statusText }}</p>
            <div v-if="agent.progress > 0" class="agent-progress">
              <div class="progress-bar small">
                <div class="progress-fill" :style="{ width: `${agent.progress}%` }"></div>
              </div>
            </div>
          </div>
          <div class="agent-actions">
            <button @click="interactWithAgent(agent)" class="btn btn-small">
              交互
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览面板 -->
    <div class="preview-panel">
      <h3>世界预览</h3>
      <div class="preview-content">
        <div class="preview-summary">
          <h4>{{ worldData.name || '未命名世界' }}</h4>
          <p class="world-description">{{ generateWorldSummary() }}</p>
        </div>

        <div class="preview-stats">
          <div class="stat-item">
            <span class="stat-label">地区数量</span>
            <span class="stat-value">{{ worldData.geography?.regions?.length || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">社会阶层</span>
            <span class="stat-value">{{ worldData.society?.classes?.length || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">魔法体系</span>
            <span class="stat-value">{{ worldData.magicTech?.systems?.length || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">历史事件</span>
            <span class="stat-value">{{ worldData.history?.events?.length || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import WorldBasicsEditor from './editors/WorldBasicsEditor.vue'
import GeographyEditor from './editors/GeographyEditor.vue'
import SocietyEditor from './editors/SocietyEditor.vue'
import MagicTechEditor from './editors/MagicTechEditor.vue'
import HistoryEditor from './editors/HistoryEditor.vue'
import RulesEditor from './editors/RulesEditor.vue'

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'save', 'export'])

// 响应式数据
const activeTab = ref('basics')
const isSaving = ref(false)
const generationProgress = ref(0)

const worldData = ref({
  id: null,
  name: '',
  type: 'fantasy',
  complexity: 'medium',
  basics: {
    theme: '',
    tone: 'balanced',
    scale: 'regional',
    protagonists: [],
    antagonists: []
  },
  geography: {
    regions: [],
    landmarks: [],
    climate: '',
    terrain: []
  },
  society: {
    classes: [],
    cultures: [],
    religions: [],
    governments: []
  },
  magicTech: {
    systems: [],
    artifacts: [],
    limitations: []
  },
  history: {
    timeline: [],
    events: [],
    eras: []
  },
  rules: {
    physics: [],
    magic: [],
    society: [],
    custom: []
  },
  metadata: {
    createdAt: null,
    updatedAt: null,
    version: '1.0'
  }
})

// 选项卡配置
const tabs = ref([
  { id: 'basics', label: '基础设定', icon: '🏠' },
  { id: 'geography', label: '地理环境', icon: '🌍' },
  { id: 'society', label: '社会结构', icon: '👥' },
  { id: 'magic', label: '魔法/科技', icon: '⚡' },
  { id: 'history', label: '历史背景', icon: '📜' },
  { id: 'rules', label: '自定义规则', icon: '⚖️' }
])

// AI Agent状态
const agents = ref([
  {
    id: 'creation-agent',
    name: 'Creation Agent',
    role: '世界构建',
    icon: '🌍',
    status: 'active',
    statusText: '正在构建世界框架',
    progress: 85
  },
  {
    id: 'logic-agent',
    name: 'Logic Agent',
    role: '逻辑验证',
    icon: '🧠',
    status: 'active',
    statusText: '检查世界一致性',
    progress: 72
  },
  {
    id: 'narrative-agent',
    name: 'Narrative Agent',
    role: '叙事创作',
    icon: '📚',
    status: 'waiting',
    statusText: '等待世界设定完成',
    progress: 0
  }
])

// 计算属性
const isWorldComplete = computed(() => {
  return worldData.value.name &&
         worldData.value.basics.theme &&
         worldData.value.geography.regions.length > 0
})

// 方法
const saveWorld = async () => {
  try {
    isSaving.value = true

    // 更新元数据
    worldData.value.metadata.updatedAt = new Date().toISOString()

    // 如果是新世界，设置创建时间
    if (!worldData.value.metadata.createdAt) {
      worldData.value.metadata.createdAt = new Date().toISOString()
      worldData.value.id = 'world-' + Date.now()
    }

    emit('save', worldData.value)

    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 显示成功消息
    console.log('World saved successfully')

  } catch (error) {
    console.error('Failed to save world:', error)
  } finally {
    isSaving.value = false
  }
}

const exportWorld = () => {
  emit('export', worldData.value)
}

const generateWorldSummary = () => {
  if (!worldData.value.name) return '请先设置世界名称和基础信息'

  const basics = worldData.value.basics
  const geography = worldData.value.geography
  const society = worldData.value.society

  let summary = `一个${worldData.value.type === 'fantasy' ? '奇幻' :
                   worldData.value.type === 'scifi' ? '科幻' :
                   worldData.value.type === 'modern' ? '现代' : '自定义'}世界，`

  if (basics.theme) {
    summary += `主题围绕${basics.theme}，`
  }

  if (geography.regions.length > 0) {
    summary += `包含${geography.regions.length}个主要地区，`
  }

  if (society.classes.length > 0) {
    summary += `拥有${society.classes.length}个社会阶层。`
  }

  return summary || '正在构建世界设定...'
}

const interactWithAgent = (agent) => {
  // TODO: 实现与Agent的交互
  console.log('Interacting with agent:', agent)
}

// 监听外部数据变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    worldData.value = { ...worldData.value, ...newValue }
  }
}, { deep: true })

// 监听内部数据变化
watch(worldData, (newData) => {
  emit('update:modelValue', newData)
}, { deep: true })

// 初始化
if (props.modelValue) {
  worldData.value = { ...worldData.value, ...props.modelValue }
}
</script>

<style scoped>
.advanced-world-builder {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.builder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.builder-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.builder-actions {
  display: flex;
  gap: 16px;
}

.world-overview {
  margin-bottom: 32px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.overview-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.overview-item label {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
}

.overview-item input,
.overview-item select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}

.overview-item input:focus,
.overview-item select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.progress-bar {
  position: relative;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  right: 0;
  top: -20px;
  font-size: 12px;
  color: #4a5568;
}

.builder-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 32px;
}

.tab-buttons {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 20px;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
}

.tab-button:hover {
  background: #f8fafc;
}

.tab-button.active {
  background: #667eea;
  color: white;
  border-bottom: 2px solid #5a67d8;
}

.tab-content {
  padding: 24px;
}

.tab-panel {
  min-height: 400px;
}

.ai-collaboration-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.ai-collaboration-panel h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

.agent-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.agent-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.agent-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.agent-card.status-active {
  border-color: #48bb78;
  background: #f0fff4;
}

.agent-card.status-waiting {
  border-color: #ed8936;
  background: #fffaf0;
}

.agent-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.agent-info {
  flex: 1;
}

.agent-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.agent-role {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #718096;
}

.agent-status-text {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #4a5568;
}

.agent-progress {
  margin-top: 8px;
}

.progress-bar.small {
  height: 4px;
}

.agent-actions {
  flex-shrink: 0;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.preview-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-panel h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

.preview-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.preview-summary h4 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
}

.world-description {
  margin: 0;
  color: #4a5568;
  line-height: 1.6;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #718096;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive design */
@media (max-width: 768px) {
  .builder-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .builder-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .tab-buttons {
    flex-direction: column;
  }

  .agent-status-grid {
    grid-template-columns: 1fr;
  }

  .preview-content {
    grid-template-columns: 1fr;
  }

  .preview-stats {
    grid-template-columns: 1fr;
  }
}
</style>
