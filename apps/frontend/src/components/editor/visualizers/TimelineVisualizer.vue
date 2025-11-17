<template>
  <div class="timeline-visualizer">
    <div class="timeline-container">
      <div class="timeline-line"></div>
      <div class="timeline-events">
        <div
          v-for="event in timelineEvents"
          :key="event.id"
          class="timeline-event"
          :style="{ left: `${getEventPosition(event)}%` }"
          @click="handleEventClick(event)"
        >
          <div class="event-marker" :style="{ backgroundColor: event.color }"></div>
          <div class="event-content">
            <h4>{{ event.title }}</h4>
            <p>{{ event.description }}</p>
            <span class="event-date">{{ formatDate(event.date) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  content: string
  events?: any[]
}

interface Emits {
  (e: 'event-click', event: any): void
  (e: 'event-add', event: any): void
}

const props = withDefaults(defineProps<Props>(), {
  events: () => [],
})

const emit = defineEmits<Emits>()

const timelineEvents = computed(() => {
  if (props.events.length > 0) return props.events

  // 模拟事件数据
  return [
    {
      id: 'event1',
      title: '项目开始',
      description: '初始化项目结构',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      color: '#28a745',
    },
    {
      id: 'event2',
      title: '核心功能开发',
      description: '实现主要功能模块',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      color: '#ffc107',
    },
    {
      id: 'event3',
      title: '测试阶段',
      description: '进行功能测试和优化',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      color: '#dc3545',
    },
    {
      id: 'event4',
      title: '发布上线',
      description: '项目正式上线',
      date: new Date(),
      color: '#007bff',
    },
  ]
})

const getEventPosition = (event: any) => {
  const now = new Date()
  const totalDays = 90 // 90天时间范围
  const daysSinceStart = (now.getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.min(100, (daysSinceStart / totalDays) * 100))
}

const handleEventClick = (event: any) => {
  emit('event-click', event)
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.timeline-visualizer {
  height: 100%;
  padding: 20px;
  background: white;
}

.timeline-container {
  position: relative;
  height: 100%;
}

.timeline-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: #e1e5e9;
}

.timeline-events {
  position: relative;
  height: 100%;
}

.timeline-event {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  max-width: 200px;
}

.event-marker {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin: 0 auto 8px auto;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.event-content {
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.event-content h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
}

.event-content p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.event-date {
  font-size: 11px;
  color: #999;
}
</style>
