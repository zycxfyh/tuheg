import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface GameState {
  id: string
  title: string
  description: string
  currentScene: string
  playerActions: string[]
  aiResponses: string[]
  characters: Array<{
    id: string
    name: string
    description: string
    attributes: Record<string, any>
  }>
  worldState: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Action {
  id: string
  type: 'player' | 'ai'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export const useGameStore = defineStore('game', () => {
  // 状态
  const currentGame = ref<GameState | null>(null)
  const actions = ref<Action[]>([])
  const isAiThinking = ref(false)
  const isLoading = ref(false)

  // 计算属性
  const isGameActive = computed(() => !!currentGame.value)
  const latestAction = computed(() => actions.value[actions.value.length - 1] || null)

  // 游戏管理方法
  const createGame = async (title: string, description: string) => {
    try {
      isLoading.value = true
      // TODO: 实现实际的游戏创建API调用
      const newGame: GameState = {
        id: Date.now().toString(),
        title,
        description,
        currentScene: '开始场景',
        playerActions: [],
        aiResponses: [],
        characters: [],
        worldState: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      currentGame.value = newGame
      actions.value = []

      console.log('Game created:', newGame)
      return newGame
    } catch (error) {
      console.error('Failed to create game:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const loadGame = async (gameId: string) => {
    try {
      isLoading.value = true
      // TODO: 实现实际的游戏加载API调用
      console.log('Loading game:', gameId)
      // 模拟加载
      // currentGame.value = loadedGame
      // actions.value = loadedActions
    } catch (error) {
      console.error('Failed to load game:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const submitAction = async (action: string) => {
    if (!currentGame.value) {
      throw new Error('No active game')
    }

    try {
      isAiThinking.value = true

      // 添加玩家行动
      const playerAction: Action = {
        id: Date.now().toString(),
        type: 'player',
        content: action,
        timestamp: new Date(),
      }
      actions.value.push(playerAction)

      // TODO: 调用AI API生成响应
      console.log('Player action submitted:', action)

      // 模拟AI响应
      setTimeout(() => {
        const aiResponse: Action = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `AI响应：你选择了"${action}"，故事继续发展...`,
          timestamp: new Date(),
        }
        actions.value.push(aiResponse)
        isAiThinking.value = false
      }, 2000)
    } catch (error) {
      console.error('Failed to submit action:', error)
      isAiThinking.value = false
      throw error
    }
  }

  const pauseGame = () => {
    // TODO: 实现游戏暂停逻辑
    console.log('Game paused')
  }

  const resumeGame = () => {
    // TODO: 实现游戏恢复逻辑
    console.log('Game resumed')
  }

  const endGame = () => {
    currentGame.value = null
    actions.value = []
    isAiThinking.value = false
    console.log('Game ended')
  }

  // 角色管理
  const addCharacter = (character: GameState['characters'][0]) => {
    if (!currentGame.value) return
    currentGame.value.characters.push(character)
  }

  const updateCharacter = (characterId: string, updates: Partial<GameState['characters'][0]>) => {
    if (!currentGame.value) return
    const character = currentGame.value.characters.find((c) => c.id === characterId)
    if (character) {
      Object.assign(character, updates)
    }
  }

  const removeCharacter = (characterId: string) => {
    if (!currentGame.value) return
    currentGame.value.characters = currentGame.value.characters.filter((c) => c.id !== characterId)
  }

  return {
    // 状态
    currentGame,
    actions,
    isAiThinking,
    isLoading,

    // 计算属性
    isGameActive,
    latestAction,

    // 游戏管理
    createGame,
    loadGame,
    submitAction,
    pauseGame,
    resumeGame,
    endGame,

    // 角色管理
    addCharacter,
    updateCharacter,
    removeCharacter,
  }
})
