<!-- 文件路径: apps/frontend/src/App.vue (已更新) -->
<template>
  <div id="app-container">
    <RouterView />
    <CharacterSheetModal v-if="uiStore.isCharacterSheetModalVisible" />
    <JournalModal v-if="uiStore.isJournalModalVisible" />
    <WeaverConsoleModal v-if="uiStore.isWeaverConsoleVisible" />
    <!-- [核心] 在这里挂载我们的新模态框 -->
    <AISettingsModal v-if="uiStore.isAiSettingsModalVisible" />
    <ProcessingOverlay />

    <!-- Toast通知容器 -->
    <ToastContainer />

    <!-- 语言切换器 (开发调试用，生产环境可隐藏) -->
    <LanguageSwitcher v-if="showLanguageSwitcher" class="language-switcher-overlay" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterView } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { useThemeStore } from '@/stores/theme.store';

// 导入所有模态框和覆盖层组件
import CharacterSheetModal from '@/components/common/CharacterSheetModal.vue';
import JournalModal from '@/components/common/JournalModal.vue';
import ProcessingOverlay from '@/components/common/ProcessingOverlay.vue';
import WeaverConsoleModal from '@/components/common/WeaverConsoleModal.vue';
// [核心] 导入新创建的模态框组件
import AISettingsModal from '@/components/common/AISettingsModal.vue';
import ToastContainer from '@/components/common/ToastContainer.vue';
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue';

const authStore = useAuthStore();
const uiStore = useUIStore();
const themeStore = useThemeStore();

// 语言切换器显示控制 (开发环境显示，生产环境可隐藏)
const showLanguageSwitcher = ref(import.meta.env.DEV);

onMounted(() => {
  // 初始化主题系统
  themeStore.initTheme();

  // 验证用户认证状态
  authStore.verifyAuthOnLoad();
});
</script>

<style>
/* 语言切换器覆盖层样式 */
.language-switcher-overlay {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10000;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideInFromRight 0.5s ease-out;
}

@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .language-switcher-overlay {
    bottom: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>
