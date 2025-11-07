<template>
  <div class="error-boundary">
    <div class="error-container">
      <div class="error-icon">
        <span>⚠️</span>
      </div>
      <div class="error-content">
        <h3>{{ $t('common.error') }}</h3>
        <p>{{ errorMessage }}</p>
        <div class="error-actions">
          <button @click="retry" class="button primary">
            {{ $t('common.retry') }}
          </button>
          <button @click="goHome" class="button">
            {{ $t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

// Props
const props = defineProps({
  error: {
    type: Error,
    default: null,
  },
});

// Composables
const { t } = useI18n();
const router = useRouter();

// Reactive
const capturedError = ref(props.error);
const errorMessage = ref('');

// Methods
const retry = () => {
  window.location.reload();
};

const goHome = () => {
  router.push('/');
};

// Error capture
onErrorCaptured((err) => {
  capturedError.value = err;
  errorMessage.value = err.message || t('common.unknownError');
  console.error('Route loading error:', err);
  return false; // Prevent error from propagating
});
</script>

<style scoped>
.error-boundary {
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

.error-container {
  max-width: 500px;
  width: 90%;
  background: var(--secondary-bg);
  border-radius: var(--spacing-lg);
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 30px var(--shadow-color);
  padding: var(--spacing-xl);
  text-align: center;
  animation: slideIn 0.3s ease-out;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-lg);
}

.error-content h3 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--error-color);
  font-size: var(--text-xl);
  font-weight: 600;
}

.error-content p {
  margin: 0 0 var(--spacing-xl) 0;
  color: var(--secondary-text);
  font-size: var(--text-base);
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
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

/* 移动端优化 */
@media (max-width: 768px) {
  .error-container {
    padding: var(--spacing-lg);
    margin: var(--spacing-md);
  }

  .error-icon {
    font-size: 2.5rem;
    margin-bottom: var(--spacing-md);
  }

  .error-content h3 {
    font-size: var(--text-lg);
  }

  .error-content p {
    font-size: var(--text-sm);
  }

  .error-actions {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .error-actions .button {
    width: 100%;
  }
}
</style>
