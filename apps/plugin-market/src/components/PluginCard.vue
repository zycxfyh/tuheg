<template>
  <div :class="['plugin-card', size]">
    <!-- 插件图标/截图 -->
    <div class="plugin-image">
      <img
        v-if="plugin.screenshots && plugin.screenshots[0]"
        :src="plugin.screenshots[0]"
        :alt="plugin.package.name"
        class="plugin-screenshot"
      >
      <div v-else class="plugin-icon">
        <span class="icon-placeholder">{{ getCategoryIcon(plugin.categories[0]) }}</span>
      </div>

      <!-- 状态标签 -->
      <div class="plugin-badges">
        <span v-if="plugin.featured" class="badge featured">精选</span>
        <span v-if="plugin.verified" class="badge verified">认证</span>
        <span v-if="plugin.trending" class="badge trending">热门</span>
      </div>

      <!-- 定价标签 -->
      <div class="pricing-tag">
        <span :class="['price-label', plugin.pricing.model]">
          {{ getPricingText(plugin.pricing) }}
        </span>
      </div>
    </div>

    <!-- 插件信息 -->
    <div class="plugin-info">
      <h3 class="plugin-name">{{ plugin.package.name }}</h3>
      <p class="plugin-author">by {{ plugin.package.author }}</p>

      <!-- 评分和下载 -->
      <div class="plugin-stats">
        <div class="rating">
          <div class="stars">
            <span
              v-for="star in 5"
              :key="star"
              :class="['star', { filled: star <= Math.floor(plugin.stats.rating) }]"
            >
              ★
            </span>
          </div>
          <span class="rating-text">{{ plugin.stats.rating.toFixed(1) }}</span>
          <span class="review-count">({{ plugin.stats.reviewCount }})</span>
        </div>

        <div class="downloads">
          <span class="download-icon">⬇️</span>
          <span class="download-count">{{ formatNumber(plugin.stats.downloads) }}</span>
        </div>
      </div>

      <!-- 插件描述 -->
      <p class="plugin-description">{{ plugin.package.description }}</p>

      <!-- 分类标签 -->
      <div class="plugin-tags">
        <span
          v-for="category in plugin.categories.slice(0, 2)"
          :key="category"
          class="tag"
        >
          {{ getCategoryName(category) }}
        </span>
      </div>

      <!-- 操作按钮 -->
      <div class="plugin-actions">
        <button
          @click="$emit('view-details', plugin)"
          class="btn btn-secondary details-btn"
        >
          查看详情
        </button>
        <button
          @click="$emit('install', plugin)"
          class="btn btn-primary install-btn"
        >
          {{ getInstallText(plugin.pricing) }}
        </button>
      </div>
    </div>

    <!-- 悬停效果遮罩 -->
    <div class="card-overlay">
      <div class="overlay-content">
        <h4>快速预览</h4>
        <div class="preview-stats">
          <div class="stat">
            <span class="stat-label">活跃安装</span>
            <span class="stat-value">{{ formatNumber(plugin.stats.activeInstalls) }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">版本</span>
            <span class="stat-value">{{ plugin.package.version }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">更新时间</span>
            <span class="stat-value">{{ formatDate(plugin.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  plugin: {
    type: Object,
    required: true
  },
  size: {
    type: String,
    default: 'normal' // 'normal' | 'large'
  }
})

const emit = defineEmits(['view-details', 'install'])

// 获取分类图标
const getCategoryIcon = (categoryId) => {
  const icons = {
    'story-generation': '📖',
    'character-creation': '👤',
    'world-building': '🌍',
    'narrative-tools': '🎭',
    'ui-themes': '🎨',
    'integrations': '🔗',
    'localization': '🌐',
    'analytics': '📊'
  }
  return icons[categoryId] || '🔧'
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  const names = {
    'story-generation': '故事生成',
    'character-creation': '角色创建',
    'world-building': '世界构建',
    'narrative-tools': '叙事工具',
    'ui-themes': '界面主题',
    'integrations': '集成工具',
    'localization': '本地化',
    'analytics': '分析工具'
  }
  return names[categoryId] || categoryId
}

// 获取定价文本
const getPricingText = (pricing) => {
  switch (pricing.model) {
    case 'free':
      return '免费'
    case 'freemium':
      return '免费增值'
    case 'paid':
      return `¥${pricing.basePrice}`
    case 'subscription':
      return `¥${pricing.subscriptionPrice}/月`
    default:
      return '免费'
  }
}

// 获取安装按钮文本
const getInstallText = (pricing) => {
  switch (pricing.model) {
    case 'free':
    case 'freemium':
      return '免费安装'
    case 'paid':
      return `购买 ¥${pricing.basePrice}`
    case 'subscription':
      return `订阅 ¥${pricing.subscriptionPrice}`
    default:
      return '安装'
  }
}

// 格式化数字
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 格式化日期
const formatDate = (date) => {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return '今天'
  if (diffDays === 2) return '昨天'
  if (diffDays <= 7) return `${diffDays - 1}天前`
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}周前`
  if (diffDays <= 365) return `${Math.ceil(diffDays / 30)}个月前`
  return `${Math.ceil(diffDays / 365)}年前`
}
</script>

<style scoped>
.plugin-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
}

.plugin-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.plugin-card:hover .card-overlay {
  opacity: 1;
}

.plugin-card.large {
  max-width: 350px;
}

.plugin-image {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.plugin-card.large .plugin-image {
  height: 200px;
}

.plugin-screenshot {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plugin-icon {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-placeholder {
  font-size: 48px;
  color: white;
  opacity: 0.8;
}

.plugin-badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 6px;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge.featured {
  background: #ffd700;
  color: #333;
}

.badge.verified {
  background: #48bb78;
  color: white;
}

.badge.trending {
  background: #ed8936;
  color: white;
}

.pricing-tag {
  position: absolute;
  top: 10px;
  right: 10px;
}

.price-label {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.price-label.free {
  background: #48bb78;
  color: white;
}

.price-label.paid {
  background: #667eea;
  color: white;
}

.price-label.subscription {
  background: #9f7aea;
  color: white;
}

.plugin-info {
  padding: 20px;
}

.plugin-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plugin-card.large .plugin-name {
  font-size: 20px;
  white-space: normal;
  line-height: 1.3;
}

.plugin-author {
  font-size: 14px;
  color: #6c757d;
  margin: 0 0 12px 0;
}

.plugin-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stars {
  display: flex;
  gap: 1px;
}

.star {
  color: #ddd;
  font-size: 12px;
}

.star.filled {
  color: #ffc107;
}

.rating-text {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.review-count {
  font-size: 12px;
  color: #6c757d;
}

.downloads {
  display: flex;
  align-items: center;
  gap: 4px;
}

.download-icon {
  font-size: 14px;
}

.download-count {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.plugin-description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plugin-card.large .plugin-description {
  -webkit-line-clamp: 3;
}

.plugin-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 8px;
  background: #f8f9fa;
  color: #6c757d;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.plugin-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  flex: 1;
}

.btn-secondary {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.btn-secondary:hover {
  background: #e9ecef;
  color: #495057;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: white;
}

.overlay-content {
  text-align: center;
  padding: 20px;
}

.overlay-content h4 {
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
}

.preview-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .plugin-card {
    margin: 0 auto;
    max-width: 100%;
  }

  .plugin-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .plugin-stats {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .plugin-tags {
    justify-content: center;
  }
}
</style>
