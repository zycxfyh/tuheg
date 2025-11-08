<template>
  <div :class="['plugin-card', viewMode]">
    <!-- 插件图标 -->
    <div class="plugin-icon">
      <div class="icon-placeholder">
        <i :class="pluginIconClass"></i>
      </div>
      <div v-if="plugin.isFeatured" class="featured-badge">
        <i class="icon-star"></i>
        精选
      </div>
    </div>

    <!-- 插件信息 -->
    <div class="plugin-info">
      <div class="plugin-header">
        <h3 class="plugin-name">{{ plugin.displayName }}</h3>
        <div class="plugin-badges">
          <span
            v-for="tag in plugin.tags.slice(0, 2)"
            :key="tag.id"
            class="plugin-tag"
          >
            {{ tag.displayName }}
          </span>
        </div>
      </div>

      <p class="plugin-description">
        {{ truncatedDescription }}
      </p>

      <div class="plugin-meta">
        <div class="meta-item">
          <i class="icon-user"></i>
          <span>{{ plugin.author.email }}</span>
        </div>

        <div class="meta-item">
          <i class="icon-folder"></i>
          <span>{{ plugin.category.displayName }}</span>
        </div>

        <div class="meta-item">
          <i class="icon-download"></i>
          <span>{{ formatNumber(plugin.totalDownloads) }}</span>
        </div>
      </div>

      <!-- 评分 -->
      <div class="plugin-rating">
        <div class="rating-stars">
          <i
            v-for="star in 5"
            :key="star"
            :class="star <= Math.floor(plugin.averageRating || 0) ? 'icon-star-full' : 'icon-star-empty'"
            class="star-icon"
          ></i>
        </div>
        <span class="rating-score">
          {{ plugin.averageRating ? plugin.averageRating.toFixed(1) : '暂无' }}
        </span>
        <span class="rating-count">
          ({{ plugin.reviewCount || 0 }})
        </span>
      </div>

      <!-- 版本信息 -->
      <div class="plugin-version">
        <span class="version-label">最新版本:</span>
        <span class="version-number">{{ plugin.latestVersion || '未知' }}</span>
        <span class="version-date">
          {{ plugin.lastUpdated ? formatDate(plugin.lastUpdated) : '未知' }}
        </span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="plugin-actions">
      <button
        @click="$emit('viewDetails', plugin)"
        class="action-btn secondary"
      >
        <i class="icon-info"></i>
        详情
      </button>

      <button
        @click="$emit('install', plugin)"
        :disabled="installing"
        class="action-btn primary"
      >
        <i v-if="installing" class="icon-spinner spinning"></i>
        <i v-else class="icon-download"></i>
        {{ installing ? '安装中...' : '安装' }}
      </button>
    </div>

    <!-- 安装状态覆盖层 -->
    <div v-if="installing" class="install-overlay">
      <div class="install-progress">
        <div class="progress-spinner"></div>
        <p>正在安装插件...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  plugin: {
    type: Object,
    required: true
  },
  viewMode: {
    type: String,
    default: 'grid'
  }
})

const emit = defineEmits(['install', 'viewDetails'])

const installing = ref(false)

// 计算属性
const truncatedDescription = computed(() => {
  const description = props.plugin.description || ''
  return description.length > 100 ? description.substring(0, 100) + '...' : description
})

const pluginIconClass = computed(() => {
  // 根据插件分类返回不同的图标
  const categoryIcons = {
    'ai-tools': 'icon-brain',
    'utilities': 'icon-wrench',
    'themes': 'icon-palette',
    'languages': 'icon-globe',
    'integrations': 'icon-plug'
  }

  return categoryIcons[props.plugin.category.name] || 'icon-puzzle-piece'
})

// 方法
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return '今天'
  } else if (diffDays === 2) {
    return '昨天'
  } else if (diffDays <= 7) {
    return `${diffDays - 1}天前`
  } else if (diffDays <= 30) {
    return `${Math.ceil(diffDays / 7)}周前`
  } else if (diffDays <= 365) {
    return `${Math.ceil(diffDays / 30)}个月前`
  } else {
    return `${Math.ceil(diffDays / 365)}年前`
  }
}

async function handleInstall() {
  installing.value = true
  try {
    emit('install', props.plugin)
  } finally {
    // 延迟一点时间显示安装状态
    setTimeout(() => {
      installing.value = false
    }, 2000)
  }
}
</script>

<style scoped>
.plugin-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.plugin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.plugin-card.grid {
  display: flex;
  flex-direction: column;
}

.plugin-card.list {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
}

/* 插件图标 */
.plugin-icon {
  position: relative;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  padding: 2rem 1rem;
  text-align: center;
  color: white;
}

.plugin-card.grid .plugin-icon {
  height: 120px;
}

.plugin-card.list .plugin-icon {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  margin: 0;
  padding: 1rem;
}

.icon-placeholder {
  font-size: 2.5rem;
  opacity: 0.9;
}

.plugin-card.grid .icon-placeholder {
  font-size: 3rem;
}

.plugin-card.list .icon-placeholder {
  font-size: 2rem;
}

/* 精选徽章 */
.featured-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #ffd700;
  color: #333;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* 插件信息 */
.plugin-info {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.plugin-card.list .plugin-info {
  padding: 0;
}

.plugin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.plugin-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #333;
  flex: 1;
  margin-right: 1rem;
}

.plugin-card.list .plugin-name {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.plugin-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.plugin-tag {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.plugin-description {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 1rem;
  flex: 1;
}

.plugin-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  color: #666;
}

.plugin-card.list .plugin-meta {
  margin-bottom: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.meta-item i {
  font-size: 0.75rem;
}

/* 评分 */
.plugin-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star-icon {
  font-size: 0.9rem;
  color: #ffd700;
}

.rating-score {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.rating-count {
  color: #666;
  font-size: 0.8rem;
}

/* 版本信息 */
.plugin-version {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #666;
}

.version-label {
  font-weight: 500;
}

.version-number {
  background: #e9ecef;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  font-weight: 500;
}

.version-date {
  margin-left: auto;
}

/* 操作按钮 */
.plugin-actions {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  gap: 0.5rem;
}

.plugin-card.list .plugin-actions {
  padding: 0;
  margin-top: 1rem;
}

.action-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.action-btn.secondary {
  background: #f8f9fa;
  color: #666;
}

.action-btn.secondary:hover {
  background: #e9ecef;
  color: #333;
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
}

.action-btn.primary:hover {
  background: var(--primary-hover);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn i.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 安装覆盖层 */
.install-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.install-progress {
  text-align: center;
}

.progress-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.install-progress p {
  margin: 0;
  color: #666;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .plugin-card.list {
    flex-direction: column;
    gap: 1rem;
  }

  .plugin-card.list .plugin-icon {
    width: 100%;
    height: 100px;
  }

  .plugin-card.list .plugin-info {
    padding: 0;
  }

  .plugin-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }

  .plugin-meta {
    flex-wrap: wrap;
  }

  .plugin-version {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .version-date {
    margin-left: 0;
  }
}
</style>
