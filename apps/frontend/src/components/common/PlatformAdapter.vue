<template>
  <div :class="platformClasses" :style="platformStyles">
    <!-- 平台特定的UI调整 -->
    <div v-if="isNative" class="native-app-container">
      <!-- 原生平台特有的UI元素 -->
      <slot name="native-header">
        <div class="native-header-spacer" :style="{ height: safeAreaInsets.top + 'px' }"></div>
      </slot>

      <!-- 主内容区域 -->
      <div class="native-main-content" :style="mainContentStyles">
        <slot></slot>
      </div>

      <!-- 原生平台特有的底部元素 -->
      <slot name="native-footer">
        <div class="native-footer-spacer" :style="{ height: safeAreaInsets.bottom + 'px' }"></div>
      </slot>
    </div>

    <!-- Web/PWA平台 -->
    <div v-else class="web-app-container">
      <slot></slot>
    </div>

    <!-- 平台特定的覆盖层 -->
    <div v-if="showPlatformOverlay" class="platform-overlay" @click="hidePlatformOverlay">
      <div class="platform-message" @click.stop>
        <div class="platform-icon">{{ platformIcon }}</div>
        <h3>{{ platformMessage.title }}</h3>
        <p>{{ platformMessage.description }}</p>
        <button class="platform-action-btn" @click="handlePlatformAction">
          {{ platformMessage.actionText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { platformService } from '@/services/mobile/PlatformService'

// Props
interface Props {
  adaptiveLayout?: boolean
  showPlatformHints?: boolean
  customPlatformStyles?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  adaptiveLayout: true,
  showPlatformHints: false,
  customPlatformStyles: () => ({}),
})

// Emits
const emit = defineEmits<{
  platformChanged: [platform: string]
  nativeAction: [action: string]
}>()

// 响应式数据
const platformInfo = ref<any>(null)
const safeAreaInsets = ref({ top: 0, bottom: 0, left: 0, right: 0 })
const showPlatformOverlay = ref(false)
const platformMessage = ref({
  title: '',
  description: '',
  actionText: '确定',
})

// 计算属性
const isNative = computed(() => platformInfo.value?.isNative || false)
const currentPlatform = computed(() => platformInfo.value?.platform || 'web')

const platformClasses = computed(() => ({
  'platform-adapter': true,
  'native-platform': isNative.value,
  'web-platform': !isNative.value,
  [`platform-${currentPlatform.value}`]: true,
  'adaptive-layout': props.adaptiveLayout,
}))

const platformStyles = computed(() => ({
  ...props.customPlatformStyles,
  '--safe-area-top': safeAreaInsets.value.top + 'px',
  '--safe-area-bottom': safeAreaInsets.value.bottom + 'px',
  '--safe-area-left': safeAreaInsets.value.left + 'px',
  '--safe-area-right': safeAreaInsets.value.right + 'px',
}))

const mainContentStyles = computed(() => ({
  paddingTop: isNative.value ? '0px' : '20px',
  paddingBottom: isNative.value ? '0px' : '20px',
  paddingLeft: isNative.value ? safeAreaInsets.value.left + 'px' : '20px',
  paddingRight: isNative.value ? safeAreaInsets.value.right + 'px' : '20px',
}))

const platformIcon = computed(() => {
  switch (currentPlatform.value) {
    case 'ios':
      return '📱'
    case 'android':
      return '🤖'
    case 'web':
      return '🌐'
    default:
      return '💻'
  }
})

// 方法
const initializePlatform = async () => {
  platformInfo.value = await platformService.getPlatformInfo()

  if (platformInfo.value.isNative) {
    safeAreaInsets.value = await platformService.getSafeAreaInsets()
  }

  emit('platformChanged', currentPlatform.value)

  // 显示平台提示（如果启用）
  if (props.showPlatformHints && platformInfo.value.isNative) {
    showPlatformHint()
  }
}

const showPlatformHint = () => {
  const platform = currentPlatform.value
  const messages = {
    ios: {
      title: 'iOS 应用模式',
      description: '您正在使用 iOS 应用版本，享受原生性能和功能。',
      actionText: '知道了',
    },
    android: {
      title: 'Android 应用模式',
      description: '您正在使用 Android 应用版本，享受原生性能和功能。',
      actionText: '知道了',
    },
  }

  if (messages[platform as keyof typeof messages]) {
    platformMessage.value = messages[platform as keyof typeof messages]
    showPlatformOverlay.value = true
  }
}

const hidePlatformOverlay = () => {
  showPlatformOverlay.value = false
}

const handlePlatformAction = () => {
  emit('nativeAction', 'platform_hint_acknowledged')
  hidePlatformOverlay()
}

// 平台特定的工具方法
const vibrate = async (pattern: number | number[] = 100) => {
  if (platformInfo.value?.supportsFeature('vibration')) {
    if (isNative.value) {
      // 原生平台震动
      const { Haptics } = await import('@capacitor/haptics')
      await Haptics.vibrate({ duration: typeof pattern === 'number' ? pattern : 100 })
    } else {
      // Web平台震动
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern)
      }
    }
  }
}

const share = async (data: { title: string; text?: string; url?: string }) => {
  if (platformInfo.value?.supportsFeature('share')) {
    if (isNative.value) {
      const { Share } = await import('@capacitor/share')
      await Share.share(data)
    } else {
      if ('share' in navigator) {
        await navigator.share(data)
      } else {
        // 降级处理：复制到剪贴板
        const text = `${data.title}${data.text ? '\n' + data.text : ''}${data.url ? '\n' + data.url : ''}`
        await navigator.clipboard.writeText(text)
        alert('内容已复制到剪贴板')
      }
    }
  }
}

// 暴露给父组件的方法
defineExpose({
  vibrate,
  share,
  getPlatformInfo: () => platformInfo.value,
  getSafeAreaInsets: () => safeAreaInsets.value,
})

// 生命周期
onMounted(() => {
  initializePlatform()
})

// 监听平台变化（热重载等情况）
if (import.meta.hot) {
  import.meta.hot.on('platform-changed', () => {
    initializePlatform()
  })
}
</script>

<style scoped>
.platform-adapter {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 原生平台样式 */
.native-platform {
  background: var(--background-color, #1a1a2e);
  color: var(--text-color, #ffffff);
}

.native-app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh; /* 现代浏览器支持 */
}

.native-main-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* iOS平滑滚动 */
}

.native-header-spacer,
.native-footer-spacer {
  background: transparent;
  flex-shrink: 0;
}

/* Web平台样式 */
.web-platform {
  background: var(--background-color, #ffffff);
  color: var(--text-color, #333333);
}

.web-app-container {
  min-height: 100vh;
}

/* 平台覆盖层 */
.platform-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}

.platform-message {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 320px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

.platform-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.platform-message h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 1.2rem;
}

.platform-message p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.platform-action-btn {
  background: linear-gradient(45deg, #00d4ff, #09c);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.platform-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 212, 255, 0.3);
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 480px) {
  .platform-message {
    margin: 20px;
    padding: 20px;
  }

  .platform-icon {
    font-size: 2.5rem;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .platform-message {
    border: 2px solid #000;
  }

  .platform-action-btn {
    border: 2px solid #000;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .platform-overlay,
  .platform-message {
    animation: none;
  }

  .platform-action-btn {
    transition: none;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .web-platform {
    background: #1a1a1a;
    color: #ffffff;
  }

  .platform-message {
    background: #2d2d2d;
    color: #ffffff;
  }

  .platform-message h3 {
    color: #ffffff;
  }

  .platform-message p {
    color: #cccccc;
  }
}
</style>
