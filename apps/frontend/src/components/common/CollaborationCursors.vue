<template>
  <div class="collaboration-cursors">
    <!-- 其他用户的鼠标光标 -->
    <div
      v-for="collaborator in onlineCollaborators"
      :key="collaborator.id"
      v-show="collaborator.cursor.visible && collaborator.id !== userId"
      class="collaborator-cursor"
      :style="{
        left: collaborator.cursor.x + 'px',
        top: collaborator.cursor.y + 'px',
        '--cursor-color': collaborator.color
      }"
    >
      <!-- 光标图标 -->
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="cursor-icon"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill="var(--cursor-color)"
          stroke="white"
          stroke-width="1"
        />
      </svg>

      <!-- 用户名标签 -->
      <div class="cursor-label" :style="{ backgroundColor: collaborator.color }">
        {{ collaborator.name }}
      </div>
    </div>

    <!-- 文本选择高亮 -->
    <div
      v-for="collaborator in onlineCollaborators"
      :key="`selection-${collaborator.id}`"
      v-show="collaborator.selection && collaborator.id !== userId"
      class="collaborator-selection"
      :style="{
        '--selection-color': collaborator.color + '40',
        '--selection-border': collaborator.color
      }"
    >
      <!-- TODO: 实现文本选择高亮的DOM操作 -->
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCollaborationStore } from '@/stores/collaboration.store'

const collaborationStore = useCollaborationStore()

const userId = computed(() => collaborationStore.userId)
const onlineCollaborators = computed(() => collaborationStore.onlineCollaborators)
</script>

<style scoped>
.collaboration-cursors {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.collaborator-cursor {
  position: absolute;
  pointer-events: none;
  transition: all 0.1s ease-out;
}

.cursor-icon {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.cursor-label {
  position: absolute;
  top: -25px;
  left: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transform: translateX(-50%);
}

.collaborator-selection {
  /* 文本选择高亮的样式 */
  background-color: var(--selection-color);
  border: 1px solid var(--selection-border);
  border-radius: 2px;
  pointer-events: none;
}
</style>
