<template>
  <div class="tenant-management">
    <div class="view-header">
      <h1>🏢 租户管理</h1>
      <div class="header-actions">
        <button @click="showCreateTenant = true" class="primary-button">
          创建租户
        </button>
        <button @click="refreshData" class="secondary-button">
          刷新数据
        </button>
      </div>
    </div>

    <!-- 租户概览统计 -->
    <div class="stats-grid">
      <div class="stat-card">
        <h3>活跃租户</h3>
        <div class="stat-value">{{ stats.activeTenants }}</div>
        <div class="stat-trend positive">+12%</div>
      </div>

      <div class="stat-card">
        <h3>总用户数</h3>
        <div class="stat-value">{{ stats.totalUsers }}</div>
        <div class="stat-trend positive">+8%</div>
      </div>

      <div class="stat-card">
        <h3>资源利用率</h3>
        <div class="stat-value">{{ stats.resourceUtilization }}%</div>
        <div class="stat-bar">
          <div
            class="stat-fill"
            :style="{ width: `${stats.resourceUtilization}%` }"
          ></div>
        </div>
      </div>

      <div class="stat-card">
        <h3>月收入</h3>
        <div class="stat-value">${{ stats.monthlyRevenue }}</div>
        <div class="stat-trend positive">+15%</div>
      </div>
    </div>

    <!-- 租户列表 -->
    <div class="content-section">
      <div class="section-header">
        <h2>租户列表</h2>
        <div class="filters">
          <select v-model="statusFilter" @change="filterTenants" class="filter-select">
            <option value="all">全部状态</option>
            <option value="ACTIVE">活跃</option>
            <option value="SUSPENDED">暂停</option>
            <option value="TRIAL">试用</option>
          </select>
          <select v-model="planFilter" @change="filterTenants" class="filter-select">
            <option value="all">全部计划</option>
            <option value="FREE">免费版</option>
            <option value="STANDARD">标准版</option>
            <option value="PROFESSIONAL">专业版</option>
            <option value="ENTERPRISE">企业版</option>
          </select>
        </div>
      </div>

      <div class="tenant-list">
        <div
          v-for="tenant in filteredTenants"
          :key="tenant.id"
          class="tenant-card"
          :class="{ suspended: tenant.status !== 'ACTIVE' }"
        >
          <div class="tenant-header">
            <div class="tenant-avatar">
              <span class="tenant-icon">{{ tenant.name.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="tenant-info">
              <h3>{{ tenant.displayName }}</h3>
              <div class="tenant-meta">
                <span class="tenant-name">{{ tenant.name }}</span>
                <span class="tenant-plan" :class="tenant.plan.toLowerCase()">
                  {{ getPlanText(tenant.plan) }}
                </span>
                <span class="tenant-status" :class="tenant.status.toLowerCase()">
                  {{ getStatusText(tenant.status) }}
                </span>
              </div>
            </div>
            <div class="tenant-actions">
              <button @click="viewTenantDetails(tenant)" class="action-button">
                详情
              </button>
              <button @click="editTenant(tenant)" class="action-button">
                编辑
              </button>
            </div>
          </div>

          <div class="tenant-details">
            <div class="detail-row">
              <span class="label">域名:</span>
              <span class="value">{{ tenant.domain || '未设置' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">创建时间:</span>
              <span class="value">{{ formatDate(tenant.createdAt) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">用户数:</span>
              <span class="value">{{ tenant.usage?.currentUsers || 0 }}</span>
            </div>
            <div class="detail-row">
              <span class="label">存储使用:</span>
              <span class="value">{{ tenant.usage?.usedStorageGB || 0 }}GB</span>
            </div>
          </div>

          <!-- 资源使用情况 -->
          <div class="tenant-usage">
            <div class="usage-item">
              <div class="usage-label">
                <span>用户使用</span>
                <span>{{ tenant.usage?.currentUsers || 0 }}/{{ (tenant.limits as any)?.maxUsers || 0 }}</span>
              </div>
              <div class="usage-bar">
                <div
                  class="usage-fill"
                  :style="{ width: `${getUsagePercentage(tenant.usage?.currentUsers || 0, (tenant.limits as any)?.maxUsers || 1)}%` }"
                ></div>
              </div>
            </div>

            <div class="usage-item">
              <div class="usage-label">
                <span>存储使用</span>
                <span>{{ tenant.usage?.usedStorageGB || 0 }}GB/{{ (tenant.limits as any)?.maxStorageGB || 0 }}GB</span>
              </div>
              <div class="usage-bar">
                <div
                  class="usage-fill"
                  :style="{ width: `${getUsagePercentage((tenant.usage?.usedStorageGB || 0), (tenant.limits as any)?.maxStorageGB || 1)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="page-button"
        >
          上一页
        </button>

        <span class="page-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
        </span>

        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="page-button"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 创建租户模态框 -->
    <div v-if="showCreateTenant" class="modal-overlay" @click="showCreateTenant = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>创建新租户</h3>
          <button @click="showCreateTenant = false" class="close-button">×</button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="createTenant" class="tenant-form">
            <div class="form-group">
              <label for="tenantName">租户名称 *</label>
              <input
                id="tenantName"
                v-model="newTenant.name"
                type="text"
                required
                placeholder="输入租户唯一标识"
                class="form-input"
              />
              <small class="form-hint">只能包含字母、数字和连字符</small>
            </div>

            <div class="form-group">
              <label for="displayName">显示名称 *</label>
              <input
                id="displayName"
                v-model="newTenant.displayName"
                type="text"
                required
                placeholder="输入租户显示名称"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="domain">域名</label>
              <input
                id="domain"
                v-model="newTenant.domain"
                type="text"
                placeholder="example.com"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="plan">服务计划 *</label>
              <select v-model="newTenant.plan" required class="form-select">
                <option value="FREE">免费版 - 适合个人使用</option>
                <option value="STANDARD">标准版 - 适合小团队</option>
                <option value="PROFESSIONAL">专业版 - 适合中型企业</option>
                <option value="ENTERPRISE">企业版 - 适合大型组织</option>
              </select>
            </div>

            <div class="form-group">
              <label for="billingEmail">账单邮箱</label>
              <input
                id="billingEmail"
                v-model="newTenant.billingEmail"
                type="email"
                placeholder="billing@example.com"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="description">描述</label>
              <textarea
                id="description"
                v-model="newTenant.description"
                placeholder="租户描述信息"
                class="form-textarea"
                rows="3"
              ></textarea>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button @click="showCreateTenant = false" class="cancel-button">
            取消
          </button>
          <button @click="createTenant" class="primary-button">
            创建租户
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useToast } from '@/composables/useToast'

const { show: showToast } = useToast()

// 状态
const tenants = ref([])
const stats = ref({
  activeTenants: 0,
  totalUsers: 0,
  resourceUtilization: 0,
  monthlyRevenue: 0
})

const statusFilter = ref('all')
const planFilter = ref('all')
const showCreateTenant = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)

const newTenant = ref({
  name: '',
  displayName: '',
  domain: '',
  plan: 'STANDARD',
  billingEmail: '',
  description: ''
})

// 计算属性
const filteredTenants = computed(() => {
  let filtered = tenants.value

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(tenant => tenant.status === statusFilter.value)
  }

  if (planFilter.value !== 'all') {
    filtered = filtered.filter(tenant => tenant.plan === planFilter.value)
  }

  return filtered
})

// 方法
const getPlanText = (plan) => {
  const plans = {
    FREE: '免费版',
    STANDARD: '标准版',
    PROFESSIONAL: '专业版',
    ENTERPRISE: '企业版'
  }
  return plans[plan] || plan
}

const getStatusText = (status) => {
  const statuses = {
    ACTIVE: '活跃',
    SUSPENDED: '暂停',
    TRIAL: '试用'
  }
  return statuses[status] || status
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const getUsagePercentage = (used, total) => {
  return Math.min(100, Math.round((used / total) * 100))
}

const refreshData = async () => {
  await loadTenants()
  await loadStats()
}

const loadTenants = async () => {
  try {
    const response = await axios.get('/tenants')
    tenants.value = response.data.data || []
    totalPages.value = Math.ceil(tenants.value.length / pageSize.value)
  } catch (error) {
    console.error('Failed to load tenants:', error)
    showToast('加载租户列表失败', 'error')
  }
}

const loadStats = async () => {
  try {
    // 这里应该调用统计API，暂时使用模拟数据
    stats.value = {
      activeTenants: tenants.value.filter(t => t.status === 'ACTIVE').length,
      totalUsers: tenants.value.reduce((sum, t) => sum + (t.usage?.currentUsers || 0), 0),
      resourceUtilization: 65, // 模拟数据
      monthlyRevenue: 12500 // 模拟数据
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

const filterTenants = () => {
  currentPage.value = 1
}

const viewTenantDetails = (tenant) => {
  console.log('查看租户详情:', tenant)
  // TODO: 打开租户详情页面
}

const editTenant = (tenant) => {
  console.log('编辑租户:', tenant)
  // TODO: 打开租户编辑页面
}

const createTenant = async () => {
  try {
    const response = await axios.post('/tenants', newTenant.value)
    showToast('租户创建成功', 'success')

    // 重置表单
    newTenant.value = {
      name: '',
      displayName: '',
      domain: '',
      plan: 'STANDARD',
      billingEmail: '',
      description: ''
    }

    showCreateTenant.value = false
    await refreshData()
  } catch (error) {
    console.error('Failed to create tenant:', error)
    showToast('创建租户失败', 'error')
  }
}

// 初始化
onMounted(async () => {
  await refreshData()
})
</script>

<style scoped>
.tenant-management {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.view-header h1 {
  margin: 0;
  color: var(--text-primary, #111827);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.primary-button, .secondary-button {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-button {
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
}

.primary-button:hover {
  background: var(--primary-hover, #2563eb);
}

.secondary-button {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #374151);
  border: 1px solid var(--border-color, #d1d5db);
}

.secondary-button:hover {
  background: var(--bg-hover, #e5e7eb);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-card h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary, #111827);
  margin-bottom: 12px;
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
}

.stat-trend.positive {
  background: var(--success-bg, #dcfce7);
  color: var(--success-text, #166534);
}

.stat-bar {
  height: 4px;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 2px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: var(--primary-color, #3b82f6);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.content-section {
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-secondary, #f9fafb);
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.filters {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  background: var(--bg-primary, #ffffff);
  font-size: 14px;
}

.tenant-list {
  padding: 0;
}

.tenant-card {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  transition: background-color 0.2s;
}

.tenant-card:last-child {
  border-bottom: none;
}

.tenant-card:hover {
  background: var(--bg-hover, #f9fafb);
}

.tenant-card.suspended {
  opacity: 0.7;
  background: var(--danger-bg-light, #fef2f2);
}

.tenant-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.tenant-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary-color, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.tenant-info {
  flex: 1;
}

.tenant-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.tenant-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tenant-name {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  font-family: monospace;
}

.tenant-plan {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.tenant-plan.free {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-secondary, #6b7280);
}

.tenant-plan.standard {
  background: var(--primary-bg, #dbeafe);
  color: var(--primary-text, #1e40af);
}

.tenant-plan.professional {
  background: var(--warning-bg, #fef3c7);
  color: var(--warning-text, #92400e);
}

.tenant-plan.enterprise {
  background: var(--success-bg, #dcfce7);
  color: var(--success-text, #166534);
}

.tenant-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.tenant-status.active {
  background: var(--success-bg, #dcfce7);
  color: var(--success-text, #166534);
}

.tenant-status.suspended {
  background: var(--danger-bg, #fee2e2);
  color: var(--danger-text, #991b1b);
}

.tenant-status.trial {
  background: var(--warning-bg, #fef3c7);
  color: var(--warning-text, #92400e);
}

.tenant-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 6px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #374151);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  border-color: var(--primary-color, #3b82f6);
  background: var(--bg-hover, #f3f4f6);
}

.tenant-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
}

.value {
  font-size: 14px;
  color: var(--text-primary, #111827);
  font-weight: 500;
}

.tenant-usage {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.usage-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.usage-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}

.usage-bar {
  height: 6px;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 3px;
  overflow: hidden;
}

.usage-fill {
  height: 100%;
  background: var(--primary-color, #3b82f6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

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

/* 模态框样式 */
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
  max-width: 600px;
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

.tenant-form {
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

.form-input, .form-select, .form-textarea {
  padding: 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-hint {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
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
</style>
