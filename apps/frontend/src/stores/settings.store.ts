import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AISettings {
  model: string
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  apiKey?: string
  baseUrl?: string
}

export interface AgentConfig {
  role: string
  enabled: boolean
  priority: number
  settings: AISettings
}

export const ALL_AI_ROLES = [
  'creation-agent',
  'logic-agent',
  'narrative-agent',
  'backend-gateway',
] as const

export type AIRole = (typeof ALL_AI_ROLES)[number]

export const useSettingsStore = defineStore('settings', () => {
  // AI设置状态
  const agentConfigs = ref<Record<AIRole, AgentConfig>>({
    'creation-agent': {
      role: 'creation-agent',
      enabled: true,
      priority: 1,
      settings: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
      },
    },
    'logic-agent': {
      role: 'logic-agent',
      enabled: true,
      priority: 2,
      settings: {
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 1500,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
      },
    },
    'narrative-agent': {
      role: 'narrative-agent',
      enabled: true,
      priority: 3,
      settings: {
        model: 'gpt-4',
        temperature: 0.8,
        maxTokens: 3000,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
      },
    },
    'backend-gateway': {
      role: 'backend-gateway',
      enabled: true,
      priority: 0,
      settings: {
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        maxTokens: 1000,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
      },
    },
  })

  // UI设置
  const uiSettings = ref({
    theme: 'auto' as 'light' | 'dark' | 'auto',
    language: 'zh-CN',
    animations: true,
    soundEffects: true,
    autoSave: true,
    showTips: true,
  })

  // 计算属性
  const enabledAgents = computed(() =>
    Object.values(agentConfigs.value).filter((config) => config.enabled)
  )

  const sortedAgents = computed(() =>
    Object.values(agentConfigs.value).sort((a, b) => a.priority - b.priority)
  )

  // Agent配置方法
  const updateAgentConfig = (role: AIRole, updates: Partial<AgentConfig>) => {
    if (agentConfigs.value[role]) {
      Object.assign(agentConfigs.value[role], updates)
      saveToLocalStorage()
    }
  }

  const updateAgentSettings = (role: AIRole, settings: Partial<AISettings>) => {
    if (agentConfigs.value[role]) {
      Object.assign(agentConfigs.value[role].settings, settings)
      saveToLocalStorage()
    }
  }

  const toggleAgent = (role: AIRole) => {
    if (agentConfigs.value[role]) {
      agentConfigs.value[role].enabled = !agentConfigs.value[role].enabled
      saveToLocalStorage()
    }
  }

  const setAgentPriority = (role: AIRole, priority: number) => {
    if (agentConfigs.value[role]) {
      agentConfigs.value[role].priority = priority
      saveToLocalStorage()
    }
  }

  // UI设置方法
  const updateUISettings = (settings: Partial<typeof uiSettings.value>) => {
    Object.assign(uiSettings.value, settings)
    saveToLocalStorage()
  }

  // 本地存储
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('ai-agent-configs', JSON.stringify(agentConfigs.value))
      localStorage.setItem('ui-settings', JSON.stringify(uiSettings.value))
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const savedAgentConfigs = localStorage.getItem('ai-agent-configs')
      if (savedAgentConfigs) {
        const parsed = JSON.parse(savedAgentConfigs)
        Object.assign(agentConfigs.value, parsed)
      }

      const savedUISettings = localStorage.getItem('ui-settings')
      if (savedUISettings) {
        const parsed = JSON.parse(savedUISettings)
        Object.assign(uiSettings.value, parsed)
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error)
    }
  }

  // 初始化
  const init = () => {
    loadFromLocalStorage()
  }

  // 重置为默认设置
  const resetToDefaults = () => {
    // 重置Agent配置
    agentConfigs.value = {
      'creation-agent': {
        role: 'creation-agent',
        enabled: true,
        priority: 1,
        settings: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0,
        },
      },
      'logic-agent': {
        role: 'logic-agent',
        enabled: true,
        priority: 2,
        settings: {
          model: 'gpt-4',
          temperature: 0.3,
          maxTokens: 1500,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0,
        },
      },
      'narrative-agent': {
        role: 'narrative-agent',
        enabled: true,
        priority: 3,
        settings: {
          model: 'gpt-4',
          temperature: 0.8,
          maxTokens: 3000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0,
        },
      },
      'backend-gateway': {
        role: 'backend-gateway',
        enabled: true,
        priority: 0,
        settings: {
          model: 'gpt-3.5-turbo',
          temperature: 0.5,
          maxTokens: 1000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0,
        },
      },
    }

    // 重置UI设置
    uiSettings.value = {
      theme: 'auto',
      language: 'zh-CN',
      animations: true,
      soundEffects: true,
      autoSave: true,
      showTips: true,
    }

    saveToLocalStorage()
  }

  return {
    // 状态
    agentConfigs,
    uiSettings,

    // 计算属性
    enabledAgents,
    sortedAgents,

    // Agent配置方法
    updateAgentConfig,
    updateAgentSettings,
    toggleAgent,
    setAgentPriority,

    // UI设置方法
    updateUISettings,

    // 存储方法
    saveToLocalStorage,
    loadFromLocalStorage,

    // 其他方法
    init,
    resetToDefaults,
  }
})
