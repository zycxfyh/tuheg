<template>
  <div class="multi-agent-collaboration">
    <!-- 页面头部 -->
    <div class="collaboration-header">
      <div class="header-content">
        <h1 class="collaboration-title">
          <i class="icon-users"></i>
          多Agent协作系统
        </h1>
        <p class="collaboration-subtitle">见证AI Agent间的智能协作，实现复杂任务的分布式解决</p>

        <div class="system-status">
          <div class="status-indicator" :class="systemHealth.status">
            <i class="icon-circle"></i>
            系统状态: {{ systemHealth.status === 'healthy' ? '正常' : '异常' }}
          </div>
          <div class="agent-count">
            <i class="icon-robot"></i>
            在线Agent: {{ agentStats.total || 0 }}
          </div>
        </div>
      </div>
    </div>

    <div class="collaboration-content">
      <!-- 侧边栏 - Agent状态面板 -->
      <aside class="collaboration-sidebar">
        <div class="agents-panel">
          <h3>Agent状态</h3>
          <div class="agent-list">
            <div
              v-for="agent in agents"
              :key="agent.id"
              :class="['agent-item', agent.status.toLowerCase()]"
            >
              <div class="agent-avatar">
                <i :class="getAgentIcon(agent.type)"></i>
              </div>
              <div class="agent-info">
                <div class="agent-name">{{ agent.displayName }}</div>
                <div class="agent-type">{{ getAgentTypeName(agent.type) }}</div>
                <div class="agent-status">
                  <span :class="['status-dot', agent.status.toLowerCase()]"></span>
                  {{ getAgentStatusName(agent.status) }}
                </div>
              </div>
              <div class="agent-metrics">
                <div class="metric">
                  <span class="metric-value">{{ agent.workload?.activeTasks || 0 }}</span>
                  <span class="metric-label">活跃任务</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <h3>快速操作</h3>
          <button @click="createDemoCollaboration" class="action-btn primary">
            <i class="icon-play"></i>
            启动演示协作
          </button>
          <button @click="createRandomTask" class="action-btn secondary">
            <i class="icon-plus"></i>
            创建随机任务
          </button>
          <button @click="showAgentOptimization" class="action-btn tertiary">
            <i class="icon-cog"></i>
            Agent优化
          </button>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="collaboration-main">
        <!-- 协作画布 -->
        <div class="collaboration-canvas">
          <div class="canvas-header">
            <h2>协作网络</h2>
            <div class="canvas-controls">
              <button :class="{ active: viewMode === 'network' }" @click="viewMode = 'network'">
                网络视图
              </button>
              <button :class="{ active: viewMode === 'timeline' }" @click="viewMode = 'timeline'">
                时间线视图
              </button>
              <button :class="{ active: viewMode === 'tasks' }" @click="viewMode = 'tasks'">
                任务视图
              </button>
            </div>
          </div>

          <!-- 网络视图 -->
          <div v-if="viewMode === 'network'" class="network-view">
            <div class="agent-network">
              <div
                v-for="agent in agents"
                :key="agent.id"
                :class="['network-node', agent.type.toLowerCase()]"
                :style="getNodePosition(agent.id)"
              >
                <div class="node-avatar">
                  <i :class="getAgentIcon(agent.type)"></i>
                </div>
                <div class="node-label">{{ agent.displayName }}</div>
                <div class="node-status" :class="agent.status.toLowerCase()">
                  <span class="status-indicator"></span>
                </div>
              </div>

              <!-- 协作连接线 -->
              <svg class="connection-lines" v-if="activeCollaborations.length > 0">
                <line
                  v-for="collaboration in activeCollaborations"
                  :key="collaboration.id"
                  :x1="getNodeX(collaboration.leaderId)"
                  :y1="getNodeY(collaboration.leaderId)"
                  :x2="getNodeX(collaboration.participants[0]?.id)"
                  :y2="getNodeY(collaboration.participants[0]?.id)"
                  class="connection-line"
                />
              </svg>
            </div>

            <div v-if="activeCollaborations.length === 0" class="empty-network">
              <div class="empty-state">
                <i class="icon-users"></i>
                <h3>暂无活跃协作</h3>
                <p>点击"启动演示协作"开始体验多Agent协作</p>
              </div>
            </div>
          </div>

          <!-- 时间线视图 -->
          <div v-if="viewMode === 'timeline'" class="timeline-view">
            <div class="timeline-container">
              <div
                v-for="event in timelineEvents"
                :key="event.id"
                :class="['timeline-event', event.type]"
                :style="{ left: getEventPosition(event.timestamp) + '%' }"
              >
                <div class="event-dot"></div>
                <div class="event-content">
                  <div class="event-title">{{ event.title }}</div>
                  <div class="event-description">{{ event.description }}</div>
                  <div class="event-time">{{ formatTime(event.timestamp) }}</div>
                </div>
              </div>
            </div>

            <div class="timeline-axis">
              <div class="time-marker" v-for="hour in 24" :key="hour">{{ hour }}:00</div>
            </div>
          </div>

          <!-- 任务视图 -->
          <div v-if="viewMode === 'tasks'" class="tasks-view">
            <div class="tasks-grid">
              <div
                v-for="task in recentTasks"
                :key="task.id"
                :class="['task-card', task.status.toLowerCase()]"
              >
                <div class="task-header">
                  <h4>{{ task.title }}</h4>
                  <span :class="['task-status', task.status.toLowerCase()]">
                    {{ getTaskStatusName(task.status) }}
                  </span>
                </div>

                <p class="task-description">{{ task.description }}</p>

                <div class="task-meta">
                  <div
                    class="task-priority"
                    :class="task.priority >= 8 ? 'high' : task.priority >= 4 ? 'medium' : 'low'"
                  >
                    优先级: {{ task.priority }}
                  </div>
                  <div class="task-complexity">
                    复杂度: {{ getComplexityName(task.complexity) }}
                  </div>
                </div>

                <div v-if="task.agents && task.agents.length > 0" class="task-assignment">
                  <div class="assigned-agent">
                    <i class="icon-user"></i>
                    {{ task.agents[0].agent.displayName }}
                  </div>
                  <div class="task-progress">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        :style="{ width: task.agents[0].progress * 100 + '%' }"
                      ></div>
                    </div>
                    <span class="progress-text"
                      >{{ Math.round(task.agents[0].progress * 100) }}%</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 实时消息面板 -->
        <div class="messages-panel">
          <div class="panel-header">
            <h3>实时通信</h3>
            <div class="message-controls">
              <button @click="clearMessages" class="clear-btn">
                <i class="icon-trash"></i>
              </button>
            </div>
          </div>

          <div class="messages-container" ref="messagesContainer">
            <div
              v-for="message in recentMessages"
              :key="message.id"
              :class="['message-item', message.messageType.toLowerCase()]"
            >
              <div class="message-avatar">
                <i :class="getMessageIcon(message.messageType)"></i>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-sender">{{ message.sender?.displayName || '系统' }}</span>
                  <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                </div>
                <div class="message-text">{{ message.message }}</div>
                <div v-if="message.receiver" class="message-receiver">
                  → {{ message.receiver.displayName }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- 右侧面板 - 协作详情 -->
      <aside class="collaboration-details">
        <div class="active-collaborations">
          <h3>活跃协作</h3>
          <div class="collaboration-list">
            <div
              v-for="collaboration in activeCollaborations"
              :key="collaboration.id"
              class="collaboration-item"
              :class="collaboration.status.toLowerCase()"
            >
              <div class="collaboration-header">
                <h4>{{ collaboration.name }}</h4>
                <span :class="['collaboration-status', collaboration.status.toLowerCase()]">
                  {{ getCollaborationStatusName(collaboration.status) }}
                </span>
              </div>

              <p class="collaboration-goal">{{ collaboration.goal }}</p>

              <div class="collaboration-participants">
                <div
                  class="participant"
                  v-for="participant in collaboration.participants.slice(0, 3)"
                  :key="participant.id"
                >
                  <i :class="getAgentIcon(participant.type)"></i>
                  <span>{{ participant.displayName }}</span>
                </div>
                <div v-if="collaboration.participants.length > 3" class="participant-more">
                  +{{ collaboration.participants.length - 3 }}
                </div>
              </div>

              <div class="collaboration-progress">
                <div class="progress-stats">
                  <span
                    >{{
                      collaboration.tasks?.filter((t) => t.status === 'COMPLETED').length || 0
                    }}
                    / {{ collaboration.tasks?.length || 0 }} 任务</span
                  >
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{
                      width:
                        collaboration.tasks?.length > 0
                          ? (collaboration.tasks.filter((t) => t.status === 'COMPLETED').length /
                              collaboration.tasks.length) *
                              100 +
                            '%'
                          : '0%',
                    }"
                  ></div>
                </div>
              </div>
            </div>

            <div v-if="activeCollaborations.length === 0" class="empty-collaborations">
              <i class="icon-users"></i>
              <p>暂无活跃协作</p>
            </div>
          </div>
        </div>

        <div class="system-metrics">
          <h3>系统指标</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-icon">
                <i class="icon-tasks"></i>
              </div>
              <div class="metric-data">
                <div class="metric-value">{{ systemMetrics.totalTasks || 0 }}</div>
                <div class="metric-label">总任务数</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">
                <i class="icon-check-circle"></i>
              </div>
              <div class="metric-data">
                <div class="metric-value">{{ systemMetrics.completedTasks || 0 }}</div>
                <div class="metric-label">完成任务</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">
                <i class="icon-messages"></i>
              </div>
              <div class="metric-data">
                <div class="metric-value">{{ systemMetrics.totalMessages || 0 }}</div>
                <div class="metric-label">消息数量</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">
                <i class="icon-trending-up"></i>
              </div>
              <div class="metric-data">
                <div class="metric-value">{{ systemMetrics.successRate || 0 }}%</div>
                <div class="metric-label">成功率</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- 演示协作模态框 -->
    <DemoCollaborationModal
      v-if="showDemoModal"
      :visible="showDemoModal"
      @close="showDemoModal = false"
      @start="startDemoCollaboration"
    />
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import DemoCollaborationModal from '../components/collaboration/DemoCollaborationModal.vue'
import { agentCollaborationApi } from '../services/agentCollaborationApi'

// 响应式数据
const agents = ref([])
const activeCollaborations = ref([])
const recentTasks = ref([])
const recentMessages = ref([])
const systemHealth = ref({ status: 'healthy' })
const agentStats = ref({})
const systemMetrics = ref({})
const viewMode = ref('network')
const showDemoModal = ref(false)

// 时间线事件
const timelineEvents = ref([])

// 节点位置（用于网络视图）
const nodePositions = ref(new Map())

// 生命周期
onMounted(async () => {
  await loadInitialData()
  startRealTimeUpdates()
})

onUnmounted(() => {
  stopRealTimeUpdates()
})

// 方法
async function loadInitialData() {
  try {
    const [agentsData, collaborationsData, tasksData, messagesData, healthData, metricsData] =
      await Promise.all([
        agentCollaborationApi.getAgents(),
        agentCollaborationApi.getActiveCollaborations(),
        agentCollaborationApi.getTasks({ limit: 20 }),
        loadRecentMessages(),
        agentCollaborationApi.getSystemHealth(),
        loadSystemMetrics(),
      ])

    agents.value = agentsData
    activeCollaborations.value = collaborationsData
    recentTasks.value = tasksData.tasks
    recentMessages.value = messagesData
    systemHealth.value = healthData
    systemMetrics.value = metricsData

    // 计算Agent统计
    agentStats.value = {
      total: agentsData.length,
      online: agentsData.filter((a) => a.status === 'ONLINE').length,
      busy: agentsData.filter((a) => a.status === 'BUSY').length,
    }

    // 初始化节点位置
    initializeNodePositions()
  } catch (error) {
    console.error('Failed to load initial data:', error)
  }
}

async function loadRecentMessages() {
  // 这里应该从API获取消息，暂时模拟数据
  return [
    {
      id: '1',
      sender: { displayName: '创作Agent' },
      receiver: null,
      message: '开始处理创作任务...',
      messageType: 'STATUS',
      createdAt: new Date(Date.now() - 300000),
    },
    {
      id: '2',
      sender: { displayName: '逻辑Agent' },
      receiver: { displayName: '创作Agent' },
      message: '分析任务需求中...',
      messageType: 'COMMAND',
      createdAt: new Date(Date.now() - 240000),
    },
  ]
}

async function loadSystemMetrics() {
  return {
    totalTasks: 45,
    completedTasks: 32,
    totalMessages: 128,
    successRate: 87,
  }
}

function initializeNodePositions() {
  agents.value.forEach((agent, index) => {
    const angle = (index / agents.value.length) * 2 * Math.PI
    const radius = 200
    const centerX = 300
    const centerY = 200

    nodePositions.value.set(agent.id, {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    })
  })
}

function getNodePosition(agentId) {
  const pos = nodePositions.value.get(agentId)
  return pos ? { left: pos.x + 'px', top: pos.y + 'px' } : {}
}

function getNodeX(agentId) {
  return nodePositions.value.get(agentId)?.x || 0
}

function getNodeY(agentId) {
  return nodePositions.value.get(agentId)?.y || 0
}

function getAgentIcon(type) {
  const icons = {
    GENERIC: 'icon-robot',
    CREATION: 'icon-palette',
    LOGIC: 'icon-brain',
    NARRATIVE: 'icon-book',
    CRITIC: 'icon-search',
    SPECIALIST: 'icon-star',
  }
  return icons[type] || 'icon-robot'
}

function getAgentTypeName(type) {
  const names = {
    GENERIC: '通用',
    CREATION: '创作',
    LOGIC: '逻辑',
    NARRATIVE: '叙事',
    CRITIC: '批评',
    SPECIALIST: '专家',
  }
  return names[type] || '未知'
}

function getAgentStatusName(status) {
  const names = {
    OFFLINE: '离线',
    ONLINE: '在线',
    BUSY: '忙碌',
    MAINTENANCE: '维护',
  }
  return names[status] || '未知'
}

function getTaskStatusName(status) {
  const names = {
    PENDING: '待处理',
    ASSIGNED: '已分配',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    FAILED: '失败',
    CANCELLED: '已取消',
  }
  return names[status] || '未知'
}

function getComplexityName(complexity) {
  const names = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    CRITICAL: '关键',
  }
  return names[complexity] || '未知'
}

function getCollaborationStatusName(status) {
  const names = {
    ACTIVE: '活跃',
    COMPLETED: '完成',
    SUSPENDED: '暂停',
    TERMINATED: '终止',
  }
  return names[status] || '未知'
}

function getMessageIcon(type) {
  const icons = {
    TEXT: 'icon-message',
    COMMAND: 'icon-terminal',
    RESULT: 'icon-check',
    ERROR: 'icon-alert',
    STATUS: 'icon-info',
  }
  return icons[type] || 'icon-message'
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function getEventPosition(timestamp) {
  const now = new Date()
  const eventTime = new Date(timestamp)
  const hoursAgo = (now - eventTime) / (1000 * 60 * 60)

  // 24小时内的事件，按时间比例定位
  return Math.max(0, Math.min(100, ((24 - hoursAgo) / 24) * 100))
}

function createDemoCollaboration() {
  showDemoModal.value = true
}

async function startDemoCollaboration(config) {
  try {
    // 创建演示协作
    const collaboration = await agentCollaborationApi.createCollaboration({
      participantIds: config.participantIds,
      config: {
        goal: config.goal,
        strategy: 'round-robin',
      },
    })

    // 创建演示任务
    const tasks = await Promise.all(
      config.tasks.map((taskData) =>
        agentCollaborationApi.createTask({
          ...taskData,
          gameId: null, // 可以关联到当前游戏
        })
      )
    )

    // 为协作分配任务
    for (const task of tasks) {
      await agentCollaborationApi.assignCollaborationTask(
        collaboration.id,
        task.id,
        config.participantIds[0] // 分配给第一个参与者
      )
    }

    showDemoModal.value = false
    await loadInitialData() // 刷新数据

    alert('演示协作已启动！观察Agent间的智能协作。')
  } catch (error) {
    console.error('Failed to start demo collaboration:', error)
    alert('启动演示协作失败，请重试')
  }
}

async function createRandomTask() {
  try {
    const taskTypes = ['CREATION', 'ANALYSIS', 'REVIEW', 'OPTIMIZATION']
    const complexities = ['LOW', 'MEDIUM', 'HIGH']

    const randomTask = {
      title: `随机任务 ${Date.now()}`,
      description: '这是一个自动生成的演示任务，用于测试多Agent协作系统。',
      type: taskTypes[Math.floor(Math.random() * taskTypes.length)],
      priority: Math.floor(Math.random() * 10) + 1,
      complexity: complexities[Math.floor(Math.random() * complexities.length)],
      input: { demo: true },
      requirements: { estimatedDuration: Math.floor(Math.random() * 60) + 15 },
    }

    await agentCollaborationApi.createTask(randomTask)
    await loadInitialData()

    alert('随机任务已创建！')
  } catch (error) {
    console.error('Failed to create random task:', error)
    alert('创建任务失败，请重试')
  }
}

function showAgentOptimization() {
  // 这里可以显示Agent优化面板
  alert('Agent优化功能即将上线！')
}

function clearMessages() {
  recentMessages.value = []
}

// 实时更新
let updateInterval = null

function startRealTimeUpdates() {
  updateInterval = setInterval(async () => {
    try {
      const [tasksData, messagesData] = await Promise.all([
        agentCollaborationApi.getTasks({ limit: 10 }),
        loadRecentMessages(),
      ])

      recentTasks.value = tasksData.tasks
      recentMessages.value = messagesData

      // 滚动到底部
      nextTick(() => {
        const container = document.querySelector('.messages-container')
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    } catch (error) {
      console.error('Failed to update data:', error)
    }
  }, 5000) // 每5秒更新一次
}

function stopRealTimeUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
}
</script>

<style scoped>
.multi-agent-collaboration {
  min-height: 100vh;
  background: var(--bg-color);
}

/* 页面头部 */
.collaboration-header {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  padding: 4rem 0 3rem;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
}

.collaboration-title {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.collaboration-subtitle {
  font-size: 1.25rem;
  margin: 0 0 2rem;
  opacity: 0.9;
}

.system-status {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2rem;
}

.status-indicator,
.agent-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  backdrop-filter: blur(10px);
}

/* 主内容区 */
.collaboration-content {
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  gap: 2rem;
  min-height: calc(100vh - 300px);
}

/* 侧边栏 */
.collaboration-sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.agents-panel,
.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.agents-panel h3,
.quick-actions h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #333;
}

.agent-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.agent-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  transition: all 0.3s;
}

.agent-item:hover {
  background: #f8f9fa;
}

.agent-item.online {
  border-left: 4px solid #28a745;
}

.agent-item.busy {
  border-left: 4px solid #ffc107;
}

.agent-item.offline {
  border-left: 4px solid #6c757d;
  opacity: 0.6;
}

.agent-avatar {
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.agent-info {
  flex: 1;
}

.agent-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.agent-type {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.agent-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #28a745;
}

.status-dot.busy {
  background: #ffc107;
}

.status-dot.offline {
  background: #6c757d;
}

.agent-metrics {
  text-align: right;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.metric-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.metric-label {
  font-size: 0.7rem;
  color: #666;
}

.quick-actions {
  margin-top: auto;
}

.action-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
}

.action-btn.primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: #f8f9fa;
  color: #666;
}

.action-btn.secondary:hover {
  background: #e9ecef;
  color: #333;
}

.action-btn.tertiary {
  background: #6c757d;
  color: white;
}

.action-btn.tertiary:hover {
  background: #5a6268;
}

/* 主内容区 */
.collaboration-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 协作画布 */
.collaboration-canvas {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.canvas-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.canvas-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.canvas-controls {
  display: flex;
  gap: 0.5rem;
}

.canvas-controls button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.canvas-controls button:hover {
  background: #f8f9fa;
}

.canvas-controls button.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* 网络视图 */
.network-view {
  position: relative;
  height: 500px;
  padding: 2rem;
}

.agent-network {
  position: relative;
  width: 100%;
  height: 100%;
}

.network-node {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.network-node:hover {
  transform: scale(1.1);
  z-index: 10;
}

.network-node.creation {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.network-node.logic {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.network-node.narrative {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.network-node.critic {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.node-avatar {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
}

.node-label {
  font-size: 0.7rem;
  color: white;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
}

.node-status {
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.status-indicator.online {
  background: #28a745;
}

.status-indicator.busy {
  background: #ffc107;
}

.status-indicator.offline {
  background: #6c757d;
}

.connection-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.connection-line {
  stroke: var(--primary-color);
  stroke-width: 2;
  stroke-dasharray: 5, 5;
  animation: dash 2s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}

.empty-network {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-state {
  text-align: center;
  color: #666;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem;
}

.empty-state p {
  margin: 0;
}

/* 时间线视图 */
.timeline-view {
  padding: 2rem;
  height: 400px;
  position: relative;
}

.timeline-container {
  position: relative;
  height: 300px;
  border-bottom: 2px solid #eee;
  margin-bottom: 2rem;
}

.timeline-event {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
}

.timeline-event.creation {
  top: 20px;
}

.timeline-event.collaboration {
  top: 80px;
}

.timeline-event.task {
  top: 140px;
}

.event-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary-color);
  margin: 0 auto 0.5rem;
  border: 2px solid white;
  box-shadow: 0 0 0 2px var(--primary-color);
}

.event-content {
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  text-align: center;
}

.event-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.event-description {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.event-time {
  font-size: 0.7rem;
  color: #999;
}

.timeline-axis {
  display: flex;
  justify-content: space-between;
  padding: 0 2rem;
}

.time-marker {
  font-size: 0.8rem;
  color: #666;
  text-align: center;
}

/* 任务视图 */
.tasks-view {
  padding: 2rem;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.task-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #ddd;
  transition: all 0.3s;
}

.task-card.completed {
  border-left-color: #28a745;
  background: #f8fff8;
}

.task-card.in_progress {
  border-left-color: #ffc107;
  background: #fffef8;
}

.task-card.failed {
  border-left-color: #dc3545;
  background: #fff8f8;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.task-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: #333;
  flex: 1;
  margin-right: 1rem;
}

.task-status {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.task-status.completed {
  background: #d4edda;
  color: #155724;
}

.task-status.in_progress {
  background: #fff3cd;
  color: #856404;
}

.task-status.failed {
  background: #f8d7da;
  color: #721c24;
}

.task-description {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.task-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  color: #666;
}

.task-priority.high {
  color: #dc3545;
  font-weight: 600;
}

.task-priority.medium {
  color: #ffc107;
  font-weight: 500;
}

.task-assignment {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.assigned-agent {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  width: 100px;
  height: 6px;
  background: #eee;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
}

/* 消息面板 */
.messages-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 400px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.message-controls {
  display: flex;
  gap: 0.5rem;
}

.clear-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s;
}

.clear-btn:hover {
  background: #f8f9fa;
  color: #333;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.3s;
}

.message-item:hover {
  background: #e9ecef;
}

.message-item.command {
  background: #e7f3ff;
  border-left: 4px solid #0066cc;
}

.message-item.result {
  background: #e8f5e8;
  border-left: 4px solid #28a745;
}

.message-item.error {
  background: #ffeaea;
  border-left: 4px solid #dc3545;
}

.message-avatar {
  width: 32px;
  height: 32px;
  background: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.message-sender {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.message-time {
  font-size: 0.7rem;
  color: #666;
}

.message-text {
  color: #555;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 0.25rem;
}

.message-receiver {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
}

/* 右侧详情面板 */
.collaboration-details {
  width: 350px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.active-collaborations,
.system-metrics {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.active-collaborations h3,
.system-metrics h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #333;
}

.collaboration-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.collaboration-item {
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #eee;
  transition: all 0.3s;
}

.collaboration-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.collaboration-item.active {
  border-left: 4px solid var(--primary-color);
}

.collaboration-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.collaboration-header h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #333;
  flex: 1;
  margin-right: 0.5rem;
}

.collaboration-status {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.collaboration-status.active {
  background: #d1ecf1;
  color: #0c5460;
}

.collaboration-goal {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.collaboration-participants {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.participant {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #666;
}

.participant i {
  font-size: 0.7rem;
}

.participant-more {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.collaboration-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-stats {
  font-size: 0.8rem;
  color: #666;
  text-align: right;
}

.progress-bar {
  height: 6px;
  background: #eee;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.empty-collaborations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #666;
  text-align: center;
}

.empty-collaborations i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-icon {
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.metric-data {
  flex: 1;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.25rem;
}

.metric-label {
  font-size: 0.8rem;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .collaboration-content {
    flex-direction: column;
  }

  .collaboration-sidebar,
  .collaboration-details {
    width: 100%;
  }

  .agent-list {
    max-height: 300px;
  }

  .collaboration-list {
    max-height: 300px;
  }
}

@media (max-width: 768px) {
  .collaboration-header {
    padding: 2rem 0 1.5rem;
  }

  .collaboration-title {
    font-size: 2rem;
  }

  .system-status {
    flex-direction: column;
    gap: 1rem;
  }

  .collaboration-content {
    padding: 1rem;
  }

  .canvas-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .tasks-grid {
    grid-template-columns: 1fr;
  }

  .messages-panel {
    height: 300px;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
