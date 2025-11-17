<template>
  <div class="mindmap-visualizer">
    <div class="visualizer-header">
      <div class="header-info">
        <h4>🧠 思维导图</h4>
        <span class="node-count">{{ nodes.length }} 个节点</span>
      </div>
      <div class="header-actions">
        <button @click="fitToView" class="action-btn" title="适应视图">
          🔍
        </button>
        <button @click="resetZoom" class="action-btn" title="重置缩放">
          🔄
        </button>
        <button @click="toggleFullscreen" class="action-btn" title="全屏">
          ⛶
        </button>
        <select v-model="layoutAlgorithm" @change="updateLayout" class="layout-select">
          <option value="hierarchical">层次布局</option>
          <option value="organic">有机布局</option>
          <option value="circular">圆形布局</option>
        </select>
      </div>
    </div>

    <div class="visualizer-content" ref="svgContainer">
      <svg
        ref="svg"
        :width="svgWidth"
        :height="svgHeight"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @wheel="handleWheel"
      >
        <!-- defs 用于定义箭头和阴影 -->
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#999"
            />
          </marker>

          <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="2" dy="2" result="offset" />
            <feFlood flood-color="#000" flood-opacity="0.3"/>
            <feComposite in2="offset" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- 连线 -->
        <g class="links">
          <path
            v-for="link in links"
            :key="`link-${link.source.id}-${link.target.id}`"
            :d="link.path"
            :class="['link', { highlighted: link.highlighted }]"
            :stroke-width="link.strokeWidth"
            marker-end="url(#arrowhead)"
            @click="handleLinkClick(link)"
          />
        </g>

        <!-- 节点 -->
        <g class="nodes">
          <g
            v-for="node in nodes"
            :key="node.id"
            :class="['node', node.type, { selected: node.selected, root: node.isRoot }]"
            :transform="`translate(${node.x}, ${node.y})`"
            @click="handleNodeClick(node)"
            @dblclick="handleNodeDoubleClick(node)"
            @mousedown="handleNodeMouseDown(node, $event)"
          >
            <!-- 节点阴影 -->
            <circle
              v-if="node.isRoot"
              :r="node.radius + 4"
              fill="#667eea"
              opacity="0.2"
              filter="url(#dropshadow)"
            />

            <!-- 节点背景 -->
            <circle
              :r="node.radius"
              :fill="node.color"
              :stroke="node.selected ? '#667eea' : '#fff'"
              :stroke-width="node.selected ? 3 : 2"
              class="node-circle"
            />

            <!-- 节点图标 -->
            <text
              v-if="node.icon"
              :x="0"
              :y="-8"
              text-anchor="middle"
              font-size="16px"
              fill="#fff"
              class="node-icon"
            >
              {{ node.icon }}
            </text>

            <!-- 节点标签 -->
            <text
              :x="0"
              :y="node.icon ? 8 : 0"
              text-anchor="middle"
              :font-size="node.fontSize"
              :fill="node.textColor"
              class="node-label"
              dominant-baseline="middle"
            >
              {{ node.label }}
            </text>

            <!-- 节点描述 -->
            <text
              v-if="node.description"
              :x="0"
              :y="node.radius + 20"
              text-anchor="middle"
              font-size="12px"
              fill="#666"
              class="node-description"
            >
              {{ node.description.slice(0, 20) }}{{ node.description.length > 20 ? '...' : '' }}
            </text>
          </g>
        </g>

        <!-- 工具提示 -->
        <g v-if="tooltip.visible" class="tooltip">
          <rect
            :x="tooltip.x"
            :y="tooltip.y"
            :width="tooltip.width"
            :height="tooltip.height"
            fill="#333"
            rx="4"
            opacity="0.9"
          />
          <text
            :x="tooltip.x + 8"
            :y="tooltip.y + 16"
            fill="#fff"
            font-size="12px"
          >
            {{ tooltip.content }}
          </text>
        </g>
      </svg>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel" v-if="showControls">
      <div class="zoom-controls">
        <button @click="zoomIn" class="zoom-btn">+</button>
        <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
        <button @click="zoomOut" class="zoom-btn">-</button>
      </div>

      <div class="node-controls">
        <button @click="addNode" class="control-btn" title="添加节点">
          ➕
        </button>
        <button @click="editNode" :disabled="!selectedNode" class="control-btn" title="编辑节点">
          ✏️
        </button>
        <button @click="deleteNode" :disabled="!selectedNode" class="control-btn" title="删除节点">
          🗑️
        </button>
      </div>

      <div class="layout-controls">
        <label>
          <input
            type="checkbox"
            v-model="autoLayout"
            @change="toggleAutoLayout"
          />
          自动布局
        </label>
      </div>
    </div>

    <!-- 节点编辑对话框 -->
    <div v-if="showNodeDialog" class="node-dialog-overlay" @click="closeNodeDialog">
      <div class="node-dialog" @click.stop>
        <h4>{{ editingNode ? '编辑节点' : '添加节点' }}</h4>

        <div class="form-group">
          <label>标签:</label>
          <input
            v-model="nodeForm.label"
            type="text"
            placeholder="节点标签"
            ref="labelInput"
          />
        </div>

        <div class="form-group">
          <label>描述:</label>
          <textarea
            v-model="nodeForm.description"
            placeholder="节点描述（可选）"
            rows="3"
          />
        </div>

        <div class="form-group">
          <label>图标:</label>
          <input
            v-model="nodeForm.icon"
            type="text"
            placeholder="emoji 图标"
            maxlength="2"
          />
        </div>

        <div class="form-group">
          <label>颜色:</label>
          <input
            v-model="nodeForm.color"
            type="color"
          />
        </div>

        <div class="dialog-actions">
          <button @click="closeNodeDialog">取消</button>
          <button @click="saveNode" class="primary">
            {{ editingNode ? '保存' : '添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as d3 from 'd3'
import { useToast } from '@/composables/useToast'

interface Props {
  content: string
  selectedText?: string
  layout?: 'hierarchical' | 'organic' | 'circular'
  nodeSize?: number
}

interface Emits {
  (e: 'node-click', node: any): void
  (e: 'update', data: any): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedText: '',
  layout: 'hierarchical',
  nodeSize: 100,
})

const emit = defineEmits<Emits>()

const { show: showToast } = useToast()

// 引用
const svgContainer = ref<HTMLElement>()
const svg = ref<SVGElement>()

// 状态
const layoutAlgorithm = ref(props.layout)
const nodes = ref<any[]>([])
const links = ref<any[]>([])
const selectedNode = ref<any>(null)
const zoom = ref(1)
const pan = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const showControls = ref(true)
const showNodeDialog = ref(false)
const editingNode = ref<any>(null)
const autoLayout = ref(true)
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  content: '',
})

// SVG 尺寸
const svgWidth = computed(() => (svgContainer.value?.clientWidth || 800))
const svgHeight = computed(() => (svgContainer.value?.clientHeight || 600))

// 节点表单
const nodeForm = ref({
  label: '',
  description: '',
  icon: '',
  color: '#667eea',
})

// 模拟数据
const mockData = {
  id: 'root',
  label: '主要概念',
  description: '文档的核心主题',
  icon: '🎯',
  color: '#667eea',
  children: [
    {
      id: 'child1',
      label: '子主题1',
      description: '第一个子主题',
      icon: '📝',
      color: '#28a745',
      children: [
        { id: 'grandchild1', label: '细节1', description: '具体细节', icon: '💡', color: '#ffc107' },
        { id: 'grandchild2', label: '细节2', description: '另一个细节', icon: '🔍', color: '#dc3545' },
      ],
    },
    {
      id: 'child2',
      label: '子主题2',
      description: '第二个子主题',
      icon: '📊',
      color: '#17a2b8',
      children: [
        { id: 'grandchild3', label: '分析1', description: '数据分析', icon: '📈', color: '#6f42c1' },
      ],
    },
    {
      id: 'child3',
      label: '结论',
      description: '总结性内容',
      icon: '✅',
      color: '#fd7e14',
    },
  ],
}

// 方法
const initializeMindMap = () => {
  // 从内容中提取节点
  const extractedNodes = extractNodesFromContent(props.content)

  // 如果没有提取到节点，使用模拟数据
  const mindMapData = extractedNodes.length > 0 ? buildHierarchy(extractedNodes) : mockData

  // 转换数据格式
  nodes.value = flattenHierarchy(mindMapData)

  // 生成连线
  links.value = generateLinks(nodes.value)

  // 应用布局
  applyLayout()

  // 居中视图
  fitToView()
}

const extractNodesFromContent = (content: string) => {
  // 简单的文本分析提取节点
  const lines = content.split('\n').filter(line => line.trim())
  const nodes: any[] = []

  lines.forEach((line, index) => {
    if (line.length > 10) { // 只处理较长的行
      nodes.push({
        id: `node_${index}`,
        label: line.slice(0, 30) + (line.length > 30 ? '...' : ''),
        description: line,
        type: 'content',
        color: getRandomColor(),
      })
    }
  })

  return nodes
}

const buildHierarchy = (flatNodes: any[]) => {
  // 简化的层次结构构建
  if (flatNodes.length === 0) return mockData

  return {
    id: 'root',
    label: '文档结构',
    description: '从内容中提取的结构',
    icon: '📄',
    color: '#667eea',
    children: flatNodes.slice(0, 5).map((node, index) => ({
      ...node,
      id: `level1_${index}`,
      children: flatNodes.slice(5 + index * 2, 5 + (index + 1) * 2),
    })),
  }
}

const flattenHierarchy = (root: any, level = 0): any[] => {
  const result: any[] = []

  const processNode = (node: any, depth: number, parent?: any) => {
    const processedNode = {
      ...node,
      level: depth,
      isRoot: depth === 0,
      radius: node.isRoot ? 40 : Math.max(20, 30 - depth * 3),
      fontSize: node.isRoot ? 16 : Math.max(12, 14 - depth * 1),
      textColor: node.isRoot ? '#fff' : '#333',
      selected: false,
      x: 0,
      y: 0,
      parentId: parent?.id,
    }

    result.push(processedNode)

    if (node.children) {
      node.children.forEach((child: any) => processNode(child, depth + 1, processedNode))
    }
  }

  processNode(root, level)
  return result
}

const generateLinks = (nodeList: any[]) => {
  const links: any[] = []

  nodeList.forEach(node => {
    if (node.parentId) {
      const parent = nodeList.find(n => n.id === node.parentId)
      if (parent) {
        links.push({
          source: parent,
          target: node,
          path: '',
          strokeWidth: 2,
          highlighted: false,
        })
      }
    }
  })

  return links
}

const applyLayout = () => {
  const width = svgWidth.value
  const height = svgHeight.value

  switch (layoutAlgorithm.value) {
    case 'hierarchical':
      applyHierarchicalLayout(width, height)
      break
    case 'organic':
      applyOrganicLayout(width, height)
      break
    case 'circular':
      applyCircularLayout(width, height)
      break
  }

  // 更新连线路径
  updateLinkPaths()
}

const applyHierarchicalLayout = (width: number, height: number) => {
  const rootNodes = nodes.value.filter(n => n.level === 0)
  const childNodes = nodes.value.filter(n => n.level > 0)

  // 根节点居中
  rootNodes.forEach(node => {
    node.x = width / 2
    node.y = height / 2
  })

  // 按层级排列子节点
  const levels = [...new Set(childNodes.map(n => n.level))]
  const levelHeight = height / (levels.length + 1)

  levels.forEach((level, levelIndex) => {
    const levelNodes = childNodes.filter(n => n.level === level)
    const levelY = levelHeight * (levelIndex + 1)
    const nodeSpacing = width / (levelNodes.length + 1)

    levelNodes.forEach((node, index) => {
      node.x = nodeSpacing * (index + 1)
      node.y = levelY
    })
  })
}

const applyOrganicLayout = (width: number, height: number) => {
  // 使用力导向布局
  const simulation = d3.forceSimulation(nodes.value)
    .force('link', d3.forceLink(links.value).id((d: any) => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius((d: any) => d.radius + 10))

  simulation.tick(100)

  simulation.stop()
}

const applyCircularLayout = (width: number, height: number) => {
  const centerX = width / 2
  const centerY = height / 2

  // 根节点居中
  const rootNode = nodes.value.find(n => n.isRoot)
  if (rootNode) {
    rootNode.x = centerX
    rootNode.y = centerY
  }

  // 子节点按圆形排列
  const childNodes = nodes.value.filter(n => !n.isRoot)
  const radius = Math.min(width, height) / 3
  const angleStep = (2 * Math.PI) / childNodes.length

  childNodes.forEach((node, index) => {
    const angle = angleStep * index
    node.x = centerX + radius * Math.cos(angle)
    node.y = centerY + radius * Math.sin(angle)
  })
}

const updateLinkPaths = () => {
  links.value.forEach(link => {
    const path = d3.path()
    path.moveTo(link.source.x, link.source.y)
    path.lineTo(link.target.x, link.target.y)
    link.path = path.toString()
  })
}

const getRandomColor = () => {
  const colors = ['#667eea', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14', '#20c997']
  return colors[Math.floor(Math.random() * colors.length)]
}

// 事件处理
const handleNodeClick = (node: any) => {
  // 清除之前的选择
  nodes.value.forEach(n => n.selected = false)

  // 选择当前节点
  node.selected = true
  selectedNode.value = node

  // 高亮相关连线
  links.value.forEach(link => {
    link.highlighted = link.source.id === node.id || link.target.id === node.id
  })

  emit('node-click', node)
}

const handleNodeDoubleClick = (node: any) => {
  editNode()
}

const handleNodeMouseDown = (node: any, event: MouseEvent) => {
  event.stopPropagation()
  // 可以添加拖拽功能
}

const handleLinkClick = (link: any) => {
  // 处理连线点击
  showToast(`连接: ${link.source.label} → ${link.target.label}`, 'info')
}

const handleMouseDown = (event: MouseEvent) => {
  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
}

const handleMouseMove = (event: MouseEvent) => {
  if (isDragging.value) {
    const dx = event.clientX - dragStart.value.x
    const dy = event.clientY - dragStart.value.y

    pan.value.x += dx
    pan.value.y += dy

    dragStart.value = { x: event.clientX, y: event.clientY }

    // 应用平移变换
    updateTransform()
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()

  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
  zoom.value *= zoomFactor

  // 限制缩放范围
  zoom.value = Math.max(0.1, Math.min(5, zoom.value))

  updateTransform()
}

const updateTransform = () => {
  const transform = `translate(${pan.value.x}, ${pan.value.y}) scale(${zoom.value})`
  d3.select(svg.value).select('.nodes').attr('transform', transform)
  d3.select(svg.value).select('.links').attr('transform', transform)
}

// 控制方法
const fitToView = () => {
  if (nodes.value.length === 0) return

  const padding = 50
  const bounds = {
    x1: d3.min(nodes.value, d => d.x - d.radius) || 0,
    y1: d3.min(nodes.value, d => d.y - d.radius) || 0,
    x2: d3.max(nodes.value, d => d.x + d.radius) || 0,
    y2: d3.max(nodes.value, d => d.y + d.radius) || 0,
  }

  const contentWidth = bounds.x2 - bounds.x1
  const contentHeight = bounds.y2 - bounds.y1

  const scaleX = (svgWidth.value - padding * 2) / contentWidth
  const scaleY = (svgHeight.value - padding * 2) / contentHeight
  const newScale = Math.min(scaleX, scaleY, 1)

  zoom.value = newScale

  const centerX = (bounds.x1 + bounds.x2) / 2
  const centerY = (bounds.y1 + bounds.y2) / 2

  pan.value.x = svgWidth.value / 2 - centerX * newScale
  pan.value.y = svgHeight.value / 2 - centerY * newScale

  updateTransform()
}

const resetZoom = () => {
  zoom.value = 1
  pan.value = { x: 0, y: 0 }
  updateTransform()
}

const toggleFullscreen = () => {
  // 全屏功能
  showToast('全屏功能开发中...', 'info')
}

const updateLayout = () => {
  applyLayout()
  fitToView()
}

const zoomIn = () => {
  zoom.value *= 1.2
  updateTransform()
}

const zoomOut = () => {
  zoom.value *= 0.8
  updateTransform()
}

const addNode = () => {
  editingNode.value = null
  nodeForm.value = {
    label: '',
    description: '',
    icon: '',
    color: '#667eea',
  }
  showNodeDialog.value = true

  nextTick(() => {
    const labelInput = document.querySelector('.node-dialog input') as HTMLInputElement
    labelInput?.focus()
  })
}

const editNode = () => {
  if (!selectedNode.value) return

  editingNode.value = selectedNode.value
  nodeForm.value = {
    label: selectedNode.value.label,
    description: selectedNode.value.description || '',
    icon: selectedNode.value.icon || '',
    color: selectedNode.value.color,
  }
  showNodeDialog.value = true
}

const deleteNode = () => {
  if (!selectedNode.value) return

  const index = nodes.value.indexOf(selectedNode.value)
  if (index > -1) {
    nodes.value.splice(index, 1)
    selectedNode.value = null

    // 重新生成连线
    links.value = generateLinks(nodes.value)
    applyLayout()

    showToast('节点已删除', 'success')
  }
}

const closeNodeDialog = () => {
  showNodeDialog.value = false
  editingNode.value = null
}

const saveNode = () => {
  if (!nodeForm.value.label.trim()) {
    showToast('节点标签不能为空', 'error')
    return
  }

  if (editingNode.value) {
    // 编辑现有节点
    Object.assign(editingNode.value, nodeForm.value)
  } else {
    // 添加新节点
    const newNode = {
      id: `node_${Date.now()}`,
      level: selectedNode.value?.level + 1 || 1,
      isRoot: false,
      radius: 25,
      fontSize: 12,
      textColor: '#333',
      selected: false,
      parentId: selectedNode.value?.id,
      x: Math.random() * svgWidth.value,
      y: Math.random() * svgHeight.value,
      ...nodeForm.value,
    }

    nodes.value.push(newNode)

    // 添加连线
    if (selectedNode.value) {
      links.value.push({
        source: selectedNode.value,
        target: newNode,
        path: '',
        strokeWidth: 2,
        highlighted: false,
      })
    }
  }

  applyLayout()
  closeNodeDialog()

  showToast(editingNode.value ? '节点已更新' : '节点已添加', 'success')
}

const toggleAutoLayout = () => {
  if (autoLayout.value) {
    applyLayout()
  }
}

// 监听变化
watch(() => props.content, () => {
  initializeMindMap()
})

watch(() => props.layout, (newLayout) => {
  layoutAlgorithm.value = newLayout
  applyLayout()
})

// 生命周期
onMounted(() => {
  initializeMindMap()
})

onUnmounted(() => {
  // 清理
})
</script>

<style scoped>
.mindmap-visualizer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.visualizer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
}

.header-info h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.node-count {
  font-size: 12px;
  color: #666;
  margin-left: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.layout-select {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
}

.visualizer-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.visualizer-content svg {
  cursor: grab;
}

.visualizer-content svg:active {
  cursor: grabbing;
}

.link {
  fill: none;
  stroke: #999;
  stroke-width: 2px;
  opacity: 0.6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.link:hover {
  stroke: #667eea;
  stroke-width: 3px;
  opacity: 1;
}

.link.highlighted {
  stroke: #667eea;
  stroke-width: 3px;
  opacity: 1;
}

.node {
  cursor: pointer;
  transition: all 0.2s ease;
}

.node:hover {
  filter: brightness(1.1);
}

.node.selected {
  filter: drop-shadow(0 0 8px rgba(102, 126, 234, 0.5));
}

.node-circle {
  transition: all 0.2s ease;
}

.node.root .node-circle {
  stroke-width: 4px;
}

.node-icon {
  pointer-events: none;
  user-select: none;
}

.node-label {
  pointer-events: none;
  user-select: none;
}

.node-description {
  pointer-events: none;
  user-select: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.node:hover .node-description {
  opacity: 1;
}

.control-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-top: 1px solid #e1e5e9;
  background: #f8f9fa;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-level {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: center;
}

.node-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.control-btn:hover:not(:disabled) {
  border-color: #667eea;
  background: #f8f9ff;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.layout-controls {
  font-size: 12px;
}

.layout-controls label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.node-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.node-dialog {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 400px;
  max-width: 90vw;
}

.node-dialog h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.dialog-actions button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.dialog-actions button.primary {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .visualizer-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .control-panel {
    flex-direction: column;
    gap: 8px;
  }

  .node-controls {
    justify-content: center;
  }

  .node-dialog {
    width: 90vw;
    margin: 20px;
  }
}
</style>
