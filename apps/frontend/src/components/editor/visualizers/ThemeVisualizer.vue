<template>
  <div class="theme-visualizer">
    <div class="themes-grid">
      <div
        v-for="theme in availableThemes"
        :key="theme.id"
        class="theme-card"
        :class="{ active: currentTheme === theme.id }"
        @click="applyTheme(theme)"
      >
        <div class="theme-preview" :style="getThemeStyles(theme)">
          <div class="preview-title">标题示例</div>
          <div class="preview-text">这是一段示例文本，用来预览主题效果。</div>
          <div class="preview-quote">"这是一个引用示例"</div>
        </div>
        <div class="theme-info">
          <h4>{{ theme.name }}</h4>
          <p>{{ theme.description }}</p>
          <button @click.stop="customizeTheme(theme)" class="customize-btn">
            自定义
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  content: string
  themes?: any[]
  currentTheme?: string
}

interface Emits {
  (e: 'theme-apply', theme: any): void
  (e: 'theme-customize', theme: any): void
}

const props = withDefaults(defineProps<Props>(), {
  themes: () => [
    {
      id: 'default',
      name: '默认主题',
      description: '简洁现代的设计',
      colors: {
        primary: '#667eea',
        secondary: '#f8f9fa',
        text: '#333',
        background: '#fff',
      },
    },
    {
      id: 'dark',
      name: '深色主题',
      description: '护眼的深色模式',
      colors: {
        primary: '#667eea',
        secondary: '#2d3748',
        text: '#e2e8f0',
        background: '#1a202c',
      },
    },
    {
      id: 'warm',
      name: '暖色主题',
      description: '温暖舒适的配色',
      colors: {
        primary: '#d97706',
        secondary: '#fef3c7',
        text: '#92400e',
        background: '#fffbeb',
      },
    },
  ],
  currentTheme: 'default',
})

const emit = defineEmits<Emits>()

const applyTheme = (theme: any) => {
  emit('theme-apply', theme)
}

const customizeTheme = (theme: any) => {
  emit('theme-customize', theme)
}

const getThemeStyles = (theme: any) => {
  return {
    '--theme-primary': theme.colors.primary,
    '--theme-secondary': theme.colors.secondary,
    '--theme-text': theme.colors.text,
    '--theme-bg': theme.colors.background,
  }
}
</script>

<style scoped>
.theme-visualizer {
  height: 100%;
  padding: 16px;
  background: white;
  overflow-y: auto;
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.theme-card {
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.theme-card.active {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.theme-preview {
  height: 120px;
  padding: 12px;
  background: var(--theme-bg);
  color: var(--theme-text);
  font-size: 12px;
}

.preview-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--theme-primary);
}

.preview-text {
  margin-bottom: 8px;
  line-height: 1.4;
}

.preview-quote {
  font-style: italic;
  color: var(--theme-secondary);
  border-left: 3px solid var(--theme-primary);
  padding-left: 8px;
}

.theme-info {
  padding: 12px;
  background: white;
}

.theme-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
}

.theme-info p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.customize-btn {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 11px;
  cursor: pointer;
}

.customize-btn:hover {
  background: #f8f9fa;
}
</style>
