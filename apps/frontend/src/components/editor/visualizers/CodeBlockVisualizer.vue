<template>
  <div class="codeblock-visualizer">
    <div class="code-blocks-list">
      <div
        v-for="block in codeBlocks"
        :key="block.id"
        class="code-block-item"
        @click="handleCodeBlockSelect(block)"
      >
        <div class="block-header">
          <span class="language">{{ block.language }}</span>
          <span class="lines">{{ block.lines }} 行</span>
        </div>
        <pre class="code-preview"><code>{{ block.preview }}</code></pre>
        <button @click.stop="handleCodeBlockExecute(block)" class="execute-btn">
          ▶ 运行
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  content: string
  codeBlocks?: any[]
}

interface Emits {
  (e: 'code-block-select', block: any): void
  (e: 'code-block-execute', block: any): void
}

const props = withDefaults(defineProps<Props>(), {
  codeBlocks: () => [],
})

const emit = defineEmits<Emits>()

const handleCodeBlockSelect = (block: any) => {
  emit('code-block-select', block)
}

const handleCodeBlockExecute = (block: any) => {
  emit('code-block-execute', block)
}
</script>

<style scoped>
.codeblock-visualizer {
  height: 100%;
  padding: 16px;
  background: white;
  overflow-y: auto;
}

.code-blocks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.code-block-item {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.code-block-item:hover {
  border-color: #667eea;
}

.block-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f9fa;
  font-size: 12px;
  color: #666;
}

.code-preview {
  padding: 12px;
  margin: 0;
  background: #f6f8fa;
  font-size: 13px;
  line-height: 1.4;
  max-height: 100px;
  overflow: hidden;
}

.execute-btn {
  width: 100%;
  padding: 8px;
  border: none;
  background: #28a745;
  color: white;
  cursor: pointer;
  font-size: 12px;
}

.execute-btn:hover {
  background: #218838;
}
</style>
