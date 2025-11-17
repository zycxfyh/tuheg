<template>
  <div
    ref="gestureArea"
    class="touch-gesture-area"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
  >
    <slot></slot>

    <!-- 手势反馈 -->
    <div
      v-if="showFeedback && currentGesture"
      class="gesture-feedback"
      :class="currentGesture.type"
      :style="feedbackStyle"
    >
      <div class="feedback-icon">
        {{ getGestureIcon(currentGesture.type) }}
      </div>
      <div class="feedback-text">
        {{ getGestureText(currentGesture.type) }}
      </div>
    </div>

    <!-- 滑动指示器 -->
    <div
      v-if="showSwipeIndicator && isSwipeGesture"
      class="swipe-indicator"
      :style="{ transform: `translateX(${swipeProgress}%)` }"
    >
      <div class="indicator-bar"></div>
    </div>

    <!-- 长按菜单 -->
    <div
      v-if="showContextMenu && contextMenuItems.length > 0"
      class="context-menu"
      :style="{ top: `${contextMenuPosition.y}px`, left: `${contextMenuPosition.x}px` }"
      @click.stop
    >
      <div
        v-for="item in contextMenuItems"
        :key="item.id"
        @click="handleContextMenuItem(item)"
        class="context-menu-item"
      >
        <span class="menu-icon">{{ item.icon }}</span>
        <span class="menu-text">{{ item.label }}</span>
      </div>
    </div>

    <!-- 多点触控指示器 -->
    <div v-if="showMultiTouch && touchPoints.length > 1" class="multi-touch-indicator">
      <div
        v-for="(point, index) in touchPoints"
        :key="index"
        class="touch-point"
        :style="{ left: `${point.x}px`, top: `${point.y}px` }"
      >
        {{ index + 1 }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface TouchPoint {
  x: number
  y: number
  id: number
}

export interface GestureEvent {
  type: 'tap' | 'doubleTap' | 'longPress' | 'swipe' | 'pinch' | 'pan' | 'rotate'
  startX: number
  startY: number
  endX?: number
  endY?: number
  velocity?: number
  scale?: number
  rotation?: number
  duration?: number
}

export interface ContextMenuItem {
  id: string
  label: string
  icon: string
  action: () => void
}

interface Props {
  enableGestures?: boolean
  showFeedback?: boolean
  showSwipeIndicator?: boolean
  showContextMenu?: boolean
  showMultiTouch?: boolean
  longPressDelay?: number
  swipeThreshold?: number
  pinchThreshold?: number
}

interface Emits {
  (e: 'gesture', gesture: GestureEvent): void
  (e: 'tap', point: TouchPoint): void
  (e: 'double-tap', point: TouchPoint): void
  (e: 'long-press', point: TouchPoint): void
  (e: 'swipe', gesture: GestureEvent): void
  (e: 'pinch', gesture: GestureEvent): void
  (e: 'pan', gesture: GestureEvent): void
  (e: 'rotate', gesture: GestureEvent): void
  (e: 'context-menu', items: ContextMenuItem[], position: { x: number; y: number }): void
}

const props = withDefaults(defineProps<Props>(), {
  enableGestures: true,
  showFeedback: true,
  showSwipeIndicator: false,
  showContextMenu: false,
  showMultiTouch: false,
  longPressDelay: 500,
  swipeThreshold: 50,
  pinchThreshold: 0.1,
})

const emit = defineEmits<Emits>()

// 引用
const gestureArea = ref<HTMLElement>()

// 状态
const touchPoints = ref<TouchPoint[]>([])
const currentGesture = ref<GestureEvent | null>(null)
const isSwipeGesture = ref(false)
const swipeProgress = ref(0)
const contextMenuItems = ref<ContextMenuItem[]>([])
const contextMenuPosition = ref({ x: 0, y: 0 })

// 手势检测变量
const gestureStartTime = ref(0)
const gestureStartPoint = ref({ x: 0, y: 0 })
const lastTapTime = ref(0)
const longPressTimer = ref<NodeJS.Timeout | null>(null)
const initialDistance = ref(0)
const initialAngle = ref(0)

// 计算属性
const showFeedback = computed(() => props.showFeedback && currentGesture.value)
const feedbackStyle = computed(() => {
  if (!currentGesture.value) return {}

  const gesture = currentGesture.value
  return {
    left: `${gesture.endX || gesture.startX}px`,
    top: `${gesture.endY || gesture.startY}px`,
  }
})

// 工具函数
const getDistance = (p1: TouchPoint, p2: TouchPoint) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

const getAngle = (p1: TouchPoint, p2: TouchPoint) => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x)
}

const getVelocity = (start: TouchPoint, end: TouchPoint, duration: number) => {
  const distance = getDistance(start, end)
  return distance / duration
}

const getGestureIcon = (type: string) => {
  const icons: Record<string, string> = {
    tap: '👆',
    doubleTap: '👆👆',
    longPress: '👇',
    swipe: '👉',
    pinch: '🤏',
    pan: '🖐️',
    rotate: '🔄',
  }
  return icons[type] || '❓'
}

const getGestureText = (type: string) => {
  const texts: Record<string, string> = {
    tap: '点击',
    doubleTap: '双击',
    longPress: '长按',
    swipe: '滑动',
    pinch: '缩放',
    pan: '拖拽',
    rotate: '旋转',
  }
  return texts[type] || type
}

// 事件处理
const handleTouchStart = (event: TouchEvent) => {
  if (!props.enableGestures) return

  event.preventDefault()

  const touches = Array.from(event.touches).map(touch => ({
    x: touch.clientX,
    y: touch.clientY,
    id: touch.identifier,
  }))

  touchPoints.value = touches

  if (touches.length === 1) {
    handleSingleTouchStart(touches[0])
  } else if (touches.length === 2) {
    handleMultiTouchStart(touches)
  }
}

const handleSingleTouchStart = (point: TouchPoint) => {
  gestureStartTime.value = Date.now()
  gestureStartPoint.value = point

  // 检查双击
  const now = Date.now()
  if (now - lastTapTime.value < 300) {
    emit('double-tap', point)
    emit('gesture', {
      type: 'doubleTap',
      startX: point.x,
      startY: point.y,
    })
    lastTapTime.value = 0
    return
  }

  // 设置长按定时器
  longPressTimer.value = setTimeout(() => {
    emit('long-press', point)
    emit('gesture', {
      type: 'longPress',
      startX: point.x,
      startY: point.y,
      duration: props.longPressDelay,
    })

    // 显示上下文菜单
    if (props.showContextMenu) {
      showContextMenu(point)
    }
  }, props.longPressDelay)

  lastTapTime.value = now
}

const handleMultiTouchStart = (points: TouchPoint[]) => {
  if (points.length !== 2) return

  initialDistance.value = getDistance(points[0], points[1])
  initialAngle.value = getAngle(points[0], points[1])
}

const handleTouchMove = (event: TouchEvent) => {
  if (!props.enableGestures) return

  event.preventDefault()

  const touches = Array.from(event.touches).map(touch => ({
    x: touch.clientX,
    y: touch.clientY,
    id: touch.identifier,
  }))

  touchPoints.value = touches

  if (touches.length === 1) {
    handleSingleTouchMove(touches[0])
  } else if (touches.length === 2) {
    handleMultiTouchMove(touches)
  }
}

const handleSingleTouchMove = (point: TouchPoint) => {
  // 清除长按定时器
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }

  const deltaX = point.x - gestureStartPoint.value.x
  const deltaY = point.y - gestureStartPoint.value.y
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  // 检查是否为滑动
  if (distance > props.swipeThreshold) {
    isSwipeGesture.value = true
    swipeProgress.value = Math.min(distance / 100, 1) * 100

    currentGesture.value = {
      type: 'swipe',
      startX: gestureStartPoint.value.x,
      startY: gestureStartPoint.value.y,
      endX: point.x,
      endY: point.y,
      velocity: getVelocity(gestureStartPoint.value, point, Date.now() - gestureStartTime.value),
    }
  }
}

const handleMultiTouchMove = (points: TouchPoint[]) => {
  if (points.length !== 2) return

  const currentDistance = getDistance(points[0], points[1])
  const currentAngle = getAngle(points[0], points[1])

  // 检测缩放
  const scale = currentDistance / initialDistance.value
  if (Math.abs(scale - 1) > props.pinchThreshold) {
    currentGesture.value = {
      type: 'pinch',
      startX: (points[0].x + points[1].x) / 2,
      startY: (points[0].y + points[1].y) / 2,
      scale,
    }
    emit('pinch', currentGesture.value)
  }

  // 检测旋转
  const rotation = currentAngle - initialAngle.value
  if (Math.abs(rotation) > 0.1) {
    currentGesture.value = {
      type: 'rotate',
      startX: (points[0].x + points[1].x) / 2,
      startY: (points[0].y + points[1].y) / 2,
      rotation,
    }
    emit('rotate', currentGesture.value)
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  if (!props.enableGestures) return

  // 清除定时器
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }

  const touches = Array.from(event.changedTouches)

  if (touches.length === 1 && !isSwipeGesture.value) {
    // 单指点击
    const point = {
      x: touches[0].clientX,
      y: touches[0].clientY,
      id: touches[0].identifier,
    }

    emit('tap', point)
    emit('gesture', {
      type: 'tap',
      startX: point.x,
      startY: point.y,
    })
  }

  if (isSwipeGesture.value && currentGesture.value) {
    emit('swipe', currentGesture.value)
    emit('gesture', currentGesture.value)
  }

  // 重置状态
  touchPoints.value = []
  currentGesture.value = null
  isSwipeGesture.value = false
  swipeProgress.value = 0
}

// 鼠标事件处理（用于桌面端测试）
const handleMouseDown = (event: MouseEvent) => {
  if (!props.enableGestures || event.touches) return

  const point = { x: event.clientX, y: event.clientY, id: 0 }
  handleSingleTouchStart(point)
}

const handleMouseMove = (event: MouseEvent) => {
  if (!props.enableGestures || event.touches) return

  const point = { x: event.clientX, y: event.clientY, id: 0 }
  handleSingleTouchMove(point)
}

const handleMouseUp = (event: MouseEvent) => {
  if (!props.enableGestures || event.touches) return

  // 模拟touchend
  handleTouchEnd({
    changedTouches: [{ clientX: event.clientX, clientY: event.clientY, identifier: 0 }],
    preventDefault: () => {},
  } as any)
}

// 上下文菜单
const showContextMenu = (point: TouchPoint) => {
  contextMenuPosition.value = { x: point.x, y: point.y }
  contextMenuItems.value = [
    { id: 'copy', label: '复制', icon: '📋', action: () => console.log('copy') },
    { id: 'share', label: '分享', icon: '🔗', action: () => console.log('share') },
    { id: 'delete', label: '删除', icon: '🗑️', action: () => console.log('delete') },
  ]

  emit('context-menu', contextMenuItems.value, contextMenuPosition.value)
}

const handleContextMenuItem = (item: ContextMenuItem) => {
  item.action()
  contextMenuItems.value = []
}

// 生命周期
onMounted(() => {
  // 添加事件监听器防止默认行为
  if (gestureArea.value) {
    gestureArea.value.addEventListener('contextmenu', (e) => {
      if (props.showContextMenu) {
        e.preventDefault()
      }
    })
  }
})

onUnmounted(() => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
  }
})
</script>

<style scoped>
.touch-gesture-area {
  position: relative;
  width: 100%;
  height: 100%;
  touch-action: none; /* 防止浏览器默认的触摸行为 */
}

.gesture-feedback {
  position: fixed;
  pointer-events: none;
  z-index: 1000;
  background: rgba(102, 126, 234, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transform: translate(-50%, -50%);
  animation: feedbackFade 0.5s ease;
}

.feedback-icon {
  font-size: 16px;
}

.feedback-text {
  white-space: nowrap;
}

.gesture-feedback.tap {
  background: rgba(40, 167, 69, 0.9);
}

.gesture-feedback.swipe {
  background: rgba(255, 193, 7, 0.9);
}

.gesture-feedback.pinch {
  background: rgba(220, 53, 69, 0.9);
}

.gesture-feedback.pan {
  background: rgba(23, 162, 184, 0.9);
}

.swipe-indicator {
  position: fixed;
  top: 50%;
  left: 20px;
  width: calc(100vw - 40px);
  height: 4px;
  background: rgba(102, 126, 234, 0.3);
  border-radius: 2px;
  z-index: 999;
  pointer-events: none;
}

.indicator-bar {
  height: 100%;
  background: #667eea;
  border-radius: 2px;
  transition: width 0.1s ease;
}

.context-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
  padding: 8px 0;
  border: 1px solid #e1e5e9;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.context-menu-item:hover {
  background: #f8f9fa;
}

.menu-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.multi-touch-indicator {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 998;
}

.touch-point {
  position: absolute;
  width: 40px;
  height: 40px;
  background: rgba(102, 126, 234, 0.8);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transform: translate(-50%, -50%);
  animation: touchPointPulse 0.5s ease infinite alternate;
}

@keyframes feedbackFade {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes touchPointPulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1.1);
  }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .gesture-feedback,
  .touch-point {
    animation: none;
  }

  .indicator-bar {
    transition: none;
  }
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .gesture-feedback {
    background: rgba(144, 202, 249, 0.9);
  }

  .context-menu {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .context-menu-item:hover {
    background: #4a5568;
  }
}
</style>
