<template>
  <div class="world-basics-editor">
    <div class="editor-section">
      <h3 class="section-title">世界主题与基调</h3>

      <div class="form-grid">
        <div class="form-item">
          <label class="form-label">核心主题</label>
          <textarea
            v-model="basics.theme"
            placeholder="描述世界的核心主题或故事主线..."
            rows="3"
            class="form-textarea"
          ></textarea>
          <small class="form-help">例如：权力斗争、救赎之旅、科技进化等</small>
        </div>

        <div class="form-item">
          <label class="form-label">世界基调</label>
          <div class="tone-selector">
            <button
              v-for="tone in toneOptions"
              :key="tone.value"
              @click="basics.tone = tone.value"
              :class="['tone-button', { active: basics.tone === tone.value }]"
            >
              <span class="tone-icon">{{ tone.icon }}</span>
              <span class="tone-label">{{ tone.label }}</span>
            </button>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">世界规模</label>
          <select v-model="basics.scale" class="form-select">
            <option value="local">局部 (一个城镇)</option>
            <option value="regional">地区 (多个城镇)</option>
            <option value="continental">大陆 (整个大陆)</option>
            <option value="world">世界 (多个大陆)</option>
            <option value="universal">宇宙 (多个世界)</option>
          </select>
        </div>
      </div>
    </div>

    <div class="editor-section">
      <h3 class="section-title">主要角色设定</h3>

      <div class="character-section">
        <div class="character-group">
          <h4 class="group-title">
            <span class="group-icon">🦸</span>
            主人公
          </h4>
          <div class="character-list">
            <div
              v-for="(character, index) in basics.protagonists"
              :key="index"
              class="character-item"
            >
              <div class="character-header">
                <input
                  v-model="character.name"
                  placeholder="角色名称"
                  class="character-name-input"
                />
                <button @click="removeCharacter('protagonists', index)" class="remove-btn">
                  ✕
                </button>
              </div>
              <textarea
                v-model="character.description"
                placeholder="角色背景和性格描述..."
                class="character-description"
                rows="2"
              ></textarea>
            </div>
            <button @click="addCharacter('protagonists')" class="add-character-btn">
              <span class="add-icon">+</span>
              添加主人公
            </button>
          </div>
        </div>

        <div class="character-group">
          <h4 class="group-title">
            <span class="group-icon">🦹</span>
            反派角色
          </h4>
          <div class="character-list">
            <div
              v-for="(character, index) in basics.antagonists"
              :key="index"
              class="character-item"
            >
              <div class="character-header">
                <input
                  v-model="character.name"
                  placeholder="角色名称"
                  class="character-name-input"
                />
                <button @click="removeCharacter('antagonists', index)" class="remove-btn">
                  ✕
                </button>
              </div>
              <textarea
                v-model="character.description"
                placeholder="角色背景和动机描述..."
                class="character-description"
                rows="2"
              ></textarea>
            </div>
            <button @click="addCharacter('antagonists')" class="add-character-btn">
              <span class="add-icon">+</span>
              添加反派
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="editor-section">
      <h3 class="section-title">世界冲突设定</h3>

      <div class="conflict-builder">
        <div class="conflict-item">
          <label class="form-label">主要冲突类型</label>
          <select v-model="basics.primaryConflict" class="form-select">
            <option value="">选择冲突类型</option>
            <option value="person-vs-person">人与人</option>
            <option value="person-vs-society">人与社会</option>
            <option value="person-vs-nature">人与自然</option>
            <option value="person-vs-self">人与自我</option>
            <option value="person-vs-supernatural">人与超自然</option>
            <option value="person-vs-technology">人与科技</option>
          </select>
        </div>

        <div class="conflict-item">
          <label class="form-label">冲突强度</label>
          <div class="intensity-slider">
            <input
              type="range"
              min="1"
              max="10"
              v-model="basics.conflictIntensity"
              class="slider"
            />
            <div class="slider-labels">
              <span>温和</span>
              <span class="intensity-value">{{ basics.conflictIntensity }}/10</span>
              <span>激烈</span>
            </div>
          </div>
        </div>

        <div class="conflict-item">
          <label class="form-label">冲突描述</label>
          <textarea
            v-model="basics.conflictDescription"
            placeholder="详细描述世界的核心冲突..."
            rows="3"
            class="form-textarea"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- AI建议面板 -->
    <div class="ai-suggestions">
      <h3 class="suggestions-title">
        <span class="ai-icon">🤖</span>
        AI建议
      </h3>
      <div class="suggestions-content">
        <div v-if="suggestions.length === 0" class="no-suggestions">
          完成基础设定后，AI将提供世界构建建议
        </div>
        <div v-else class="suggestions-list">
          <div
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            class="suggestion-item"
          >
            <div class="suggestion-header">
              <span class="suggestion-type">{{ suggestion.type }}</span>
              <button @click="applySuggestion(suggestion)" class="apply-btn">
                应用
              </button>
            </div>
            <p class="suggestion-content">{{ suggestion.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      theme: '',
      tone: 'balanced',
      scale: 'regional',
      protagonists: [],
      antagonists: [],
      primaryConflict: '',
      conflictIntensity: 5,
      conflictDescription: '',
    }),
  },
})

// Emits
const emit = defineEmits(['update:modelValue'])

// 响应式数据
const basics = ref({
  theme: '',
  tone: 'balanced',
  scale: 'regional',
  protagonists: [],
  antagonists: [],
  primaryConflict: '',
  conflictIntensity: 5,
  conflictDescription: '',
})

const suggestions = ref([])

// 配置选项
const toneOptions = ref([
  { value: 'dark', label: '黑暗', icon: '🌑' },
  { value: 'grimdark', label: '极端黑暗', icon: '💀' },
  { value: 'serious', label: '严肃', icon: '⚖️' },
  { value: 'balanced', label: '平衡', icon: '⚖️' },
  { value: 'hopeful', label: '充满希望', icon: '🌅' },
  { value: 'whimsical', label: '奇幻轻快', icon: '🎪' },
  { value: 'satirical', label: '讽刺幽默', icon: '🎭' },
  { value: 'optimistic', label: '乐观向上', icon: '☀️' },
])

// 方法
const addCharacter = (type) => {
  const newCharacter = {
    name: '',
    description: '',
    traits: [],
    background: '',
  }

  if (type === 'protagonists') {
    basics.value.protagonists.push(newCharacter)
  } else {
    basics.value.antagonists.push(newCharacter)
  }
}

const removeCharacter = (type, index) => {
  if (type === 'protagonists') {
    basics.value.protagonists.splice(index, 1)
  } else {
    basics.value.antagonists.splice(index, 1)
  }
}

const generateAISuggestions = () => {
  // 模拟AI建议生成
  if (basics.value.theme && basics.value.tone && basics.value.scale) {
    suggestions.value = [
      {
        id: 'theme-expansion',
        type: '主题扩展',
        content: `基于"${basics.value.theme}"主题，建议添加${getThemeSuggestions()}元素来丰富世界观。`,
      },
      {
        id: 'tone-consistency',
        type: '基调一致性',
        content: `当前基调为${getToneLabel(basics.value.tone)}，建议在后续设定中保持这种${getToneConsistency()}氛围。`,
      },
      {
        id: 'scale-implications',
        type: '规模影响',
        content: `${getScaleLabel(basics.value.scale)}的世界规模意味着${getScaleImplications()}。`,
      },
    ]
  } else {
    suggestions.value = []
  }
}

const getThemeSuggestions = () => {
  const theme = basics.value.theme.toLowerCase()
  if (theme.includes('权力') || theme.includes('政治')) {
    return '政治阴谋、贵族斗争、革命运动'
  }
  if (theme.includes('魔法') || theme.includes('科技')) {
    return '神秘组织、技术垄断、知识追求'
  }
  if (theme.includes('救赎') || theme.includes('成长')) {
    return '导师角色、试炼关卡、自我反思'
  }
  return '独特的文化元素、特殊事件、核心矛盾'
}

const getToneLabel = (tone) => {
  const toneMap = {
    dark: '黑暗',
    grimdark: '极端黑暗',
    serious: '严肃',
    balanced: '平衡',
    hopeful: '充满希望',
    whimsical: '奇幻轻快',
    satirical: '讽刺幽默',
    optimistic: '乐观向上',
  }
  return toneMap[tone] || tone
}

const getToneConsistency = () => {
  const tone = basics.value.tone
  if (tone === 'dark' || tone === 'grimdark') {
    return '阴郁压抑'
  }
  if (tone === 'hopeful' || tone === 'optimistic') {
    return '积极向上'
  }
  if (tone === 'whimsical') {
    return '轻松愉悦'
  }
  return '整体一致'
}

const getScaleLabel = (scale) => {
  const scaleMap = {
    local: '局部',
    regional: '地区级',
    continental: '大陆级',
    world: '世界级',
    universal: '宇宙级',
  }
  return scaleMap[scale] || scale
}

const getScaleImplications = () => {
  const scale = basics.value.scale
  if (scale === 'local') {
    return '故事可以更聚焦于个人命运，世界背景相对简单'
  }
  if (scale === 'universal') {
    return '需要考虑多世界观设定，增加叙事复杂度'
  }
  return '故事范围适中，便于展开多条情节线'
}

const applySuggestion = (suggestion) => {
  // TODO: 实现建议应用逻辑
  console.log('Applying suggestion:', suggestion)
}

// 监听外部数据变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      basics.value = { ...basics.value, ...newValue }
    }
  },
  { deep: true }
)

// 监听内部数据变化
watch(
  basics,
  (newBasics) => {
    emit('update:modelValue', newBasics)
    generateAISuggestions()
  },
  { deep: true }
)

// 初始化
onMounted(() => {
  if (props.modelValue) {
    basics.value = { ...basics.value, ...props.modelValue }
  }
  generateAISuggestions()
})
</script>

<style scoped>
.world-basics-editor {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.editor-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
}

.form-textarea,
.form-select {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-help {
  font-size: 12px;
  color: #718096;
}

.tone-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.tone-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.tone-button:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.tone-button.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.character-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.character-group h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-icon {
  font-size: 18px;
}

.character-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.character-item {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.character-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.character-name-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.character-name-input:focus {
  outline: none;
  border-color: #667eea;
}

.remove-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #e53e3e;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: #c53030;
}

.character-description {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
}

.character-description:focus {
  outline: none;
  border-color: #667eea;
}

.add-character-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  background: white;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.add-character-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f8f9ff;
}

.add-icon {
  font-size: 18px;
  font-weight: bold;
}

.conflict-builder {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.conflict-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.intensity-slider {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e2e8f0;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: none;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #718096;
}

.intensity-value {
  font-weight: 600;
  color: #1a202c;
}

.ai-suggestions {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.suggestions-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-icon {
  font-size: 20px;
}

.no-suggestions {
  text-align: center;
  color: #718096;
  font-style: italic;
  padding: 40px 20px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suggestion-item {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #667eea;
}

.suggestion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.suggestion-type {
  font-size: 12px;
  font-weight: 500;
  color: #667eea;
  background: #f8f9ff;
  padding: 4px 8px;
  border-radius: 12px;
}

.apply-btn {
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.apply-btn:hover {
  background: #5a67d8;
}

.suggestion-content {
  margin: 0;
  color: #4a5568;
  line-height: 1.5;
}

/* Responsive design */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .character-section {
    grid-template-columns: 1fr;
  }

  .conflict-builder {
    grid-template-columns: 1fr;
  }

  .tone-selector {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
