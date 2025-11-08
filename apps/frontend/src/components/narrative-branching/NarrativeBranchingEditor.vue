<template>
  <div class="narrative-branching-editor">
    <div class="editor-header">
      <h2 class="editor-title">分支叙事编辑器</h2>
      <div class="editor-actions">
        <button @click="addNode" class="btn btn-secondary">
          <span class="btn-icon">➕</span>
          添加节点
        </button>
        <button @click="autoGenerateBranches" :disabled="storyNodes.length === 0" class="btn btn-primary">
          <span class="btn-icon">🤖</span>
          AI生成分支
        </button>
        <button @click="exportStoryTree" class="btn btn-outline">
          <span class="btn-icon">📤</span>
          导出故事树
        </button>
      </div>
    </div>

    <!-- 故事树可视化 -->
    <div class="story-tree-section">
      <h3 class="section-title">故事树结构</h3>
      <div class="tree-canvas">
        <div class="canvas-container" ref="canvasContainer">
          <svg class="story-graph" :viewBox="getViewBox()">
            <!-- 连接线 -->
            <g class="connections">
              <path
                v-for="connection in connections"
                :key="connection.id"
                :d="getConnectionPath(connection)"
                :stroke="getConnectionColor(connection)"
                stroke-width="2"
                fill="none"
                class="connection-path"
                :class="{ 'connection-selected': selectedConnection === connection.id }"
                @click="selectConnection(connection.id)"
              />
              <!-- 连接标签 -->
              <text
                v-for="connection in connections"
                :key="`label-${connection.id}`"
                :x="getConnectionLabelPosition(connection).x"
                :y="getConnectionLabelPosition(connection).y"
                text-anchor="middle"
                class="connection-label"
              >
                {{ connection.choice || '选择' }}
              </text>
            </g>

            <!-- 故事节点 -->
            <g class="story-nodes">
              <g
                v-for="node in storyNodes"
                :key="node.id"
                :transform="`translate(${node.position.x}, ${node.position.y})`"
                class="story-node"
                :class="{ 'node-selected': selectedNode === node.id }"
                @click="selectNode(node.id)"
                @dblclick="editNode(node)"
              >
                <!-- 节点背景 -->
                <rect
                  x="-60"
                  y="-30"
                  width="120"
                  height="60"
                  rx="8"
                  :fill="getNodeColor(node)"
                  :stroke="selectedNode === node.id ? '#667eea' : '#e2e8f0'"
                  stroke-width="2"
                  class="node-background"
                />

                <!-- 节点标题 -->
                <text
                  text-anchor="middle"
                  dy="-5"
                  class="node-title"
                  :class="{ 'title-selected': selectedNode === node.id }"
                >
                  {{ truncateText(node.title || `节点 ${storyNodes.indexOf(node) + 1}`, 12) }}
                </text>

                <!-- 节点类型指示器 -->
                <circle
                  cx="45"
                  cy="-20"
                  r="8"
                  :fill="getNodeTypeColor(node.type)"
                  class="node-type-indicator"
                />
                <text
                  x="45"
                  y="-16"
                  text-anchor="middle"
                  class="node-type-icon"
                  font-size="10"
                >
                  {{ getNodeTypeIcon(node.type) }}
                </text>
              </g>
            </g>
          </svg>
        </div>

        <!-- 控制面板 -->
        <div class="canvas-controls">
          <button @click="zoomIn" class="control-btn">
            <span class="zoom-icon">🔍+</span>
          </button>
          <button @click="zoomOut" class="control-btn">
            <span class="zoom-icon">🔍-</span>
          </button>
          <button @click="fitToScreen" class="control-btn">
            <span class="fit-icon">📐</span>
          </button>
          <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        </div>

        <!-- 迷你地图 -->
        <div class="minimap">
          <div class="minimap-container">
            <svg class="minimap-svg" viewBox="0 0 200 150">
              <rect
                x="0"
                y="0"
                width="200"
                height="150"
                fill="#f8fafc"
                stroke="#e2e8f0"
              />
              <!-- 迷你节点 -->
              <rect
                v-for="node in storyNodes"
                :key="`mini-${node.id}`"
                :x="(node.position.x / canvasSize.width) * 180 + 10"
                :y="(node.position.y / canvasSize.height) * 130 + 10"
                width="4"
                height="4"
                :fill="getNodeColor(node)"
              />
              <!-- 视窗指示器 -->
              <rect
                :x="viewportRect.x"
                :y="viewportRect.y"
                :width="viewportRect.width"
                :height="viewportRect.height"
                fill="none"
                stroke="#667eea"
                stroke-width="1"
                stroke-dasharray="2,2"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 节点编辑器 -->
    <div v-if="selectedNode" class="node-editor">
      <h3 class="section-title">节点编辑</h3>

      <div class="editor-content">
        <div class="node-basic-info">
          <div class="info-field">
            <label class="field-label">节点标题</label>
            <input
              v-model="editingNode.title"
              type="text"
              class="field-input"
              placeholder="输入节点标题..."
            />
          </div>

          <div class="info-field">
            <label class="field-label">节点类型</label>
            <select v-model="editingNode.type" class="field-select">
              <option value="narrative">叙事节点</option>
              <option value="choice">选择节点</option>
              <option value="event">事件节点</option>
              <option value="ending">结局节点</option>
            </select>
          </div>

          <div class="info-field">
            <label class="field-label">节点内容</label>
            <textarea
              v-model="editingNode.content"
              class="field-textarea"
              placeholder="输入节点的具体内容..."
              rows="6"
            ></textarea>
          </div>
        </div>

        <!-- 选择分支 (仅对选择节点) -->
        <div v-if="editingNode.type === 'choice'" class="node-choices">
          <h4>选择分支</h4>
          <div class="choices-list">
            <div
              v-for="(choice, index) in editingNode.choices"
              :key="index"
              class="choice-item"
            >
              <input
                v-model="choice.text"
                type="text"
                class="choice-input"
                placeholder="选择文本..."
              />
              <select v-model="choice.targetNode" class="choice-target">
                <option value="">选择目标节点</option>
                <option
                  v-for="node in getAvailableTargetNodes(editingNode.id)"
                  :key="node.id"
                  :value="node.id"
                >
                  {{ node.title || `节点 ${storyNodes.indexOf(node) + 1}` }}
                </option>
              </select>
              <button @click="removeChoice(index)" class="remove-choice-btn">
                ✕
              </button>
            </div>
            <button @click="addChoice" class="add-choice-btn">
              <span class="add-icon">+</span>
              添加选择
            </button>
          </div>
        </div>

        <!-- 节点属性 -->
        <div class="node-properties">
          <h4>节点属性</h4>
          <div class="properties-grid">
            <div class="property-item">
              <label class="property-label">
                <input
                  v-model="editingNode.properties.isCheckpoint"
                  type="checkbox"
                  class="property-checkbox"
                />
                检查点
              </label>
            </div>
            <div class="property-item">
              <label class="property-label">
                <input
                  v-model="editingNode.properties.requiresCondition"
                  type="checkbox"
                  class="property-checkbox"
                />
                需要条件
              </label>
            </div>
            <div v-if="editingNode.properties.requiresCondition" class="property-item full-width">
              <label class="property-label">条件描述</label>
              <input
                v-model="editingNode.properties.condition"
                type="text"
                class="property-input"
                placeholder="例如：玩家等级 >= 5"
              />
            </div>
          </div>
        </div>

        <div class="editor-actions">
          <button @click="saveNode" class="btn btn-primary">
            保存节点
          </button>
          <button @click="deleteNode" class="btn btn-danger">
            删除节点
          </button>
        </div>
      </div>
    </div>

    <!-- AI建议面板 -->
    <div class="ai-suggestions-panel">
      <h3 class="panel-title">
        <span class="ai-icon">🤖</span>
        AI叙事建议
      </h3>
      <div class="suggestions-content">
        <div v-if="aiSuggestions.length === 0" class="no-suggestions">
          添加更多故事节点后，AI将提供分支建议
        </div>
        <div v-else class="suggestions-list">
          <div
            v-for="suggestion in aiSuggestions"
            :key="suggestion.id"
            class="suggestion-card"
          >
            <div class="suggestion-header">
              <span class="suggestion-type">{{ suggestion.type }}</span>
              <span class="suggestion-impact">{{ getImpactLabel(suggestion.impact) }}</span>
            </div>
            <p class="suggestion-content">{{ suggestion.description }}</p>
            <div class="suggestion-actions">
              <button @click="applySuggestion(suggestion)" class="apply-btn">
                应用建议
              </button>
              <button @click="dismissSuggestion(suggestion.id)" class="dismiss-btn">
                忽略
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      nodes: [],
      connections: [],
    }),
  },
})

// Emits
const emit = defineEmits(['update:modelValue'])

// 响应式数据
const storyNodes = ref([])
const connections = ref([])
const selectedNode = ref(null)
const selectedConnection = ref(null)
const editingNode = ref(null)
const zoomLevel = ref(1)
const panOffset = ref({ x: 0, y: 0 })
const aiSuggestions = ref([])
const canvasContainer = ref(null)

// 画布配置
const canvasSize = ref({ width: 2000, height: 1500 })

// 计算属性
const viewportRect = computed(() => {
  const container = canvasContainer.value
  if (!container) return { x: 0, y: 0, width: 0, height: 0 }

  const rect = container.getBoundingClientRect()
  const scaleX = canvasSize.value.width / rect.width
  const scaleY = canvasSize.value.height / rect.height

  return {
    x: ((-panOffset.value.x * scaleX) / canvasSize.value.width) * 180 + 10,
    y: ((-panOffset.value.y * scaleY) / canvasSize.value.height) * 130 + 10,
    width: (rect.width / canvasSize.value.width) * 180,
    height: (rect.height / canvasSize.value.height) * 130,
  }
})

// 方法
const addNode = () => {
  const newNode = {
    id: `node-${Date.now()}`,
    title: '',
    type: 'narrative',
    content: '',
    position: {
      x: Math.random() * 1000 + 500,
      y: Math.random() * 800 + 400,
    },
    choices: [],
    properties: {
      isCheckpoint: false,
      requiresCondition: false,
      condition: '',
    },
  }

  storyNodes.value.push(newNode)
  emit('update:modelValue', { nodes: storyNodes.value, connections: connections.value })
}

const selectNode = (nodeId) => {
  selectedNode.value = nodeId
  selectedConnection.value = null
  const node = storyNodes.value.find((n) => n.id === nodeId)
  if (node) {
    editingNode.value = { ...node }
  }
}

const selectConnection = (connectionId) => {
  selectedConnection.value = connectionId
  selectedNode.value = null
}

const editNode = (node) => {
  editingNode.value = { ...node }
}

const saveNode = () => {
  if (!editingNode.value) return

  const index = storyNodes.value.findIndex((n) => n.id === editingNode.value.id)
  if (index !== -1) {
    storyNodes.value[index] = { ...editingNode.value }
    emit('update:modelValue', { nodes: storyNodes.value, connections: connections.value })

    // 生成AI建议
    generateAISuggestions()
  }
}

const deleteNode = () => {
  if (!selectedNode.value) return

  storyNodes.value = storyNodes.value.filter((n) => n.id !== selectedNode.value)
  connections.value = connections.value.filter(
    (c) => c.from !== selectedNode.value && c.to !== selectedNode.value
  )

  selectedNode.value = null
  editingNode.value = null
  emit('update:modelValue', { nodes: storyNodes.value, connections: connections.value })
}

const addChoice = () => {
  if (!editingNode.value.choices) {
    editingNode.value.choices = []
  }
  editingNode.value.choices.push({
    text: '',
    targetNode: '',
  })
}

const removeChoice = (index) => {
  editingNode.value.choices.splice(index, 1)
}

const getAvailableTargetNodes = (currentNodeId) => {
  return storyNodes.value.filter((node) => node.id !== currentNodeId)
}

const getNodeColor = (node) => {
  switch (node.type) {
    case 'narrative':
      return '#667eea'
    case 'choice':
      return '#48bb78'
    case 'event':
      return '#d69e2e'
    case 'ending':
      return '#e53e3e'
    default:
      return '#a0aec0'
  }
}

const getNodeTypeColor = (type) => {
  switch (type) {
    case 'narrative':
      return '#3182ce'
    case 'choice':
      return '#38a169'
    case 'event':
      return '#d69e2e'
    case 'ending':
      return '#e53e3e'
    default:
      return '#a0aec0'
  }
}

const getNodeTypeIcon = (type) => {
  switch (type) {
    case 'narrative':
      return '📖'
    case 'choice':
      return '🔀'
    case 'event':
      return '⚡'
    case 'ending':
      return '🏁'
    default:
      return '❓'
  }
}

const getConnectionColor = (connection) => {
  // 根据连接类型或重要性返回不同颜色
  return '#cbd5e0'
}

const getConnectionPath = (connection) => {
  const fromNode = storyNodes.value.find((n) => n.id === connection.from)
  const toNode = storyNodes.value.find((n) => n.id === connection.to)

  if (!fromNode || !toNode) return ''

  const fromX = fromNode.position.x + 60 // 节点右侧
  const fromY = fromNode.position.y
  const toX = toNode.position.x - 60 // 节点左侧
  const toY = toNode.position.y

  // 创建贝塞尔曲线
  const midX = (fromX + toX) / 2
  const controlPointOffset = Math.abs(toY - fromY) * 0.3

  return `M ${fromX} ${fromY} C ${fromX + controlPointOffset} ${fromY}, ${toX - controlPointOffset} ${toY}, ${toX} ${toY}`
}

const getConnectionLabelPosition = (connection) => {
  const fromNode = storyNodes.value.find((n) => n.id === connection.from)
  const toNode = storyNodes.value.find((n) => n.id === connection.to)

  if (!fromNode || !toNode) return { x: 0, y: 0 }

  return {
    x: (fromNode.position.x + toNode.position.x) / 2,
    y: (fromNode.position.y + toNode.position.y) / 2 - 10,
  }
}

const getViewBox = () => {
  const zoom = zoomLevel.value
  const panX = panOffset.value.x
  const panY = panOffset.value.y

  return `${panX} ${panY} ${canvasSize.value.width / zoom} ${canvasSize.value.height / zoom}`
}

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 3)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.1)
}

const fitToScreen = () => {
  zoomLevel.value = 1
  panOffset.value = { x: 0, y: 0 }
}

const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength) + '...'
}

const autoGenerateBranches = () => {
  // 模拟AI生成分支
  const choiceNodes = storyNodes.value.filter((node) => node.type === 'choice')

  choiceNodes.forEach((node) => {
    if (!node.choices || node.choices.length === 0) {
      // 为没有分支的选择节点生成分支
      const branches = [
        { text: '接受挑战', targetNode: '' },
        { text: '寻找替代方案', targetNode: '' },
        { text: '拒绝提议', targetNode: '' },
      ]

      node.choices = branches
    }
  })

  emit('update:modelValue', { nodes: storyNodes.value, connections: connections.value })
  generateAISuggestions()
}

const exportStoryTree = () => {
  const storyTree = {
    nodes: storyNodes.value,
    connections: connections.value,
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      totalNodes: storyNodes.value.length,
      totalConnections: connections.value.length,
    },
  }

  // 创建下载
  const dataStr = JSON.stringify(storyTree, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = `story-tree-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

const generateAISuggestions = () => {
  const suggestions = []

  // 检查缺少结局的路径
  const endingNodes = storyNodes.value.filter((node) => node.type === 'ending')
  if (endingNodes.length === 0) {
    suggestions.push({
      id: 'add-endings',
      type: '结构建议',
      impact: 'high',
      description: '建议添加多个结局节点，为故事提供不同的结束方式',
    })
  }

  // 检查选择节点的分支数
  const choiceNodes = storyNodes.value.filter((node) => node.type === 'choice')
  choiceNodes.forEach((node) => {
    if (!node.choices || node.choices.length < 2) {
      suggestions.push({
        id: `expand-choices-${node.id}`,
        type: '分支建议',
        impact: 'medium',
        description: `节点"${node.title}"的选择分支较少，建议增加更多选择选项`,
      })
    }
  })

  // 检查孤立节点
  const isolatedNodes = storyNodes.value.filter((node) => {
    const hasIncoming = connections.value.some((c) => c.to === node.id)
    const hasOutgoing = connections.value.some((c) => c.from === node.id)
    return !hasIncoming && !hasOutgoing && storyNodes.value.length > 1
  })

  if (isolatedNodes.length > 0) {
    suggestions.push({
      id: 'connect-nodes',
      type: '连接建议',
      impact: 'high',
      description: `${isolatedNodes.length}个节点未与其他节点连接，建议建立故事流`,
    })
  }

  aiSuggestions.value = suggestions
}

const getImpactLabel = (impact) => {
  const labels = {
    low: '低影响',
    medium: '中影响',
    high: '高影响',
  }
  return labels[impact] || impact
}

const applySuggestion = (suggestion) => {
  // TODO: 实现建议应用逻辑
  console.log('Applying suggestion:', suggestion)
}

const dismissSuggestion = (suggestionId) => {
  aiSuggestions.value = aiSuggestions.value.filter((s) => s.id !== suggestionId)
}

// 监听外部数据变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      storyNodes.value = newValue.nodes || []
      connections.value = newValue.connections || []
    }
  },
  { deep: true }
)

// 监听内部数据变化
watch(
  [storyNodes, connections],
  () => {
    emit('update:modelValue', {
      nodes: storyNodes.value,
      connections: connections.value,
    })
  },
  { deep: true }
)

// 初始化
onMounted(() => {
  if (props.modelValue) {
    storyNodes.value = props.modelValue.nodes || []
    connections.value = props.modelValue.connections || []
  }
})
</script>

<style scoped>
.narrative-branching-editor {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.editor-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.editor-actions {
  display: flex;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 14px;
}

.btn-secondary {
  background: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #edf2f7;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a67d8;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  background: white;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-outline:hover {
  background: #f8fafc;
}

.btn-danger {
  background: #e53e3e;
  color: white;
}

.btn-danger:hover {
  background: #c53030;
}

.btn-icon {
  font-size: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 20px 0;
}

.story-tree-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.tree-canvas {
  position: relative;
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
}

.canvas-container {
  height: 600px;
  overflow: hidden;
  position: relative;
}

.story-graph {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.connection-path {
  cursor: pointer;
  stroke-opacity: 0.7;
}

.connection-path:hover,
.connection-selected {
  stroke-opacity: 1;
  stroke-width: 3;
}

.connection-label {
  font-size: 10px;
  fill: #4a5568;
  pointer-events: none;
}

.story-node {
  cursor: pointer;
}

.node-background {
  cursor: pointer;
  transition: all 0.2s;
}

.story-node:hover .node-background {
  stroke-width: 3;
}

.node-title {
  font-size: 11px;
  fill: white;
  font-weight: 500;
  pointer-events: none;
}

.title-selected {
  fill: #667eea;
  font-weight: 600;
}

.node-type-indicator {
  cursor: pointer;
}

.node-type-icon {
  fill: white;
  pointer-events: none;
}

.canvas-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: white;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f8fafc;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.control-btn:hover {
  background: #e2e8f0;
}

.zoom-level {
  text-align: center;
  font-size: 12px;
  color: #718096;
  padding: 4px;
}

.minimap {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 120px;
  height: 90px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.minimap-container {
  width: 100%;
  height: 100%;
  padding: 4px;
}

.minimap-svg {
  width: 100%;
  height: 100%;
}

.node-editor {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.editor-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.node-basic-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
}

.field-input,
.field-select,
.field-textarea {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.field-input:focus,
.field-select:focus,
.field-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.field-textarea {
  resize: vertical;
  min-height: 100px;
}

.node-choices {
  margin-top: 24px;
}

.node-choices h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.choices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.choice-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.choice-target {
  min-width: 150px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.remove-choice-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #fed7d7;
  color: #e53e3e;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background 0.2s;
}

.remove-choice-btn:hover {
  background: #e53e3e;
  color: white;
}

.add-choice-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 2px dashed #cbd5e0;
  border-radius: 6px;
  background: white;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.add-choice-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.add-icon {
  font-size: 16px;
  font-weight: bold;
}

.node-properties {
  margin-top: 24px;
}

.node-properties h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.property-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.property-item.full-width {
  grid-column: 1 / -1;
}

.property-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4a5568;
  cursor: pointer;
}

.property-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #667eea;
}

.property-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.editor-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  grid-column: 1 / -1;
}

.ai-suggestions-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-icon {
  font-size: 20px;
}

.suggestions-content {
  min-height: 100px;
}

.no-suggestions {
  text-align: center;
  color: #718096;
  font-style: italic;
  padding: 40px 20px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suggestion-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #667eea;
}

.suggestion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.suggestion-type {
  font-size: 12px;
  font-weight: 500;
  color: #667eea;
  background: #f8f9ff;
  padding: 4px 8px;
  border-radius: 12px;
}

.suggestion-impact {
  font-size: 12px;
  color: #718096;
}

.suggestion-content {
  margin: 0 0 12px 0;
  color: #4a5568;
  line-height: 1.5;
}

.suggestion-actions {
  display: flex;
  gap: 8px;
}

.apply-btn,
.dismiss-btn {
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  border: none;
}

.apply-btn {
  background: #667eea;
  color: white;
}

.apply-btn:hover {
  background: #5a67d8;
}

.dismiss-btn {
  background: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.dismiss-btn:hover {
  background: #edf2f7;
}

/* Responsive design */
@media (max-width: 1024px) {
  .editor-content {
    grid-template-columns: 1fr;
  }

  .canvas-controls {
    top: 8px;
    right: 8px;
  }

  .minimap {
    bottom: 8px;
    right: 8px;
    width: 100px;
    height: 75px;
  }
}

@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .editor-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .properties-grid {
    grid-template-columns: 1fr;
  }

  .editor-actions {
    flex-direction: column;
  }
}
</style>
