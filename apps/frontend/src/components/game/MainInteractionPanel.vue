<!-- 文件路径: src/components/game/MainInteractionPanel.vue (UI优化版) -->
<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/game.store'

const gameStore = useGameStore()

// [新增] 进度指示器状态
const processingProgress = ref(0)
const processingStep = ref('正在分析你的行动...')
const currentTip = ref('AI正在理解你的指令，请稍候')

// [新增] 处理步骤和提示
const processingSteps = [
  { step: '正在分析你的行动...', tip: 'AI正在理解你的指令，请稍候', progress: 20 },
  { step: '正在推理游戏逻辑...', tip: 'AI正在计算行动后果', progress: 40 },
  { step: '正在生成叙事内容...', tip: 'AI正在为你编写故事', progress: 60 },
  { step: '正在整理最终结果...', tip: 'AI正在完善回应内容', progress: 80 },
  { step: '即将完成...', tip: 'AI正在最后润色', progress: 95 },
]

const tips = [
  'AI正在理解你的指令，请稍候',
  'AI正在计算行动后果',
  'AI正在为你编写故事',
  'AI正在完善回应内容',
  'AI正在最后润色',
  '复杂的决策需要更多时间思考',
  'AI正在确保故事的一致性',
  '正在检查游戏规则的合理性',
]

// [新增] 进度更新定时器
let progressTimer = null

function startProgressAnimation() {
  let currentIndex = 0
  processingProgress.value = 0
  processingStep.value = processingSteps[0].step
  currentTip.value = processingSteps[0].tip

  progressTimer = setInterval(() => {
    if (!gameStore.isAiThinking) {
      clearInterval(progressTimer)
      progressTimer = null
      processingProgress.value = 100
      processingStep.value = '处理完成！'
      currentTip.value = '你的行动已成功执行'
      return
    }

    currentIndex = (currentIndex + 1) % processingSteps.length
    const step = processingSteps[currentIndex]
    processingProgress.value = step.progress
    processingStep.value = step.step
    currentTip.value = step.tip
  }, 2000) // 每2秒更新一次步骤
}

function stopProgressAnimation() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
  processingProgress.value = 0
  processingStep.value = '准备就绪'
  currentTip.value = 'AI已准备好处理你的下一个行动'
}

// [新增] 监听AI思考状态变化
watch(
  () => gameStore.isAiThinking,
  (isThinking) => {
    if (isThinking) {
      startProgressAnimation()
    } else {
      stopProgressAnimation()
    }
  }
)

// [新增] 组件卸载时清理定时器
onUnmounted(() => {
  stopProgressAnimation()
})

function submitCommand() {
  const commandText = gameStore.commandInputValue.trim()
  if (commandText && gameStore.currentGame) {
    // [新增] 立即显示操作确认反馈
    gameStore.addNarrativeEntry(`🎯 执行行动: "${commandText}"`, true)
    gameStore.submitAction(gameStore.currentGame.id, 'command', commandText)
    gameStore.commandInputValue = ''
  }
}

function handleOptionClick(option) {
  if (gameStore.currentGame) {
    // [新增] 立即显示操作确认反馈
    gameStore.addNarrativeEntry(`🎯 选择选项: ${option.text}`, true)
    gameStore.submitAction(gameStore.currentGame.id, 'option', option)
  }
}
</script>

<template>
  <div class="main-interaction-panel game-panel">
    <div id="narrative-window">
      <p
        v-for="(entry, index) in gameStore.narrativeLog"
        :key="index"
        :style="{
          fontStyle: entry.isMeta ? 'italic' : 'normal',
          color: entry.isMeta ? '#aaa' : 'var(--primary-text)',
        }"
      >
        {{ entry.text }}
      </p>
    </div>

    <!-- [核心优化] 当 isAiThinking 为 true 时，禁用所有选项 -->
    <div id="options-container">
      <button
        v-for="option in gameStore.currentGame?.options"
        :key="option.text"
        class="option-button"
        @click="handleOptionClick(option)"
        :disabled="gameStore.isAiThinking"
      >
        <div class="option-header">{{ option.dimension }}</div>
        <div class="option-details">{{ option.text }} ({{ option.success_rate }})</div>
      </button>
    </div>

    <!-- [核心优化] 当 isAiThinking 为 true 时，禁用输入框和提交按钮 -->
    <div id="command-input-container">
      <input
        type="text"
        id="command-input"
        placeholder="输入你的自定义行动..."
        v-model="gameStore.commandInputValue"
        @keyup.enter="submitCommand"
        :disabled="gameStore.isAiThinking"
      />
      <button
        id="command-submit"
        class="button primary"
        @click="submitCommand"
        :disabled="gameStore.isAiThinking"
      >
        <span v-if="gameStore.isAiThinking" class="loading-indicator">
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          思考中...
        </span>
        <span v-else>执行</span>
      </button>
    </div>

    <!-- [新增] AI处理进度指示器 -->
    <div v-if="gameStore.isAiThinking" class="ai-processing-indicator">
      <div class="processing-header">
        <div class="processing-icon">🤖</div>
        <div class="processing-text">AI正在处理你的行动</div>
      </div>
      <div class="processing-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: processingProgress + '%' }"></div>
        </div>
        <div class="progress-text">{{ processingStep }}</div>
      </div>
      <div class="processing-tips">
        <div class="tip-icon">💡</div>
        <div class="tip-text">{{ currentTip }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* [新增] AI处理进度指示器样式 */
.ai-processing-indicator {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
  border-radius: 0.75rem;
  border: 1px solid rgba(59, 130, 246, 0.2);
  animation: pulse 2s infinite;
}

.processing-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.processing-icon {
  font-size: 1.25rem;
  animation: bounce 1s infinite;
}

.processing-text {
  font-weight: 600;
  color: var(--primary-text);
}

.processing-progress {
  margin-bottom: 0.75rem;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 0.25rem;
  transition: width 0.5s ease;
  animation: shimmer 2s infinite;
}

.progress-text {
  font-size: 0.875rem;
  color: var(--secondary-text);
  text-align: center;
}

.processing-tips {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.tip-icon {
  font-size: 1rem;
}

.tip-text {
  font-size: 0.875rem;
  color: var(--secondary-text);
}

/* [新增] 加载指示器样式 */
.loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.loading-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  animation: loading-dots 1.4s infinite ease-in-out;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}
.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

/* 动画定义 */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-4px);
  }
  60% {
    transform: translateY(-2px);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes loading-dots {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
