<template>
  <Teleport to="body">
    <!-- 悬浮反馈按钮 -->
    <div class="feedback-widget">
      <button
        @click="toggleFeedback"
        class="feedback-button"
        :class="{ 'has-unread': unreadCount > 0 }"
      >
        <span class="feedback-icon">💬</span>
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
      </button>

      <!-- 反馈模态框 -->
      <Transition name="feedback-modal">
        <div v-if="visible" class="feedback-overlay" @click="closeFeedback">
          <div class="feedback-modal" @click.stop>
            <div class="feedback-header">
              <h3 class="feedback-title">分享您的反馈</h3>
              <button @click="closeFeedback" class="close-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>

            <div class="feedback-body">
              <!-- 反馈类型选择 -->
              <div class="feedback-type-selector">
                <button
                  v-for="type in feedbackTypes"
                  :key="type.value"
                  @click="selectedType = type.value"
                  :class="['type-button', { active: selectedType === type.value }]"
                >
                  <span class="type-icon">{{ type.icon }}</span>
                  <span class="type-label">{{ type.label }}</span>
                </button>
              </div>

              <!-- 反馈表单 -->
              <form @submit.prevent="submitFeedback" class="feedback-form">
                <div class="form-group">
                  <label class="form-label">标题</label>
                  <input
                    v-model="title"
                    type="text"
                    class="form-input"
                    placeholder="简要描述您的问题或建议..."
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">详细描述</label>
                  <textarea
                    v-model="description"
                    class="form-textarea"
                    placeholder="请详细描述您遇到的问题、使用体验或功能建议..."
                    rows="4"
                    required
                  ></textarea>
                </div>

                <!-- 满意度评分 (仅对体验反馈显示) -->
                <div v-if="selectedType === 'experience'" class="form-group">
                  <label class="form-label">满意度评分</label>
                  <div class="rating-stars">
                    <span
                      v-for="star in 5"
                      :key="star"
                      @click="rating = star"
                      :class="['star', { active: star <= rating }]"
                    >
                      ⭐
                    </span>
                  </div>
                </div>

                <!-- 截图上传 -->
                <div class="form-group">
                  <label class="form-label">附加截图 (可选)</label>
                  <div class="screenshot-upload">
                    <input
                      ref="screenshotInput"
                      type="file"
                      accept="image/*"
                      @change="handleScreenshotUpload"
                      class="screenshot-input"
                      multiple
                    />
                    <button
                      type="button"
                      @click="$refs.screenshotInput.click()"
                      class="upload-button"
                    >
                      📎 选择图片
                    </button>
                    <div v-if="screenshots.length > 0" class="screenshot-preview">
                      <div
                        v-for="(screenshot, index) in screenshots"
                        :key="index"
                        class="screenshot-item"
                      >
                        <img :src="screenshot.preview" :alt="screenshot.name" />
                        <button
                          type="button"
                          @click="removeScreenshot(index)"
                          class="remove-screenshot"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 联系方式 (可选) -->
                <div class="form-group">
                  <label class="form-label">联系方式 (可选)</label>
                  <input
                    v-model="contact"
                    type="email"
                    class="form-input"
                    placeholder="您的邮箱地址，我们会及时回复..."
                  />
                  <small class="form-help">
                    提供联系方式可以帮助我们更好地理解您的反馈
                  </small>
                </div>

                <!-- 提交按钮 -->
                <div class="form-actions">
                  <button
                    type="button"
                    @click="closeFeedback"
                    class="cancel-button"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    :disabled="isSubmitting"
                    class="submit-button"
                  >
                    <span v-if="isSubmitting" class="loading-spinner">⏳</span>
                    {{ isSubmitting ? '提交中...' : '提交反馈' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@/composables/useToast'

// Props
const props = defineProps({
  position: {
    type: String,
    default: 'bottom-right',
    validator: (value) => ['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(value),
  },
})

// Emits
const emit = defineEmits(['feedback-submitted', 'feedback-error'])

// Composables
const { success, error } = useToast()

// 状态
const visible = ref(false)
const selectedType = ref('experience')
const title = ref('')
const description = ref('')
const rating = ref(5)
const contact = ref('')
const isSubmitting = ref(false)
const screenshots = ref([])
const unreadCount = ref(0)

// 反馈类型配置
const feedbackTypes = ref([
  {
    value: 'experience',
    label: '使用体验',
    icon: '😊',
    description: '分享您的使用体验和建议',
  },
  {
    value: 'bug',
    label: '发现问题',
    icon: '🐛',
    description: '报告应用中的问题或错误',
  },
  {
    value: 'feature',
    label: '功能建议',
    icon: '💡',
    description: '提出新功能或改进建议',
  },
])

// 计算属性
const widgetClasses = computed(() => ({
  'feedback-widget': true,
  [`position-${props.position}`]: true,
}))

// 方法
const toggleFeedback = () => {
  visible.value = !visible.value
  if (visible.value) {
    // 标记为已读
    unreadCount.value = 0
  }
}

const closeFeedback = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  title.value = ''
  description.value = ''
  rating.value = 5
  contact.value = ''
  screenshots.value = []
  selectedType.value = 'experience'
}

const handleScreenshotUpload = (event) => {
  const files = Array.from(event.target.files)

  files.forEach((file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        screenshots.value.push({
          file,
          preview: e.target.result,
          name: file.name,
        })
      }
      reader.readAsDataURL(file)
    }
  })
}

const removeScreenshot = (index) => {
  screenshots.value.splice(index, 1)
}

const submitFeedback = async () => {
  if (!title.value.trim() || !description.value.trim()) {
    error('请填写完整的反馈信息')
    return
  }

  try {
    isSubmitting.value = true

    // 构建反馈数据
    const feedbackData = {
      type: selectedType.value,
      title: title.value.trim(),
      description: description.value.trim(),
      rating: selectedType.value === 'experience' ? rating.value : null,
      contact: contact.value.trim() || null,
      screenshots: screenshots.value.map((s) => s.file),
      metadata: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      },
    }

    // 这里应该调用API提交反馈
    // await feedbackApi.submitFeedback(feedbackData)

    // 模拟提交
    await new Promise((resolve) => setTimeout(resolve, 1000))

    success('感谢您的反馈！我们会认真考虑您的建议。')

    emit('feedback-submitted', feedbackData)

    closeFeedback()
  } catch (err) {
    console.error('Failed to submit feedback:', err)
    error('提交反馈失败，请稍后重试')
    emit('feedback-error', err)
  } finally {
    isSubmitting.value = false
  }
}

// 生命周期
onMounted(() => {
  // 模拟未读反馈数量
  // 在实际应用中，这里应该从API获取
  setTimeout(() => {
    unreadCount.value = Math.floor(Math.random() * 3)
  }, 2000)
})
</script>

<style scoped>
.feedback-widget {
  position: fixed;
  z-index: 9999;
}

.position-bottom-right {
  bottom: 20px;
  right: 20px;
}

.position-bottom-left {
  bottom: 20px;
  left: 20px;
}

.position-top-right {
  top: 20px;
  right: 20px;
}

.position-top-left {
  top: 20px;
  left: 20px;
}

.feedback-button {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.feedback-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
}

.feedback-button:active {
  transform: scale(0.95);
}

.has-unread .feedback-icon {
  animation: pulse 2s infinite;
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.feedback-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.feedback-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.feedback-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e1e5e9;
}

.feedback-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
}

.close-button {
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-button:hover {
  background: #f7fafc;
  color: #2d3748;
}

.feedback-body {
  padding: 24px;
}

.feedback-type-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.type-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.type-button:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.type-button.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.type-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.type-label {
  font-size: 14px;
  font-weight: 500;
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
}

.form-input,
.form-textarea {
  padding: 12px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.rating-stars {
  display: flex;
  gap: 4px;
}

.star {
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.3;
}

.star.active {
  opacity: 1;
  transform: scale(1.1);
}

.screenshot-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-button {
  align-self: flex-start;
  padding: 8px 16px;
  background: #f7fafc;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.upload-button:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.screenshot-input {
  display: none;
}

.screenshot-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.screenshot-item {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e1e5e9;
}

.screenshot-item img {
  width: 100%;
  height: 80px;
  object-fit: cover;
}

.remove-screenshot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-help {
  font-size: 12px;
  color: #718096;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.cancel-button,
.submit-button {
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.cancel-button {
  background: #f7fafc;
  color: #4a5568;
  border: 1px solid #e1e5e9;
}

.cancel-button:hover {
  background: #edf2f7;
}

.submit-button {
  background: #667eea;
  color: white;
}

.submit-button:hover:not(:disabled) {
  background: #5a67d8;
}

.submit-button:disabled {
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

/* Modal animations */
.feedback-modal-enter-active,
.feedback-modal-leave-active {
  transition: all 0.3s ease;
}

.feedback-modal-enter-from,
.feedback-modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Responsive design */
@media (max-width: 640px) {
  .feedback-widget {
    bottom: 10px;
    right: 10px;
  }

  .feedback-button {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }

  .feedback-modal {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }

  .feedback-type-selector {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-button,
  .submit-button {
    width: 100%;
  }
}
</style>
