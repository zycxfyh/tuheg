<template>
  <div class="plugin-market">
    <!-- 市场头部 -->
    <div class="market-header">
      <div class="header-content">
        <h1 class="market-title">🎭 创世星环插件市场</h1>
        <p class="market-subtitle">发现和下载AI叙事创作的无限可能</p>

        <!-- 搜索框 -->
        <div class="search-section">
          <div class="search-bar">
            <input
              v-model="searchQuery"
              @input="debouncedSearch"
              type="text"
              placeholder="搜索插件..."
              class="search-input"
            >
            <button @click="performSearch" class="search-btn">
              🔍 搜索
            </button>
          </div>

          <!-- 快捷筛选 -->
          <div class="quick-filters">
            <button
              v-for="filter in quickFilters"
              :key="filter.id"
              @click="applyQuickFilter(filter)"
              :class="['filter-btn', { active: activeFilter === filter.id }]"
            >
              {{ filter.icon }} {{ filter.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="market-content">
      <!-- 侧边栏筛选器 -->
      <div class="sidebar">
        <div class="filter-section">
          <h3 class="filter-title">分类</h3>
          <div class="category-list">
            <div
              v-for="category in categories"
              :key="category.id"
              @click="selectCategory(category.id)"
              :class="['category-item', { active: selectedCategory === category.id }]"
            >
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-name">{{ category.name }}</span>
              <span class="category-count">{{ category.pluginCount }}</span>
            </div>
          </div>
        </div>

        <div class="filter-section">
          <h3 class="filter-title">定价</h3>
          <div class="pricing-options">
            <label v-for="option in pricingOptions" :key="option.value" class="option-label">
              <input
                v-model="selectedPricing"
                :value="option.value"
                type="radio"
                name="pricing"
                @change="applyFilters"
              >
              <span class="option-text">{{ option.label }}</span>
            </label>
          </div>
        </div>

        <div class="filter-section">
          <h3 class="filter-title">评分</h3>
          <div class="rating-filter">
            <div
              v-for="rating in [5, 4, 3, 2, 1]"
              :key="rating"
              @click="setMinRating(rating)"
              :class="['rating-option', { active: minRating === rating }]"
            >
              <div class="stars">
                <span v-for="star in 5" :key="star" :class="['star', { filled: star <= rating }]">
                  ★
                </span>
              </div>
              <span class="rating-text">& 以上</span>
            </div>
          </div>
        </div>

        <div class="filter-section">
          <h3 class="filter-title">其他</h3>
          <label class="checkbox-label">
            <input v-model="showVerified" type="checkbox" @change="applyFilters">
            <span class="checkbox-text">仅显示认证插件</span>
          </label>
          <label class="checkbox-label">
            <input v-model="showFeatured" type="checkbox" @change="applyFilters">
            <span class="checkbox-text">仅显示精选插件</span>
          </label>
        </div>
      </div>

      <!-- 主要内容区 -->
      <div class="main-content">
        <!-- 精选和热门区域 -->
        <div class="featured-section" v-if="!hasActiveFilters">
          <!-- 精选插件 -->
          <div class="featured-plugins">
            <h2 class="section-title">✨ 精选插件</h2>
            <div class="plugins-grid featured-grid">
              <PluginCard
                v-for="plugin in featuredPlugins"
                :key="plugin.id"
                :plugin="plugin"
                size="large"
                @install="installPlugin"
                @view-details="viewPluginDetails"
              />
            </div>
          </div>

          <!-- 热门插件 -->
          <div class="trending-plugins">
            <h2 class="section-title">🔥 热门插件</h2>
            <div class="plugins-grid">
              <PluginCard
                v-for="plugin in trendingPlugins"
                :key="plugin.id"
                :plugin="plugin"
                @install="installPlugin"
                @view-details="viewPluginDetails"
              />
            </div>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div class="search-results" v-else>
          <div class="results-header">
            <h2 class="results-title">
              搜索结果
              <span class="results-count">{{ searchResults.total }} 个插件</span>
            </h2>
            <div class="results-sort">
              <select v-model="sortBy" @change="applyFilters" class="sort-select">
                <option value="downloads">下载量</option>
                <option value="rating">评分</option>
                <option value="newest">最新</option>
                <option value="trending">热门</option>
                <option value="price">价格</option>
              </select>
              <button @click="toggleSortOrder" class="sort-order-btn">
                {{ sortOrder === 'desc' ? '⬇️' : '⬆️' }}
              </button>
            </div>
          </div>

          <div v-if="searchResults.plugins.length === 0" class="no-results">
            <div class="no-results-icon">🔍</div>
            <h3 class="no-results-title">未找到匹配的插件</h3>
            <p class="no-results-text">尝试调整搜索条件或关键词</p>
            <button @click="clearFilters" class="clear-filters-btn">
              清除筛选条件
            </button>
          </div>

          <div v-else class="plugins-grid">
            <PluginCard
              v-for="plugin in searchResults.plugins"
              :key="plugin.id"
              :plugin="plugin"
              @install="installPlugin"
              @view-details="viewPluginDetails"
            />
          </div>

          <!-- 分页 -->
          <div v-if="searchResults.hasMore" class="pagination">
            <button
              @click="loadMore"
              :disabled="isLoadingMore"
              class="load-more-btn"
            >
              <span v-if="isLoadingMore" class="loading-spinner">⏳</span>
              加载更多
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 插件详情模态框 -->
    <PluginDetailsModal
      v-if="selectedPlugin"
      :plugin="selectedPlugin"
      :visible="showDetailsModal"
      @close="closeDetailsModal"
      @install="installPlugin"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { marketManager } from '../MarketManager'
import PluginCard from './PluginCard.vue'
import PluginDetailsModal from './PluginDetailsModal.vue'

// 响应式数据
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedPricing = ref('')
const minRating = ref(0)
const showVerified = ref(false)
const showFeatured = ref(false)
const sortBy = ref('downloads')
const sortOrder = ref('desc')

const categories = ref([])
const featuredPlugins = ref([])
const trendingPlugins = ref([])
const searchResults = ref({
  plugins: [],
  total: 0,
  hasMore: false,
})
const selectedPlugin = ref(null)
const showDetailsModal = ref(false)
const isLoadingMore = ref(false)
const currentOffset = ref(0)

// 计算属性
const hasActiveFilters = computed(() => {
  return !!(
    searchQuery.value ||
    selectedCategory.value ||
    selectedPricing.value ||
    minRating.value > 0 ||
    showVerified.value ||
    showFeatured.value
  )
})

const activeFilter = computed(() => {
  if (showFeatured.value) return 'featured'
  if (showVerified.value) return 'verified'
  if (selectedPricing.value) return selectedPricing.value
  if (selectedCategory.value) return selectedCategory.value
  return ''
})

const quickFilters = computed(() => [
  { id: 'featured', label: '精选', icon: '✨' },
  { id: 'verified', label: '认证', icon: '✅' },
  { id: 'free', label: '免费', icon: '🆓' },
  { id: 'paid', label: '付费', icon: '💰' },
  { id: 'trending', label: '热门', icon: '🔥' },
])

const pricingOptions = computed(() => [
  { value: '', label: '全部' },
  { value: 'free', label: '免费' },
  { value: 'paid', label: '付费' },
  { value: 'subscription', label: '订阅' },
])

// 防抖搜索
let searchTimeout = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

// 执行搜索
const performSearch = () => {
  currentOffset.value = 0
  applyFilters()
}

// 应用筛选器
const applyFilters = () => {
  const filters = {
    query: searchQuery.value,
    category: selectedCategory.value,
    pricing: selectedPricing.value,
    rating: minRating.value > 0 ? minRating.value : undefined,
    verified: showVerified.value || undefined,
    featured: showFeatured.value || undefined,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
  }

  const results = marketManager.searchPlugins(filters, 20, currentOffset.value)
  searchResults.value = results
}

// 快速筛选
const applyQuickFilter = (filter) => {
  // 重置所有筛选
  selectedCategory.value = ''
  selectedPricing.value = ''
  minRating.value = 0
  showVerified.value = false
  showFeatured.value = false

  // 应用特定筛选
  switch (filter.id) {
    case 'featured':
      showFeatured.value = true
      break
    case 'verified':
      showVerified.value = true
      break
    case 'free':
      selectedPricing.value = 'free'
      break
    case 'paid':
      selectedPricing.value = 'paid'
      break
    case 'trending':
      // 热门插件需要特殊处理
      searchResults.value = {
        plugins: marketManager.getTrendingPlugins(20),
        total: marketManager.getTrendingPlugins().length,
        hasMore: false,
      }
      return
  }

  applyFilters()
}

// 选择分类
const selectCategory = (categoryId) => {
  selectedCategory.value = selectedCategory.value === categoryId ? '' : categoryId
  applyFilters()
}

// 设置最低评分
const setMinRating = (rating) => {
  minRating.value = minRating.value === rating ? 0 : rating
  applyFilters()
}

// 切换排序顺序
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  applyFilters()
}

// 清除筛选
const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  selectedPricing.value = ''
  minRating.value = 0
  showVerified.value = false
  showFeatured.value = false
  applyFilters()
}

// 加载更多
const loadMore = async () => {
  if (isLoadingMore.value) return

  isLoadingMore.value = true
  currentOffset.value += 20

  const filters = {
    query: searchQuery.value,
    category: selectedCategory.value,
    pricing: selectedPricing.value,
    rating: minRating.value > 0 ? minRating.value : undefined,
    verified: showVerified.value || undefined,
    featured: showFeatured.value || undefined,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
  }

  const results = marketManager.searchPlugins(filters, 20, currentOffset.value)

  searchResults.value.plugins.push(...results.plugins)
  searchResults.value.hasMore = results.hasMore

  isLoadingMore.value = false
}

// 查看插件详情
const viewPluginDetails = (plugin) => {
  selectedPlugin.value = plugin
  showDetailsModal.value = true
}

// 关闭详情模态框
const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedPlugin.value = null
}

// 安装插件
const installPlugin = async (plugin) => {
  try {
    // 记录下载
    marketManager.recordDownload(plugin.id)

    // 这里应该调用实际的安装逻辑
    console.log('Installing plugin:', plugin.id)

    // 显示成功消息
    alert(`插件 "${plugin.package.name}" 已开始安装！`)
  } catch (error) {
    console.error('Failed to install plugin:', error)
    alert('安装失败，请重试')
  }
}

// 初始化数据
const initializeData = () => {
  // 获取分类
  categories.value = marketManager.getCategories()

  // 获取精选和热门插件
  featuredPlugins.value = marketManager.getFeaturedPlugins(6)
  trendingPlugins.value = marketManager.getTrendingPlugins(12)
}

// 生命周期
onMounted(() => {
  initializeData()
})
</script>

<style scoped>
.plugin-market {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.market-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 40px 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
  color: white;
}

.market-title {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.market-subtitle {
  font-size: 1.2rem;
  margin: 0 0 30px 0;
  opacity: 0.9;
}

.search-section {
  max-width: 600px;
  margin: 0 auto;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 15px 20px;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  outline: none;
}

.search-input::placeholder {
  color: #666;
}

.search-btn {
  padding: 15px 25px;
  border: none;
  border-radius: 50px;
  background: #667eea;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.search-btn:hover {
  background: #5a67d8;
  transform: translateY(-2px);
}

.quick-filters {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  background: transparent;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover,
.filter-btn.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: white;
}

.market-content {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  gap: 40px;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
}

.filter-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.filter-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 15px 0;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:hover,
.category-item.active {
  background: #f8f9fa;
}

.category-icon {
  font-size: 18px;
}

.category-name {
  flex: 1;
  font-weight: 500;
}

.category-count {
  background: #e9ecef;
  color: #6c757d;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.pricing-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.rating-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rating-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.rating-option:hover,
.rating-option.active {
  background: #f8f9fa;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #ddd;
  font-size: 14px;
}

.star.filled {
  color: #ffc107;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.main-content {
  flex: 1;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0 0 20px 0;
}

.plugins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.featured-grid {
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.search-results {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.results-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.results-count {
  color: #6c757d;
  font-size: 16px;
  font-weight: 500;
}

.results-sort {
  display: flex;
  gap: 10px;
  align-items: center;
}

.sort-select {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

.sort-order-btn {
  padding: 8px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
}

.no-results-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.no-results-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
}

.no-results-text {
  color: #6c757d;
  margin: 0 0 30px 0;
}

.clear-filters-btn {
  padding: 12px 24px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  color: #333;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-filters-btn:hover {
  background: #f8f9fa;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.load-more-btn {
  padding: 15px 30px;
  border: 2px solid #667eea;
  border-radius: 8px;
  background: white;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.load-more-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .market-content {
    flex-direction: column;
    gap: 30px;
  }

  .sidebar {
    width: 100%;
    order: 2;
  }

  .main-content {
    order: 1;
  }

  .results-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .market-title {
    font-size: 2rem;
  }

  .market-subtitle {
    font-size: 1rem;
  }

  .search-bar {
    flex-direction: column;
  }

  .search-input,
  .search-btn {
    width: 100%;
  }

  .quick-filters {
    justify-content: center;
  }

  .filter-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .plugins-grid {
    grid-template-columns: 1fr;
  }

  .featured-grid {
    grid-template-columns: 1fr;
  }

  .search-results {
    padding: 20px;
  }
}
</style>
