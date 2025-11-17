<template>
  <div class="visualization-tools">
    <!-- 工具栏 -->
    <div class="tools-toolbar">
      <div class="tool-group">
        <button
          v-for="tool in availableTools"
          :key="tool.id"
          @click="activateTool(tool)"
          :class="{ active: activeTool === tool.id }"
          :title="tool.description"
          class="tool-btn"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
          <span class="tool-label">{{ tool.name }}</span>
        </button>
      </div>

      <div class="tool-actions">
        <button @click="exportVisualization" class="action-btn export">
          📤 导出
        </button>
        <button @click="shareVisualization" class="action-btn share">
          🔗 分享
        </button>
        <button @click="resetVisualization" class="action-btn reset">
          🔄 重置
        </button>
      </div>
    </div>

    <!-- 工具内容区域 -->
    <div class="tools-content">
      <!-- 思维导图 -->
      <div v-if="activeTool === 'mindmap'" class="tool-panel mindmap-panel">
        <MindMapVisualizer
          :content="content"
          :selected-text="selectedText"
          @node-click="handleMindMapNodeClick"
          @update="handleMindMapUpdate"
        />
      </div>

      <!-- 大纲视图 -->
      <div v-if="activeTool === 'outline'" class="tool-panel outline-panel">
        <OutlineVisualizer
          :content="content"
          :structure="documentStructure"
          @section-select="handleOutlineSectionSelect"
          @structure-update="handleOutlineUpdate"
        />
      </div>

      <!-- 关系图 -->
      <div v-if="activeTool === 'relationships'" class="tool-panel relationships-panel">
        <RelationshipVisualizer
          :content="content"
          :entities="extractedEntities"
          :relationships="extractedRelationships"
          @entity-click="handleEntityClick"
          @relationship-click="handleRelationshipClick"
        />
      </div>

      <!-- 时间线 -->
      <div v-if="activeTool === 'timeline'" class="tool-panel timeline-panel">
        <TimelineVisualizer
          :content="content"
          :events="timelineEvents"
          @event-click="handleTimelineEventClick"
          @event-add="handleTimelineEventAdd"
        />
      </div>

      <!-- 统计图表 -->
      <div v-if="activeTool === 'charts'" class="tool-panel charts-panel">
        <ChartVisualizer
          :content="content"
          :statistics="contentStatistics"
          @chart-type-change="handleChartTypeChange"
        />
      </div>

      <!-- 代码块预览 -->
      <div v-if="activeTool === 'codeblocks'" class="tool-panel codeblocks-panel">
        <CodeBlockVisualizer
          :content="content"
          :codeBlocks="extractedCodeBlocks"
          @code-block-select="handleCodeBlockSelect"
          @code-block-execute="handleCodeBlockExecute"
        />
      </div>

      <!-- 颜色主题 -->
      <div v-if="activeTool === 'themes'" class="tool-panel themes-panel">
        <ThemeVisualizer
          :content="content"
          :themes="availableThemes"
          :current-theme="currentTheme"
          @theme-apply="handleThemeApply"
          @theme-customize="handleThemeCustomize"
        />
      </div>

      <!-- 阅读模式 -->
      <div v-if="activeTool === 'reading'" class="tool-panel reading-panel">
        <ReadingVisualizer
          :content="content"
          :reading-progress="readingProgress"
          :annotations="readingAnnotations"
          @progress-update="handleReadingProgressUpdate"
          @annotation-add="handleReadingAnnotationAdd"
        />
      </div>
    </div>

    <!-- 工具设置面板 -->
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-header">
        <h4>⚙️ 工具设置</h4>
        <button @click="closeSettings" class="close-btn">✕</button>
      </div>

      <div class="settings-content">
        <div v-if="activeTool === 'mindmap'" class="tool-settings">
          <div class="setting-group">
            <label>布局算法:</label>
            <select v-model="toolSettings.mindmap.layout">
              <option value="hierarchical">层次布局</option>
              <option value="organic">有机布局</option>
              <option value="circular">圆形布局</option>
            </select>
          </div>
          <div class="setting-group">
            <label>节点大小:</label>
            <input
              type="range"
              min="50"
              max="200"
              v-model="toolSettings.mindmap.nodeSize"
              @input="updateToolSettings"
            />
            <span>{{ toolSettings.mindmap.nodeSize }}px</span>
          </div>
        </div>

        <div v-if="activeTool === 'outline'" class="tool-settings">
          <div class="setting-group">
            <label>显示级别:</label>
            <select v-model="toolSettings.outline.maxDepth">
              <option :value="2">2级</option>
              <option :value="3">3级</option>
              <option :value="4">4级</option>
              <option :value="null">全部</option>
            </select>
          </div>
          <div class="setting-group">
            <label>
              <input
                type="checkbox"
                v-model="toolSettings.outline.showWordCount"
              />
              显示字数统计
            </label>
          </div>
        </div>

        <div v-if="activeTool === 'charts'" class="tool-settings">
          <div class="setting-group">
            <label>图表类型:</label>
            <select v-model="toolSettings.charts.defaultType">
              <option value="bar">柱状图</option>
              <option value="line">线图</option>
              <option value="pie">饼图</option>
              <option value="doughnut">环形图</option>
            </select>
          </div>
          <div class="setting-group">
            <label>
              <input
                type="checkbox"
                v-model="toolSettings.charts.showLegend"
              />
              显示图例
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 导出对话框 -->
    <div v-if="showExportDialog" class="export-dialog-overlay" @click="closeExportDialog">
      <div class="export-dialog" @click.stop>
        <h4>📤 导出可视化</h4>
        <div class="export-options">
          <div class="option">
            <label>
              <input type="radio" v-model="exportFormat" value="png" />
              PNG 图片
            </label>
          </div>
          <div class="option">
            <label>
              <input type="radio" v-model="exportFormat" value="svg" />
              SVG 矢量图
            </label>
          </div>
          <div class="option">
            <label>
              <input type="radio" v-model="exportFormat" value="pdf" />
              PDF 文档
            </label>
          </div>
          <div class="option">
            <label>
              <input type="radio" v-model="exportFormat" value="json" />
              JSON 数据
            </label>
          </div>
        </div>
        <div class="export-actions">
          <button @click="closeExportDialog">取消</button>
          <button @click="confirmExport" class="primary">导出</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import MindMapVisualizer from './visualizers/MindMapVisualizer.vue'
import OutlineVisualizer from './visualizers/OutlineVisualizer.vue'
import RelationshipVisualizer from './visualizers/RelationshipVisualizer.vue'
import TimelineVisualizer from './visualizers/TimelineVisualizer.vue'
import ChartVisualizer from './visualizers/ChartVisualizer.vue'
import CodeBlockVisualizer from './visualizers/CodeBlockVisualizer.vue'
import ThemeVisualizer from './visualizers/ThemeVisualizer.vue'
import ReadingVisualizer from './visualizers/ReadingVisualizer.vue'
import { useToast } from '@/composables/useToast'

interface Props {
  content: string
  selectedText?: string
  documentStructure?: any
  extractedEntities?: any[]
  extractedRelationships?: any[]
  timelineEvents?: any[]
  contentStatistics?: any
  extractedCodeBlocks?: any[]
  availableThemes?: any[]
  currentTheme?: string
  readingProgress?: any
  readingAnnotations?: any[]
}

interface Emits {
  (e: 'tool-activated', toolId: string): void
  (e: 'content-update', content: string): void
  (e: 'visualization-export', data: any): void
  (e: 'settings-changed', settings: any): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedText: '',
  documentStructure: () => ({}),
  extractedEntities: () => [],
  extractedRelationships: () => [],
  timelineEvents: () => [],
  contentStatistics: () => ({}),
  extractedCodeBlocks: () => [],
  availableThemes: () => [],
  currentTheme: 'default',
  readingProgress: () => ({}),
  readingAnnotations: () => [],
})

const emit = defineEmits<Emits>()

const { show: showToast } = useToast()

// 状态
const activeTool = ref<string | null>(null)
const showSettings = ref(false)
const showExportDialog = ref(false)
const exportFormat = ref('png')

// 可用工具
const availableTools = ref([
  {
    id: 'mindmap',
    name: '思维导图',
    icon: '🧠',
    description: '将内容转换为思维导图结构',
  },
  {
    id: 'outline',
    name: '大纲视图',
    icon: '📋',
    description: '显示文档的层次结构大纲',
  },
  {
    id: 'relationships',
    name: '关系图',
    icon: '🔗',
    description: '可视化内容中的实体关系',
  },
  {
    id: 'timeline',
    name: '时间线',
    icon: '⏰',
    description: '按时间顺序组织事件',
  },
  {
    id: 'charts',
    name: '统计图表',
    icon: '📊',
    description: '将数据转换为可视化图表',
  },
  {
    id: 'codeblocks',
    name: '代码块',
    icon: '💻',
    description: '突出显示和编辑代码片段',
  },
  {
    id: 'themes',
    name: '主题样式',
    icon: '🎨',
    description: '应用不同的视觉主题',
  },
  {
    id: 'reading',
    name: '阅读模式',
    icon: '📖',
    description: '专注的阅读体验',
  },
])

// 工具设置
const toolSettings = ref({
  mindmap: {
    layout: 'hierarchical',
    nodeSize: 100,
  },
  outline: {
    maxDepth: 3,
    showWordCount: true,
  },
  charts: {
    defaultType: 'bar',
    showLegend: true,
  },
})

// 方法
const activateTool = (tool: any) => {
  if (activeTool.value === tool.id) {
    activeTool.value = null
  } else {
    activeTool.value = tool.id
    emit('tool-activated', tool.id)
  }
}

const exportVisualization = () => {
  showExportDialog.value = true
}

const shareVisualization = () => {
  // 生成分享链接
  const shareUrl = `${window.location.origin}/visualization/${activeTool.value}/${Date.now()}`
  navigator.clipboard.writeText(shareUrl).then(() => {
    showToast('分享链接已复制到剪贴板', 'success')
  }).catch(() => {
    showToast('复制失败，请手动复制链接', 'error')
  })
}

const resetVisualization = () => {
  if (activeTool.value) {
    // 重置当前工具的状态
    showToast(`${availableTools.value.find(t => t.id === activeTool.value)?.name} 已重置`, 'info')
  }
}

const closeSettings = () => {
  showSettings.value = false
}

const updateToolSettings = () => {
  emit('settings-changed', toolSettings.value)
}

const closeExportDialog = () => {
  showExportDialog.value = false
}

const confirmExport = () => {
  const exportData = {
    tool: activeTool.value,
    format: exportFormat.value,
    timestamp: new Date().toISOString(),
    content: props.content,
    // 工具特定的数据
    toolData: getToolSpecificData(),
  }

  emit('visualization-export', exportData)
  closeExportDialog()
  showToast(`可视化已导出为 ${exportFormat.value.toUpperCase()}`, 'success')
}

const getToolSpecificData = () => {
  switch (activeTool.value) {
    case 'mindmap':
      return { layout: toolSettings.value.mindmap.layout }
    case 'outline':
      return props.documentStructure
    case 'relationships':
      return {
        entities: props.extractedEntities,
        relationships: props.extractedRelationships,
      }
    case 'timeline':
      return { events: props.timelineEvents }
    case 'charts':
      return props.contentStatistics
    default:
      return {}
  }
}

// 事件处理器
const handleMindMapNodeClick = (node: any) => {
  // 处理思维导图节点点击
  emit('content-update', `聚焦节点: ${node.label}`)
}

const handleMindMapUpdate = (data: any) => {
  // 处理思维导图更新
  emit('content-update', data)
}

const handleOutlineSectionSelect = (section: any) => {
  // 处理大纲部分选择
  emit('content-update', `选择部分: ${section.title}`)
}

const handleOutlineUpdate = (structure: any) => {
  // 处理大纲更新
  emit('content-update', structure)
}

const handleEntityClick = (entity: any) => {
  // 处理实体点击
  showToast(`实体: ${entity.name}`, 'info')
}

const handleRelationshipClick = (relationship: any) => {
  // 处理关系点击
  showToast(`关系: ${relationship.type}`, 'info')
}

const handleTimelineEventClick = (event: any) => {
  // 处理时间线事件点击
  showToast(`事件: ${event.title}`, 'info')
}

const handleTimelineEventAdd = (event: any) => {
  // 处理时间线事件添加
  emit('content-update', `添加事件: ${event.title}`)
}

const handleChartTypeChange = (type: string) => {
  // 处理图表类型变化
  toolSettings.value.charts.defaultType = type
}

const handleCodeBlockSelect = (codeBlock: any) => {
  // 处理代码块选择
  showToast(`代码块: ${codeBlock.language}`, 'info')
}

const handleCodeBlockExecute = (codeBlock: any) => {
  // 处理代码块执行
  showToast('代码执行功能开发中...', 'info')
}

const handleThemeApply = (theme: any) => {
  // 处理主题应用
  emit('content-update', `应用主题: ${theme.name}`)
}

const handleThemeCustomize = (customizations: any) => {
  // 处理主题自定义
  emit('content-update', customizations)
}

const handleReadingProgressUpdate = (progress: any) => {
  // 处理阅读进度更新
  emit('content-update', progress)
}

const handleReadingAnnotationAdd = (annotation: any) => {
  // 处理阅读注解添加
  emit('content-update', annotation)
}

// 监听内容变化
watch(() => props.content, () => {
  // 当内容更新时，刷新可视化
  if (activeTool.value) {
    // 触发工具重新渲染
  }
})

// 初始化
onMounted(() => {
  // 加载保存的设置
  const savedSettings = localStorage.getItem('visualization-tool-settings')
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings)
      toolSettings.value = { ...toolSettings.value, ...parsed }
    } catch (error) {
      console.error('Failed to load tool settings:', error)
    }
  }
})
</script>

<style scoped>
.visualization-tools {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8f9fa;
  border-left: 1px solid #e1e5e9;
}

.tools-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e1e5e9;
  background: white;
}

.tool-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-btn:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.tool-btn.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.tool-icon {
  font-size: 16px;
}

.tool-label {
  font-weight: 500;
}

.tool-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  border-color: #667eea;
}

.action-btn.export:hover {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.action-btn.share:hover {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.action-btn.reset:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.tools-content {
  flex: 1;
  overflow: hidden;
}

.tool-panel {
  height: 100%;
  padding: 16px;
  background: white;
  border-radius: 8px;
  margin: 16px;
  overflow: hidden;
}

.settings-panel {
  position: absolute;
  top: 60px;
  right: 16px;
  width: 300px;
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
}

.settings-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #e1e5e9;
}

.settings-content {
  padding: 20px;
}

.tool-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-group label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.setting-group select,
.setting-group input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.setting-group input[type="range"] {
  width: 100%;
}

.setting-group label:has(input[type="checkbox"]) {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.setting-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.export-dialog-overlay {
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

.export-dialog {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  max-width: 90vw;
}

.export-dialog h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
}

.export-options {
  margin-bottom: 24px;
}

.option {
  margin-bottom: 12px;
}

.option label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.export-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.export-actions button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.export-actions button.primary {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tools-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .tool-group {
    justify-content: center;
  }

  .tool-actions {
    justify-content: center;
  }

  .tool-panel {
    margin: 8px;
    padding: 12px;
  }

  .settings-panel {
    width: 280px;
    right: 8px;
  }

  .export-dialog {
    width: 90vw;
    margin: 20px;
  }
}
</style>
