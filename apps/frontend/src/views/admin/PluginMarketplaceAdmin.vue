<template>
  <div class="plugin-admin">
    <div class="admin-header">
      <h1 class="admin-title">
        <i class="icon-settings"></i>
        插件市场管理
      </h1>
      <p class="admin-subtitle">管理插件市场内容、审核插件、配置分类</p>
    </div>

    <!-- 管理选项卡 -->
    <div class="admin-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <i :class="tab.icon"></i>
        {{ tab.name }}
      </button>
    </div>

    <!-- 插件审核选项卡 -->
    <div v-if="activeTab === 'pending'" class="admin-content">
      <div class="content-header">
        <h2>待审核插件</h2>
        <div class="header-actions">
          <button @click="refreshPendingPlugins" class="refresh-button">
            <i class="icon-refresh"></i>
            刷新
          </button>
        </div>
      </div>

      <div class="plugins-list">
        <div
          v-for="plugin in pendingPlugins"
          :key="plugin.id"
          class="plugin-card review-card"
        >
          <div class="plugin-header">
            <div class="plugin-info">
              <h3>{{ plugin.displayName }}</h3>
              <div class="plugin-meta">
                <span class="plugin-name">{{ plugin.name }}</span>
                <span class="plugin-version">v{{ plugin.latestVersion }}</span>
                <span class="plugin-author">作者: {{ plugin.author.displayName }}</span>
              </div>
            </div>
            <div class="plugin-status">
              <span class="status-badge pending">待审核</span>
            </div>
          </div>

          <div class="plugin-description">
            {{ plugin.description }}
          </div>

          <div class="plugin-details">
            <div class="detail-item">
              <span class="label">分类:</span>
              <span class="value">{{ plugin.category.displayName }}</span>
            </div>
            <div class="detail-item">
              <span class="label">标签:</span>
              <div class="tags">
                <span v-for="tag in plugin.tags" :key="tag.id" class="tag">{{ tag.displayName }}</span>
              </div>
            </div>
            <div class="detail-item">
              <span class="label">提交时间:</span>
              <span class="value">{{ formatDate(plugin.createdAt) }}</span>
            </div>
          </div>

          <div class="plugin-stats">
            <div class="stat-item">
              <span class="stat-label">下载量</span>
              <span class="stat-value">{{ plugin.downloadCount || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">评分</span>
              <span class="stat-value">{{ plugin.averageRating || 0 }}/5</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">评论数</span>
              <span class="stat-value">{{ plugin.reviewCount || 0 }}</span>
            </div>
          </div>

          <div class="plugin-actions">
            <button @click="viewPluginDetails(plugin)" class="action-button secondary">
              查看详情
            </button>
            <button @click="approvePlugin(plugin)" class="action-button success">
              批准
            </button>
            <button @click="rejectPlugin(plugin)" class="action-button danger">
              拒绝
            </button>
          </div>
        </div>

        <div v-if="pendingPlugins.length === 0" class="empty-state">
          <i class="icon-check-circle"></i>
          <h3>暂无待审核插件</h3>
          <p>所有插件都已审核完成</p>
        </div>
      </div>
    </div>

    <!-- 已发布插件选项卡 -->
    <div v-if="activeTab === 'published'" class="admin-content">
      <div class="content-header">
        <h2>已发布插件</h2>
        <div class="header-actions">
          <input
            v-model="searchQuery"
            @input="debouncedSearch"
            type="text"
            placeholder="搜索插件..."
            class="search-input"
          />
          <select v-model="statusFilter" @change="filterPublishedPlugins" class="filter-select">
            <option value="all">全部状态</option>
            <option value="APPROVED">已批准</option>
            <option value="SUSPENDED">已暂停</option>
            <option value="DEPRECATED">已弃用</option>
          </select>
        </div>
      </div>

      <div class="plugins-table">
        <table class="admin-table">
          <thead>
            <tr>
              <th>插件名称</th>
              <th>版本</th>
              <th>作者</th>
              <th>分类</th>
              <th>下载量</th>
              <th>评分</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plugin in filteredPublishedPlugins" :key="plugin.id">
              <td>
                <div class="table-plugin-info">
                  <span class="plugin-display-name">{{ plugin.displayName }}</span>
                  <span class="plugin-name">{{ plugin.name }}</span>
                </div>
              </td>
              <td>{{ plugin.latestVersion }}</td>
              <td>{{ plugin.author.displayName }}</td>
              <td>{{ plugin.category.displayName }}</td>
              <td>{{ plugin.downloadCount || 0 }}</td>
              <td>{{ plugin.averageRating ? plugin.averageRating.toFixed(1) : '0.0' }}</td>
              <td>
                <span :class="['status-badge', plugin.status.toLowerCase()]">
                  {{ getStatusText(plugin.status) }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button @click="viewPluginDetails(plugin)" class="action-link">详情</button>
                  <button @click="editPlugin(plugin)" class="action-link">编辑</button>
                  <button
                    v-if="plugin.status === 'APPROVED'"
                    @click="suspendPlugin(plugin)"
                    class="action-link danger"
                  >
                    暂停
                  </button>
                  <button
                    v-if="plugin.status === 'SUSPENDED'"
                    @click="unsuspendPlugin(plugin)"
                    class="action-link success"
                  >
                    恢复
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button @click="currentPage--" :disabled="currentPage === 1" class="page-button">
          上一页
        </button>
        <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="page-button">
          下一页
        </button>
      </div>
    </div>

    <!-- 分类管理选项卡 -->
    <div v-if="activeTab === 'categories'" class="admin-content">
      <div class="content-header">
        <h2>插件分类管理</h2>
        <div class="header-actions">
          <button @click="showCreateCategory = true" class="primary-button">
            <i class="icon-plus"></i>
            新建分类
          </button>
        </div>
      </div>

      <div class="categories-grid">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-card"
        >
          <div class="category-header">
            <div class="category-icon" :style="{ backgroundColor: category.color }">
              <i :class="category.icon"></i>
            </div>
            <div class="category-info">
              <h3>{{ category.displayName }}</h3>
              <span class="category-name">{{ category.name }}</span>
            </div>
            <div class="category-actions">
              <button @click="editCategory(category)" class="action-button small">
                编辑
              </button>
              <button @click="deleteCategory(category)" class="action-button danger small">
                删除
              </button>
            </div>
          </div>

          <p class="category-description">{{ category.description }}</p>

          <div class="category-stats">
            <span class="stat">{{ category.pluginCount || 0 }} 个插件</span>
            <span class="stat">排序: {{ category.sortOrder }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计分析选项卡 -->
    <div v-if="activeTab === 'analytics'" class="admin-content">
      <div class="content-header">
        <h2>插件市场统计</h2>
        <div class="header-actions">
          <select v-model="analyticsPeriod" @change="loadAnalytics" class="period-select">
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="90d">最近90天</option>
            <option value="1y">最近一年</option>
          </select>
        </div>
      </div>

      <div class="analytics-grid">
        <div class="analytics-card">
          <h3>总插件数</h3>
          <div class="metric">{{ analytics.totalPlugins }}</div>
          <div class="change positive">+{{ analytics.pluginsGrowth }}%</div>
        </div>

        <div class="analytics-card">
          <h3>总下载量</h3>
          <div class="metric">{{ analytics.totalDownloads }}</div>
          <div class="change positive">+{{ analytics.downloadsGrowth }}%</div>
        </div>

        <div class="analytics-card">
          <h3>活跃用户</h3>
          <div class="metric">{{ analytics.activeUsers }}</div>
          <div class="change positive">+{{ analytics.usersGrowth }}%</div>
        </div>

        <div class="analytics-card">
          <h3>平均评分</h3>
          <div class="metric">{{ analytics.averageRating }}/5</div>
          <div class="change positive">+{{ analytics.ratingGrowth }}%</div>
        </div>
      </div>

      <div class="charts-section">
        <div class="chart-container">
          <h3>下载趋势</h3>
          <div class="chart-placeholder">
            <i class="icon-chart-line"></i>
            <span>下载量趋势图表</span>
          </div>
        </div>

        <div class="chart-container">
          <h3>分类分布</h3>
          <div class="chart-placeholder">
            <i class="icon-chart-pie"></i>
            <span>插件分类饼图</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑分类模态框 -->
    <div v-if="showCreateCategory || editingCategory" class="modal-overlay" @click="closeCategoryModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingCategory ? '编辑分类' : '创建新分类' }}</h3>
          <button @click="closeCategoryModal" class="close-button">×</button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="saveCategory" class="category-form">
            <div class="form-group">
              <label for="categoryName">分类标识 *</label>
              <input
                id="categoryName"
                v-model="categoryForm.name"
                type="text"
                required
                :disabled="!!editingCategory"
                placeholder="category-name"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="displayName">显示名称 *</label>
              <input
                id="displayName"
                v-model="categoryForm.displayName"
                type="text"
                required
                placeholder="分类显示名称"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="description">描述</label>
              <textarea
                id="description"
                v-model="categoryForm.description"
                placeholder="分类描述"
                class="form-textarea"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="icon">图标</label>
              <input
                id="icon"
                v-model="categoryForm.icon"
                type="text"
                placeholder="icon-name"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="color">颜色</label>
              <input
                id="color"
                v-model="categoryForm.color"
                type="color"
                class="form-input color-input"
              />
            </div>

            <div class="form-group">
              <label for="sortOrder">排序</label>
              <input
                id="sortOrder"
                v-model.number="categoryForm.sortOrder"
                type="number"
                min="0"
                class="form-input"
              />
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button @click="closeCategoryModal" class="cancel-button">
            取消
          </button>
          <button @click="saveCategory" class="primary-button">
            {{ editingCategory ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { useToast } from '@/composables/useToast'
import { debounce } from 'lodash-es'

const { show: showToast } = useToast()

// 状态
const activeTab = ref('pending')
const tabs = [
  { id: 'pending', name: '待审核', icon: 'icon-clock' },
  { id: 'published', name: '已发布', icon: 'icon-package' },
  { id: 'categories', name: '分类管理', icon: 'icon-folder' },
  { id: 'analytics', name: '统计分析', icon: 'icon-chart-bar' }
]

const pendingPlugins = ref([])
const publishedPlugins = ref([])
const categories = ref([])
const analytics = ref({
  totalPlugins: 0,
  totalDownloads: 0,
  activeUsers: 0,
  averageRating: 0,
  pluginsGrowth: 0,
  downloadsGrowth: 0,
  usersGrowth: 0,
  ratingGrowth: 0
})

const searchQuery = ref('')
const statusFilter = ref('all')
const currentPage = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)
const analyticsPeriod = ref('30d')

const showCreateCategory = ref(false)
const editingCategory = ref(null)
const categoryForm = ref({
  name: '',
  displayName: '',
  description: '',
  icon: '',
  color: '#3b82f6',
  sortOrder: 0
})

// 计算属性
const filteredPublishedPlugins = computed(() => {
  let filtered = publishedPlugins.value

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(plugin => plugin.status === statusFilter.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(plugin =>
      plugin.displayName.toLowerCase().includes(query) ||
      plugin.name.toLowerCase().includes(query) ||
      plugin.description.toLowerCase().includes(query)
    )
  }

  return filtered
})

// 方法
const getStatusText = (status) => {
  const statusMap = {
    APPROVED: '已批准',
    SUSPENDED: '已暂停',
    DEPRECATED: '已弃用',
    PENDING_REVIEW: '待审核',
    REJECTED: '已拒绝'
  }
  return statusMap[status] || status
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const debouncedSearch = debounce(() => {
  currentPage.value = 1
  loadPublishedPlugins()
}, 300)

const refreshPendingPlugins = async () => {
  await loadPendingPlugins()
  showToast('刷新完成', 'success')
}

const filterPublishedPlugins = () => {
  currentPage.value = 1
}

const viewPluginDetails = (plugin) => {
  console.log('查看插件详情:', plugin)
  // TODO: 打开插件详情页面
}

const approvePlugin = async (plugin) => {
  try {
    await axios.put(`/plugins/marketplace/admin/${plugin.id}/approve`)
    showToast('插件已批准', 'success')
    await loadPendingPlugins()
    await loadPublishedPlugins()
  } catch (error) {
    console.error('批准插件失败:', error)
    showToast('批准插件失败', 'error')
  }
}

const rejectPlugin = async (plugin) => {
  try {
    await axios.put(`/plugins/marketplace/admin/${plugin.id}/reject`)
    showToast('插件已拒绝', 'success')
    await loadPendingPlugins()
  } catch (error) {
    console.error('拒绝插件失败:', error)
    showToast('拒绝插件失败', 'error')
  }
}

const editPlugin = (plugin) => {
  console.log('编辑插件:', plugin)
  // TODO: 打开插件编辑页面
}

const suspendPlugin = async (plugin) => {
  try {
    await axios.put(`/plugins/marketplace/admin/${plugin.id}/suspend`)
    showToast('插件已暂停', 'success')
    await loadPublishedPlugins()
  } catch (error) {
    console.error('暂停插件失败:', error)
    showToast('暂停插件失败', 'error')
  }
}

const unsuspendPlugin = async (plugin) => {
  try {
    await axios.put(`/plugins/marketplace/admin/${plugin.id}/unsuspend`)
    showToast('插件已恢复', 'success')
    await loadPublishedPlugins()
  } catch (error) {
    console.error('恢复插件失败:', error)
    showToast('恢复插件失败', 'error')
  }
}

const editCategory = (category) => {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    displayName: category.displayName,
    description: category.description,
    icon: category.icon,
    color: category.color,
    sortOrder: category.sortOrder
  }
}

const deleteCategory = async (category) => {
  if (!confirm(`确定要删除分类 "${category.displayName}" 吗？`)) {
    return
  }

  try {
    await axios.delete(`/plugins/marketplace/admin/categories/${category.id}`)
    showToast('分类已删除', 'success')
    await loadCategories()
  } catch (error) {
    console.error('删除分类失败:', error)
    showToast('删除分类失败', 'error')
  }
}

const saveCategory = async () => {
  try {
    if (editingCategory.value) {
      await axios.put(`/plugins/marketplace/admin/categories/${editingCategory.value.id}`, categoryForm.value)
      showToast('分类已更新', 'success')
    } else {
      await axios.post('/plugins/marketplace/admin/categories', categoryForm.value)
      showToast('分类已创建', 'success')
    }

    closeCategoryModal()
    await loadCategories()
  } catch (error) {
    console.error('保存分类失败:', error)
    showToast('保存分类失败', 'error')
  }
}

const closeCategoryModal = () => {
  showCreateCategory.value = false
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    displayName: '',
    description: '',
    icon: '',
    color: '#3b82f6',
    sortOrder: 0
  }
}

// 数据加载方法
const loadPendingPlugins = async () => {
  try {
    const response = await axios.get('/plugins/marketplace/admin/pending')
    pendingPlugins.value = response.data.data || []
  } catch (error) {
    console.error('加载待审核插件失败:', error)
    showToast('加载待审核插件失败', 'error')
  }
}

const loadPublishedPlugins = async () => {
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value,
      q: searchQuery.value || undefined
    }

    const response = await axios.get('/plugins/marketplace/admin/published', { params })
    publishedPlugins.value = response.data.data.plugins || []
    totalPages.value = response.data.data.pagination?.totalPages || 1
  } catch (error) {
    console.error('加载已发布插件失败:', error)
    showToast('加载已发布插件失败', 'error')
  }
}

const loadCategories = async () => {
  try {
    const response = await axios.get('/plugins/marketplace/admin/categories')
    categories.value = response.data.data || []
  } catch (error) {
    console.error('加载分类失败:', error)
    showToast('加载分类失败', 'error')
  }
}

const loadAnalytics = async () => {
  try {
    const response = await axios.get('/plugins/marketplace/admin/analytics', {
      params: { period: analyticsPeriod.value }
    })
    analytics.value = response.data.data || analytics.value
  } catch (error) {
    console.error('加载统计数据失败:', error)
    showToast('加载统计数据失败', 'error')
  }
}

// 监听选项卡变化
watch(activeTab, async (newTab) => {
  if (newTab === 'pending') {
    await loadPendingPlugins()
  } else if (newTab === 'published') {
    await loadPublishedPlugins()
  } else if (newTab === 'categories') {
    await loadCategories()
  } else if (newTab === 'analytics') {
    await loadAnalytics()
  }
})

// 初始化
onMounted(async () => {
  await loadPendingPlugins()
})
</script>

<style scoped>
.plugin-admin {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header {
  margin-bottom: 30px;
}

.admin-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary, #111827);
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-subtitle {
  margin: 0;
  font-size: 16px;
  color: var(--text-secondary, #6b7280);
}

.admin-tabs {
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.tab-button {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-button:hover {
  color: var(--text-primary, #111827);
}

.tab-button.active {
  color: var(--primary-color, #3b82f6);
  border-bottom-color: var(--primary-color, #3b82f6);
}

.admin-content {
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  overflow: hidden;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-secondary, #f9fafb);
}

.content-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.primary-button, .refresh-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.primary-button {
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
}

.primary-button:hover {
  background: var(--primary-hover, #2563eb);
}

.refresh-button {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #374151);
  border: 1px solid var(--border-color, #d1d5db);
}

.refresh-button:hover {
  background: var(--bg-hover, #e5e7eb);
}

.search-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  font-size: 14px;
  width: 250px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  background: var(--bg-primary, #ffffff);
  font-size: 14px;
}

/* 插件列表 */
.plugins-list {
  padding: 0;
}

.plugin-card {
  padding: 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.plugin-card:last-child {
  border-bottom: none;
}

.review-card {
  border-left: 4px solid var(--warning-color, #f59e0b);
}

.plugin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.plugin-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.plugin-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
}

.plugin-status .status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.pending {
  background: var(--warning-bg, #fef3c7);
  color: var(--warning-text, #92400e);
}

.plugin-description {
  margin: 12px 0;
  color: var(--text-primary, #111827);
  line-height: 1.5;
}

.plugin-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin: 16px 0;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
}

.value {
  color: var(--text-primary, #111827);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 2px 8px;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 12px;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}

.plugin-stats {
  display: flex;
  gap: 24px;
  margin: 16px 0;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.plugin-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.action-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--border-color, #d1d5db);
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #374151);
}

.action-button:hover {
  border-color: var(--primary-color, #3b82f6);
  background: var(--bg-hover, #f3f4f6);
}

.action-button.success {
  border-color: var(--success-color, #10b981);
  color: var(--success-color, #10b981);
}

.action-button.danger {
  border-color: var(--danger-color, #ef4444);
  color: var(--danger-color, #ef4444);
}

.action-button.secondary {
  background: var(--bg-secondary, #f3f4f6);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary, #6b7280);
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--text-primary, #111827);
}

/* 表格样式 */
.plugins-table {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th,
.admin-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.admin-table th {
  background: var(--bg-secondary, #f9fafb);
  font-weight: 600;
  color: var(--text-primary, #111827);
  font-size: 14px;
}

.admin-table td {
  font-size: 14px;
  color: var(--text-primary, #111827);
}

.table-plugin-info .plugin-display-name {
  display: block;
  font-weight: 500;
  color: var(--text-primary, #111827);
}

.table-plugin-info .plugin-name {
  display: block;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  font-family: monospace;
}

.status-badge.approved {
  background: var(--success-bg, #dcfce7);
  color: var(--success-text, #166534);
}

.status-badge.suspended {
  background: var(--danger-bg, #fee2e2);
  color: var(--danger-text, #991b1b);
}

.status-badge.deprecated {
  background: var(--warning-bg, #fef3c7);
  color: var(--warning-text, #92400e);
}

.table-actions {
  display: flex;
  gap: 8px;
}

.action-link {
  padding: 4px 8px;
  background: none;
  border: none;
  color: var(--primary-color, #3b82f6);
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
}

.action-link:hover {
  color: var(--primary-hover, #2563eb);
}

.action-link.danger {
  color: var(--danger-color, #ef4444);
}

.action-link.success {
  color: var(--success-color, #10b981);
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.page-button {
  padding: 8px 16px;
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #374151);
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-button:hover:not(:disabled) {
  background: var(--bg-hover, #e5e7eb);
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
}

/* 分类网格 */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 24px;
}

.category-card {
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
}

.category-card:hover {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.category-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.category-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.category-name {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  font-family: monospace;
}

.category-actions {
  margin-left: auto;
}

.action-button.small {
  padding: 6px 12px;
  font-size: 12px;
}

.category-description {
  margin: 0 0 12px 0;
  color: var(--text-secondary, #6b7280);
  line-height: 1.4;
}

.category-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}

/* 统计分析 */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 24px;
}

.analytics-card {
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.analytics-card h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
}

.metric {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary, #111827);
  margin-bottom: 8px;
}

.change {
  font-size: 14px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
}

.change.positive {
  background: var(--success-bg, #dcfce7);
  color: var(--success-text, #166534);
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  padding: 0 24px 24px 24px;
}

.chart-container {
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  padding: 20px;
}

.chart-container h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.chart-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #6b7280);
  border: 2px dashed var(--border-color, #e5e7eb);
  border-radius: 8px;
}

.chart-placeholder i {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.5;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: var(--bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background: var(--bg-hover, #f3f4f6);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.category-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #111827);
}

.form-input, .form-textarea, .color-input {
  padding: 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus, .form-textarea:focus, .color-input:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.color-input {
  width: 60px;
  height: 40px;
  padding: 0;
  cursor: pointer;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-button, .primary-button {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #374151);
  border: 1px solid var(--border-color, #d1d5db);
}

.cancel-button:hover {
  background: var(--bg-hover, #e5e7eb);
}

.primary-button {
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
}

.primary-button:hover {
  background: var(--primary-hover, #2563eb);
}

.period-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  background: var(--bg-primary, #ffffff);
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .analytics-grid, .charts-section {
    grid-template-columns: 1fr;
  }

  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }

  .admin-table {
    font-size: 12px;
  }

  .admin-table th,
  .admin-table td {
    padding: 8px 12px;
  }
}

@media (max-width: 768px) {
  .plugin-admin {
    padding: 10px;
  }

  .admin-tabs {
    flex-wrap: wrap;
  }

  .tab-button {
    padding: 8px 16px;
    font-size: 14px;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .search-input {
    width: 200px;
  }

  .plugin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .plugin-meta {
    flex-wrap: wrap;
    gap: 8px;
  }

  .plugin-actions {
    width: 100%;
    justify-content: space-between;
  }

  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
}
</style>
