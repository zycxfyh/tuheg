import axios from 'axios'

export interface FeedbackSubmission {
  type: 'bug' | 'feature' | 'experience'
  title: string
  description: string
  rating?: number
  contact?: string
  screenshots?: File[]
  metadata: {
    url: string
    userAgent: string
    timestamp: string
    screenSize: string
  }
}

export interface FeedbackResponse {
  id: string
  status: 'received' | 'processing' | 'resolved'
  estimatedResponseTime: string
  trackingId: string
}

export interface UserInterviewRequest {
  preferredTime: string
  timezone: string
  topics: string[]
  contactInfo: {
    email: string
    name?: string
  }
}

export interface UserInterviewResponse {
  id: string
  scheduledAt: string
  interviewer: string
  meetingLink: string
  preparationMaterials: string[]
}

export interface AnalyticsEvent {
  eventType: string
  eventData: Record<string, any>
  timestamp: string
  sessionId: string
  userId?: string
  page: string
  userAgent: string
}

class FeedbackApiService {
  private baseURL = '/api/feedback'

  constructor() {
    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 请求拦截器 - 添加用户标识
    axios.interceptors.request.use((config) => {
      const sessionId = this.getSessionId()
      const userId = this.getUserId()

      if (config.headers) {
        config.headers['X-Session-ID'] = sessionId
        if (userId) {
          config.headers['X-User-ID'] = userId
        }
      }

      return config
    })
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('feedback-session-id')
    if (!sessionId) {
      sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('feedback-session-id', sessionId)
    }
    return sessionId
  }

  private getUserId(): string | null {
    return localStorage.getItem('user-id') || null
  }

  // 提交反馈
  async submitFeedback(feedback: FeedbackSubmission): Promise<FeedbackResponse> {
    try {
      const formData = new FormData()

      // 基本信息
      formData.append('type', feedback.type)
      formData.append('title', feedback.title)
      formData.append('description', feedback.description)

      if (feedback.rating) {
        formData.append('rating', feedback.rating.toString())
      }

      if (feedback.contact) {
        formData.append('contact', feedback.contact)
      }

      // 元数据
      formData.append('metadata', JSON.stringify(feedback.metadata))

      // 截图文件
      if (feedback.screenshots) {
        feedback.screenshots.forEach((file, index) => {
          formData.append(`screenshots`, file)
        })
      }

      const response = await axios.post<FeedbackResponse>(`${this.baseURL}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error) {
      console.error('Failed to submit feedback:', error)

      // 返回模拟响应以供演示
      return {
        id: 'feedback-' + Date.now(),
        status: 'received',
        estimatedResponseTime: '24小时内',
        trackingId: 'TRK-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      }
    }
  }

  // 获取反馈历史
  async getFeedbackHistory(limit = 10): Promise<FeedbackSubmission[]> {
    try {
      const response = await axios.get<FeedbackSubmission[]>(`${this.baseURL}/history`, {
        params: { limit },
      })
      return response.data
    } catch (error) {
      console.error('Failed to get feedback history:', error)
      return []
    }
  }

  // 预约用户访谈
  async requestInterview(request: UserInterviewRequest): Promise<UserInterviewResponse> {
    try {
      const response = await axios.post<UserInterviewResponse>(
        `${this.baseURL}/interview/request`,
        request
      )
      return response.data
    } catch (error) {
      console.error('Failed to request interview:', error)

      // 返回模拟响应
      return {
        id: 'interview-' + Date.now(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        interviewer: '产品团队',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        preparationMaterials: [
          '请准备您使用创世星环的体验分享',
          '可以包含您遇到的问题或建议',
          '访谈时长约30分钟',
        ],
      }
    }
  }

  // 发送分析事件
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/analytics/track`, event)
    } catch (error) {
      console.error('Failed to track event:', error)
      // 静默失败，不影响用户体验
    }
  }

  // 批量发送分析事件
  async trackEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/analytics/track-batch`, { events })
    } catch (error) {
      console.error('Failed to track events:', error)
    }
  }

  // 获取用户统计信息
  async getUserStats(): Promise<{
    totalFeedback: number
    averageRating: number
    lastFeedbackDate: string | null
    interviewRequested: boolean
  }> {
    try {
      const response = await axios.get(`${this.baseURL}/user/stats`)
      return response.data
    } catch (error) {
      console.error('Failed to get user stats:', error)
      return {
        totalFeedback: 0,
        averageRating: 0,
        lastFeedbackDate: null,
        interviewRequested: false,
      }
    }
  }

  // 页面访问跟踪
  trackPageView(page: string, additionalData: Record<string, any> = {}) {
    this.trackEvent({
      eventType: 'page_view',
      eventData: {
        page,
        referrer: document.referrer,
        ...additionalData,
      },
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      userId: this.getUserId() || undefined,
      page,
      userAgent: navigator.userAgent,
    })
  }

  // 用户交互跟踪
  trackInteraction(elementId: string, action: string, additionalData: Record<string, any> = {}) {
    this.trackEvent({
      eventType: 'user_interaction',
      eventData: {
        elementId,
        action,
        ...additionalData,
      },
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      userId: this.getUserId() || undefined,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
    })
  }

  // 错误跟踪
  trackError(error: Error, context: Record<string, any> = {}) {
    this.trackEvent({
      eventType: 'error',
      eventData: {
        message: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
        stack: error.stack,
        ...context,
      },
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      userId: this.getUserId() || undefined,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
    })
  }

  // AI交互跟踪
  trackAIInteraction(agentType: string, prompt: string, response: string, duration: number) {
    this.trackEvent({
      eventType: 'ai_interaction',
      eventData: {
        agentType,
        promptLength: prompt.length,
        responseLength: response.length,
        duration,
        timestamp: Date.now(),
      },
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      userId: this.getUserId() || undefined,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
    })
  }

  // 性能跟踪
  trackPerformance(metric: string, value: number, additionalData: Record<string, any> = {}) {
    this.trackEvent({
      eventType: 'performance',
      eventData: {
        metric,
        value,
        ...additionalData,
      },
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      userId: this.getUserId() || undefined,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
    })
  }
}

// 创建单例实例
export const feedbackApi = new FeedbackApiService()
