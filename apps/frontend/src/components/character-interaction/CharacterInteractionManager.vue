<template>
  <div class="character-interaction-manager">
    <div class="interaction-header">
      <h2 class="interaction-title">角色交互管理</h2>
      <div class="interaction-actions">
        <button @click="addCharacter" class="btn btn-secondary">
          <span class="btn-icon">👤</span>
          添加角色
        </button>
        <button @click="generateInteractions" :disabled="characters.length < 2" class="btn btn-primary">
          <span class="btn-icon">🔄</span>
          生成交互
        </button>
      </div>
    </div>

    <!-- 角色列表 -->
    <div class="characters-section">
      <h3 class="section-title">角色列表</h3>
      <div class="characters-grid">
        <div
          v-for="(character, index) in characters"
          :key="character.id"
          class="character-card"
          :class="{ selected: selectedCharacter === character.id }"
          @click="selectCharacter(character.id)"
        >
          <div class="character-avatar">
            <span class="avatar-icon">{{ character.avatar || '👤' }}</span>
          </div>
          <div class="character-info">
            <h4 class="character-name">{{ character.name || `角色 ${index + 1}` }}</h4>
            <p class="character-role">{{ character.role || '未设定' }}</p>
            <div class="character-stats">
              <span class="stat-item">
                <span class="stat-label">关系数:</span>
                <span class="stat-value">{{ getCharacterRelationships(character.id).length }}</span>
              </span>
            </div>
          </div>
          <div class="character-actions">
            <button @click.stop="editCharacter(character)" class="action-btn edit-btn">
              ✏️
            </button>
            <button @click.stop="removeCharacter(character.id)" class="action-btn remove-btn">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 关系图谱 -->
    <div class="relationship-section">
      <h3 class="section-title">关系图谱</h3>
      <div class="relationship-canvas">
        <div class="canvas-container">
          <svg class="relationship-graph" viewBox="0 0 800 600">
            <!-- 关系连线 -->
            <g class="relationships">
              <line
                v-for="relationship in relationships"
                :key="`${relationship.from}-${relationship.to}`"
                :x1="getCharacterPosition(relationship.from).x"
                :y1="getCharacterPosition(relationship.from).y"
                :x2="getCharacterPosition(relationship.to).x"
                :y2="getCharacterPosition(relationship.to).y"
                :stroke="getRelationshipColor(relationship.type)"
                stroke-width="2"
                class="relationship-line"
              />
            </g>

            <!-- 角色节点 -->
            <g class="character-nodes">
              <g
                v-for="character in characters"
                :key="character.id"
                :transform="`translate(${getCharacterPosition(character.id).x}, ${getCharacterPosition(character.id).y})`"
                class="character-node"
                @click="selectCharacter(character.id)"
              >
                <circle
                  r="30"
                  :fill="getCharacterColor(character)"
                  :stroke="selectedCharacter === character.id ? '#667eea' : '#e2e8f0'"
                  stroke-width="3"
                  class="node-circle"
                />
                <text
                  text-anchor="middle"
                  dy="5"
                  class="node-label"
                  :class="{ selected: selectedCharacter === character.id }"
                >
                  {{ character.name || `角色 ${characters.indexOf(character) + 1}` }}
                </text>
              </g>
            </g>
          </svg>
        </div>

        <!-- 图例 -->
        <div class="graph-legend">
          <h4>关系类型</h4>
          <div class="legend-items">
            <div
              v-for="type in relationshipTypes"
              :key="type.value"
              class="legend-item"
            >
              <div class="legend-color" :style="{ backgroundColor: type.color }"></div>
              <span class="legend-label">{{ type.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 交互编辑器 -->
    <div v-if="selectedCharacter" class="interaction-editor">
      <h3 class="section-title">交互编辑</h3>

      <div class="editor-content">
        <div class="selected-character-info">
          <div class="character-summary">
            <div class="character-avatar-large">
              <span class="avatar-icon-large">{{ getSelectedCharacter()?.avatar || '👤' }}</span>
            </div>
            <div class="character-details">
              <h4>{{ getSelectedCharacter()?.name }}</h4>
              <p>{{ getSelectedCharacter()?.description }}</p>
            </div>
          </div>
        </div>

        <div class="relationships-list">
          <h4>与其他角色的关系</h4>
          <div class="relationship-items">
            <div
              v-for="relationship in getCharacterRelationships(selectedCharacter)"
              :key="relationship.id"
              class="relationship-item"
            >
              <div class="relationship-info">
                <div class="relationship-target">
                  <span class="target-avatar">{{ getCharacterById(relationship.to)?.avatar || '👤' }}</span>
                  <span class="target-name">{{ getCharacterById(relationship.to)?.name }}</span>
                </div>
                <div class="relationship-type">
                  <select
                    v-model="relationship.type"
                    @change="updateRelationship(relationship)"
                    class="type-select"
                  >
                    <option
                      v-for="type in relationshipTypes"
                      :key="type.value"
                      :value="type.value"
                    >
                      {{ type.label }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="relationship-description">
                <textarea
                  v-model="relationship.description"
                  @blur="updateRelationship(relationship)"
                  placeholder="描述这段关系..."
                  class="description-input"
                ></textarea>
              </div>
              <div class="relationship-actions">
                <button @click="removeRelationship(relationship.id)" class="remove-relationship-btn">
                  删除关系
                </button>
              </div>
            </div>

            <!-- 添加新关系 -->
            <div class="add-relationship">
              <select v-model="newRelationshipTarget" class="target-select">
                <option value="">选择要建立关系的角色</option>
                <option
                  v-for="character in getAvailableCharacters()"
                  :key="character.id"
                  :value="character.id"
                >
                  {{ character.name }}
                </option>
              </select>
              <button
                @click="addRelationship"
                :disabled="!newRelationshipTarget"
                class="add-relationship-btn"
              >
                添加关系
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI建议面板 -->
    <div class="ai-suggestions-panel">
      <h3 class="panel-title">
        <span class="ai-icon">🤖</span>
        AI交互建议
      </h3>
      <div class="suggestions-content">
        <div v-if="interactionSuggestions.length === 0" class="no-suggestions">
          添加更多角色和关系后，AI将提供交互建议
        </div>
        <div v-else class="suggestions-list">
          <div
            v-for="suggestion in interactionSuggestions"
            :key="suggestion.id"
            class="suggestion-card"
          >
            <div class="suggestion-header">
              <span class="suggestion-type">{{ suggestion.type }}</span>
              <span class="suggestion-confidence">{{ suggestion.confidence }}% 置信度</span>
            </div>
            <p class="suggestion-content">{{ suggestion.content }}</p>
            <div class="suggestion-actions">
              <button @click="applySuggestion(suggestion)" class="apply-btn">
                应用建议
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

// Emits
const emit = defineEmits(['update:modelValue'])

// 响应式数据
const characters = ref([])
const relationships = ref([])
const selectedCharacter = ref(null)
const newRelationshipTarget = ref('')
const interactionSuggestions = ref([])

// 关系类型配置
const relationshipTypes = ref([
  { value: 'ally', label: '盟友', color: '#48bb78' },
  { value: 'enemy', label: '敌人', color: '#e53e3e' },
  { value: 'family', label: '家人', color: '#667eea' },
  { value: 'mentor', label: '导师', color: '#d69e2e' },
  { value: 'rival', label: '对手', color: '#805ad5' },
  { value: 'love', label: '爱情', color: '#e91e63' },
  { value: 'friend', label: '朋友', color: '#00bcd4' },
  { value: 'neutral', label: '中立', color: '#9e9e9e' },
])

// 计算属性
const availableCharacters = computed(() => {
  return characters.value.filter((char) => char.id !== selectedCharacter.value)
})

// 方法
const addCharacter = () => {
  const newCharacter = {
    id: `char-${Date.now()}`,
    name: '',
    role: '',
    description: '',
    avatar: '👤',
    traits: [],
    position: { x: Math.random() * 600 + 100, y: Math.random() * 400 + 100 },
  }

  characters.value.push(newCharacter)
  emit('update:modelValue', characters.value)
}

const removeCharacter = (characterId) => {
  characters.value = characters.value.filter((char) => char.id !== characterId)
  relationships.value = relationships.value.filter(
    (rel) => rel.from !== characterId && rel.to !== characterId
  )
  if (selectedCharacter.value === characterId) {
    selectedCharacter.value = null
  }
  emit('update:modelValue', characters.value)
}

const selectCharacter = (characterId) => {
  selectedCharacter.value = characterId
}

const editCharacter = (character) => {
  // TODO: 打开角色编辑模态框
  console.log('Edit character:', character)
}

const getSelectedCharacter = () => {
  return characters.value.find((char) => char.id === selectedCharacter.value)
}

const getCharacterById = (id) => {
  return characters.value.find((char) => char.id === id)
}

const getCharacterPosition = (characterId) => {
  const character = characters.value.find((char) => char.id === characterId)
  return character?.position || { x: 0, y: 0 }
}

const getCharacterRelationships = (characterId) => {
  return relationships.value.filter((rel) => rel.from === characterId || rel.to === characterId)
}

const getAvailableCharacters = () => {
  return characters.value.filter((char) => {
    const existingRelationships = getCharacterRelationships(selectedCharacter.value)
    return (
      char.id !== selectedCharacter.value &&
      !existingRelationships.some((rel) => rel.to === char.id || rel.from === char.id)
    )
  })
}

const addRelationship = () => {
  if (!selectedCharacter.value || !newRelationshipTarget.value) return

  const newRelationship = {
    id: `rel-${Date.now()}`,
    from: selectedCharacter.value,
    to: newRelationshipTarget.value,
    type: 'neutral',
    description: '',
  }

  relationships.value.push(newRelationship)
  newRelationshipTarget.value = ''

  // 生成AI建议
  generateInteractionSuggestions()
}

const updateRelationship = (relationship) => {
  const index = relationships.value.findIndex((rel) => rel.id === relationship.id)
  if (index !== -1) {
    relationships.value[index] = relationship
  }
}

const removeRelationship = (relationshipId) => {
  relationships.value = relationships.value.filter((rel) => rel.id !== relationshipId)
}

const getRelationshipColor = (type) => {
  const typeObj = relationshipTypes.value.find((t) => t.value === type)
  return typeObj?.color || '#9e9e9e'
}

const getCharacterColor = (character) => {
  // 根据角色类型返回不同颜色
  if (character.role?.includes('主角')) return '#667eea'
  if (character.role?.includes('反派')) return '#e53e3e'
  if (character.role?.includes('导师')) return '#d69e2e'
  return '#48bb78'
}

const generateInteractions = () => {
  if (characters.value.length < 2) return

  // 模拟AI生成角色交互
  const suggestions = []

  // 生成潜在的盟友关系
  const protagonist = characters.value.find((c) => c.role?.includes('主角'))
  const potentialAllies = characters.value.filter(
    (c) => c.id !== protagonist?.id && !c.role?.includes('反派')
  )

  if (protagonist && potentialAllies.length > 0) {
    suggestions.push({
      type: '盟友关系',
      content: `${protagonist.name}可能与${potentialAllies[0].name}建立盟友关系`,
      confidence: 75,
    })
  }

  // 生成冲突关系
  const antagonist = characters.value.find((c) => c.role?.includes('反派'))
  if (protagonist && antagonist) {
    suggestions.push({
      type: '冲突关系',
      content: `${protagonist.name}与${antagonist.name}之间存在核心冲突`,
      confidence: 90,
    })
  }

  interactionSuggestions.value = suggestions.map((suggestion, index) => ({
    id: `suggestion-${index}`,
    ...suggestion,
  }))
}

const generateInteractionSuggestions = () => {
  // 基于当前关系生成更具体的建议
  const suggestions = []

  if (relationships.value.length > 0) {
    // 建议添加更多关系细节
    suggestions.push({
      id: 'detail-relationships',
      type: '关系细节',
      content: '考虑为现有关系添加更详细的背景故事和互动历史',
      confidence: 80,
    })

    // 建议创建关系网络
    const isolatedCharacters = characters.value.filter((char) => {
      const relationships = getCharacterRelationships(char.id)
      return relationships.length === 0
    })

    if (isolatedCharacters.length > 0) {
      suggestions.push({
        id: 'expand-network',
        type: '关系网络',
        content: `${isolatedCharacters[0].name}目前没有与其他角色建立关系，考虑将其融入故事网络`,
        confidence: 70,
      })
    }
  }

  interactionSuggestions.value = suggestions
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
      characters.value = newValue
    }
  },
  { deep: true }
)

// 监听内部数据变化
watch(
  characters,
  (newCharacters) => {
    emit('update:modelValue', newCharacters)
  },
  { deep: true }
)

// 初始化
onMounted(() => {
  if (props.modelValue && props.modelValue.length > 0) {
    characters.value = props.modelValue
  }
})
</script>

<style scoped>
.character-interaction-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.interaction-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.interaction-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.interaction-actions {
  display: flex;
  gap: 16px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #edf2f7;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a67d8;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 20px 0;
}

.characters-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.character-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.character-card:hover,
.character-card.selected {
  border-color: #667eea;
  background: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.character-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.avatar-icon {
  font-size: 24px;
}

.character-info {
  flex: 1;
}

.character-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.character-role {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #718096;
}

.character-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  font-size: 12px;
  color: #718096;
}

.stat-value {
  font-weight: 600;
  color: #1a202c;
}

.character-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.edit-btn {
  background: #ebf8ff;
  color: #3182ce;
}

.edit-btn:hover {
  background: #3182ce;
  color: white;
}

.remove-btn {
  background: #fed7d7;
  color: #e53e3e;
}

.remove-btn:hover {
  background: #e53e3e;
  color: white;
}

.relationship-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.relationship-canvas {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: start;
}

.canvas-container {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  overflow: hidden;
}

.relationship-graph {
  width: 100%;
  height: 400px;
}

.relationship-line {
  stroke-opacity: 0.6;
}

.node-circle {
  cursor: pointer;
  transition: all 0.2s;
}

.node-circle:hover {
  r: 35;
}

.node-label {
  font-size: 12px;
  fill: #1a202c;
  pointer-events: none;
  font-weight: 500;
}

.node-label.selected {
  fill: #667eea;
  font-weight: 600;
}

.graph-legend {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 200px;
}

.graph-legend h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.legend-label {
  font-size: 14px;
  color: #4a5568;
}

.interaction-editor {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.editor-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 32px;
}

.selected-character-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
}

.character-summary {
  display: flex;
  align-items: center;
  gap: 16px;
}

.character-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon-large {
  font-size: 28px;
}

.character-details h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

.character-details p {
  margin: 0;
  color: #4a5568;
  line-height: 1.5;
}

.relationships-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.relationships-list h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.relationship-item {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #667eea;
}

.relationship-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.relationship-target {
  display: flex;
  align-items: center;
  gap: 12px;
}

.target-avatar {
  font-size: 20px;
}

.target-name {
  font-weight: 500;
  color: #1a202c;
}

.type-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.description-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  min-height: 60px;
}

.relationship-actions {
  margin-top: 12px;
  text-align: right;
}

.remove-relationship-btn {
  padding: 6px 12px;
  background: #fed7d7;
  color: #e53e3e;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.remove-relationship-btn:hover {
  background: #e53e3e;
  color: white;
}

.add-relationship {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background: #f0fff4;
  border-radius: 8px;
  border: 2px dashed #48bb78;
}

.target-select,
.add-relationship-btn {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.add-relationship-btn {
  background: #48bb78;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.add-relationship-btn:hover:not(:disabled) {
  background: #38a169;
}

.add-relationship-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-suggestions-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-title {
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

.suggestions-content {
  min-height: 100px;
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

.suggestion-card {
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

.suggestion-confidence {
  font-size: 12px;
  color: #718096;
}

.suggestion-content {
  margin: 0 0 12px 0;
  color: #4a5568;
  line-height: 1.5;
}

.suggestion-actions {
  text-align: right;
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

/* Responsive design */
@media (max-width: 768px) {
  .interaction-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .interaction-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .characters-grid {
    grid-template-columns: 1fr;
  }

  .relationship-canvas {
    grid-template-columns: 1fr;
  }

  .editor-content {
    grid-template-columns: 1fr;
  }

  .relationship-info {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .add-relationship {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
