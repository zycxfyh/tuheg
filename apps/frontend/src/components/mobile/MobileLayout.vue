<template>
  <div class="mobile-layout" :class="{ 'sidebar-open': sidebarOpen }">
    <!-- 移动端头部 -->
    <header class="mobile-header" v-if="showHeader">
      <div class="header-left">
        <button
          v-if="hasSidebar"
          @click="toggleSidebar"
          class="menu-btn"
          :aria-label="sidebarOpen ? '关闭侧边栏' : '打开侧边栏'"
        >
          <span class="hamburger" :class="{ open: sidebarOpen }">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <button
          v-if="showBackButton"
          @click="$emit('back')"
          class="back-btn"
          aria-label="返回"
        >
          ←
        </button>
      </div>

      <div class="header-center">
        <h1 class="header-title" v-if="title">{{ title }}</h1>
        <slot name="header-center"></slot>
      </div>

      <div class="header-right">
        <slot name="header-actions"></slot>
        <button
          v-if="showSearch"
          @click="toggleSearch"
          class="search-btn"
          aria-label="搜索"
        >
          🔍
        </button>
        <button
          v-if="showMenu"
          @click="toggleMenu"
          class="menu-btn"
          aria-label="更多选项"
        >
          ⋮
        </button>
      </div>

      <!-- 搜索栏 -->
      <div v-if="searchVisible" class="header-search">
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          @keyup.enter="performSearch"
          @blur="hideSearch"
        />
        <button @click="performSearch" class="search-submit">搜索</button>
      </div>
    </header>

    <!-- 侧边栏 -->
    <aside
      v-if="hasSidebar"
      class="mobile-sidebar"
      :class="{ open: sidebarOpen }"
      @touchstart="handleSidebarTouchStart"
      @touchmove="handleSidebarTouchMove"
      @touchend="handleSidebarTouchEnd"
    >
      <div class="sidebar-header">
        <h2>菜单</h2>
        <button @click="closeSidebar" class="close-btn">✕</button>
      </div>

      <nav class="sidebar-nav">
        <slot name="sidebar"></slot>
      </nav>

      <!-- 侧边栏底部 -->
      <div class="sidebar-footer">
        <slot name="sidebar-footer"></slot>
      </div>
    </aside>

    <!-- 侧边栏遮罩 -->
    <div
      v-if="sidebarOpen && hasSidebar"
      class="sidebar-overlay"
      @click="closeSidebar"
      @touchstart="handleOverlayTouchStart"
    ></div>

    <!-- 主要内容区域 -->
    <main class="mobile-main" :class="{ 'with-header': showHeader, 'with-bottom-nav': showBottomNav }">
      <slot></slot>
    </main>

    <!-- 底部导航 -->
    <nav v-if="showBottomNav" class="mobile-bottom-nav">
      <slot name="bottom-nav"></slot>
    </nav>

    <!-- 底部安全区域（适配iPhone X等） -->
    <div v-if="hasSafeArea" class="safe-area-spacer"></div>

    <!-- 浮动操作按钮 -->
    <button
      v-if="showFab"
      @click="$emit('fab-click')"
      class="fab-btn"
      :class="{ 'fab-extended': fabExtended }"
    >
      <span class="fab-icon">{{ fabIcon }}</span>
      <span v-if="fabExtended" class="fab-text">{{ fabText }}</span>
    </button>

    <!-- 下拉刷新指示器 -->
    <div
      v-if="pullToRefresh && isRefreshing"
      class="pull-refresh-indicator"
    >
      <div class="refresh-spinner"></div>
      <span>刷新中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

interface Props {
  title?: string
  showHeader?: boolean
  showBackButton?: boolean
  hasSidebar?: boolean
  showSearch?: boolean
  showMenu?: boolean
  showBottomNav?: boolean
  showFab?: boolean
  fabIcon?: string
  fabText?: string
  fabExtended?: boolean
  searchPlaceholder?: string
  pullToRefresh?: boolean
  hasSafeArea?: boolean
}

interface Emits {
  (e: 'back'): void
  (e: 'sidebar-toggle', open: boolean): void
  (e: 'search', query: string): void
  (e: 'menu-toggle', show: boolean): void
  (e: 'fab-click'): void
  (e: 'pull-refresh'): void
}

const props = withDefaults(defineProps<Props>(), {
  showHeader: true,
  showBackButton: false,
  hasSidebar: false,
  showSearch: false,
  showMenu: false,
  showBottomNav: false,
  showFab: false,
  fabIcon: '+',
  fabText: '',
  fabExtended: false,
  searchPlaceholder: '搜索...',
  pullToRefresh: false,
  hasSafeArea: false,
})

const emit = defineEmits<Emits>()

// 状态
const sidebarOpen = ref(false)
const searchVisible = ref(false)
const searchQuery = ref('')
const menuVisible = ref(false)
const isRefreshing = ref(false)

// 触摸手势处理
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchCurrentX = ref(0)
const isDraggingSidebar = ref(false)

const searchInput = ref<HTMLInputElement>()

// 计算属性
const fabExtended = computed(() => props.fabExtended && props.fabText)

// 方法
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
  emit('sidebar-toggle', sidebarOpen.value)
}

const closeSidebar = () => {
  sidebarOpen.value = false
  emit('sidebar-toggle', false)
}

const openSidebar = () => {
  sidebarOpen.value = true
  emit('sidebar-toggle', true)
}

const toggleSearch = () => {
  searchVisible.value = !searchVisible.value
  if (searchVisible.value) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
}

const hideSearch = () => {
  searchVisible.value = false
  searchQuery.value = ''
}

const performSearch = () => {
  if (searchQuery.value.trim()) {
    emit('search', searchQuery.value.trim())
    hideSearch()
  }
}

const toggleMenu = () => {
  menuVisible.value = !menuVisible.value
  emit('menu-toggle', menuVisible.value)
}

// 触摸手势处理
const handleSidebarTouchStart = (event: TouchEvent) => {
  touchStartX.value = event.touches[0].clientX
  touchStartY.value = event.touches[0].clientY
  isDraggingSidebar.value = true
}

const handleSidebarTouchMove = (event: TouchEvent) => {
  if (!isDraggingSidebar.value) return

  touchCurrentX.value = event.touches[0].clientX
  const deltaX = touchCurrentX.value - touchStartX.value

  // 只有向右滑动才关闭侧边栏
  if (deltaX > 50 && sidebarOpen.value) {
    closeSidebar()
    isDraggingSidebar.value = false
  }
}

const handleSidebarTouchEnd = () => {
  isDraggingSidebar.value = false
}

const handleOverlayTouchStart = (event: TouchEvent) => {
  // 防止侧边栏遮罩上的触摸事件冒泡
  event.preventDefault()
}

// 下拉刷新处理
const handlePullToRefresh = () => {
  if (!props.pullToRefresh) return

  isRefreshing.value = true
  emit('pull-refresh')

  // 模拟刷新完成
  setTimeout(() => {
    isRefreshing.value = false
  }, 2000)
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (sidebarOpen.value) {
      closeSidebar()
    } else if (searchVisible.value) {
      hideSearch()
    } else if (menuVisible.value) {
      menuVisible.value = false
    }
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)

  // 检测设备是否支持下拉刷新
  if (props.pullToRefresh) {
    // 这里可以添加下拉刷新的事件监听器
    // 实际实现需要根据具体需求来处理
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f8f9fa;
  position: relative;
}

.mobile-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  border-bottom: 1px solid #e1e5e9;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-center {
  flex: 1;
  text-align: center;
  margin: 0 16px;
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-btn,
.back-btn,
.search-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 6px;
  color: #666;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.menu-btn:hover,
.back-btn:hover,
.search-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.hamburger {
  width: 20px;
  height: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hamburger span {
  width: 100%;
  height: 2px;
  background: currentColor;
  transition: all 0.3s ease;
  transform-origin: center;
}

.hamburger.open span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.hamburger.open span:nth-child(2) {
  opacity: 0;
}

.hamburger.open span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

.header-search {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 16px;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  gap: 8px;
  animation: slideDown 0.2s ease;
}

.header-search input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
}

.header-search .search-submit {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: white;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 200;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.mobile-sidebar.open {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.sidebar-header .close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 4px;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.sidebar-footer {
  border-top: 1px solid #e1e5e9;
  padding: 16px 20px;
  background: #f8f9fa;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 150;
}

.mobile-main {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* iOS 滚动优化 */
}

.mobile-main.with-header {
  padding-top: 0;
}

.mobile-main.with-bottom-nav {
  padding-bottom: 80px; /* 为底部导航留出空间 */
}

.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e1e5e9;
  padding: 8px 16px;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.safe-area-spacer {
  height: env(safe-area-inset-bottom, 0);
  background: white;
}

.fab-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #667eea;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  transition: all 0.3s ease;
}

.fab-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.fab-btn.fab-extended {
  width: auto;
  padding: 0 20px;
  border-radius: 28px;
  font-size: 16px;
}

.fab-extended .fab-icon {
  margin-right: 8px;
}

.fab-extended .fab-text {
  font-weight: 500;
}

.pull-refresh-indicator {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 12px 20px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 100;
}

.refresh-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (min-width: 768px) {
  .mobile-layout.sidebar-open .mobile-main {
    margin-left: 280px;
  }

  .mobile-sidebar {
    position: static;
    transform: none;
    width: 280px;
    height: auto;
    box-shadow: none;
    border-right: 1px solid #e1e5e9;
  }

  .sidebar-overlay {
    display: none;
  }

  .mobile-header {
    margin-left: 280px;
  }

  .mobile-layout .mobile-sidebar {
    transform: translateX(0);
  }
}

/* iOS Safari 底部安全区域适配 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .mobile-bottom-nav {
    padding-bottom: calc(8px + env(safe-area-inset-bottom));
  }

  .fab-btn {
    bottom: calc(24px + env(safe-area-inset-bottom));
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .mobile-layout {
    background: #1a202c;
    color: #e2e8f0;
  }

  .mobile-header {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .mobile-sidebar {
    background: #2d3748;
    color: #e2e8f0;
  }

  .sidebar-header {
    background: #1a202c;
    border-color: #4a5568;
  }

  .mobile-bottom-nav {
    background: #2d3748;
    border-color: #4a5568;
  }
}

/* 减少动画对于偏好减少动画的用户 */
@media (prefers-reduced-motion: reduce) {
  .mobile-sidebar,
  .header-search,
  .fab-btn {
    transition: none;
  }

  .refresh-spinner {
    animation: none;
  }
}
</style>
