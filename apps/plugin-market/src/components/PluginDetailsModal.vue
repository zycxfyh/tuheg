<template>
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <!-- 模态框头部 -->
      <div class="modal-header">
        <div class="plugin-header-info">
          <div class="plugin-icon-large">
            <span v-if="plugin.screenshots && plugin.screenshots[0]">
              <img :src="plugin.screenshots[0]" :alt="plugin.package.name" class="plugin-header-image">
            </span>
            <span v-else class="icon-placeholder-large">
              {{ getCategoryIcon(plugin.categories[0]) }}
            </span>
          </div>
          <div class="plugin-title-section">
            <h2 class="plugin-title">{{ plugin.package.name }}</h2>
            <p class="plugin-subtitle">by {{ plugin.package.author }}</p>
            <div class="plugin-meta">
              <span class="version">版本 {{ plugin.package.version }}</span>
              <span class="separator">•</span>
              <span class="last-updated">{{ formatDate(plugin.updatedAt) }}更新</span>
            </div>
          </div>
        </div>

        <button @click="$emit('close')" class="close-btn">
          ✕
        </button>
      </div>

      <!-- 模态框主体 -->
      <div class="modal-body">
        <!-- 主要信息区域 -->
        <div class="main-info">
          <!-- 截图轮播 -->
          <div v-if="plugin.screenshots && plugin.screenshots.length > 0" class="screenshots-section">
            <div class="screenshots-carousel">
              <div
                v-for="(screenshot, index) in plugin.screenshots"
                :key="index"
                :class="['screenshot-item', { active: activeScreenshot === index }]"
                @click="activeScreenshot = index"
              >
                <img :src="screenshot" :alt="`截图 ${index + 1}`" class="screenshot-image">
              </div>
            </div>
            <div class="screenshot-dots">
              <span
                v-for="(screenshot, index) in plugin.screenshots"
                :key="index"
                :class="['dot', { active: activeScreenshot === index }]"
                @click="activeScreenshot = index"
              ></span>
            </div>
          </div>

          <!-- 插件描述 -->
          <div class="description-section">
            <h3>插件描述</h3>
            <p class="description-text">{{ plugin.package.description }}</p>

            <!-- 功能特性 -->
            <div v-if="plugin.capabilities" class="features-section">
              <h4>功能特性</h4>
              <div class="features-list">
                <div v-if="plugin.capabilities.storyGeneration" class="feature-group">
                  <h5>故事生成</h5>
                  <ul>
                    <li v-if="plugin.capabilities.storyGeneration.customPrompts">自定义故事提示</li>
                    <li v-if="plugin.capabilities.storyGeneration.branchingNarratives">分支叙事支持</li>
                    <li v-if="plugin.capabilities.storyGeneration.multipleEndings">多结局支持</li>
                    <li v-if="plugin.capabilities.storyGeneration.characterConsistency">角色一致性保证</li>
                  </ul>
                </div>

                <div v-if="plugin.capabilities.characterCreation" class="feature-group">
                  <h5>角色创建</h5>
                  <ul>
                    <li v-if="plugin.capabilities.characterCreation.personalityTraits">性格特征生成</li>
                    <li v-if="plugin.capabilities.characterCreation.backgroundStories">背景故事创建</li>
                    <li v-if="plugin.capabilities.characterCreation.visualDescriptions">视觉描述生成</li>
                    <li v-if="plugin.capabilities.characterCreation.voiceProfiles">语音特征定义</li>
                  </ul>
                </div>

                <div v-if="plugin.capabilities.worldBuilding" class="feature-group">
                  <h5>世界构建</h5>
                  <ul>
                    <li v-if="plugin.capabilities.worldBuilding.geography">地理环境生成</li>
                    <li v-if="plugin.capabilities.worldBuilding.cultures">文化体系构建</li>
                    <li v-if="plugin.capabilities.worldBuilding.magicSystems">魔法系统设计</li>
                    <li v-if="plugin.capabilities.worldBuilding.history">历史事件设定</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 侧边栏信息 -->
        <div class="sidebar-info">
          <!-- 评分和统计 -->
          <div class="stats-card">
            <div class="rating-section">
              <div class="rating-display">
                <div class="stars">
                  <span
                    v-for="star in 5"
                    :key="star"
                    :class="['star', { filled: star <= Math.floor(plugin.stats.rating) }]"
                  >
                    ★
                  </span>
                </div>
                <span class="rating-number">{{ plugin.stats.rating.toFixed(1) }}</span>
              </div>
              <p class="review-count">{{ plugin.stats.reviewCount }} 条评价</p>
            </div>

            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">下载量</span>
                <span class="stat-value">{{ formatNumber(plugin.stats.downloads) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">活跃安装</span>
                <span class="stat-value">{{ formatNumber(plugin.stats.activeInstalls) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">插件大小</span>
                <span class="stat-value">{{ formatFileSize(plugin.package.size) }}</span>
              </div>
            </div>
          </div>

          <!-- 定价信息 -->
          <div class="pricing-card">
            <h4>定价</h4>
            <div class="pricing-info">
              <div :class="['price-tag', plugin.pricing.model]">
                <span class="price-amount">
                  {{ getPricingDisplay(plugin.pricing) }}
                </span>
                <span class="price-period">
                  {{ getPricingPeriod(plugin.pricing) }}
                </span>
              </div>

              <div v-if="plugin.pricing.model === 'freemium'" class="pricing-features">
                <div class="feature-list">
                  <h5>免费版包含：</h5>
                  <ul>
                    <li v-for="feature in plugin.pricing.features.free" :key="feature">
                      {{ feature }}
                    </li>
                  </ul>
                </div>
                <div class="feature-list premium">
                  <h5>高级版额外包含：</h5>
                  <ul>
                    <li v-for="feature in plugin.pricing.features.premium" :key="feature">
                      {{ feature }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- 兼容性信息 -->
          <div class="compatibility-card">
            <h4>兼容性</h4>
            <div class="compatibility-info">
              <div class="compatibility-item">
                <span class="label">最低版本:</span>
                <span class="value">{{ plugin.compatibility.minVersion }}</span>
              </div>
              <div class="compatibility-item">
                <span class="label">支持平台:</span>
                <span class="value">{{ plugin.compatibility.platforms.join(', ') }}</span>
              </div>
              <div v-if="plugin.compatibility.requiredPlugins.length > 0" class="compatibility-item">
                <span class="label">依赖插件:</span>
                <span class="value">{{ plugin.compatibility.requiredPlugins.join(', ') }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="actions-card">
            <button
              @click="$emit('install', plugin)"
              :class="['action-btn primary', { 'trial-available': plugin.pricing.trialDays }]"
            >
              {{ getInstallButtonText(plugin.pricing) }}
              <span v-if="plugin.pricing.trialDays" class="trial-note">
                ({{ plugin.pricing.trialDays }}天试用)
              </span>
            </button>

            <div class="secondary-actions">
              <button
                v-if="plugin.demoUrl"
                @click="openUrl(plugin.demoUrl)"
                class="action-btn secondary"
              >
                🎮 试用演示
              </button>
              <button
                v-if="plugin.documentationUrl"
                @click="openUrl(plugin.documentationUrl)"
                class="action-btn secondary"
              >
                📚 文档
              </button>
              <button
                v-if="plugin.supportUrl"
                @click="openUrl(plugin.supportUrl)"
                class="action-btn secondary"
              >
                🆘 支持
              </button>
            </div>
          </div>

          <!-- 插件状态 -->
          <div class="status-card">
            <div class="status-badges">
              <span v-if="plugin.verified" class="badge verified">✓ 已认证</span>
              <span v-if="plugin.featured" class="badge featured">⭐ 精选</span>
              <span v-if="plugin.trending" class="badge trending">🔥 热门</span>
            </div>
            <div class="status-info">
              <p class="license">许可证: {{ plugin.license || 'MIT' }}</p>
              <p class="last-updated">最后更新: {{ formatDate(plugin.updatedAt) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 评论区域 -->
      <div class="reviews-section">
        <div class="reviews-header">
          <h3>用户评价 ({{ plugin.reviews.length }})</h3>
          <button v-if="plugin.stats.reviewCount > 3" @click="showAllReviews = !showAllReviews" class="toggle-reviews-btn">
            {{ showAllReviews ? '收起' : `查看全部 ${plugin.stats.reviewCount} 条评价` }}
          </button>
        </div>

        <div class="reviews-list">
          <div
            v-for="(review, index) in displayedReviews"
            :key="review.id"
            class="review-item"
          >
            <div class="review-header">
              <div class="reviewer-info">
                <img :src="review.userAvatar || '/avatars/default.png'" :alt="review.userName" class="reviewer-avatar">
                <div class="reviewer-details">
                  <span class="reviewer-name">{{ review.userName }}</span>
                  <div class="review-rating">
                    <div class="stars small">
                      <span
                        v-for="star in 5"
                        :key="star"
                        :class="['star', { filled: star <= review.rating }]"
                      >
                        ★
                      </span>
                    </div>
                    <span class="review-date">{{ formatDate(review.createdAt) }}</span>
                  </div>
                </div>
              </div>
              <div v-if="review.verified" class="verified-badge">已验证</div>
            </div>

            <div class="review-content">
              <h4 class="review-title">{{ review.title }}</h4>
              <p class="review-text">{{ review.content }}</p>

              <div v-if="review.pros.length > 0 || review.cons.length > 0" class="review-pros-cons">
                <div v-if="review.pros.length > 0" class="pros">
                  <h5>优点</h5>
                  <ul>
                    <li v-for="pro in review.pros" :key="pro">{{ pro }}</li>
                  </ul>
                </div>
                <div v-if="review.cons.length > 0" class="cons">
                  <h5>缺点</h5>
                  <ul>
                    <li v-for="con in review.cons" :key="con">{{ con }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="review-footer">
              <button @click="toggleHelpful(review)" class="helpful-btn">
                👍 有帮助 ({{ review.helpful }})
              </button>
            </div>
          </div>
        </div>

        <div v-if="!showAllReviews && plugin.reviews.length > 3" class="show-more-reviews">
          <button @click="showAllReviews = true" class="show-more-btn">
            查看更多评价
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  plugin: {
    type: Object,
    required: true,
  },
  visible: {
    type: Boolean,
    default: false,
  },
})

const _emit = defineEmits(['close', 'install'])

const _activeScreenshot = ref(0)
const showAllReviews = ref(false)

// 计算属性
const _displayedReviews = computed(() => {
  if (showAllReviews.value) {
    return props.plugin.reviews
  }
  return props.plugin.reviews.slice(0, 3)
})

// 方法
const _getCategoryIcon = (categoryId) => {
  const icons = {
    'story-generation': '📖',
    'character-creation': '👤',
    'world-building': '🌍',
    'narrative-tools': '🎭',
    'ui-themes': '🎨',
    integrations: '🔗',
  }
  return icons[categoryId] || '🔧'
}

const _formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const _formatNumber = (num) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

const _formatFileSize = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

const _getPricingDisplay = (pricing) => {
  switch (pricing.model) {
    case 'free':
      return '免费'
    case 'paid':
      return `¥${pricing.basePrice}`
    case 'subscription':
      return `¥${pricing.subscriptionPrice}`
    case 'freemium':
      return '免费增值'
    default:
      return '免费'
  }
}

const _getPricingPeriod = (pricing) => {
  switch (pricing.model) {
    case 'subscription':
      return '/月'
    case 'paid':
      return '一次性'
    default:
      return ''
  }
}

const _getInstallButtonText = (pricing) => {
  switch (pricing.model) {
    case 'free':
      return '免费安装'
    case 'paid':
      return `购买 ¥${pricing.basePrice}`
    case 'subscription':
      return `订阅 ¥${pricing.subscriptionPrice}`
    case 'freemium':
      return pricing.trialDays ? `试用 ${pricing.trialDays} 天` : '免费安装'
    default:
      return '安装'
  }
}

const _openUrl = (url) => {
  window.open(url, '_blank')
}

const _toggleHelpful = (review) => {
  // 这里应该实现有帮助投票逻辑
  review.helpful++
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid #e1e5e9;
}

.plugin-header-info {
  display: flex;
  gap: 16px;
  flex: 1;
}

.plugin-icon-large {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.plugin-header-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon-placeholder-large {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: white;
}

.plugin-title-section {
  flex: 1;
}

.plugin-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 4px 0;
}

.plugin-subtitle {
  font-size: 16px;
  color: #718096;
  margin: 0 0 8px 0;
}

.plugin-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 14px;
  color: #a0aec0;
}

.separator {
  color: #cbd5e0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #a0aec0;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f7fafc;
  color: #4a5568;
}

.modal-body {
  display: flex;
  padding: 24px;
  gap: 24px;
  overflow-y: auto;
  flex: 1;
}

.main-info {
  flex: 1;
  min-width: 0;
}

.screenshots-section {
  margin-bottom: 32px;
}

.screenshots-carousel {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.screenshot-item {
  flex-shrink: 0;
  width: 200px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.screenshot-item:hover,
.screenshot-item.active {
  border-color: #667eea;
  transform: scale(1.02);
}

.screenshot-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.screenshot-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e2e8f0;
  cursor: pointer;
  transition: background 0.2s;
}

.dot.active {
  background: #667eea;
}

.description-section h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 16px 0;
}

.description-text {
  font-size: 16px;
  line-height: 1.6;
  color: #4a5568;
  margin: 0 0 24px 0;
}

.features-section h4 {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 16px 0 12px 0;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-group h5 {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.feature-group ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-group li {
  font-size: 14px;
  color: #718096;
  margin-bottom: 4px;
  padding-left: 16px;
  position: relative;
}

.feature-group li:before {
  content: '✓';
  color: #48bb78;
  font-weight: bold;
  position: absolute;
  left: 0;
}

.sidebar-info {
  width: 320px;
  flex-shrink: 0;
}

.stats-card,
.pricing-card,
.compatibility-card,
.actions-card,
.status-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.stats-card h4,
.pricing-card h4,
.compatibility-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 16px 0;
}

.rating-section {
  text-align: center;
  margin-bottom: 20px;
}

.rating-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #e2e8f0;
  font-size: 18px;
}

.star.filled {
  color: #ffc107;
}

.stars.small .star {
  font-size: 14px;
}

.rating-number {
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
}

.review-count {
  font-size: 14px;
  color: #718096;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #718096;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.pricing-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.price-tag {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
}

.price-tag.free {
  background: #f0fff4;
  color: #38a169;
}

.price-tag.paid {
  background: #ebf8ff;
  color: #3182ce;
}

.price-tag.subscription {
  background: #faf5ff;
  color: #805ad5;
}

.price-tag.fremium {
  background: #fffaf0;
  color: #d69e2e;
}

.price-amount {
  font-size: 18px;
}

.price-period {
  font-size: 12px;
  opacity: 0.8;
}

.pricing-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-list h5 {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.feature-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  font-size: 13px;
  color: #718096;
  margin-bottom: 4px;
  padding-left: 16px;
  position: relative;
}

.feature-list li:before {
  content: '•';
  color: #cbd5e0;
  position: absolute;
  left: 0;
}

.feature-list.premium li:before {
  content: '⭐';
  color: #ffc107;
}

.compatibility-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compatibility-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 14px;
  color: #718096;
  font-weight: 500;
}

.value {
  font-size: 14px;
  color: #2d3748;
  text-align: right;
}

.actions-card {
  background: white;
  border: 1px solid #e1e5e9;
}

.action-btn {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.action-btn.primary {
  background: #667eea;
  color: white;
}

.action-btn.primary:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.action-btn.trial-available {
  position: relative;
}

.trial-note {
  display: block;
  font-size: 12px;
  font-weight: 400;
  opacity: 0.9;
  margin-top: 4px;
}

.action-btn.secondary {
  background: #f8fafc;
  color: #4a5568;
  border: 1px solid #e1e5e9;
}

.action-btn.secondary:hover {
  background: #f1f5f9;
}

.secondary-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge.verified {
  background: #f0fff4;
  color: #38a169;
}

.badge.featured {
  background: #fffaf0;
  color: #d69e2e;
}

.badge.trending {
  background: #fef5e7;
  color: #dd6b20;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-info p {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.reviews-section {
  padding: 24px;
  border-top: 1px solid #e1e5e9;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.reviews-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.toggle-reviews-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 24px;
}

.review-item {
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.reviewer-info {
  display: flex;
  gap: 12px;
}

.reviewer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.reviewer-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reviewer-name {
  font-weight: 600;
  color: #2d3748;
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-date {
  font-size: 12px;
  color: #a0aec0;
}

.verified-badge {
  background: #f0fff4;
  color: #38a169;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.review-content {
  margin-bottom: 16px;
}

.review-title {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.review-text {
  font-size: 14px;
  line-height: 1.6;
  color: #4a5568;
  margin: 0 0 16px 0;
}

.review-pros-cons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.pros,
.cons {
  background: white;
  padding: 12px;
  border-radius: 6px;
}

.pros h5 {
  color: #38a169;
  margin: 0 0 8px 0;
}

.cons h5 {
  color: #e53e3e;
  margin: 0 0 8px 0;
}

.pros ul,
.cons ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.pros li,
.cons li {
  font-size: 13px;
  color: #4a5568;
  margin-bottom: 4px;
  padding-left: 16px;
  position: relative;
}

.pros li:before {
  content: '+';
  color: #38a169;
  position: absolute;
  left: 0;
}

.cons li:before {
  content: '−';
  color: #e53e3e;
  position: absolute;
  left: 0;
}

.review-footer {
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.helpful-btn {
  background: none;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s;
}

.helpful-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e0;
}

.show-more-reviews {
  text-align: center;
}

.show-more-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.show-more-btn:hover {
  background: #5a67d8;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .modal-content {
    max-width: 95vw;
  }

  .modal-body {
    flex-direction: column;
  }

  .sidebar-info {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-header {
    padding: 16px;
    flex-direction: column;
    gap: 16px;
  }

  .plugin-header-info {
    flex-direction: column;
    text-align: center;
  }

  .plugin-icon-large {
    align-self: center;
  }

  .reviews-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .review-pros-cons {
    grid-template-columns: 1fr;
  }

  .review-header {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
