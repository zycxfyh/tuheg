<template>
  <div class="plugin-marketplace">
    <!-- 页面头部 -->
    <div class="marketplace-header">
      <div class="header-content">
        <h1 class="marketplace-title">
          <i class="icon-plug"></i>
          插件市场
        </h1>
        <p class="marketplace-subtitle">发现和安装强大的 VCPToolBox 插件，扩展你的创作能力</p>

        <!-- 搜索栏 -->
        <div class="search-section">
          <div class="search-box">
            <input
              v-model="searchQuery"
              @input="debouncedSearch"
              type="text"
              placeholder="搜索插件、标签或作者..."
              class="search-input"
            />
            <button class="search-button">
              <i class="icon-search"></i>
            </button>
          </div>

          <!-- 搜索建议 -->
          <div v-if="searchSuggestions && showSuggestions" class="search-suggestions">
            <div v-if="searchSuggestions.plugins.length > 0" class="suggestion-group">
              <h4>插件</h4>
              <div
                v-for="item in searchSuggestions.plugins"
                :key="item.id"
                @click="selectSuggestion(item)"
                class="suggestion-item"
              >
                <span class="item-name">{{ item.displayName }}</span>
                <span class="item-type">插件</span>
              </div>
            </div>

            <div v-if="searchSuggestions.tags.length > 0" class="suggestion-group">
              <h4>标签</h4>
              <div
                v-for="item in searchSuggestions.tags"
                :key="item.id"
                @click="selectSuggestion(item)"
                class="suggestion-item"
              >
                <span class="item-name">{{ item.displayName }}</span>
                <span class="item-type">标签</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="marketplace-content">
      <!-- 侧边栏过滤器 -->
      <aside class="marketplace-sidebar">
        <div class="filter-section">
          <h3 class="filter-title">分类</h3>
          <div class="filter-options">
            <label v-for="category in categories" :key="category.id" class="filter-option">
              <input
                v-model="filters.category"
                :value="category.id"
                type="checkbox"
                class="filter-checkbox"
              />
              <span class="option-label">{{ category.displayName }}</span>
              <span class="option-count">({{ category.count }})</span>
            </label>
          </div>
        </div>

        <div class="filter-section">
          <h3 class="filter-title">标签</h3>
          <div class="filter-options">
            <label v-for="tag in popularTags" :key="tag.id" class="filter-option">
              <input
                v-model="filters.tags"
                :value="tag.name"
                type="checkbox"
                class="filter-checkbox"
              />
              <span class="option-label">{{ tag.displayName }}</span>
              <span class="option-count">({{ tag.count }})</span>
            </label>
          </div>
        </div>

        <div class="filter-section">
          <h3 class="filter-title">评分</h3>
          <div class="rating-filter">
            <label v-for="rating in ratingOptions" :key="rating.value" class="rating-option">
              <input
                v-model="filters.minRating"
                :value="rating.value"
                type="radio"
                name="rating"
                class="rating-radio"
              />
              <span class="rating-stars">
                <i
                  v-for="star in 5"
                  :key="star"
                  :class="star <= rating.value ? 'icon-star-full' : 'icon-star-empty'"
                  class="star-icon"
                ></i>
              </span>
              <span class="rating-label">& 以上</span>
            </label>
          </div>
        </div>

        <div class="filter-actions">
          <button @click="clearFilters" class="clear-filters-btn">清除筛选</button>
          <button @click="applyFilters" class="apply-filters-btn">应用筛选</button>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="marketplace-main">
        <!-- 排序和视图选项 -->
        <div class="content-header">
          <div class="results-info">
            <span v-if="searchResults.total > 0"> 找到 {{ searchResults.total }} 个插件 </span>
            <span v-else-if="loading"> 搜索中... </span>
            <span v-else> 暂无结果 </span>
          </div>

          <div class="view-options">
            <select v-model="sortBy" @change="applySort" class="sort-select">
              <option value="downloads">下载量</option>
              <option value="rating">评分</option>
              <option value="updatedAt">更新时间</option>
              <option value="name">名称</option>
            </select>

            <div class="view-toggle">
              <button
                :class="{ active: viewMode === 'grid' }"
                @click="viewMode = 'grid'"
                class="view-btn"
              >
                <i class="icon-grid"></i>
              </button>
              <button
                :class="{ active: viewMode === 'list' }"
                @click="viewMode = 'list'"
                class="view-btn"
              >
                <i class="icon-list"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 插件网格/列表 -->
        <div
          v-if="!loading && searchResults.plugins.length > 0"
          :class="['plugins-container', viewMode]"
        >
          <PluginCard
            v-for="plugin in searchResults.plugins"
            :key="plugin.id"
            :plugin="plugin"
            :view-mode="viewMode"
            @install="handleInstall"
            @view-details="handleViewDetails"
          />
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载插件...</p>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && searchResults.plugins.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="icon-search"></i>
          </div>
          <h3>未找到插件</h3>
          <p>尝试调整搜索关键词或筛选条件</p>
          <button @click="clearFilters" class="retry-btn">清除筛选</button>
        </div>

        <!-- 分页 -->
        <div v-if="searchResults.total > 0" class="pagination">
          <button
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
            class="page-btn prev"
          >
            <i class="icon-chevron-left"></i>
            上一页
          </button>

          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              :class="{ active: page === currentPage }"
              @click="goToPage(page)"
              class="page-number"
            >
              {{ page }}
            </button>
          </div>

          <button
            :disabled="!searchResults.hasMore"
            @click="goToPage(currentPage + 1)"
            class="page-btn next"
          >
            下一页
            <i class="icon-chevron-right"></i>
          </button>
        </div>
      </main>
    </div>

    <!-- 插件详情模态框 -->
    <PluginDetailsModal
      v-if="selectedPlugin"
      :plugin="selectedPlugin"
      :visible="showDetailsModal"
      @close="closeDetailsModal"
      @install="handleInstall"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useDebounce } from '../composables/useDebounce'
import PluginCard from '../components/plugins/PluginCard.vue'
import PluginDetailsModal from '../components/plugins/PluginDetailsModal.vue'
import { pluginMarketplaceApi } from '../services/pluginMarketplaceApi'

// 响应式数据
const searchQuery = ref('')
const searchSuggestions = ref(null)
const showSuggestions = ref(false)
const selectedPlugin = ref(null)
const showDetailsModal = ref(false)
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const sortBy = ref('downloads')
const sortOrder = ref('desc')
const viewMode = ref('grid') // 'grid' | 'list'

// 搜索结果
const searchResults = ref({
  plugins: [],
  total: 0,
  hasMore: false,
})

// 过滤器
const filters = ref({
  category: [],
  tags: [],
  minRating: null,
})

// 分类和标签数据
const categories = ref([])
const popularTags = ref([])
const ratingOptions = [
  { value: 4, label: '4星' },
  { value: 3, label: '3星' },
  { value: 2, label: '2星' },
  { value: 1, label: '1星' },
]

// 防抖搜索
const debouncedSearch = useDebounce(async () => {
  if (searchQuery.value.length >= 2) {
    await loadSearchSuggestions()
    showSuggestions.value = true
  } else {
    searchSuggestions.value = null
    showSuggestions.value = false
  }
}, 300)

// 计算属性
const visiblePages = computed(() => {
  const totalPages = Math.ceil(searchResults.value.total / pageSize.value)
  const current = currentPage.value
  const pages = []

  // 显示当前页前后2页
  for (let i = Math.max(1, current - 2); i <= Math.min(totalPages, current + 2); i++) {
    pages.push(i)
  }

  return pages
})

// 生命周期
onMounted(async () => {
  await loadInitialData()
  await performSearch()
})

// 监听过滤器变化
watch(
  () => [filters.value, sortBy.value, sortOrder.value],
  () => {
    currentPage.value = 1
    performSearch()
  },
  { deep: true }
)

// 方法
async function loadInitialData() {
  try {
    const [categoriesData, tagsData] = await Promise.all([
      pluginMarketplaceApi.getCategories(),
      pluginMarketplaceApi.getTags(),
    ])

    categories.value = categoriesData
    popularTags.value = tagsData.slice(0, 20) // 只显示前20个热门标签
  } catch (error) {
    console.error('Failed to load initial data:', error)
  }
}

async function loadSearchSuggestions() {
  try {
    if (searchQuery.value.length < 2) return

    const suggestions = await pluginMarketplaceApi.getSearchSuggestions(searchQuery.value)
    searchSuggestions.value = suggestions
  } catch (error) {
    console.error('Failed to load search suggestions:', error)
  }
}

async function performSearch() {
  loading.value = true
  try {
    const params = {
      q: searchQuery.value || undefined,
      category: filters.value.category.length > 0 ? filters.value.category[0] : undefined,
      tags: filters.value.tags.length > 0 ? filters.value.tags : undefined,
      minRating: filters.value.minRating,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value,
    }

    const results = await pluginMarketplaceApi.searchPlugins(params)
    searchResults.value = results
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = { plugins: [], total: 0, hasMore: false }
  } finally {
    loading.value = false
  }
}

function selectSuggestion(suggestion) {
  searchQuery.value = suggestion.displayName
  showSuggestions.value = false
  performSearch()
}

function clearFilters() {
  filters.value = {
    category: [],
    tags: [],
    minRating: null,
  }
  searchQuery.value = ''
  currentPage.value = 1
  performSearch()
}

function applyFilters() {
  currentPage.value = 1
  performSearch()
}

function applySort() {
  currentPage.value = 1
  performSearch()
}

function goToPage(page) {
  currentPage.value = page
  performSearch()
}

async function handleInstall(plugin) {
  try {
    await pluginMarketplaceApi.installPlugin(plugin.id)
    // 显示成功消息
    alert(`插件 ${plugin.displayName} 安装成功！`)
  } catch (error) {
    console.error('Failed to install plugin:', error)
    alert('插件安装失败，请重试')
  }
}

function handleViewDetails(plugin) {
  selectedPlugin.value = plugin
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = null
  showDetailsModal.value = false
}
</script>

<style scoped>
.plugin-marketplace {
  min-height: 100vh;
  background: var(--bg-color);
}

/* 页面头部 */
.marketplace-header {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  padding: 4rem 0 3rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
}

.marketplace-title {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.marketplace-subtitle {
  font-size: 1.25rem;
  margin: 0 0 2rem;
  opacity: 0.9;
}

/* 搜索区域 */
.search-section {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.search-box {
  display: flex;
  background: white;
  border-radius: 50px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.search-input {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  font-size: 1.1rem;
  outline: none;
}

.search-button {
  background: var(--primary-color);
  border: none;
  padding: 1rem 1.5rem;
  cursor: pointer;
  color: white;
  transition: background-color 0.3s;
}

.search-button:hover {
  background: var(--primary-hover);
}

/* 搜索建议 */
.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  margin-top: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
}

.suggestion-group {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.suggestion-group:last-child {
  border-bottom: none;
}

.suggestion-group h4 {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background: #f8f9fa;
}

.item-name {
  font-weight: 500;
}

.item-type {
  font-size: 0.8rem;
  color: #666;
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

/* 主内容区 */
.marketplace-content {
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  gap: 2rem;
}

/* 侧边栏 */
.marketplace-sidebar {
  width: 300px;
  flex-shrink: 0;
}

.filter-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #333;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  cursor: pointer;
  transition: color 0.2s;
}

.filter-option:hover {
  color: var(--primary-color);
}

.filter-checkbox {
  margin: 0;
}

.option-label {
  flex: 1;
}

.option-count {
  color: #666;
  font-size: 0.9rem;
}

/* 评分过滤器 */
.rating-filter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rating-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  cursor: pointer;
}

.rating-radio {
  margin: 0;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star-icon {
  font-size: 0.9rem;
  color: #ffd700;
}

.rating-label {
  font-size: 0.9rem;
  color: #666;
}

/* 过滤器操作 */
.filter-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.clear-filters-btn,
.apply-filters-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.clear-filters-btn {
  background: #f8f9fa;
  color: #666;
}

.clear-filters-btn:hover {
  background: #e9ecef;
}

.apply-filters-btn {
  background: var(--primary-color);
  color: white;
}

.apply-filters-btn:hover {
  background: var(--primary-hover);
}

/* 主内容区 */
.marketplace-main {
  flex: 1;
}

/* 内容头部 */
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.results-info {
  font-size: 1.1rem;
  color: #666;
}

.view-options {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sort-select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
}

.view-toggle {
  display: flex;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.view-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.view-btn:hover {
  background: #f8f9fa;
}

.view-btn.active {
  background: var(--primary-color);
  color: white;
}

/* 插件容器 */
.plugins-container {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.plugins-container.grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.plugins-container.list {
  grid-template-columns: 1fr;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.retry-btn:hover {
  background: var(--primary-hover);
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 40px;
  text-align: center;
}

.page-number:hover {
  background: #f8f9fa;
  border-color: var(--primary-color);
}

.page-number.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .marketplace-content {
    flex-direction: column;
  }

  .marketplace-sidebar {
    width: 100%;
    order: 2;
  }

  .marketplace-main {
    order: 1;
  }
}

@media (max-width: 768px) {
  .marketplace-header {
    padding: 2rem 0 1.5rem;
  }

  .marketplace-title {
    font-size: 2rem;
  }

  .marketplace-subtitle {
    font-size: 1rem;
  }

  .content-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .view-options {
    justify-content: space-between;
  }

  .plugins-container.grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }

  .pagination {
    flex-wrap: wrap;
  }
}
</style>
