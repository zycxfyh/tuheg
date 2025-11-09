<template>
  <div class="theme-switcher">
    <!-- 主题模式选择 -->
    <div class="theme-mode-selector">
      <label class="selector-label">主题模式</label>
      <div class="mode-buttons">
        <button
          v-for="mode in themeModeOptions"
          :key="mode.value"
          class="mode-button"
          :class="{ active: themeMode === mode.value }"
          @click="setThemeMode(mode.value)"
          :title="mode.label"
        >
          <span class="mode-icon">{{ mode.icon }}</span>
          <span class="mode-label">{{ mode.label }}</span>
        </button>
      </div>
    </div>

    <!-- 手动主题选择（仅在非自动模式下显示） -->
    <div v-if="themeMode !== 'auto'" class="theme-selector">
      <label class="selector-label">选择主题</label>
      <div class="theme-buttons">
        <button
          v-for="themeOption in themeOptions"
          :key="themeOption.value"
          class="theme-button"
          :class="{ active: currentTheme === themeOption.value }"
          @click="setTheme(themeOption.value)"
          :title="themeOption.label"
        >
          <span class="theme-icon">{{ themeOption.icon }}</span>
          <span class="theme-label">{{ themeOption.label }}</span>
        </button>
      </div>
    </div>

    <!-- 快速切换按钮 -->
    <div class="quick-toggle">
      <button
        class="toggle-button"
        @click="toggleTheme"
        :disabled="themeMode === 'auto'"
        :title="themeMode === 'auto' ? '自动模式下无法手动切换' : '切换主题'"
      >
        <span class="toggle-icon">{{ getThemeIcon(currentTheme) }}</span>
        <span class="toggle-text">{{ isDarkTheme ? '切换到浅色' : '切换到深色' }}</span>
      </button>
    </div>

    <!-- 主题预览 -->
    <div class="theme-preview">
      <div class="preview-card">
        <div class="preview-header">
          <h4>主题预览</h4>
        </div>
        <div class="preview-content">
          <div class="preview-text">
            <p><strong>主要文字：</strong>这是主要文字的颜色</p>
            <p><span class="secondary">次要文字：</span> 这是次要文字的颜色</p>
          </div>
          <div class="preview-elements">
            <button class="preview-button primary">主要按钮</button>
            <button class="preview-button secondary">次要按钮</button>
            <div class="preview-accent">强调色示例</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme.store'

const themeStore = useThemeStore()

// 计算属性
const _currentTheme = computed(() => themeStore.currentTheme)
const _themeMode = computed(() => themeStore.themeMode)
const _themeOptions = computed(() => themeStore.getThemeOptions())
const _themeModeOptions = computed(() => themeStore.getThemeModeOptions())
const _isDarkTheme = computed(() => themeStore.isDarkTheme())

// 方法
const _setTheme = (theme) => {
  themeStore.setTheme(theme)
}

const _setThemeMode = (mode) => {
  themeStore.setThemeMode(mode)
}

const _toggleTheme = () => {
  themeStore.toggleTheme()
}

const _getThemeIcon = (theme) => {
  return themeStore.getThemeIcon(theme)
}

// 生命周期
onMounted(() => {
  // 初始化主题系统
  themeStore.initTheme()
})
</script>

<style scoped>
.theme-switcher {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  max-width: 400px;
}

.selector-label {
  display: block;
  font-weight: 600;
  color: var(--primary-text);
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

/* 主题模式选择 */
.theme-mode-selector {
  width: 100%;
}

.mode-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.mode-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--primary-bg);
  border: 2px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  font-weight: 500;
}

.mode-button:hover {
  border-color: var(--accent-color);
  background: var(--hover-bg);
  transform: translateY(-1px);
}

.mode-button.active {
  border-color: var(--accent-color);
  background: var(--accent-color);
  color: var(--primary-bg);
  box-shadow: 0 0 10px var(--glow-color);
}

.mode-icon {
  font-size: 1.1rem;
}

.mode-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 主题选择 */
.theme-selector {
  width: 100%;
}

.theme-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
}

.theme-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  background: var(--primary-bg);
  border: 2px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  font-weight: 500;
  text-align: center;
}

.theme-button:hover {
  border-color: var(--accent-color);
  background: var(--hover-bg);
  transform: translateY(-1px);
}

.theme-button.active {
  border-color: var(--accent-color);
  background: var(--accent-color);
  color: var(--primary-bg);
  box-shadow: 0 0 10px var(--glow-color);
}

.theme-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.theme-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 快速切换 */
.quick-toggle {
  width: 100%;
}

.toggle-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--accent-color);
  border: 2px solid var(--accent-color);
  border-radius: 6px;
  color: var(--primary-bg);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 0.9rem;
}

.toggle-button:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 0 10px var(--glow-color);
}

.toggle-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.toggle-icon {
  font-size: 1.2rem;
}

/* 主题预览 */
.theme-preview {
  width: 100%;
}

.preview-card {
  background: var(--primary-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.preview-header {
  padding: 0.75rem;
  background: var(--secondary-bg);
  border-bottom: 1px solid var(--border-color);
}

.preview-header h4 {
  margin: 0;
  color: var(--accent-color);
  font-size: 0.9rem;
  font-weight: 600;
}

.preview-content {
  padding: 1rem;
}

.preview-text p {
  margin: 0.5rem 0;
  font-size: 0.8rem;
  line-height: 1.4;
}

.preview-text .secondary {
  color: var(--secondary-text);
}

.preview-elements {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.preview-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: default;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.preview-button.primary {
  background: var(--accent-color);
  color: var(--primary-bg);
  border-color: var(--accent-color);
}

.preview-button.secondary {
  background: var(--secondary-bg);
  color: var(--primary-text);
  border-color: var(--border-color);
}

.preview-accent {
  padding: 0.5rem;
  background: var(--accent-light);
  color: var(--primary-bg);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .theme-switcher {
    padding: 0.75rem;
    gap: 1rem;
  }

  .mode-buttons,
  .theme-buttons {
    grid-template-columns: 1fr;
  }

  .mode-button,
  .theme-button {
    padding: 0.5rem;
  }

  .preview-content {
    padding: 0.75rem;
  }
}
</style>
