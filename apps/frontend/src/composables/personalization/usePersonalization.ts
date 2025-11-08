import { ref, computed, watch, onMounted } from 'vue'

// 用户偏好类型
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  fontSize: 'small' | 'medium' | 'large'
  animationEnabled: boolean
  soundEnabled: boolean
  notificationEnabled: boolean
  aiSuggestionsEnabled: boolean
  autoSaveEnabled: boolean
  exportFormat: 'json' | 'pdf' | 'html'
  worldComplexity: 'simple' | 'medium' | 'complex'
  narrativeStyle: 'linear' | 'branching' | 'experimental'
}

// 用户行为数据
export interface UserBehavior {
  favoriteGenres: string[]
  preferredComplexity: string
  averageSessionDuration: number
  commonActions: string[]
  lastActiveDate: string
  totalSessions: number
  createdWorlds: number
  completedStories: number
}

// 个性化推荐
export interface PersonalizationRecommendation {
  id: string
  type: 'feature' | 'content' | 'workflow' | 'template'
  title: string
  description: string
  confidence: number
  action: string
  metadata: Record<string, any>
}

// 个性化引擎
export class PersonalizationEngine {
  private preferences: UserPreferences
  private behavior: UserBehavior
  private recommendations: PersonalizationRecommendation[] = []

  constructor() {
    this.preferences = this.getDefaultPreferences()
    this.behavior = this.getDefaultBehavior()
  }

  // 获取默认偏好设置
  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'auto',
      language: navigator.language || 'zh-CN',
      fontSize: 'medium',
      animationEnabled: true,
      soundEnabled: true,
      notificationEnabled: true,
      aiSuggestionsEnabled: true,
      autoSaveEnabled: true,
      exportFormat: 'json',
      worldComplexity: 'medium',
      narrativeStyle: 'branching'
    }
  }

  // 获取默认行为数据
  private getDefaultBehavior(): UserBehavior {
    return {
      favoriteGenres: [],
      preferredComplexity: 'medium',
      averageSessionDuration: 0,
      commonActions: [],
      lastActiveDate: new Date().toISOString(),
      totalSessions: 1,
      createdWorlds: 0,
      completedStories: 0
    }
  }

  // 更新用户偏好
  updatePreferences(newPreferences: Partial<UserPreferences>) {
    this.preferences = { ...this.preferences, ...newPreferences }
    this.saveToStorage('preferences', this.preferences)
    this.generateRecommendations()
  }

  // 获取用户偏好
  getPreferences(): UserPreferences {
    return { ...this.preferences }
  }

  // 更新用户行为
  updateBehavior(action: string, metadata?: Record<string, any>) {
    this.behavior.lastActiveDate = new Date().toISOString()
    this.behavior.totalSessions += 1

    // 更新常见操作
    if (!this.behavior.commonActions.includes(action)) {
      this.behavior.commonActions.push(action)
      if (this.behavior.commonActions.length > 10) {
        this.behavior.commonActions = this.behavior.commonActions.slice(-10)
      }
    }

    // 根据操作更新行为数据
    switch (action) {
      case 'world_created':
        this.behavior.createdWorlds += 1
        if (metadata?.genre && !this.behavior.favoriteGenres.includes(metadata.genre)) {
          this.behavior.favoriteGenres.push(metadata.genre)
        }
        break
      case 'story_completed':
        this.behavior.completedStories += 1
        break
      case 'complex_world_created':
        this.behavior.preferredComplexity = 'complex'
        break
      case 'simple_world_created':
        this.behavior.preferredComplexity = 'simple'
        break
    }

    this.saveToStorage('behavior', this.behavior)
    this.generateRecommendations()
  }

  // 生成个性化推荐
  generateRecommendations(): PersonalizationRecommendation[] {
    const recommendations: PersonalizationRecommendation[] = []

    // 基于偏好的推荐
    if (this.preferences.worldComplexity === 'simple' && this.behavior.preferredComplexity === 'complex') {
      recommendations.push({
        id: 'complexity-upgrade',
        type: 'feature',
        title: '尝试更复杂的创作',
        description: '基于您的创作经验，建议尝试更复杂的世界构建',
        confidence: 0.8,
        action: 'enable_advanced_features',
        metadata: { feature: 'advanced_world_builder' }
      })
    }

    // 基于行为的推荐
    if (this.behavior.createdWorlds > 5 && !this.behavior.commonActions.includes('export_world')) {
      recommendations.push({
        id: 'export-feature',
        type: 'feature',
        title: '探索导出功能',
        description: '您已经创建了多个世界，试试导出功能来分享您的创作',
        confidence: 0.7,
        action: 'show_export_tutorial',
        metadata: { tutorial: 'world_export' }
      })
    }

    if (this.behavior.favoriteGenres.length > 0) {
      recommendations.push({
        id: 'genre-template',
        type: 'template',
        title: `${this.behavior.favoriteGenres[0]}题材模板`,
        description: `基于您对${this.behavior.favoriteGenres[0]}的偏好，我们为您准备了专用模板`,
        confidence: 0.9,
        action: 'apply_template',
        metadata: { genre: this.behavior.favoriteGenres[0] }
      })
    }

    // 基于使用频率的推荐
    if (this.behavior.commonActions.includes('character_interaction') &&
        !this.behavior.commonActions.includes('narrative_branching')) {
      recommendations.push({
        id: 'branching-intro',
        type: 'feature',
        title: '解锁分支叙事',
        description: '既然您喜欢角色交互，何不试试分支叙事让故事更加丰富',
        confidence: 0.6,
        action: 'introduce_branching',
        metadata: { feature: 'narrative_branching' }
      })
    }

    // 效率优化推荐
    if (this.preferences.autoSaveEnabled && this.behavior.averageSessionDuration > 3600000) { // 1小时
      recommendations.push({
        id: 'workflow-optimization',
        type: 'workflow',
        title: '工作流优化建议',
        description: '检测到您的工作时长较长，建议使用快捷键和工作区预设来提高效率',
        confidence: 0.5,
        action: 'show_shortcuts_guide',
        metadata: { optimization: 'keyboard_shortcuts' }
      })
    }

    this.recommendations = recommendations
    return recommendations
  }

  // 获取推荐
  getRecommendations(): PersonalizationRecommendation[] {
    return [...this.recommendations]
  }

  // 应用推荐
  applyRecommendation(recommendationId: string) {
    const recommendation = this.recommendations.find(r => r.id === recommendationId)
    if (recommendation) {
      // 标记为已应用
      recommendation.metadata.applied = true
      this.saveToStorage('applied_recommendations',
        [...(this.getFromStorage('applied_recommendations') || []), recommendationId])
    }
  }

  // 从存储加载数据
  loadFromStorage() {
    try {
      const storedPreferences = this.getFromStorage('preferences')
      if (storedPreferences) {
        this.preferences = { ...this.preferences, ...storedPreferences }
      }

      const storedBehavior = this.getFromStorage('behavior')
      if (storedBehavior) {
        this.behavior = { ...this.behavior, ...storedBehavior }
      }
    } catch (error) {
      console.warn('Failed to load personalization data:', error)
    }
  }

  // 保存到存储
  private saveToStorage(key: string, data: any) {
    try {
      localStorage.setItem(`creation-ring-${key}`, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save personalization data:', error)
    }
  }

  // 从存储获取数据
  private getFromStorage(key: string) {
    try {
      const data = localStorage.getItem(`creation-ring-${key}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('Failed to get personalization data:', error)
      return null
    }
  }

  // 重置个性化设置
  reset() {
    this.preferences = this.getDefaultPreferences()
    this.behavior = this.getDefaultBehavior()
    this.recommendations = []

    // 清除存储
    localStorage.removeItem('creation-ring-preferences')
    localStorage.removeItem('creation-ring-behavior')
    localStorage.removeItem('creation-ring-applied_recommendations')
  }
}

// Vue组合式函数
export function usePersonalization() {
  const engine = new PersonalizationEngine()
  const preferences = ref<UserPreferences>(engine.getPreferences())
  const recommendations = ref<PersonalizationRecommendation[]>([])

  // 初始化
  onMounted(() => {
    engine.loadFromStorage()
    preferences.value = engine.getPreferences()
    recommendations.value = engine.generateRecommendations()
  })

  // 更新偏好
  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    engine.updatePreferences(newPreferences)
    preferences.value = engine.getPreferences()
    recommendations.value = engine.generateRecommendations()
  }

  // 记录用户行为
  const trackBehavior = (action: string, metadata?: Record<string, any>) => {
    engine.updateBehavior(action, metadata)
    recommendations.value = engine.generateRecommendations()
  }

  // 获取推荐
  const getRecommendations = () => {
    return engine.getRecommendations()
  }

  // 应用推荐
  const applyRecommendation = (recommendationId: string) => {
    engine.applyRecommendation(recommendationId)
    recommendations.value = engine.generateRecommendations()
  }

  // 获取个性化设置摘要
  const getPersonalizationSummary = () => {
    const prefs = engine.getPreferences()
    const behavior = engine.getDefaultBehavior() // 这里应该从engine获取实际行为数据

    return {
      preferences: prefs,
      behavior: behavior,
      recommendationsCount: recommendations.value.length,
      appliedRecommendations: engine.getFromStorage('applied_recommendations') || []
    }
  }

  // 重置个性化设置
  const resetPersonalization = () => {
    engine.reset()
    preferences.value = engine.getPreferences()
    recommendations.value = []
  }

  return {
    // 状态
    preferences: readonly(preferences),
    recommendations: readonly(recommendations),

    // 方法
    updatePreferences,
    trackBehavior,
    getRecommendations,
    applyRecommendation,
    getPersonalizationSummary,
    resetPersonalization
  }
}
