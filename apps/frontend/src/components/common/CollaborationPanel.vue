<template>
  <div v-if="isInCollaboration" class="collaboration-panel">
    <div class="panel-header">
      <div class="collaboration-indicator">
        <div class="status-dot" :class="{ active: isInCollaboration }"></div>
        <span class="status-text">
          实时协作中 · {{ collaboratorCount }} 人在线
        </span>
      </div>

      <button
        @click="togglePanel"
        class="panel-toggle"
        :class="{ expanded: isPanelExpanded }"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8L18 14L6 14L12 8Z" fill="currentColor"/>
        </svg>
      </button>
    </div>

    <div v-show="isPanelExpanded" class="panel-content">
      <div class="collaborators-list">
        <div
          v-for="collaborator in onlineCollaborators"
          :key="collaborator.id"
          class="collaborator-item"
        >
          <div
            class="collaborator-avatar"
            :style="{ backgroundColor: collaborator.color }"
          >
            {{ collaborator.name.charAt(0).toUpperCase() }}
          </div>

          <div class="collaborator-info">
            <div class="collaborator-name">
              {{ collaborator.name }}
              <span v-if="collaborator.id === userId" class="self-indicator">(你)</span>
            </div>
            <div class="collaborator-status">
              <span class="online-indicator">●</span>
              在线 · {{ formatLastActivity(collaborator.lastActivity) }}
            </div>
          </div>

          <div v-if="collaborator.id !== userId" class="collaborator-actions">
            <button
              @click="followCollaborator(collaborator)"
              class="action-button"
              title="跟随用户"
            >
              👁️
            </button>
          </div>
        </div>
      </div>

      <div class="collaboration-actions">
        <button @click="showInviteModal = true" class="action-button primary">
          邀请协作
        </button>
        <button @click="leaveCollaboration" class="action-button secondary">
          退出协作
        </button>
      </div>
    </div>

    <!-- 邀请协作模态框 -->
    <CollaborationInviteModal
      v-model:visible="showInviteModal"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCollaborationStore } from '@/stores/collaboration.store'
import { useToast } from '@/composables/useToast'
import CollaborationInviteModal from './CollaborationInviteModal.vue'

const collaborationStore = useCollaborationStore()
const { show: showToast } = useToast()

const isPanelExpanded = ref(false)
const showInviteModal = ref(false)

const isInCollaboration = computed(() => collaborationStore.isInCollaboration)
const collaboratorCount = computed(() => collaborationStore.collaboratorCount)
const onlineCollaborators = computed(() => collaborationStore.onlineCollaborators)
const userId = computed(() => collaborationStore.userId)

const togglePanel = () => {
  isPanelExpanded.value = !isPanelExpanded.value
}

const formatLastActivity = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`

  return '很久以前'
}

const followCollaborator = (collaborator: any) => {
  // TODO: 实现跟随用户的功能
  showToast(`开始跟随 ${collaborator.name}`, 'info')
}


const leaveCollaboration = () => {
  collaborationStore.leaveCollaboration()
  showToast('已退出协作模式', 'info')
}
</script>

<style scoped>
.collaboration-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-secondary, #f9fafb);
}

.collaboration-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  transition: background-color 0.2s;
}

.status-dot.active {
  background: #10b981;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #111827);
}

.panel-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.panel-toggle:hover {
  background: var(--bg-hover, #f3f4f6);
}

.panel-toggle.expanded {
  transform: rotate(180deg);
}

.panel-content {
  max-height: 400px;
  overflow-y: auto;
}

.collaborators-list {
  padding: 8px 0;
}

.collaborator-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 12px;
  transition: background-color 0.2s;
}

.collaborator-item:hover {
  background: var(--bg-hover, #f9fafb);
}

.collaborator-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.collaborator-info {
  flex: 1;
  min-width: 0;
}

.collaborator-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #111827);
  display: flex;
  align-items: center;
  gap: 4px;
}

.self-indicator {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  font-weight: normal;
}

.collaborator-status {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  display: flex;
  align-items: center;
  gap: 4px;
}

.online-indicator {
  color: #10b981;
  font-size: 8px;
}

.collaborator-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.collaborator-item:hover .collaborator-actions {
  opacity: 1;
}

.action-button {
  padding: 4px;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.collaboration-actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.action-button.primary {
  flex: 1;
  padding: 8px 12px;
  background: var(--primary-color, #3b82f6);
  color: white;
  border-radius: 6px;
  font-weight: 500;
}

.action-button.secondary {
  padding: 8px 12px;
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #374151);
  border-radius: 6px;
  font-weight: 500;
}

.action-button:hover {
  opacity: 0.9;
}
</style>
