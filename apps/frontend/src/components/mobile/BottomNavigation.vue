<template>
  <nav class="bottom-navigation" :class="{ 'with-safe-area': hasSafeArea }">
    <div class="nav-container">
      <button
        v-for="item in navigationItems"
        :key="item.id"
        @click="navigateTo(item)"
        :class="['nav-item', { active: isActive(item) }]"
        :aria-label="item.label"
      >
        <div class="nav-icon" v-html="getIcon(item)"></div>
        <span class="nav-label">{{ item.label }}</span>
        <div v-if="item.badge" class="nav-badge">{{ item.badge }}</div>
      </button>
    </div>

    <!-- 导航指示器 -->
    <div
      v-if="showIndicator"
      class="nav-indicator"
      :style="{ transform: `translateX(${indicatorPosition}px)` }"
    ></div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export interface NavigationItem {
  id: string
  label: string
  icon: string
  route?: string
  action?: () => void
  badge?: string | number
  disabled?: boolean
}

interface Props {
  items: NavigationItem[]
  activeItem?: string
  showIndicator?: boolean
  hasSafeArea?: boolean
}

interface Emits {
  (e: 'navigate', item: NavigationItem): void
  (e: 'active-change', itemId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  activeItem: '',
  showIndicator: true,
  hasSafeArea: false,
})

const emit = defineEmits<Emits>()

const router = useRouter()
const route = useRoute()

const indicatorPosition = ref(0)

// 计算属性
const navigationItems = computed(() => props.items)

const isActive = (item: NavigationItem) => {
  if (props.activeItem) {
    return props.activeItem === item.id
  }
  return item.route && route.path.startsWith(item.route)
}

// 方法
const navigateTo = (item: NavigationItem) => {
  if (item.disabled) return

  if (item.action) {
    item.action()
  } else if (item.route) {
    router.push(item.route)
  }

  emit('navigate', item)
  emit('active-change', item.id)

  // 更新指示器位置
  updateIndicatorPosition(item)
}

const getIcon = (item: NavigationItem) => {
  // 这里可以根据active状态返回不同的图标
  return item.icon
}

const updateIndicatorPosition = (activeItem: NavigationItem) => {
  const items = navigationItems.value
  const index = items.findIndex(item => item.id === activeItem.id)

  if (index >= 0 && props.showIndicator) {
    const itemWidth = 100 / items.length // 百分比宽度
    indicatorPosition.value = (index * itemWidth) + (itemWidth / 2) - 10 // 居中位置
  }
}

// 监听路由变化
watch(() => route.path, () => {
  const activeItem = navigationItems.value.find(item =>
    item.route && route.path.startsWith(item.route)
  )

  if (activeItem) {
    updateIndicatorPosition(activeItem)
    emit('active-change', activeItem.id)
  }
})

// 初始化指示器位置
if (props.activeItem || route.path) {
  const initialActive = props.activeItem ||
    navigationItems.value.find(item => item.route && route.path.startsWith(item.route))?.id

  if (initialActive) {
    const activeItem = navigationItems.value.find(item => item.id === initialActive)
    if (activeItem) {
      updateIndicatorPosition(activeItem)
    }
  }
}
</script>

<style scoped>
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e1e5e9;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.nav-container {
  display: flex;
  position: relative;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  min-height: 64px;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  color: #666;
}

.nav-item:hover {
  background: rgba(102, 126, 234, 0.05);
}

.nav-item.active {
  color: #667eea;
}

.nav-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-icon {
  font-size: 20px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
}

.nav-badge {
  position: absolute;
  top: 6px;
  right: 20%;
  background: #dc3545;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.nav-indicator {
  position: absolute;
  bottom: 0;
  width: 40px;
  height: 3px;
  background: #667eea;
  border-radius: 2px 2px 0 0;
  transition: transform 0.3s ease;
  left: 50%;
  transform: translateX(-50%);
}

/* iOS安全区域适配 */
.bottom-navigation.with-safe-area {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .bottom-navigation {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .nav-item:hover {
    background: rgba(102, 126, 234, 0.1);
  }

  .nav-item.active {
    color: #90caf9;
  }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .nav-item,
  .nav-indicator {
    transition: none;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .nav-item {
    padding: 12px 4px;
    min-height: 72px;
  }

  .nav-icon {
    font-size: 24px;
    width: 28px;
    height: 28px;
  }

  .nav-label {
    font-size: 12px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .nav-item {
    min-height: 48px;
    padding: 4px 2px;
  }

  .nav-icon {
    font-size: 18px;
    width: 20px;
    height: 20px;
    margin-bottom: 2px;
  }

  .nav-label {
    font-size: 10px;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .nav-item.active {
    background: #667eea;
    color: white;
  }

  .nav-indicator {
    background: #fff;
    height: 4px;
  }
}
</style>
