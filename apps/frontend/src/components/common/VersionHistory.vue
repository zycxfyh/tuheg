<template>
  <div class="version-history">
    <div class="history-header">
      <h3>版本历史</h3>
      <button @click="createSnapshot" class="snapshot-button">
        📸 创建快照
      </button>
    </div>

    <div class="history-list">
      <div
        v-for="version in versions"
        :key="version.id"
        class="version-item"
        :class="{ active: version.id === currentVersion }"
      >
        <div class="version-info">
          <div class="version-title">
            {{ version.title }}
            <span v-if="version.id === currentVersion" class="current-badge">当前</span>
          </div>
          <div class="version-meta">
            <span class="author">{{ version.author }}</span>
            <span class="timestamp">{{ formatTimestamp(version.timestamp) }}</span>
          </div>
          <div class="version-description">
            {{ version.description }}
          </div>
        </div>

        <div class="version-actions">
          <button
            @click="restoreVersion(version)"
            :disabled="version.id === currentVersion"
            class="action-button restore"
          >
            恢复
          </button>
          <button
            @click="deleteVersion(version)"
            :disabled="version.id === currentVersion"
            class="action-button delete"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <div v-if="versions.length === 0" class="empty-state">
      <p>暂无版本历史</p>
      <button @click="createSnapshot" class="create-first-button">
        创建第一个快照
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { useCollaborationStore } from '@/stores/collaboration.store'
import { useToast } from '@/composables/useToast'

interface Version {
  id: string
  title: string
  description: string
  author: string
  timestamp: Date
  gameState: any
  characterState: any
}

const gameStore = useGameStore()
const collaborationStore = useCollaborationStore()
const { show: showToast } = useToast()

const versions = ref<Version[]>([])
const currentVersion = ref<string>('')

// 从本地存储加载版本历史
const loadVersions = () => {
  const stored = localStorage.getItem(`game-${gameStore.currentGame?.id}-versions`)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      versions.value = parsed.map((v: any) => ({
        ...v,
        timestamp: new Date(v.timestamp)
      }))
    } catch (err) {
      console.error('Failed to load versions:', err)
    }
  }
}

// 保存版本历史到本地存储
const saveVersions = () => {
  localStorage.setItem(
    `game-${gameStore.currentGame?.id}-versions`,
    JSON.stringify(versions.value)
  )
}

// 创建快照
const createSnapshot = () => {
  if (!gameStore.currentGame) {
    showToast('没有活跃的游戏', 'error')
    return
  }

  const version: Version = {
    id: `version-${Date.now()}`,
    title: `快照 ${new Date().toLocaleString()}`,
    description: '自动创建的游戏状态快照',
    author: collaborationStore.userName,
    timestamp: new Date(),
    gameState: { ...gameStore.currentGame },
    characterState: { ...gameStore.currentCharacter }
  }

  versions.value.unshift(version)
  currentVersion.value = version.id
  saveVersions()

  showToast('版本快照已创建', 'success')
}

// 恢复版本
const restoreVersion = (version: Version) => {
  if (!confirm(`确定要恢复到版本"${version.title}"吗？当前未保存的更改将会丢失。`)) {
    return
  }

  // 恢复游戏状态
  gameStore.updateGame(version.gameState)
  if (version.characterState) {
    gameStore.updateCharacter(version.characterState)
  }

  currentVersion.value = version.id
  saveVersions()

  showToast(`已恢复到版本"${version.title}"`, 'success')
}

// 删除版本
const deleteVersion = (version: Version) => {
  if (version.id === currentVersion.value) {
    showToast('不能删除当前版本', 'error')
    return
  }

  if (!confirm(`确定要删除版本"${version.title}"吗？`)) {
    return
  }

  const index = versions.value.findIndex(v => v.id === version.id)
  if (index > -1) {
    versions.value.splice(index, 1)
    saveVersions()
    showToast('版本已删除', 'success')
  }
}

// 格式化时间戳
const formatTimestamp = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString()
}

// 初始化
onMounted(() => {
  loadVersions()

  // 如果没有版本历史，创建一个初始版本
  if (versions.value.length === 0 && gameStore.currentGame) {
    createSnapshot()
  }
})
</script>

<style scoped>
.version-history {
  max-width: 600px;
  margin: 0 auto;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.history-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.snapshot-button {
  padding: 8px 16px;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.snapshot-button:hover {
  background: var(--primary-hover, #2563eb);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  transition: all 0.2s;
}

.version-item:hover {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.version-item.active {
  border-color: var(--success-color, #10b981);
  background: var(--bg-success, #f0fdf4);
}

.version-info {
  flex: 1;
}

.version-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #111827);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.current-badge {
  padding: 2px 8px;
  background: var(--success-color, #10b981);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.version-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 8px;
}

.version-description {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
}

.version-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.action-button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button.restore {
  background: var(--primary-color, #3b82f6);
  color: white;
}

.action-button.restore:hover:not(:disabled) {
  background: var(--primary-hover, #2563eb);
}

.action-button.restore:disabled {
  background: var(--disabled-color, #9ca3af);
  cursor: not-allowed;
}

.action-button.delete {
  background: var(--danger-color, #ef4444);
  color: white;
}

.action-button.delete:hover:not(:disabled) {
  background: var(--danger-hover, #dc2626);
}

.action-button.delete:disabled {
  background: var(--disabled-color, #9ca3af);
  cursor: not-allowed;
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
</style>
