<template>
  <div class="orchestration-view">
    <div class="view-header">
      <h1>🤖 Agent编排管理</h1>
      <div class="header-actions">
        <button @click="showCreateWorkflow = true" class="primary-button">
          创建工作流
        </button>
        <button @click="refreshData" class="secondary-button">
          刷新数据
        </button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-grid">
      <div class="stat-card">
        <h3>在线Agent</h3>
        <div class="stat-value">{{ stats.onlineAgents }}/{{ stats.totalAgents }}</div>
        <div class="stat-bar">
          <div
            class="stat-fill"
            :style="{ width: `${(stats.onlineAgents / Math.max(stats.totalAgents, 1)) * 100}%` }"
          ></div>
        </div>
      </div>

      <div class="stat-card">
        <h3>活跃执行</h3>
        <div class="stat-value">{{ stats.activeExecutions }}</div>
      </div>

      <div class="stat-card">
        <h3>平均健康度</h3>
        <div class="stat-value">{{ stats.averageHealthScore }}%</div>
      </div>

      <div class="stat-card">
        <h3>注册工作流</h3>
        <div class="stat-value">{{ stats.registeredWorkflows }}</div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-grid">
      <!-- Agent注册表 -->
      <div class="panel">
        <div class="panel-header">
          <h2>Agent注册表</h2>
          <div class="panel-actions">
            <select v-model="agentFilter" @change="filterAgents" class="filter-select">
              <option value="all">全部类型</option>
              <option value="creation">创世Agent</option>
              <option value="logic">逻辑Agent</option>
              <option value="narrative">叙事Agent</option>
              <option value="custom">自定义Agent</option>
            </select>
          </div>
        </div>

        <div class="agent-list">
          <div
            v-for="agent in filteredAgents"
            :key="agent.id"
            class="agent-card"
            :class="{ offline: agent.status !== 'online' }"
          >
            <div class="agent-header">
              <div class="agent-avatar">
                <span class="agent-type-icon">{{ getAgentTypeIcon(agent.type) }}</span>
              </div>
              <div class="agent-info">
                <h4>{{ agent.name }}</h4>
                <div class="agent-meta">
                  <span class="agent-version">v{{ agent.version }}</span>
                  <span class="agent-status" :class="agent.status">
                    {{ getStatusText(agent.status) }}
                  </span>
                </div>
              </div>
              <div class="agent-health">
                <div class="health-bar">
                  <div
                    class="health-fill"
                    :style="{ width: `${agent.healthScore}%` }"
                    :class="getHealthClass(agent.healthScore)"
                  ></div>
                </div>
                <span class="health-text">{{ agent.healthScore }}</span>
              </div>
            </div>

            <div class="agent-capabilities">
              <div
                v-for="capability in agent.capabilities.slice(0, 3)"
                :key="capability.name"
                class="capability-tag"
              >
                {{ capability.name }}
              </div>
              <div v-if="agent.capabilities.length > 3" class="capability-more">
                +{{ agent.capabilities.length - 3 }} 更多
              </div>
            </div>

            <div class="agent-actions">
              <button @click="viewAgentDetails(agent)" class="action-button">
                详情
              </button>
              <button
                @click="testAgent(agent)"
                class="action-button primary"
                :disabled="agent.status !== 'online'"
              >
                测试
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 工作流执行监控 -->
      <div class="panel">
        <div class="panel-header">
          <h2>工作流执行监控</h2>
        </div>

        <div class="executions-list">
          <div
            v-for="execution in activeExecutions"
            :key="execution.id"
            class="execution-card"
            :class="execution.status"
          >
            <div class="execution-header">
              <h4>{{ getWorkflowName(execution.workflowId) }}</h4>
              <span class="execution-status" :class="execution.status">
                {{ getExecutionStatusText(execution.status) }}
              </span>
            </div>

            <div class="execution-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${getExecutionProgress(execution)}%` }"
                ></div>
              </div>
              <div class="progress-text">
                {{ execution.completedSteps.length }}/{{ execution.completedSteps.length + getRemainingSteps(execution).length }} 步骤
              </div>
            </div>

            <div class="execution-meta">
              <span>开始时间: {{ formatTime(execution.startTime) }}</span>
              <span v-if="execution.currentStep">当前步骤: {{ execution.currentStep }}</span>
            </div>

            <div class="execution-actions">
              <button @click="viewExecutionDetails(execution)" class="action-button">
                详情
              </button>
              <button
                v-if="execution.status === 'running'"
                @click="cancelExecution(execution.id)"
                class="action-button danger"
              >
                取消
              </button>
            </div>
          </div>

          <div v-if="activeExecutions.length === 0" class="empty-state">
            <p>暂无活跃的工作流执行</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建工作流模态框 -->
    <div v-if="showCreateWorkflow" class="modal-overlay" @click="showCreateWorkflow = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>创建工作流</h3>
          <button @click="showCreateWorkflow = false" class="close-button">×</button>
        </div>

        <div class="modal-body">
          <div class="workflow-templates">
            <div
              v-for="template in workflowTemplates"
              :key="template.id"
              class="template-card"
              @click="selectWorkflowTemplate(template)"
            >
              <h4>{{ template.name }}</h4>
              <p>{{ template.description }}</p>
              <div class="template-steps">{{ template.steps.length }} 个步骤</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useToast } from '@/composables/useToast'

const { show: showToast } = useToast()

const stats = ref({
  totalAgents: 0,
  onlineAgents: 0,
  activeExecutions: 0,
  averageHealthScore: 0,
  registeredWorkflows: 0
})

const agents = ref([])
const activeExecutions = ref([])
const agentFilter = ref('all')
const showCreateWorkflow = ref(false)
const loading = ref(false)

const filteredAgents = computed(() => {
  if (agentFilter.value === 'all') {
    return agents.value
  }
  return agents.value.filter(agent => agent.type === agentFilter.value)
})

const workflowTemplates = ref([
  {
    id: 'game-creation',
    name: '游戏创建工作流',
    description: '从用户概念到完整游戏的自动化创建流程',
    steps: [
      { id: 'analyze-concept', name: '概念分析', type: 'logic' },
      { id: 'generate-world', name: '世界生成', type: 'creation' },
      { id: 'create-narrative', name: '叙事构建', type: 'narrative' },
      { id: 'validate-game', name: '游戏验证', type: 'logic' }
    ]
  },
  {
    id: 'story-expansion',
    name: '故事扩展工作流',
    description: '基于现有游戏扩展故事线和分支',
    steps: [
      { id: 'analyze-current', name: '现状分析', type: 'logic' },
      { id: 'generate-branches', name: '分支生成', type: 'creation' },
      { id: 'expand-narrative', name: '叙事扩展', type: 'narrative' }
    ]
  }
])

// 工具函数
const getAgentTypeIcon = (type) => {
  const icons = {
    creation: '🎨',
    logic: '🧠',
    narrative: '📖',
    custom: '🔧'
  }
  return icons[type] || '🤖'
}

const getStatusText = (status) => {
  const texts = {
    online: '在线',
    offline: '离线',
    maintenance: '维护中'
  }
  return texts[status] || status
}

const getHealthClass = (score) => {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'warning'
  return 'critical'
}

const getWorkflowName = (workflowId) => {
  // 在实际实现中，这里应该从工作流定义中获取名称
  return `工作流 ${workflowId.split('-').pop()}`
}

const getExecutionStatusText = (status) => {
  const texts = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const getExecutionProgress = (execution) => {
  const total = execution.completedSteps.length + getRemainingSteps(execution).length
  return total > 0 ? (execution.completedSteps.length / total) * 100 : 0
}

const getRemainingSteps = (execution) => {
  // 在实际实现中，这里应该从工作流定义中获取剩余步骤
  return ['step1', 'step2', 'step3'].filter(step => !execution.completedSteps.includes(step))
}

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString()
}

// 事件处理函数
const refreshData = () => {
  loadData()
}

const viewAgentDetails = (agent) => {
  console.log('查看Agent详情:', agent)
  // TODO: 打开Agent详情模态框
}

const testAgent = async (agent) => {
  if (agent.status !== 'online') {
    showToast('Agent不在线，无法测试', 'error')
    return
  }

  try {
    showToast('正在测试Agent...', 'info')

    // 使用第一个能力进行测试
    const capability = agent.capabilities[0]
    if (!capability) {
      showToast('Agent没有可用能力', 'error')
      return
    }

    const response = await axios.post('/orchestration/schedule', {
      requirements: {
        capability: capability.name,
        priority: 'low',
        maxLatency: capability.latency * 2, // 给双倍时间
        minReliability: 0.5 // 测试时降低要求
      }
    })

    if (response.data.success) {
      showToast(`Agent测试成功! 调度到: ${response.data.data.agent.name}`, 'success')
    } else {
      showToast('Agent测试失败: 没有合适的Agent可用', 'error')
    }
  } catch (error) {
    console.error('Agent测试失败:', error)
    showToast('Agent测试失败', 'error')
  }
}

const viewExecutionDetails = (execution) => {
  console.log('查看执行详情:', execution)
  // TODO: 打开执行详情模态框
}

const cancelExecution = async (executionId) => {
  try {
    const response = await axios.delete(`/orchestration/executions/${executionId}`)

    if (response.data.success) {
      showToast('执行已取消', 'success')
      // 刷新数据
      loadData()
    } else {
      showToast(response.data.message || '取消执行失败', 'error')
    }
  } catch (error) {
    console.error('取消执行失败:', error)
    showToast('取消执行失败', 'error')
  }
}

const selectWorkflowTemplate = async (template) => {
  try {
    showToast('正在创建工作流...', 'info')

    // 转换模板为工作流定义
    const workflowDefinition = {
      id: `${template.id}-${Date.now()}`,
      name: template.name,
      description: template.description,
      version: '1.0.0',
      steps: template.steps.map((step, index) => ({
        id: step.id,
        name: step.name,
        description: `执行${step.name}`,
        agentType: step.type,
        capability: step.id, // 使用step id作为capability
        inputMapping: {},
        outputMapping: {},
        conditions: {
          prerequisiteSteps: index > 0 ? [template.steps[index - 1].id] : []
        },
        timeout: 30000 // 30秒超时
      }))
    }

    // 先注册工作流
    await axios.post('/orchestration/workflows', workflowDefinition)

    // 然后执行工作流
    const executionResponse = await axios.post(`/orchestration/workflows/${workflowDefinition.id}/execute`, {
      context: {
        userId: 'user-1', // 应该从认证状态获取
        timestamp: new Date().toISOString()
      }
    })

    showCreateWorkflow.value = false

    if (executionResponse.data.success) {
      showToast(`工作流"${template.name}"已开始执行`, 'success')
      // 刷新数据以显示新的执行
      setTimeout(() => loadData(), 1000)
    } else {
      showToast('工作流执行失败', 'error')
    }

  } catch (error) {
    console.error('创建工作流失败:', error)
    showToast('创建工作流失败', 'error')
  }
}

// API调用函数
const loadData = async () => {
  loading.value = true
  try {
    // 并行加载所有数据
    const [agentsResponse, executionsResponse, statsResponse] = await Promise.allSettled([
      axios.get('/orchestration/agents'),
      axios.get('/orchestration/executions/active'),
      axios.get('/orchestration/stats')
    ])

    // 处理Agent数据
    if (agentsResponse.status === 'fulfilled') {
      agents.value = agentsResponse.value.data.data || []
    } else {
      console.error('Failed to load agents:', agentsResponse.reason)
      agents.value = []
    }

    // 处理执行数据
    if (executionsResponse.status === 'fulfilled') {
      activeExecutions.value = executionsResponse.value.data.data || []
    } else {
      console.error('Failed to load executions:', executionsResponse.reason)
      activeExecutions.value = []
    }

    // 处理统计数据
    if (statsResponse.status === 'fulfilled') {
      const statsData = statsResponse.value.data.data
      stats.value = {
        totalAgents: statsData.agents.total,
        onlineAgents: statsData.agents.online,
        activeExecutions: activeExecutions.value.length,
        averageHealthScore: Math.round(statsData.agents.averageHealthScore),
        registeredWorkflows: statsData.workflows.registeredWorkflows
      }
    } else {
      console.error('Failed to load stats:', statsResponse.reason)
      // 设置默认统计数据
      stats.value = {
        totalAgents: agents.value.length,
        onlineAgents: agents.value.filter(a => a.status === 'online').length,
        activeExecutions: activeExecutions.value.length,
        averageHealthScore: agents.value.length > 0
          ? Math.round(agents.value.reduce((sum, a) => sum + (a.healthScore || 0), 0) / agents.value.length)
          : 0,
        registeredWorkflows: 0
      }
    }

  } catch (error) {
    console.error('Failed to load orchestration data:', error)
    showToast('加载编排数据失败', 'error')
  } finally {
    loading.value = false
  }
}

const filterAgents = () => {
  // 过滤逻辑已经在computed属性中实现
}

// 初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.orchestration-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.view-header h1 {
  margin: 0;
  color: var(--text-primary, #111827);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.primary-button, .secondary-button {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-button {
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
}

.primary-button:hover {
  background: var(--primary-hover, #2563eb);
}

.secondary-button {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #374151);
  border: 1px solid var(--border-color, #d1d5db);
}

.secondary-button:hover {
  background: var(--bg-hover, #e5e7eb);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-card h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary, #111827);
  margin-bottom: 12px;
}

.stat-bar {
  height: 4px;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 2px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: var(--primary-color, #3b82f6);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.panel {
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.panel-actions {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  background: var(--bg-primary, #ffffff);
  font-size: 14px;
}

.agent-list, .executions-list {
  padding: 0;
}

.agent-card, .execution-card {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  transition: background-color 0.2s;
}

.agent-card:last-child, .execution-card:last-child {
  border-bottom: none;
}

.agent-card:hover, .execution-card:hover {
  background: var(--bg-hover, #f9fafb);
}

.agent-card.offline {
  opacity: 0.6;
}

.agent-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.agent-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary-color, #3b82f6);
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
  color: var(--text-primary, #111827);
}

.agent-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-version {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  background: var(--bg-secondary, #f3f4f6);
  padding: 2px 6px;
  border-radius: 10px;
}

.agent-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.agent-status.online {
  background: var(--success-bg, #dcfce7);
  color: var(--success-text, #166534);
}

.agent-status.offline {
  background: var(--danger-bg, #fee2e2);
  color: var(--danger-text, #991b1b);
}

.agent-status.maintenance {
  background: var(--warning-bg, #fef3c7);
  color: var(--warning-text, #92400e);
}

.agent-health {
  display: flex;
  align-items: center;
  gap: 8px;
}

.health-bar {
  width: 80px;
  height: 6px;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 3px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.health-fill.excellent {
  background: var(--success-color, #10b981);
}

.health-fill.good {
  background: var(--warning-color, #f59e0b);
}

.health-fill.warning {
  background: #f97316;
}

.health-fill.critical {
  background: var(--danger-color, #ef4444);
}

.health-text {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  min-width: 24px;
}

.agent-capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.capability-tag {
  font-size: 12px;
  padding: 4px 8px;
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-secondary, #6b7280);
  border-radius: 12px;
  border: 1px solid var(--border-color, #e5e7eb);
}

.capability-more {
  font-size: 12px;
  padding: 4px 8px;
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-secondary, #6b7280);
  border-radius: 12px;
  font-style: italic;
}

.agent-actions, .execution-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 6px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #374151);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  border-color: var(--primary-color, #3b82f6);
  background: var(--bg-hover, #f3f4f6);
}

.action-button.primary {
  background: var(--primary-color, #3b82f6);
  color: white;
  border-color: var(--primary-color, #3b82f6);
}

.action-button.primary:hover {
  background: var(--primary-hover, #2563eb);
}

.action-button.danger {
  background: var(--danger-color, #ef4444);
  color: white;
  border-color: var(--danger-color, #ef4444);
}

.action-button.danger:hover {
  background: #dc2626;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.execution-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.execution-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.execution-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.execution-status.pending {
  background: var(--warning-bg, #fef3c7);
  color: var(--warning-text, #92400e);
}

.execution-status.running {
  background: var(--primary-bg, #dbeafe);
  color: var(--primary-text, #1e40af);
}

.execution-status.completed {
  background: var(--success-bg, #dcfce7);
  color: var(--success-text, #166534);
}

.execution-status.failed {
  background: var(--danger-bg, #fee2e2);
  color: var(--danger-text, #991b1b);
}

.execution-status.cancelled {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-secondary, #6b7280);
}

.execution-progress {
  margin-bottom: 12px;
}

.progress-bar {
  height: 6px;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color, #3b82f6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}

.execution-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary, #6b7280);
}

.empty-state p {
  margin: 0 0 20px 0;
  font-size: 16px;
}

.create-first-button {
  padding: 12px 24px;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.create-first-button:hover {
  background: var(--primary-hover, #2563eb);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: var(--bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background: var(--bg-hover, #f3f4f6);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.workflow-templates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.template-card {
  padding: 20px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.template-card h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.template-card p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  line-height: 1.4;
}

.template-steps {
  font-size: 12px;
  color: var(--primary-color, #3b82f6);
  font-weight: 500;
}
</style>
