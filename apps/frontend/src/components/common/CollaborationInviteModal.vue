<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>邀请协作</h3>
        <button @click="closeModal" class="close-button">×</button>
      </div>

      <div class="modal-body">
        <div class="invite-section">
          <label>协作邀请链接</label>
          <div class="invite-link-container">
            <input
              ref="linkInput"
              :value="inviteLink"
              readonly
              class="invite-link-input"
              @click="selectAll"
            />
            <button @click="copyLink" class="copy-button">
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>
          <p class="invite-hint">
            分享此链接给其他用户，他们就可以加入你的游戏协作
          </p>
        </div>

        <div class="share-options">
          <h4>分享方式</h4>
          <div class="share-buttons">
            <button @click="shareViaEmail" class="share-button email">
              📧 邮件分享
            </button>
            <button @click="shareViaMessage" class="share-button message">
              💬 消息分享
            </button>
            <button @click="shareViaSocial" class="share-button social">
              🌐 社交分享
            </button>
          </div>
        </div>

        <div class="collaboration-tips">
          <h4>协作提示</h4>
          <ul>
            <li>所有参与者可以看到彼此的光标位置</li>
            <li>你可以实时看到其他人的编辑活动</li>
            <li>系统会自动同步游戏状态变更</li>
            <li>你可以随时邀请或移除协作成员</li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="cancel-button">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCollaborationStore } from '@/stores/collaboration.store'
import { useToast } from '@/composables/useToast'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const collaborationStore = useCollaborationStore()
const { show: showToast } = useToast()

const linkInput = ref<HTMLInputElement>()
const copied = ref(false)

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const inviteLink = computed(() => {
  if (collaborationStore.currentSession) {
    const baseUrl = window.location.origin
    const gameId = collaborationStore.currentSession.gameId
    const sessionId = collaborationStore.currentSession.sessionId
    return `${baseUrl}/game/${gameId}?invite=${sessionId}`
  }
  return ''
})

const closeModal = () => {
  isVisible.value = false
}

const selectAll = () => {
  linkInput.value?.select()
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    copied.value = true
    showToast('协作邀请链接已复制到剪贴板', 'success')

    // 重置复制状态
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    showToast('复制失败，请手动复制链接', 'error')
  }
}

const shareViaEmail = () => {
  const subject = encodeURIComponent('加入我的游戏创作协作')
  const body = encodeURIComponent(
    `你好！\n\n我邀请你加入我的游戏创作协作。\n\n协作链接: ${inviteLink.value}\n\n在这个协作空间中，我们可以一起创作游戏世界、角色和故事。`
  )
  window.open(`mailto:?subject=${subject}&body=${body}`)
}

const shareViaMessage = () => {
  const message = `加入我的游戏创作协作！🎮\n\n${inviteLink.value}`
  if (navigator.share) {
    navigator.share({
      title: '游戏创作协作邀请',
      text: message,
      url: inviteLink.value
    })
  } else {
    copyLink()
    showToast('已复制协作信息，请粘贴到消息应用中', 'info')
  }
}

const shareViaSocial = () => {
  const text = encodeURIComponent('加入我的游戏创作协作！🎮')
  const url = encodeURIComponent(inviteLink.value)
  const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
  window.open(twitterUrl, '_blank')
}

// 监听visible变化，显示时自动复制链接
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // 延迟执行，确保DOM已更新
    setTimeout(() => {
      linkInput.value?.focus()
      linkInput.value?.select()
    }, 100)
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: var(--bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background: var(--bg-hover, #f3f4f6);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.invite-section {
  margin-bottom: 24px;
}

.invite-section label {
  display: block;
  font-weight: 500;
  color: var(--text-primary, #111827);
  margin-bottom: 8px;
}

.invite-link-container {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.invite-link-input {
  flex: 1;
  padding: 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  font-family: monospace;
  font-size: 14px;
  background: var(--bg-secondary, #f9fafb);
}

.invite-link-input:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.copy-button {
  padding: 12px 16px;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.copy-button:hover:not(:disabled) {
  background: var(--primary-hover, #2563eb);
}

.copy-button:disabled {
  background: var(--success-color, #10b981);
  cursor: default;
}

.invite-hint {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  margin: 0;
}

.share-options {
  margin-bottom: 24px;
}

.share-options h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary, #111827);
}

.share-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.share-button {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  background: var(--bg-primary, #ffffff);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.share-button:hover {
  border-color: var(--primary-color, #3b82f6);
  background: var(--bg-hover, #f3f4f6);
}

.share-button.email {
  border-color: #ea4335;
  color: #ea4335;
}

.share-button.message {
  border-color: #25d366;
  color: #25d366;
}

.share-button.social {
  border-color: #1da1f2;
  color: #1da1f2;
}

.collaboration-tips {
  background: var(--bg-secondary, #f9fafb);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
}

.collaboration-tips h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #111827);
}

.collaboration-tips ul {
  margin: 0;
  padding-left: 20px;
}

.collaboration-tips li {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 4px;
}

.collaboration-tips li:last-child {
  margin-bottom: 0;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  justify-content: flex-end;
}

.cancel-button {
  padding: 8px 16px;
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #374151);
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-button:hover {
  background: var(--bg-hover, #e5e7eb);
}
</style>
