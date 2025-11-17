import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Game, Character, WorldBookEntry } from '@/types'

export const useGameStore = defineStore('game', () => {
  // 状态
  const currentGame = ref<Game | null>(null)
  const currentCharacter = ref<Character | null>(null)
  const worldBook = ref<WorldBookEntry[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isGameLoaded = computed(() => !!currentGame.value)
  const gameTitle = computed(() => currentGame.value?.name || '未命名游戏')
  const characterName = computed(() => currentCharacter.value?.name || '无名氏')

  // 方法
  const loadGame = async (gameId: string) => {
    isLoading.value = true
    error.value = null

    try {
      // TODO: 实现实际的API调用
      // const response = await apiService.getGame(gameId)
      // currentGame.value = response.data

      // 临时模拟数据
      currentGame.value = {
        id: gameId,
        name: '测试游戏世界',
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      } as Game

      currentCharacter.value = {
        id: 'char-1',
        gameId,
        name: '冒险者',
        description: '一位勇敢的探索者',
        stats: {},
        inventory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      } as Character

    } catch (err: any) {
      error.value = err.message || '加载游戏失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const unloadGame = () => {
    currentGame.value = null
    currentCharacter.value = null
    worldBook.value = []
    error.value = null
  }

  const updateGame = (updates: Partial<Game>) => {
    if (currentGame.value) {
      Object.assign(currentGame.value, updates)
    }
  }

  const updateCharacter = (updates: Partial<Character>) => {
    if (currentCharacter.value) {
      Object.assign(currentCharacter.value, updates)
    }
  }

  return {
    // 状态
    currentGame,
    currentCharacter,
    worldBook,
    isLoading,
    error,

    // 计算属性
    isGameLoaded,
    gameTitle,
    characterName,

    // 方法
    loadGame,
    unloadGame,
    updateGame,
    updateCharacter
  }
})
