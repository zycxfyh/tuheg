<template>
  <div class="page-loader">
    <div class="loader-container">
      <div class="loader-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <div class="loader-text">
        <h3>{{ $t('common.loading') }}</h3>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Props
const props = defineProps({
  message: {
    type: String,
    default: '',
  },
})

// Composables
const { t } = useI18n()

// Computed
const _loadingMessage = computed(() => {
  if (props.message) return props.message
  return t('game.processingAction')
})
</script>

<style scoped>
.page-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-out;
}

.loader-container {
  text-align: center;
  color: var(--accent-color);
  padding: var(--spacing-xl);
  background: var(--secondary-bg);
  border-radius: var(--spacing-lg);
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 30px var(--shadow-color);
  animation: slideIn 0.3s ease-out;
}

.loader-spinner {
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto var(--spacing-lg);
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.spinner-ring:nth-child(2) {
  animation-delay: 0.2s;
  border-top-color: var(--accent-light);
}

.spinner-ring:nth-child(3) {
  animation-delay: 0.4s;
  border-top-color: var(--accent-hover);
}

.loader-text h3 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--text-lg);
  color: var(--primary-text);
  font-weight: 600;
}

.loader-text p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--secondary-text);
  opacity: 0.8;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .loader-container {
    padding: var(--spacing-lg);
    margin: var(--spacing-md);
    max-width: 90vw;
  }

  .loader-spinner {
    width: 50px;
    height: 50px;
    margin-bottom: var(--spacing-md);
  }

  .loader-text h3 {
    font-size: var(--text-base);
  }

  .loader-text p {
    font-size: var(--text-xs);
  }
}
</style>
