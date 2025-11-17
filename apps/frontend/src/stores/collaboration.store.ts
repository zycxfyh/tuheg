import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Collaborator, CollaborationSession } from '@/types/collaboration'

export const useCollaborationStore = defineStore('collaboration', () => {
  // 状态
  const currentSession = ref<CollaborationSession | null>(null)
  const userId = ref<string>('user-' + Math.random().toString(36).substr(2, 9))
  const userName = ref<string>('协作用户')
  const userColor = ref<string>('#3B82F6')

  // 计算属性
  const isInCollaboration = computed(() => !!currentSession.value && currentSession.value.isActive)
  const collaboratorCount = computed(() => currentSession.value?.collaborators.length || 0)
  const onlineCollaborators = computed(() =>
    currentSession.value?.collaborators.filter(c => c.isOnline) || []
  )

  // 方法
  const joinCollaboration = (gameId: string) => {
    currentSession.value = {
      sessionId: `session-${gameId}-${Date.now()}`,
      gameId,
      collaborators: [{
        id: userId.value,
        name: userName.value,
        color: userColor.value,
        cursor: { x: 0, y: 0, visible: false },
        lastActivity: new Date(),
        isOnline: true
      }],
      isActive: true,
      createdAt: new Date()
    }

    // TODO: 连接WebSocket并广播加入消息
    console.log('Joined collaboration session:', currentSession.value.sessionId)
  }

  const leaveCollaboration = () => {
    if (currentSession.value) {
      // TODO: 断开WebSocket连接并广播离开消息
      console.log('Left collaboration session:', currentSession.value.sessionId)
      currentSession.value = null
    }
  }

  const addCollaborator = (collaborator: Omit<Collaborator, 'lastActivity' | 'isOnline'>) => {
    if (currentSession.value) {
      const newCollaborator: Collaborator = {
        ...collaborator,
        lastActivity: new Date(),
        isOnline: true
      }
      currentSession.value.collaborators.push(newCollaborator)
    }
  }

  const removeCollaborator = (collaboratorId: string) => {
    if (currentSession.value) {
      currentSession.value.collaborators = currentSession.value.collaborators.filter(
        c => c.id !== collaboratorId
      )
    }
  }

  const updateCollaborator = (collaboratorId: string, updates: Partial<Collaborator>) => {
    if (currentSession.value) {
      const collaborator = currentSession.value.collaborators.find(c => c.id === collaboratorId)
      if (collaborator) {
        Object.assign(collaborator, {
          ...updates,
          lastActivity: new Date()
        })
      }
    }
  }

  const updateCursorPosition = (x: number, y: number, visible: boolean = true) => {
    if (currentSession.value) {
      const userCollaborator = currentSession.value.collaborators.find(c => c.id === userId.value)
      if (userCollaborator) {
        userCollaborator.cursor = { x, y, visible }
        userCollaborator.lastActivity = new Date()

        // TODO: 通过WebSocket广播光标位置更新
        broadcastCursorUpdate(userCollaborator)
      }
    }
  }

  const updateTextSelection = (start: number, end: number, text: string) => {
    if (currentSession.value) {
      const userCollaborator = currentSession.value.collaborators.find(c => c.id === userId.value)
      if (userCollaborator) {
        userCollaborator.selection = { start, end, text }
        userCollaborator.lastActivity = new Date()

        // TODO: 通过WebSocket广播选择更新
        broadcastSelectionUpdate(userCollaborator)
      }
    }
  }

  // WebSocket广播方法 (暂时使用console.log)
  const broadcastCursorUpdate = (collaborator: Collaborator) => {
    console.log('Broadcasting cursor update:', collaborator.cursor)
    // TODO: 实现实际的WebSocket广播
  }

  const broadcastSelectionUpdate = (collaborator: Collaborator) => {
    console.log('Broadcasting selection update:', collaborator.selection)
    // TODO: 实现实际的WebSocket广播
  }

  return {
    // 状态
    currentSession,
    userId,
    userName,
    userColor,

    // 计算属性
    isInCollaboration,
    collaboratorCount,
    onlineCollaborators,

    // 方法
    joinCollaboration,
    leaveCollaboration,
    addCollaborator,
    removeCollaborator,
    updateCollaborator,
    updateCursorPosition,
    updateTextSelection
  }
})
