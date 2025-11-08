import axios from 'axios'

export interface Agent {
  id: string
  name: string
  role: 'creation-agent' | 'logic-agent' | 'narrative-agent' | 'backend-gateway'
  status: 'online' | 'offline' | 'busy'
  capabilities: string[]
  currentTask?: string
  performance: {
    responseTime: number
    successRate: number
    tasksCompleted: number
  }
}

export interface Collaboration {
  id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'paused'
  participants: string[] // Agent IDs
  tasks: Task[]
  createdAt: string
  updatedAt: string
  progress: number
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  assignedTo?: string // Agent ID
  collaborationId?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  updatedAt: string
  estimatedDuration?: number
  actualDuration?: number
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical'
  agents: {
    total: number
    online: number
    busy: number
  }
  tasks: {
    total: number
    pending: number
    inProgress: number
    completed: number
  }
  performance: {
    averageResponseTime: number
    successRate: number
    throughput: number
  }
}

class AgentCollaborationApi {
  private baseURL = '/api/agent-collaboration'

  // 获取所有Agent信息
  async getAgents(): Promise<Agent[]> {
    try {
      const response = await axios.get(`${this.baseURL}/agents`)
      return response.data
    } catch (error) {
      console.error('Failed to get agents:', error)
      // 返回模拟数据
      return [
        {
          id: 'creation-agent-001',
          name: 'Creation Agent',
          role: 'creation-agent',
          status: 'online',
          capabilities: ['world-building', 'character-creation', 'setting-design'],
          performance: {
            responseTime: 1200,
            successRate: 0.95,
            tasksCompleted: 156
          }
        },
        {
          id: 'logic-agent-001',
          name: 'Logic Agent',
          role: 'logic-agent',
          status: 'online',
          capabilities: ['rule-validation', 'logic-checking', 'consistency-verification'],
          performance: {
            responseTime: 800,
            successRate: 0.98,
            tasksCompleted: 203
          }
        },
        {
          id: 'narrative-agent-001',
          name: 'Narrative Agent',
          role: 'narrative-agent',
          status: 'busy',
          currentTask: 'generating-story-arc',
          capabilities: ['story-generation', 'dialogue-creation', 'plot-development'],
          performance: {
            responseTime: 1500,
            successRate: 0.92,
            tasksCompleted: 89
          }
        },
        {
          id: 'backend-gateway-001',
          name: 'Backend Gateway',
          role: 'backend-gateway',
          status: 'online',
          capabilities: ['api-coordination', 'data-routing', 'request-handling'],
          performance: {
            responseTime: 300,
            successRate: 0.99,
            tasksCompleted: 1247
          }
        }
      ]
    }
  }

  // 获取活跃的协作
  async getActiveCollaborations(): Promise<Collaboration[]> {
    try {
      const response = await axios.get(`${this.baseURL}/collaborations/active`)
      return response.data
    } catch (error) {
      console.error('Failed to get active collaborations:', error)
      // 返回模拟数据
      return [
        {
          id: 'collab-001',
          title: '史诗奇幻冒险创作',
          description: '为用户创建完整的奇幻世界和故事线',
          status: 'active',
          participants: ['creation-agent-001', 'logic-agent-001', 'narrative-agent-001'],
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          progress: 65
        }
      ]
    }
  }

  // 获取任务列表
  async getTasks(options: { limit?: number; status?: string; assignedTo?: string } = {}): Promise<Task[]> {
    try {
      const params = new URLSearchParams()
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.status) params.append('status', options.status)
      if (options.assignedTo) params.append('assignedTo', options.assignedTo)

      const response = await axios.get(`${this.baseURL}/tasks?${params}`)
      return response.data
    } catch (error) {
      console.error('Failed to get tasks:', error)
      // 返回模拟数据
      return [
        {
          id: 'task-001',
          title: '设计世界观设定',
          description: '为奇幻冒险游戏创建完整的世界观',
          status: 'completed',
          assignedTo: 'creation-agent-001',
          priority: 'high',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimatedDuration: 1800000, // 30分钟
          actualDuration: 1500000
        },
        {
          id: 'task-002',
          title: '验证游戏规则逻辑',
          description: '检查游戏机制的一致性和平衡性',
          status: 'in_progress',
          assignedTo: 'logic-agent-001',
          priority: 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimatedDuration: 900000 // 15分钟
        }
      ]
    }
  }

  // 获取系统健康状态
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await axios.get(`${this.baseURL}/health`)
      return response.data
    } catch (error) {
      console.error('Failed to get system health:', error)
      // 返回模拟数据
      return {
        overall: 'healthy',
        agents: {
          total: 4,
          online: 3,
          busy: 1
        },
        tasks: {
          total: 24,
          pending: 3,
          inProgress: 2,
          completed: 19
        },
        performance: {
          averageResponseTime: 950,
          successRate: 0.96,
          throughput: 45
        }
      }
    }
  }

  // 创建协作
  async createCollaboration(data: {
    title: string
    description: string
    participants: string[]
    initialTasks?: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>[]
  }): Promise<Collaboration> {
    try {
      const response = await axios.post(`${this.baseURL}/collaborations`, data)
      return response.data
    } catch (error) {
      console.error('Failed to create collaboration:', error)
      throw error
    }
  }

  // 创建任务
  async createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Task> {
    try {
      const response = await axios.post(`${this.baseURL}/tasks`, data)
      return response.data
    } catch (error) {
      console.error('Failed to create task:', error)
      // 返回模拟数据
      return {
        ...data,
        id: 'task-' + Date.now(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  }

  // 分配协作任务
  async assignCollaborationTask(collaborationsId: string, taskId: string, agentId: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/collaborations/${collaborationsId}/assign-task`, {
        taskId,
        agentId
      })
    } catch (error) {
      console.error('Failed to assign collaboration task:', error)
      throw error
    }
  }

  // 更新任务状态
  async updateTaskStatus(taskId: string, status: Task['status'], updates?: Partial<Task>): Promise<Task> {
    try {
      const response = await axios.patch(`${this.baseURL}/tasks/${taskId}`, {
        status,
        ...updates,
        updatedAt: new Date().toISOString()
      })
      return response.data
    } catch (error) {
      console.error('Failed to update task status:', error)
      throw error
    }
  }

  // 获取协作详情
  async getCollaboration(collaborationId: string): Promise<Collaboration> {
    try {
      const response = await axios.get(`${this.baseURL}/collaborations/${collaborationId}`)
      return response.data
    } catch (error) {
      console.error('Failed to get collaboration:', error)
      throw error
    }
  }

  // 获取任务详情
  async getTask(taskId: string): Promise<Task> {
    try {
      const response = await axios.get(`${this.baseURL}/tasks/${taskId}`)
      return response.data
    } catch (error) {
      console.error('Failed to get task:', error)
      throw error
    }
  }
}

// 创建单例实例
export const agentCollaborationApi = new AgentCollaborationApi()
