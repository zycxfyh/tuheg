<template>
  <div class="language-switcher">
    <!-- 语言选择器 -->
    <div class="language-selector">
      <label class="selector-label">{{ $t('settings.language') }}</label>
      <div class="language-buttons">
        <button
          v-for="lang in supportedLanguages"
          :key="lang.code"
          class="language-button"
          :class="{ active: currentLanguage === lang.code }"
          @click="setLanguage(lang.code)"
          :title="lang.nativeName"
        >
          <span class="language-flag">{{ lang.flag }}</span>
          <span class="language-name">{{ lang.nativeName }}</span>
        </button>
      </div>
    </div>

    <!-- 当前语言信息 -->
    <div class="current-language-info">
      <div class="info-item">
        <span class="info-label">{{ $t('common.language') }}:</span>
        <span class="info-value">{{ currentLanguageInfo.nativeName }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">{{ $t('common.region') }}:</span>
        <span class="info-value">{{ getLanguageRegion(currentLanguage) }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">{{ $t('common.direction') }}:</span>
        <span class="info-value">{{
          isRTL(currentLanguage) ? $t('common.rtl') : $t('common.ltr')
        }}</span>
      </div>
    </div>

    <!-- 语言预览 -->
    <div class="language-preview">
      <div class="preview-card">
        <div class="preview-header">
          <h4>{{ $t('help.preview') }}</h4>
        </div>
        <div class="preview-content">
          <div class="preview-text">
            <p>
              <strong>{{ $t('common.welcome') }}:</strong> {{ $t('tips.welcome') }}
            </p>
            <p>
              <em>{{ $t('common.note') }}:</em> {{ $t('tips.saveReminder') }}
            </p>
          </div>
          <div class="preview-buttons">
            <button class="preview-btn primary">{{ $t('common.save') }}</button>
            <button class="preview-btn secondary">{{ $t('common.cancel') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LANGUAGES, setLanguage } from '@/i18n'

// Vue i18n composable
const { locale } = useI18n()

// 计算属性
const currentLanguage = computed(() => locale.value)
const supportedLanguages = computed(() => SUPPORTED_LANGUAGES)
const _currentLanguageInfo = computed(() => {
  return (
    SUPPORTED_LANGUAGES.find((lang) => lang.code === currentLanguage.value) ||
    SUPPORTED_LANGUAGES[0]
  )
})

// 方法
const setLanguageHandler = (langCode) => {
  setLanguage(langCode)
  // 更新本地状态
  locale.value = langCode
}

const _getLanguageRegion = (langCode) => {
  const regions = {
    'zh-CN': '中国大陆',
    'zh-TW': '台灣',
    'en-US': 'United States',
    'ja-JP': '日本',
    'ko-KR': '대한민국',
  }
  return regions[langCode] || 'Unknown'
}

// 暴露方法供父组件使用
defineExpose({
  setLanguage: setLanguageHandler,
  getCurrentLanguage: () => currentLanguage.value,
  getSupportedLanguages: () => supportedLanguages.value,
})
</script>

<style scoped>
.language-switcher {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  max-width: 500px;
}

.selector-label {
  display: block;
  font-weight: 600;
  color: var(--primary-text);
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

/* 语言选择器 */
.language-selector {
  width: 100%;
}

.language-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.language-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--primary-bg);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  color: var(--primary-text);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: left;
}

.language-button:hover {
  border-color: var(--accent-color);
  background: var(--hover-bg);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-color);
}

.language-button.active {
  border-color: var(--accent-color);
  background: var(--accent-color);
  color: var(--primary-bg);
  box-shadow: 0 4px 12px var(--glow-color);
}

.language-flag {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.language-name {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 当前语言信息 */
.current-language-info {
  padding: 1rem;
  background: var(--primary-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.85rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: var(--secondary-text);
  font-weight: 500;
}

.info-value {
  color: var(--accent-color);
  font-weight: 600;
}

/* 语言预览 */
.language-preview {
  width: 100%;
}

.preview-card {
  background: var(--primary-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  padding: 0.75rem 1rem;
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
  margin: 0.75rem 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--primary-text);
}

.preview-text p:first-child {
  margin-top: 0;
}

.preview-text p:last-child {
  margin-bottom: 1rem;
}

.preview-text em {
  color: var(--secondary-text);
  font-style: italic;
}

.preview-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.preview-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: default;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.preview-btn.primary {
  background: var(--accent-color);
  color: var(--primary-bg);
  border-color: var(--accent-color);
}

.preview-btn.secondary {
  background: var(--secondary-bg);
  color: var(--primary-text);
  border-color: var(--border-color);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .language-switcher {
    padding: 0.75rem;
    gap: 1rem;
  }

  .language-buttons {
    grid-template-columns: 1fr;
  }

  .language-button {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .preview-content {
    padding: 0.75rem;
  }

  .preview-buttons {
    flex-direction: column;
  }
}

/* RTL 支持 */
[dir='rtl'] .language-button {
  text-align: right;
  flex-direction: row-reverse;
}

[dir='rtl'] .info-item {
  flex-direction: row-reverse;
}
</style>
