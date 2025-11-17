<!-- 文件路径: src/views/GameView.vue (实时协作版本) -->
<template>
  <div
    id="main-game-screen"
    class="page active"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <div v-if="isLoading" class="center-content">
      <h2>正在降临至世界...</h2>
    </div>

    <div v-else-if="gameStore.currentGame" class="game-layout">
      <CharacterHUD />
      <MainInteractionPanel />
      <WorldHUD />
    </div>

    <div v-else class="center-content">
      <h2>降临失败</h2>
      <p>{{ error || '无法加载游戏世界。该存档可能已损坏或不存在。' }}</p>
      <router-link to="/nexus" class="button">返回中枢</router-link>
    </div>

    <!-- 实时协作组件 -->
    <CollaborationCursors />
    <CollaborationPanel />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { useCollaborationStore } from '@/stores/collaboration.store'
import { useToast } from '@/composables/useToast'

import CharacterHUD from '@/components/game/CharacterHUD.vue'
import MainInteractionPanel from '@/components/game/MainInteractionPanel.vue'
import WorldHUD from '@/components/game/WorldHUD.vue'
import CollaborationCursors from '@/components/common/CollaborationCursors.vue'
import CollaborationPanel from '@/components/common/CollaborationPanel.vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const gameStore = useGameStore()
const collaborationStore = useCollaborationStore()
const { show: showToast } = useToast()

const isLoading = ref(true)
const error = ref(null)

// 鼠标位置跟踪
const handleMouseMove = (event: MouseEvent) => {
  if (collaborationStore.isInCollaboration) {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    collaborationStore.updateCursorPosition(x, y, true)
  }
}

const handleMouseLeave = () => {
  if (collaborationStore.isInCollaboration) {
    collaborationStore.updateCursorPosition(0, 0, false)
  }
}

// 初始化游戏和协作模式
onMounted(async () => {
  error.value = null
  isLoading.value = true

  try {
    // 加载游戏数据
    await gameStore.loadGame(props.id)

    // 加入协作模式
    collaborationStore.joinCollaboration(props.id)
    showToast('已进入协作模式', 'info')
  } catch (err: any) {
    error.value = err.message
    showToast(`加载世界失败: ${err.message}`, 'error')
  } finally {
    isLoading.value = false
  }
})

// 清理协作状态
onUnmounted(() => {
  collaborationStore.leaveCollaboration()
})
</script>
