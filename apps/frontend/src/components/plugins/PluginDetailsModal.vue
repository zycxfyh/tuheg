<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="$emit('close')">
        <div class="modal-content" @click.stop>
          <!-- 模态框头部 -->
          <div class="modal-header">
            <div class="plugin-summary">
              <div class="plugin-icon-large">
                <i :class="pluginIconClass"></i>
              </div>

              <div class="plugin-basic-info">
                <h2 class="plugin-title">{{ plugin.displayName }}</h2>
                <p class="plugin-subtitle">{{ plugin.name }}</p>

                <div class="plugin-meta-row">
                  <div class="meta-item">
                    <i class="icon-user"></i>
                    <span>{{ plugin.author.email }}</span>
                  </div>

                  <div class="meta-item">
                    <i class="icon-folder"></i>
                    <span>{{ plugin.category.displayName }}</span>
                  </div>

                  <div class="meta-item">
                    <i class="icon-code-branch"></i>
                    <span>{{ plugin.latestVersion || '未知' }}</span>
                  </div>
                </div>

                <div class="plugin-stats">
                  <div class="stat-item">
                    <div class="stat-value">{{ formatNumber(plugin.totalDownloads) }}</div>
                    <div class="stat-label">下载量</div>
                  </div>

                  <div class="stat-item">
                    <div class="stat-value">
                      <div class="rating-display">
                        <div class="rating-stars">
                          <i
                            v-for="star in 5"
                            :key="star"
                            :class="
                              star <= Math.floor(plugin.averageRating || 0)
                                ? 'icon-star-full'
                                : 'icon-star-empty'
                            "
                            class="star-icon"
                          ></i>
                        </div>
                        <span class="rating-score">{{
                          plugin.averageRating ? plugin.averageRating.toFixed(1) : '暂无'
                        }}</span>
                      </div>
                    </div>
                    <div class="stat-label">{{ plugin.reviewCount || 0 }} 评价</div>
                  </div>

                  <div class="stat-item">
                    <div class="stat-value">{{ formatDate(plugin.createdAt) }}</div>
                    <div class="stat-label">发布日期</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="plugin-actions">
              <button @click="$emit('install', plugin)" :disabled="installing" class="install-btn">
                <i v-if="installing" class="icon-spinner spinning"></i>
                <i v-else class="icon-download"></i>
                {{ installing ? '安装中...' : '安装插件' }}
              </button>

              <button class="close-btn" @click="$emit('close')">
                <i class="icon-close"></i>
              </button>
            </div>
          </div>

          <!-- 模态框主体 -->
          <div class="modal-body">
            <!-- 标签页导航 -->
            <div class="tab-nav">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                :class="{ active: activeTab === tab.key }"
                @click="activeTab = tab.key"
                class="tab-btn"
              >
                <i :class="tab.icon"></i>
                {{ tab.label }}
              </button>
            </div>

            <!-- 标签页内容 -->
            <div class="tab-content">
              <!-- 概述标签页 -->
              <div v-if="activeTab === 'overview'" class="tab-pane">
                <div class="overview-grid">
                  <div class="overview-section">
                    <h3>插件描述</h3>
                    <div class="description-content">
                      <p>{{ plugin.description }}</p>
                    </div>
                  </div>

                  <div class="overview-section">
                    <h3>标签</h3>
                    <div class="tags-list">
                      <span v-for="tag in plugin.tags" :key="tag.id" class="tag-item">
                        {{ tag.displayName }}
                      </span>
                    </div>
                  </div>

                  <div v-if="plugin.homepage || plugin.repository" class="overview-section">
                    <h3>链接</h3>
                    <div class="links-list">
                      <a
                        v-if="plugin.homepage"
                        :href="plugin.homepage"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="link-item"
                      >
                        <i class="icon-external-link"></i>
                        主页
                      </a>

                      <a
                        v-if="plugin.repository"
                        :href="plugin.repository"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="link-item"
                      >
                        <i class="icon-code"></i>
                        源码
                      </a>
                    </div>
                  </div>

                  <div
                    v-if="plugin.dependencies && plugin.dependencies.length > 0"
                    class="overview-section"
                  >
                    <h3>依赖项</h3>
                    <div class="dependencies-list">
                      <div v-for="dep in plugin.dependencies" :key="dep.id" class="dependency-item">
                        <span class="dep-name">{{ dep.dependency.displayName }}</span>
                        <span class="dep-version">
                          {{ dep.minVersion || '*' }} - {{ dep.maxVersion || '*' }}
                        </span>
                        <span v-if="dep.isRequired" class="dep-required">必需</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 版本标签页 -->
              <div v-if="activeTab === 'versions'" class="tab-pane">
                <div v-if="plugin.versions && plugin.versions.length > 0" class="versions-list">
                  <div v-for="version in plugin.versions" :key="version.id" class="version-item">
                    <div class="version-header">
                      <div class="version-info">
                        <span class="version-number">{{ version.version }}</span>
                        <span v-if="version.isStable" class="version-stable">稳定版</span>
                        <span class="version-date">{{ formatDate(version.createdAt) }}</span>
                      </div>

                      <div class="version-stats">
                        <span class="downloads">{{ version.downloads }} 次下载</span>
                      </div>
                    </div>

                    <div v-if="version.changelog" class="version-changelog">
                      <p>{{ version.changelog }}</p>
                    </div>
                  </div>
                </div>

                <div v-else class="empty-state">
                  <i class="icon-code-branch"></i>
                  <p>暂无版本信息</p>
                </div>
              </div>

              <!-- 评价标签页 -->
              <div v-if="activeTab === 'reviews'" class="tab-pane">
                <div class="reviews-section">
                  <!-- 评价统计 -->
                  <div class="reviews-summary">
                    <div class="rating-overview">
                      <div class="average-rating">
                        <div class="rating-score-large">
                          {{ plugin.averageRating ? plugin.averageRating.toFixed(1) : '0.0' }}
                        </div>
                        <div class="rating-stars-large">
                          <i
                            v-for="star in 5"
                            :key="star"
                            :class="
                              star <= Math.floor(plugin.averageRating || 0)
                                ? 'icon-star-full'
                                : 'icon-star-empty'
                            "
                            class="star-icon"
                          ></i>
                        </div>
                        <div class="rating-count">{{ plugin.reviewCount || 0 }} 条评价</div>
                      </div>

                      <div class="rating-breakdown">
                        <div v-for="rating in [5, 4, 3, 2, 1]" :key="rating" class="rating-bar">
                          <span class="rating-label">{{ rating }}星</span>
                          <div class="rating-bar-bg">
                            <div
                              class="rating-bar-fill"
                              :style="{ width: getRatingPercentage(rating) + '%' }"
                            ></div>
                          </div>
                          <span class="rating-count">{{ getRatingCount(rating) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 评价列表 -->
                  <div v-if="plugin.reviews && plugin.reviews.length > 0" class="reviews-list">
                    <div v-for="review in plugin.reviews" :key="review.id" class="review-item">
                      <div class="review-header">
                        <div class="reviewer-info">
                          <span class="reviewer-name">{{ review.user.email }}</span>
                          <div class="review-rating">
                            <i
                              v-for="star in 5"
                              :key="star"
                              :class="star <= review.rating ? 'icon-star-full' : 'icon-star-empty'"
                              class="star-icon"
                            ></i>
                          </div>
                        </div>

                        <div class="review-meta">
                          <span class="review-date">{{ formatDate(review.createdAt) }}</span>
                          <span v-if="review.isVerifiedPurchase" class="verified-badge">
                            <i class="icon-check"></i>
                            已验证下载
                          </span>
                        </div>
                      </div>

                      <div v-if="review.title" class="review-title">
                        {{ review.title }}
                      </div>

                      <div class="review-content">
                        {{ review.content }}
                      </div>

                      <div class="review-actions">
                        <button class="helpful-btn">
                          <i class="icon-thumbs-up"></i>
                          有帮助 ({{ review.helpful }})
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-else class="empty-state">
                    <i class="icon-comments"></i>
                    <p>暂无评价</p>
                  </div>
                </div>
              </div>

              <!-- 统计标签页 -->
              <div v-if="activeTab === 'stats'" class="tab-pane">
                <div class="stats-content">
                  <div class="stats-grid">
                    <div class="stat-card">
                      <h4>下载统计</h4>
                      <div class="stat-chart">
                        <!-- 这里可以放置图表组件 -->
                        <div class="chart-placeholder">
                          <i class="icon-chart-line"></i>
                          <p>下载趋势图</p>
                        </div>
                      </div>
                    </div>

                    <div class="stat-card">
                      <h4>用户分布</h4>
                      <div class="stat-chart">
                        <div class="chart-placeholder">
                          <i class="icon-users"></i>
                          <p>用户地区分布</p>
                        </div>
                      </div>
                    </div>

                    <div class="stat-card">
                      <h4>版本采用率</h4>
                      <div class="version-adoption">
                        <div
                          v-for="version in plugin.versions?.slice(0, 5) || []"
                          :key="version.id"
                          class="version-stat"
                        >
                          <span class="version-name">{{ version.version }}</span>
                          <div class="adoption-bar">
                            <div
                              class="adoption-fill"
                              :style="{
                                width: getVersionAdoptionPercentage(version.downloads) + '%',
                              }"
                            ></div>
                          </div>
                          <span class="adoption-count">{{ version.downloads }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

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

const emit = defineEmits(['close', 'install'])

const activeTab = ref('overview')
const installing = ref(false)

const tabs = [
  { key: 'overview', label: '概述', icon: 'icon-info-circle' },
  { key: 'versions', label: '版本', icon: 'icon-code-branch' },
  { key: 'reviews', label: '评价', icon: 'icon-comments' },
  { key: 'stats', label: '统计', icon: 'icon-chart-bar' },
]

// 计算属性
const pluginIconClass = computed(() => {
  const categoryIcons = {
    'ai-tools': 'icon-brain',
    utilities: 'icon-wrench',
    themes: 'icon-palette',
    languages: 'icon-globe',
    integrations: 'icon-plug',
  }

  return categoryIcons[props.plugin.category?.name] || 'icon-puzzle-piece'
})

// 监听 visible 变化，重置标签页
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      activeTab.value = 'overview'
    }
  }
)

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
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getRatingPercentage(rating) {
  const ratingDistribution =
    props.plugin.reviews?.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1
      return acc
    }, {}) || {}

  const total = Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0)
  return total > 0 ? ((ratingDistribution[rating] || 0) / total) * 100 : 0
}

function getRatingCount(rating) {
  return props.plugin.reviews?.filter((review) => review.rating === rating).length || 0
}

function getVersionAdoptionPercentage(downloads) {
  const totalDownloads =
    props.plugin.versions?.reduce((sum, version) => sum + version.downloads, 0) || 1
  return totalDownloads > 0 ? (downloads / totalDownloads) * 100 : 0
}
</script>

<style scoped>
/* 模态框基础样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 模态框头部 */
.modal-header {
  padding: 2rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.plugin-summary {
  display: flex;
  gap: 1.5rem;
  flex: 1;
}

.plugin-icon-large {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  flex-shrink: 0;
}

.plugin-basic-info {
  flex: 1;
}

.plugin-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: #333;
}

.plugin-subtitle {
  font-size: 1rem;
  color: #666;
  margin: 0 0 1rem;
  font-family: monospace;
}

.plugin-meta-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: #666;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.plugin-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.25rem;
}

.rating-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.rating-stars-large {
  display: flex;
  gap: 2px;
  justify-content: center;
}

.star-icon {
  font-size: 1rem;
  color: #ffd700;
}

.rating-score {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

.plugin-actions {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.install-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.install-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.install-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.install-btn i.spinning {
  animation: spin 1s linear infinite;
}

.close-btn {
  background: #f8f9fa;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  color: #666;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
}

/* 模态框主体 */
.modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 标签页导航 */
.tab-nav {
  display: flex;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.tab-btn {
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.tab-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.tab-btn.active {
  color: var(--primary-color);
  background: white;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-color);
}

/* 标签页内容 */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.tab-pane {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 概述标签页 */
.overview-grid {
  display: grid;
  gap: 2rem;
}

.overview-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #333;
}

.description-content p {
  line-height: 1.6;
  color: #555;
  margin: 0;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-item {
  background: #e9ecef;
  color: #495057;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.links-list {
  display: flex;
  gap: 1rem;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.link-item:hover {
  color: var(--primary-hover);
}

.dependencies-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dependency-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.dep-name {
  font-weight: 500;
  color: #333;
}

.dep-version {
  color: #666;
  font-family: monospace;
  font-size: 0.9rem;
}

.dep-required {
  background: #dc3545;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

/* 版本标签页 */
.versions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.version-item {
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fafafa;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.version-number {
  font-size: 1.1rem;
  font-weight: 600;
  font-family: monospace;
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.version-stable {
  background: #28a745;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

.version-date {
  color: #666;
  font-size: 0.9rem;
}

.version-stats {
  color: #666;
  font-size: 0.9rem;
}

.version-changelog {
  border-top: 1px solid #eee;
  padding-top: 1rem;
  margin-top: 1rem;
}

.version-changelog p {
  margin: 0;
  line-height: 1.5;
  color: #555;
}

/* 评价标签页 */
.reviews-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.reviews-summary {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 12px;
}

.rating-overview {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 2rem;
  align-items: center;
}

.average-rating {
  text-align: center;
}

.rating-score-large {
  font-size: 3rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.rating-count {
  color: #666;
  font-size: 0.9rem;
}

.rating-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rating-label {
  width: 30px;
  font-size: 0.9rem;
  color: #666;
}

.rating-bar-bg {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.rating-bar-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-item {
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 8px;
  background: white;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.reviewer-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reviewer-name {
  font-weight: 600;
  color: #333;
}

.review-rating {
  display: flex;
  gap: 2px;
}

.review-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #666;
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #28a745;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

.review-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
}

.review-content {
  line-height: 1.6;
  color: #555;
  margin-bottom: 1rem;
}

.review-actions {
  display: flex;
  gap: 1rem;
}

.helpful-btn {
  background: #f8f9fa;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #666;
  transition: all 0.3s;
}

.helpful-btn:hover {
  background: #e9ecef;
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* 统计标签页 */
.stats-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1.5rem;
}

.stat-card h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #333;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  color: #666;
  text-align: center;
}

.chart-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.version-adoption {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.version-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.version-name {
  width: 80px;
  font-family: monospace;
  font-size: 0.9rem;
  font-weight: 500;
}

.adoption-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.adoption-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.adoption-count {
  width: 60px;
  text-align: right;
  font-size: 0.9rem;
  color: #666;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  color: #666;
  text-align: center;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 1.1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 1rem;
  }

  .modal-content {
    max-height: 95vh;
  }

  .modal-header {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .plugin-summary {
    flex-direction: column;
    text-align: center;
  }

  .plugin-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .rating-overview {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .tab-nav {
    overflow-x: auto;
  }

  .tab-btn {
    white-space: nowrap;
    padding: 0.75rem 1rem;
  }

  .tab-content {
    padding: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
