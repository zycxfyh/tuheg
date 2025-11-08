<!-- 文件路径: apps/frontend/src/components/common/AiConfigCard.vue -->
<template>
  <div class="ai-config-card" :class="{ 'is-new': isNew, 'is-loading': isLoading }">
    <!-- Step Indicator -->
    <div class="step-indicator">
      <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
        <span class="step-number">1</span>
        <span class="step-label">选择供应商</span>
      </div>
      <div class="step-connector"></div>
      <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
        <span class="step-number">2</span>
        <span class="step-label">配置密钥</span>
      </div>
      <div class="step-connector"></div>
      <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
        <span class="step-number">3</span>
        <span class="step-label">选择模型</span>
      </div>
      <div class="step-connector"></div>
      <div class="step" :class="{ active: currentStep >= 4, completed: currentStep > 4 }">
        <span class="step-number">4</span>
        <span class="step-label">测试连接</span>
      </div>
    </div>

    <!-- Connection Status Banner -->
    <div v-if="connectionStatus" class="status-banner" :class="connectionStatus.type">
      <div class="status-icon">
        <span v-if="connectionStatus.type === 'success'">✅</span>
        <span v-else-if="connectionStatus.type === 'error'">❌</span>
        <span v-else-if="connectionStatus.type === 'warning'">⚠️</span>
        <span v-else>ℹ️</span>
      </div>
      <div class="status-content">
        <div class="status-title">{{ connectionStatus.title }}</div>
        <div class="status-message">{{ connectionStatus.message }}</div>
        <div v-if="connectionStatus.details" class="status-details">
          {{ connectionStatus.details }}
        </div>
      </div>
    </div>

    <div class="form-grid">
      <!-- Provider Selection -->
      <div>
        <label>供应商 (Provider) <span class="required">*</span></label>
        <select
          v-model="editableConfig.provider"
          @change="onProviderChange"
          :disabled="isLoading"
          :class="{ error: errors.provider }"
        >
          <option disabled value="">请选择一个供应商</option>
          <optgroup v-for="group in providerGroups" :key="group.label" :label="group.label">
            <option v-for="provider in group.providers" :key="provider.id" :value="provider.id">
              {{ provider.name }}
            </option>
          </optgroup>
        </select>
        <div v-if="errors.provider" class="error-message">{{ errors.provider }}</div>
      </div>

      <!-- Model ID Selection -->
      <div>
        <label>模型ID (Model ID) <span class="required">*</span></label>
        <select
          v-model="editableConfig.modelId"
          :disabled="isLoading || !fetchedModels.length"
          :class="{ error: errors.modelId }"
        >
          <option v-if="!fetchedModels.length" disabled value="">
            {{ modelSelectPlaceholder }}
          </option>
          <option v-for="modelId in fetchedModels" :key="modelId" :value="modelId">
            {{ modelId }}
          </option>
          <!-- Allow showing saved value even if not in fetched list -->
          <option
            v-if="editableConfig.modelId && !fetchedModels.includes(editableConfig.modelId)"
            :value="editableConfig.modelId"
          >
            {{ editableConfig.modelId }} (自定义)
          </option>
        </select>
        <div v-if="errors.modelId" class="error-message">{{ errors.modelId }}</div>
      </div>

      <!-- Base URL Input -->
      <div class="full-width">
        <label>API 基础地址 (Base URL)</label>
        <div class="input-with-button">
          <input
            type="text"
            v-model.trim="editableConfig.baseUrl"
            placeholder="选择供应商后将自动填充"
            :disabled="isLoading"
            :class="{ error: errors.baseUrl }"
          />
          <button
            class="button small"
            @click="handleTestConnection"
            :disabled="isLoading || !canTestConnection"
            :class="{ primary: canTestConnection, disabled: !canTestConnection }"
          >
            {{ testButtonText }}
          </button>
        </div>
        <div v-if="errors.baseUrl" class="error-message">{{ errors.baseUrl }}</div>
      </div>

      <!-- API Key Input -->
      <div class="full-width">
        <label>API 密钥 (API Key) <span class="required">*</span></label>
        <input
          type="password"
          v-model.trim="editableConfig.apiKey"
          placeholder="在此输入您的API密钥"
          :disabled="isLoading"
          :class="{ error: errors.apiKey }"
        />
        <div v-if="errors.apiKey" class="error-message">{{ errors.apiKey }}</div>
      </div>

      <!-- Role Assignment -->
      <div class="full-width">
        <label>能力分配 (此AI核心负责的任务)</label>
        <div class="roles-group">
          <label v-for="role in availableRoles" :key="role.id">
            <input
              type="checkbox"
              :value="role.id"
              v-model="selectedRoles"
              :disabled="isLoading || props.isGlobal"
            />
            {{ role.name }}
            <span class="tooltip">{{ role.description }}</span>
          </label>
        </div>
        <p v-if="props.isGlobal" class="global-mode-text">简易模式下，此AI将负责所有任务。</p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="button-group">
      <button v-if="!isNew" class="button danger" @click="handleDelete" :disabled="isLoading">
        删除
      </button>
      <button v-else class="button danger" @click="handleCancelNew" :disabled="isLoading">
        取消
      </button>
      <div>
        <button v-if="!isNew" class="button" @click="resetChanges" :disabled="isLoading">
          重置
        </button>
        <button class="button primary" @click="handleSave" :disabled="isLoading">
          {{ isNew ? '创建' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useSettingsStore, ALL_AI_ROLES } from '@/stores/settings.store'
import { apiService } from '@/services/api.service'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  config: { type: Object, required: true },
  isGlobal: { type: Boolean, default: false },
})

const settingsStore = useSettingsStore()
const { show: showToast } = useToast()

const isNew = computed(() => !!props.config.isNew)
const editableConfig = ref(JSON.parse(JSON.stringify(props.config)))
const isLoading = ref(false)
const isTesting = ref(false)
const fetchedModels = ref([])

// New reactive properties for enhanced UX
const errors = ref({
  provider: '',
  apiKey: '',
  baseUrl: '',
  modelId: '',
})

const connectionStatus = ref(null)

const currentStep = computed(() => {
  if (!editableConfig.value.provider) return 1
  if (!editableConfig.value.apiKey) return 2
  if (!editableConfig.value.modelId) return 3
  if (!fetchedModels.value.length) return 3
  return 4
})

const canTestConnection = computed(() => {
  return editableConfig.value.provider && editableConfig.value.apiKey
})

// --- Data for Provider Select ---
const providers = {
  china: [
    { id: 'DeepSeek', name: 'DeepSeek (深度求索)', baseUrl: 'https://api.deepseek.com' },
    { id: 'Moonshot', name: 'Moonshot (月之暗面)', baseUrl: 'https://api.moonshot.cn/v1' },
    // ... (Add other providers from your previous code)
  ],
  international: [
    { id: 'OpenAI', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
    { id: 'Groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1' },
    // ...
  ],
  local: [
    { id: 'Ollama', name: 'Ollama (本地)', baseUrl: 'http://localhost:11434/v1' },
    { id: 'CustomOpenAICompatible', name: '自定义兼容接口', baseUrl: '' },
  ],
}
const providerGroups = ref([
  { label: '国内供应商', providers: providers.china },
  { label: '国际供应商', providers: providers.international },
  { label: '本地与其他', providers: providers.local },
])

// --- Data for Role Assignment ---
const availableRoles = ref([
  {
    id: 'logic_parsing',
    name: '逻辑解析',
    description: '将玩家的自然语言输入翻译成确定的游戏世界规则变更。',
  },
  {
    id: 'narrative_synthesis',
    name: '叙事合成',
    description: '将游戏世界状态的变化渲染成生动的故事文本和玩家选项。',
  },
  {
    id: 'planner',
    name: '任务规划',
    description: '(高级) 负责将复杂任务分解为多个子任务，进行AI协作。',
  },
  {
    id: 'critic',
    name: '输出审查',
    description: '(高级) 负责审查其他AI的输出质量，并提出修改意见。',
  },
])

const selectedRoles = computed({
  get: () =>
    editableConfig.value.assignedRoles ? editableConfig.value.assignedRoles.split(',') : [],
  set: (newValue) => {
    editableConfig.value.assignedRoles = newValue.join(',')
  },
})

// --- Computed Properties for UI ---
const modelSelectPlaceholder = computed(() => {
  if (!editableConfig.value.provider) return '请先选择供应商'
  if (!editableConfig.value.apiKey) return '请填写API Key'
  return '请点击右侧按钮获取'
})

const testButtonText = computed(() => {
  if (isTesting.value) return '测试中...'
  if (fetchedModels.value.length > 0) return '重新获取'
  return '测试 & 获取模型'
})

// --- Methods ---

// Clear all errors
function clearErrors() {
  errors.value = {
    provider: '',
    apiKey: '',
    baseUrl: '',
    modelId: '',
  }
}

// Clear connection status
function clearConnectionStatus() {
  connectionStatus.value = null
}

// Validate form fields
function validateFields() {
  clearErrors()
  let isValid = true

  if (!editableConfig.value.provider) {
    errors.value.provider = '请选择一个AI供应商'
    isValid = false
  }

  if (!editableConfig.value.apiKey) {
    errors.value.apiKey = '请输入API密钥'
    isValid = false
  }

  if (!editableConfig.value.modelId) {
    errors.value.modelId = '请选择一个模型'
    isValid = false
  }

  return isValid
}

function onProviderChange() {
  clearErrors()
  clearConnectionStatus()

  const allProviders = [...providers.china, ...providers.international, ...providers.local]
  const selectedProvider = allProviders.find((p) => p.id === editableConfig.value.provider)
  if (selectedProvider) {
    editableConfig.value.baseUrl = selectedProvider.baseUrl
  }

  // Reset model selection when provider changes
  fetchedModels.value = []
  editableConfig.value.modelId = ''

  // Update step indicator
  if (editableConfig.value.provider && editableConfig.value.apiKey) {
    // Trigger model fetching if we have both provider and API key
    if (canTestConnection.value) {
      handleTestConnection()
    }
  }
}

async function handleTestConnection() {
  if (!canTestConnection.value) {
    return showToast('请先选择供应商并输入API密钥。', 'warning')
  }

  clearConnectionStatus()
  isTesting.value = true
  fetchedModels.value = []

  // Clear model error since we're testing
  errors.value.modelId = ''

  try {
    const payload = {
      provider: editableConfig.value.provider,
      apiKey: editableConfig.value.apiKey,
      baseUrl: editableConfig.value.baseUrl || null,
    }

    const response = await apiService.settings.testConnection(payload)
    fetchedModels.value = response.models || []

    if (response.models && response.models.length > 0) {
      // Auto-select first model if none selected
      if (
        !editableConfig.value.modelId ||
        !response.models.includes(editableConfig.value.modelId)
      ) {
        editableConfig.value.modelId = response.models[0]
      }

      connectionStatus.value = {
        type: 'success',
        title: '连接成功',
        message: response.message || `成功获取 ${response.models.length} 个可用模型`,
        details: null,
      }

      showToast(response.message || `成功获取 ${response.models.length} 个模型！`, 'success')
    } else {
      connectionStatus.value = {
        type: 'warning',
        title: '连接成功但无模型',
        message: '连接成功，但未找到可用模型',
        details: '请检查您的API密钥权限或联系供应商支持',
      }
      showToast('连接成功，但未找到可用模型。', 'warning')
    }
  } catch (error) {
    console.error('Connection test failed:', error)

    const errorInfo = {
      type: 'error',
      title: '连接失败',
      message: '未知错误',
      details: null,
    }

    if (error.response) {
      // Backend returned an error with details
      const errorData = error.response.data
      if (errorData.message) {
        errorInfo.message = errorData.message
        errorInfo.details = errorData.details || null

        // Set specific field errors based on error type
        if (errorData.message.includes('供应商') || errorData.message.includes('provider')) {
          errors.value.provider = errorInfo.message
        } else if (errorData.message.includes('API密钥') || errorData.message.includes('apiKey')) {
          errors.value.apiKey = errorInfo.message
        } else if (
          errorData.message.includes('Base URL') ||
          errorData.message.includes('baseUrl')
        ) {
          errors.value.baseUrl = errorInfo.message
        }
      }
    } else if (error.message) {
      errorInfo.message = error.message
      errorInfo.details = '请检查网络连接或稍后重试'
    }

    connectionStatus.value = errorInfo
    showToast(`连接测试失败: ${errorInfo.message}`, 'error')
  } finally {
    isTesting.value = false
  }
}

function handleSave() {
  // Validate all fields before saving
  if (!validateFields()) {
    showToast('请填写所有必需字段并解决错误。', 'error')
    return
  }

  const dataToSave = { ...editableConfig.value }

  if (props.isGlobal) {
    dataToSave.assignedRoles = ALL_AI_ROLES.join(',')
  }

  try {
    if (isNew.value) {
      const { isNew: _isNew, id: _id, ...creationData } = dataToSave
      settingsStore.createAiConfiguration(creationData)
      showToast('AI配置创建成功！', 'success')
    } else {
      settingsStore.updateAiConfiguration(props.config.id, dataToSave)
      showToast('AI配置更新成功！', 'success')
    }

    // Clear any connection status after successful save
    clearConnectionStatus()
  } catch (error) {
    showToast('保存配置失败，请重试。', 'error')
    console.error('Save configuration failed:', error)
  }
}

function handleDelete() {
  if (confirm(`确定要删除 "${props.config.provider}" 这个AI配置吗？`)) {
    settingsStore.deleteAiConfiguration(props.config.id)
  }
}

function resetChanges() {
  editableConfig.value = JSON.parse(JSON.stringify(props.config))
  // Also reset fetched models if not a new card
  if (!isNew.value) {
    fetchedModels.value = []
  }
}

function handleCancelNew() {
  settingsStore.removeNewConfigCard(props.config.id)
}

watch(
  () => props.config,
  (newVal) => {
    editableConfig.value = JSON.parse(JSON.stringify(newVal))
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
/* Enhanced AI Config Card Styles */

/* Step Indicator */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--secondary-bg);
  border-radius: 8px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  position: relative;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--border-color);
  color: var(--text-secondary);
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background-color: var(--accent-color);
  color: white;
}

.step.completed .step-number {
  background-color: var(--success-color);
  color: white;
}

.step-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-align: center;
  font-weight: 500;
}

.step.active .step-label {
  color: var(--accent-color);
  font-weight: 600;
}

.step.completed .step-label {
  color: var(--success-color);
}

.step-connector {
  flex: 0 0 40px;
  height: 2px;
  background-color: var(--border-color);
  margin: 0 1rem;
}

/* Status Banner */
.status-banner {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.status-banner.success {
  background-color: rgba(34, 197, 94, 0.1);
  border-left-color: var(--success-color);
}

.status-banner.error {
  background-color: rgba(239, 68, 68, 0.1);
  border-left-color: var(--error-color);
}

.status-banner.warning {
  background-color: rgba(245, 158, 11, 0.1);
  border-left-color: var(--warning-color);
}

.status-banner.info {
  background-color: rgba(59, 130, 246, 0.1);
  border-left-color: var(--accent-color);
}

.status-icon {
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.status-content {
  flex: 1;
}

.status-title {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.status-message {
  font-size: 0.9rem;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.status-details {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-style: italic;
}

/* Form Styles */
.ai-config-card {
  background-color: var(--primary-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.ai-config-card:hover {
  border-color: var(--accent-color);
}

.ai-config-card.is-new {
  border-left: 3px solid var(--success-color);
}

.ai-config-card.is-loading {
  opacity: 0.7;
  pointer-events: none;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 1.5rem;
}

.full-width {
  grid-column: 1 / -1;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.required {
  color: var(--error-color);
  margin-left: 0.25rem;
}

/* Form Controls */
select,
input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--secondary-bg);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

select:focus,
input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

select.error,
input.error {
  border-color: var(--error-color);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

select:disabled,
input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Error Messages */
.error-message {
  color: var(--error-color);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.error-message::before {
  content: '⚠️';
  font-size: 0.9rem;
}

/* Button Styles */
.input-with-button {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.input-with-button input {
  flex-grow: 1;
}

.button.small {
  padding: 8px 12px;
  font-size: 0.8rem;
  margin: 0;
  white-space: nowrap;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--secondary-bg);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.button.small:hover:not(.disabled) {
  border-color: var(--accent-color);
  background-color: var(--accent-color);
  color: white;
}

.button.small.primary {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.button.small.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.button.primary {
  background-color: var(--success-color);
  border-color: var(--success-color);
  color: white;
}

.button.primary:hover {
  background-color: #16a34a;
  border-color: #16a34a;
}

.button.danger {
  background-color: var(--error-color);
  border-color: var(--error-color);
  color: white;
}

.button.danger:hover {
  background-color: #dc2626;
  border-color: #dc2626;
}

/* Roles Group */
.roles-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  background-color: var(--secondary-bg);
  padding: 1rem;
  border-radius: 5px;
}

.roles-group label {
  font-weight: normal;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.tooltip {
  visibility: hidden;
  width: 220px;
  background-color: #555;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 10px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -110px;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 0.8rem;
  pointer-events: none;
}

.roles-group label:hover .tooltip {
  visibility: visible;
  opacity: 1;
}

.global-mode-text {
  font-size: 0.9rem;
  font-style: italic;
  color: #888;
  margin-top: 0.5rem;
}

/* Button Group */
.button-group {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .step-indicator {
    flex-direction: column;
    gap: 1rem;
  }

  .step-connector {
    width: 2px;
    height: 20px;
    margin: 0;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .input-with-button {
    flex-direction: column;
  }

  .button-group {
    flex-direction: column;
    gap: 0.75rem;
  }

  .button-group > div {
    width: 100%;
  }
}
</style>
