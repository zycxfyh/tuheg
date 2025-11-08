<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="demo-modal-overlay" @click="$emit('close')">
        <div class="demo-modal" @click.stop>
          <div class="demo-modal-header">
            <h2 class="demo-modal-title">🤖 多Agent协作演示</h2>
            <button class="demo-modal-close" @click="$emit('close')">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="demo-modal-body">
            <div class="demo-intro">
              <p class="demo-description">
                体验创世星环的强大多Agent协作能力。四个专用AI代理将协同工作，为您创建完整的互动叙事体验。
              </p>
            </div>

            <div class="demo-agents-grid">
              <div class="agent-card" v-for="agent in demoAgents" :key="agent.id">
                <div class="agent-avatar" :style="{ backgroundColor: agent.color }">
                  <span class="agent-icon">{{ agent.icon }}</span>
                </div>
                <div class="agent-info">
                  <h3 class="agent-name">{{ agent.name }}</h3>
                  <p class="agent-role">{{ agent.role }}</p>
                  <p class="agent-description">{{ agent.description }}</p>
                </div>
                <div class="agent-status" :class="agent.status">
                  <span class="status-dot"></span>
                  {{ agent.statusText }}
                </div>
              </div>
            </div>

            <div class="demo-process">
              <h3 class="process-title">协作流程演示</h3>
              <div class="process-steps">
                <div class="process-step" v-for="(step, index) in processSteps" :key="index" :class="{ active: currentStep >= index }">
                  <div class="step-number">{{ index + 1 }}</div>
                  <div class="step-content">
                    <h4 class="step-title">{{ step.title }}</h4>
                    <p class="step-description">{{ step.description }}</p>
                    <div class="step-agents">
                      <span v-for="agent in step.agents" :key="agent" class="step-agent-tag">
                        {{ agent }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="demo-benefits">
              <h3 class="benefits-title">为什么选择多Agent协作？</h3>
              <div class="benefits-grid">
                <div class="benefit-item">
                  <div class="benefit-icon">🎯</div>
                  <h4>专业分工</h4>
                  <p>每个Agent专注于特定领域，确保高质量输出</p>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">⚡</div>
                  <h4>并行处理</h4>
                  <p>多个Agent同时工作，大幅提升创作效率</p>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">🔄</div>
                  <h4>智能协作</h4>
                  <p>Agent间实时沟通，确保故事一致性和连贯性</p>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">🧠</div>
                  <h4>持续学习</h4>
                  <p>系统从每次协作中学习，不断优化创作质量</p>
                </div>
              </div>
            </div>
          </div>

          <div class="demo-modal-footer">
            <button class="btn-secondary" @click="$emit('close')">稍后体验</button>
            <button class="btn-primary" @click="handleStart">
              🚀 开始演示
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Props
const props = defineProps({
  visible: { type: Boolean, required: true }
})

// Emits
const emit = defineEmits(['close', 'start'])

// 演示Agent数据
const demoAgents = ref([
  {
    id: 'creation-agent',
    name: 'Creation Agent',
    role: '世界创建',
    description: '构建丰富多彩的游戏世界和场景',
    icon: '🌍',
    color: '#4CAF50',
    status: 'ready',
    statusText: '准备就绪'
  },
  {
    id: 'logic-agent',
    name: 'Logic Agent',
    role: '逻辑推理',
    description: '确保游戏规则的一致性和合理性',
    icon: '🧠',
    color: '#2196F3',
    status: 'ready',
    statusText: '准备就绪'
  },
  {
    id: 'narrative-agent',
    name: 'Narrative Agent',
    role: '叙事生成',
    description: '创造引人入胜的故事和对话',
    icon: '📚',
    color: '#FF9800',
    status: 'ready',
    statusText: '准备就绪'
  },
  {
    id: 'backend-gateway',
    name: 'Backend Gateway',
    role: '系统协调',
    description: '协调各Agent工作，确保系统稳定运行',
    icon: '⚙️',
    color: '#9C27B0',
    status: 'ready',
    statusText: '准备就绪'
  }
])

// 协作流程步骤
const processSteps = ref([
  {
    title: '世界构建',
    description: 'Creation Agent分析用户需求，构建游戏世界框架',
    agents: ['Creation Agent']
  },
  {
    title: '逻辑验证',
    description: 'Logic Agent检查世界设定的逻辑一致性',
    agents: ['Logic Agent']
  },
  {
    title: '故事创作',
    description: 'Narrative Agent基于世界设定创作引人入胜的故事',
    agents: ['Narrative Agent']
  },
  {
    title: '协作优化',
    description: '各Agent协作优化，确保最终结果的完美呈现',
    agents: ['所有Agent']
  }
])

const currentStep = ref(0)

// 动画演示
const animateSteps = () => {
  let step = 0
  const interval = setInterval(() => {
    currentStep.value = step
    step++
    if (step >= processSteps.value.length) {
      clearInterval(interval)
      setTimeout(() => {
        currentStep.value = 0
      }, 2000)
    }
  }, 2000)
}

// 开始演示
const handleStart = () => {
  animateSteps()
  emit('start')
}

// 组件挂载时开始动画
onMounted(() => {
  if (props.visible) {
    animateSteps()
  }
})
</script>

<style scoped>
.demo-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.demo-modal {
  background: var(--modal-bg, #1a1a1a);
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.demo-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid var(--border-color, #333);
}

.demo-modal-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary, #fff);
}

.demo-modal-close {
  background: none;
  border: none;
  color: var(--text-secondary, #ccc);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.demo-modal-close:hover {
  background: var(--hover-bg, #333);
  color: var(--text-primary, #fff);
}

.demo-modal-body {
  padding: 24px;
}

.demo-intro {
  text-align: center;
  margin-bottom: 32px;
}

.demo-description {
  font-size: 16px;
  color: var(--text-secondary, #ccc);
  line-height: 1.6;
  margin: 0;
}

.demo-agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.agent-card {
  background: var(--card-bg, #2a2a2a);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border-color, #333);
  transition: all 0.3s;
}

.agent-card:hover {
  border-color: var(--primary-color, #4CAF50);
  transform: translateY(-2px);
}

.agent-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-size: 24px;
}

.agent-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #fff);
}

.agent-info .agent-role {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--primary-color, #4CAF50);
  font-weight: 500;
}

.agent-info .agent-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: var(--text-secondary, #ccc);
  line-height: 1.4;
}

.agent-status {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.agent-status.ready {
  color: #4CAF50;
}

.agent-status.busy {
  color: #FF9800;
}

.agent-status.offline {
  color: #f44336;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  margin-right: 6px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.demo-process {
  margin-bottom: 40px;
}

.process-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary, #fff);
  margin-bottom: 24px;
  text-align: center;
}

.process-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.process-step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: var(--card-bg, #2a2a2a);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.process-step.active {
  border-color: var(--primary-color, #4CAF50);
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(42, 42, 42, 0.8));
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color, #4CAF50);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.process-step:not(.active) .step-number {
  background: var(--inactive-bg, #555);
}

.step-content {
  flex: 1;
}

.step-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #fff);
}

.step-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--text-secondary, #ccc);
  line-height: 1.4;
}

.step-agents {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.step-agent-tag {
  background: var(--tag-bg, #333);
  color: var(--tag-text, #ccc);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.demo-benefits {
  margin-bottom: 32px;
}

.benefits-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary, #fff);
  margin-bottom: 24px;
  text-align: center;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.benefit-item {
  text-align: center;
  padding: 20px;
  background: var(--card-bg, #2a2a2a);
  border-radius: 12px;
  border: 1px solid var(--border-color, #333);
}

.benefit-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.benefit-item h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #fff);
}

.benefit-item p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary, #ccc);
  line-height: 1.4;
}

.demo-modal-footer {
  display: flex;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid var(--border-color, #333);
  justify-content: flex-end;
}

.btn-secondary,
.btn-primary {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: var(--secondary-bg, #333);
  color: var(--text-secondary, #ccc);
}

.btn-secondary:hover {
  background: var(--secondary-hover, #444);
}

.btn-primary {
  background: var(--primary-color, #4CAF50);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover, #45a049);
  transform: translateY(-1px);
}

/* Modal animations */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .demo-modal {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }

  .demo-agents-grid {
    grid-template-columns: 1fr;
  }

  .benefits-grid {
    grid-template-columns: 1fr;
  }

  .process-step {
    flex-direction: column;
    text-align: center;
  }

  .demo-modal-footer {
    flex-direction: column;
  }

  .btn-secondary,
  .btn-primary {
    width: 100%;
  }
}
</style>
