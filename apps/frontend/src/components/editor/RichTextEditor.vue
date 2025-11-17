<template>
  <div class="rich-text-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar" v-if="showToolbar">
      <div class="toolbar-group">
        <!-- 撤销/重做 -->
        <button
          @click="editor?.chain().focus().undo().run()"
          :class="{ active: false }"
          title="撤销"
        >
          ↶
        </button>
        <button
          @click="editor?.chain().focus().redo().run()"
          :class="{ active: false }"
          title="重做"
        >
          ↷
        </button>
      </div>

      <div class="toolbar-group">
        <!-- 格式化 -->
        <button
          @click="editor?.chain().focus().toggleBold().run()"
          :class="{ active: editor?.isActive('bold') }"
          title="加粗"
        >
          <strong>B</strong>
        </button>
        <button
          @click="editor?.chain().focus().toggleItalic().run()"
          :class="{ active: editor?.isActive('italic') }"
          title="斜体"
        >
          <em>I</em>
        </button>
        <button
          @click="editor?.chain().focus().toggleUnderline().run()"
          :class="{ active: editor?.isActive('underline') }"
          title="下划线"
        >
          <u>U</u>
        </button>
        <button
          @click="editor?.chain().focus().toggleStrike().run()"
          :class="{ active: editor?.isActive('strike') }"
          title="删除线"
        >
          <s>S</s>
        </button>
      </div>

      <div class="toolbar-group">
        <!-- 标题 -->
        <select
          @change="setHeading($event)"
          :value="getCurrentHeading()"
        >
          <option value="p">正文</option>
          <option value="h1">标题 1</option>
          <option value="h2">标题 2</option>
          <option value="h3">标题 3</option>
          <option value="h4">标题 4</option>
          <option value="h5">标题 5</option>
          <option value="h6">标题 6</option>
        </select>
      </div>

      <div class="toolbar-group">
        <!-- 列表 -->
        <button
          @click="editor?.chain().focus().toggleBulletList().run()"
          :class="{ active: editor?.isActive('bulletList') }"
          title="无序列表"
        >
          •
        </button>
        <button
          @click="editor?.chain().focus().toggleOrderedList().run()"
          :class="{ active: editor?.isActive('orderedList') }"
          title="有序列表"
        >
          1.
        </button>
        <button
          @click="editor?.chain().focus().toggleTaskList().run()"
          :class="{ active: editor?.isActive('taskList') }"
          title="任务列表"
        >
          ☑
        </button>
      </div>

      <div class="toolbar-group">
        <!-- 对齐 -->
        <button
          @click="editor?.chain().focus().setTextAlign('left').run()"
          :class="{ active: editor?.isActive({ textAlign: 'left' }) }"
          title="左对齐"
        >
          ⬅
        </button>
        <button
          @click="editor?.chain().focus().setTextAlign('center').run()"
          :class="{ active: editor?.isActive({ textAlign: 'center' }) }"
          title="居中对齐"
        >
          ⬌
        </button>
        <button
          @click="editor?.chain().focus().setTextAlign('right').run()"
          :class="{ active: editor?.isActive({ textAlign: 'right' }) }"
          title="右对齐"
        >
          ➡
        </button>
      </div>

      <div class="toolbar-group">
        <!-- 颜色 -->
        <input
          type="color"
          @input="setTextColor($event)"
          :value="getCurrentTextColor()"
          title="文字颜色"
        />
        <input
          type="color"
          @input="setHighlightColor($event)"
          :value="getCurrentHighlightColor()"
          title="高亮颜色"
        />
      </div>

      <div class="toolbar-group">
        <!-- 链接和图片 -->
        <button
          @click="addLink"
          :class="{ active: editor?.isActive('link') }"
          title="添加链接"
        >
          🔗
        </button>
        <button
          @click="addImage"
          title="插入图片"
        >
          🖼
        </button>
        <button
          @click="addTable"
          title="插入表格"
        >
          📊
        </button>
      </div>

      <div class="toolbar-group">
        <!-- AI 建议 -->
        <button
          @click="requestAISuggestion"
          :disabled="isAIRequesting"
          title="AI 建议"
          class="ai-suggest-btn"
        >
          🤖 {{ isAIRequesting ? '思考中...' : 'AI 建议' }}
        </button>
      </div>
    </div>

    <!-- 编辑器内容区域 -->
    <div class="editor-content">
      <EditorContent
        :editor="editor"
        class="editor-instance"
        @keydown="handleKeydown"
      />
    </div>

    <!-- 状态栏 -->
    <div class="editor-status" v-if="showStatus">
      <div class="status-item">
        <span>字符数: {{ characterCount }}</span>
      </div>
      <div class="status-item">
        <span>字数: {{ wordCount }}</span>
      </div>
      <div class="status-item" v-if="isCollaborating">
        <span>👥 协作中 ({{ collaboratorCount }}人)</span>
      </div>
      <div class="status-item">
        <span>{{ isOnline ? '🟢' : '🔴' }} {{ isOnline ? '已连接' : '离线' }}</span>
      </div>
    </div>

    <!-- AI 建议面板 -->
    <div v-if="aiSuggestions.length > 0" class="ai-suggestions-panel">
      <div class="suggestions-header">
        <h4>🤖 AI 建议</h4>
        <button @click="clearAISuggestions" class="close-btn">✕</button>
      </div>
      <div class="suggestions-list">
        <div
          v-for="(suggestion, index) in aiSuggestions"
          :key="index"
          class="suggestion-item"
          @click="applyAISuggestion(suggestion)"
        >
          <div class="suggestion-content">
            {{ suggestion.text }}
          </div>
          <div class="suggestion-meta">
            <span class="confidence">{{ Math.round(suggestion.confidence * 100) }}% 置信度</span>
            <span class="type">{{ suggestion.type }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 链接对话框 -->
    <div v-if="showLinkDialog" class="link-dialog-overlay" @click="closeLinkDialog">
      <div class="link-dialog" @click.stop>
        <h4>添加链接</h4>
        <input
          v-model="linkUrl"
          type="url"
          placeholder="https://example.com"
          ref="linkInput"
        />
        <div class="dialog-buttons">
          <button @click="closeLinkDialog">取消</button>
          <button @click="confirmLink" :disabled="!linkUrl">确定</button>
        </div>
      </div>
    </div>

    <!-- 图片对话框 -->
    <div v-if="showImageDialog" class="image-dialog-overlay" @click="closeImageDialog">
      <div class="image-dialog" @click.stop>
        <h4>插入图片</h4>
        <div class="image-input-options">
          <div class="option">
            <label>图片 URL:</label>
            <input
              v-model="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div class="option">
            <label>上传图片:</label>
            <input
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              ref="imageFileInput"
            />
          </div>
        </div>
        <div class="dialog-buttons">
          <button @click="closeImageDialog">取消</button>
          <button @click="confirmImage" :disabled="!imageUrl && !imageFile">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import axios from 'axios'
import { useToast } from '@/composables/useToast'

interface Props {
  modelValue: string
  placeholder?: string
  showToolbar?: boolean
  showStatus?: boolean
  readonly?: boolean
  collaborationEnabled?: boolean
  aiEnabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'ai-suggestion-applied', suggestion: any): void
  (e: 'collaboration-event', event: any): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '开始写作...',
  showToolbar: true,
  showStatus: true,
  readonly: false,
  collaborationEnabled: false,
  aiEnabled: true,
})

const emit = defineEmits<Emits>()

const { show: showToast } = useToast()

// 编辑器状态
const editor = useEditor({
  content: props.modelValue,
  editable: !props.readonly,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    CharacterCount,
    Highlight.configure({
      multicolor: true,
    }),
    TextStyle,
    Color,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Underline,
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
  ],
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', html)
    emit('change', html)
  },
  onSelectionUpdate: ({ editor }) => {
    // 处理选择更新
  },
})

// UI 状态
const showLinkDialog = ref(false)
const showImageDialog = ref(false)
const linkUrl = ref('')
const imageUrl = ref('')
const imageFile = ref<File | null>(null)

// AI 相关状态
const aiSuggestions = ref<any[]>([])
const isAIRequesting = ref(false)

// 协作状态
const isCollaborating = ref(false)
const collaboratorCount = ref(0)
const isOnline = ref(true)

// 计算属性
const characterCount = computed(() => editor.value?.storage.characterCount.characters() || 0)
const wordCount = computed(() => {
  const text = editor.value?.getText() || ''
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
})

// 工具栏方法
const setHeading = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const level = target.value

  if (level === 'p') {
    editor.value?.chain().focus().setParagraph().run()
  } else {
    editor.value?.chain().focus().toggleHeading({ level: parseInt(level.replace('h', '')) as any }).run()
  }
}

const getCurrentHeading = () => {
  if (editor.value?.isActive('heading', { level: 1 })) return 'h1'
  if (editor.value?.isActive('heading', { level: 2 })) return 'h2'
  if (editor.value?.isActive('heading', { level: 3 })) return 'h3'
  if (editor.value?.isActive('heading', { level: 4 })) return 'h4'
  if (editor.value?.isActive('heading', { level: 5 })) return 'h5'
  if (editor.value?.isActive('heading', { level: 6 })) return 'h6'
  return 'p'
}

const setTextColor = (event: Event) => {
  const target = event.target as HTMLInputElement
  editor.value?.chain().focus().setColor(target.value).run()
}

const getCurrentTextColor = () => {
  return editor.value?.getAttributes('textStyle').color || '#000000'
}

const setHighlightColor = (event: Event) => {
  const target = event.target as HTMLInputElement
  editor.value?.chain().focus().toggleHighlight({ color: target.value }).run()
}

const getCurrentHighlightColor = () => {
  return editor.value?.getAttributes('highlight').color || '#ffff00'
}

const addLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href
  linkUrl.value = previousUrl || ''
  showLinkDialog.value = true

  nextTick(() => {
    const linkInput = document.querySelector('.link-dialog input') as HTMLInputElement
    linkInput?.focus()
  })
}

const confirmLink = () => {
  if (linkUrl.value) {
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.value }).run()
  } else {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
  }
  closeLinkDialog()
}

const closeLinkDialog = () => {
  showLinkDialog.value = false
  linkUrl.value = ''
}

const addImage = () => {
  showImageDialog.value = true
  imageUrl.value = ''
  imageFile.value = null
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    imageFile.value = file
    // 这里可以添加图片上传逻辑
  }
}

const confirmImage = () => {
  if (imageUrl.value) {
    editor.value?.chain().focus().setImage({ src: imageUrl.value }).run()
  } else if (imageFile.value) {
    // 处理文件上传
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      editor.value?.chain().focus().setImage({ src: result }).run()
    }
    reader.readAsDataURL(imageFile.value)
  }
  closeImageDialog()
}

const closeImageDialog = () => {
  showImageDialog.value = false
  imageUrl.value = ''
  imageFile.value = null
}

const addTable = () => {
  editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

// AI 建议方法
const requestAISuggestion = async () => {
  if (!props.aiEnabled || isAIRequesting.value) return

  isAIRequesting.value = true
  const currentText = editor.value?.getText() || ''

  try {
    const response = await axios.post('/api/advanced-ai/reasoning/perform', {
      input: currentText,
      options: {
        reasoningTypes: ['analogical', 'causal'],
        strategy: 'heuristic',
        context: {
          domain: 'creative_writing',
          goal: 'improve_content',
        },
        constraints: ['keep_original_meaning', 'enhance_engagement'],
      },
    })

    const suggestions = [
      {
        text: response.data.result || 'AI建议的内容',
        confidence: 0.85,
        type: '内容改进',
      },
      {
        text: '考虑添加更多具体细节来丰富描述',
        confidence: 0.75,
        type: '结构建议',
      },
      {
        text: '这个段落可以更生动一些',
        confidence: 0.7,
        type: '风格建议',
      },
    ]

    aiSuggestions.value = suggestions
  } catch (error) {
    console.error('AI suggestion failed:', error)
    showToast('AI建议获取失败', 'error')
  } finally {
    isAIRequesting.value = false
  }
}

const applyAISuggestion = (suggestion: any) => {
  // 这里可以实现将建议应用到编辑器的逻辑
  showToast(`应用AI建议: ${suggestion.text}`, 'success')
  emit('ai-suggestion-applied', suggestion)
}

const clearAISuggestions = () => {
  aiSuggestions.value = []
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl/Cmd + S 保存
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    emit('change', editor.value?.getHTML() || '')
  }

  // Ctrl/Cmd + K 快速链接
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    addLink()
  }

  // Ctrl/Cmd + I 快速图片
  if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
    event.preventDefault()
    addImage()
  }
}

// 生命周期
onMounted(() => {
  // 初始化协作监听（如果启用）
  if (props.collaborationEnabled) {
    // 这里可以添加协作功能初始化
  }
})

onUnmounted(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.rich-text-editor {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: white;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
}

.toolbar-group {
  display: flex;
  gap: 2px;
  align-items: center;
  margin-right: 12px;
}

.toolbar-group button,
.toolbar-group select,
.toolbar-group input {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-group button:hover {
  background: #e9ecef;
}

.toolbar-group button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.toolbar-group select {
  padding: 4px 6px;
  min-width: 80px;
}

.toolbar-group input[type="color"] {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  cursor: pointer;
}

.ai-suggest-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-weight: 500;
}

.ai-suggest-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.editor-content {
  flex: 1;
  min-height: 300px;
}

.editor-instance {
  padding: 16px;
  min-height: 300px;
  outline: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
}

.editor-instance :deep(.ProseMirror) {
  outline: none;
  min-height: 300px;
}

.editor-instance :deep(.ProseMirror p) {
  margin: 0 0 1em 0;
}

.editor-instance :deep(.ProseMirror h1),
.editor-instance :deep(.ProseMirror h2),
.editor-instance :deep(.ProseMirror h3),
.editor-instance :deep(.ProseMirror h4),
.editor-instance :deep(.ProseMirror h5),
.editor-instance :deep(.ProseMirror h6) {
  margin: 1.5em 0 0.5em 0;
  font-weight: 600;
  line-height: 1.3;
}

.editor-instance :deep(.ProseMirror h1) { font-size: 2em; }
.editor-instance :deep(.ProseMirror h2) { font-size: 1.75em; }
.editor-instance :deep(.ProseMirror h3) { font-size: 1.5em; }
.editor-instance :deep(.ProseMirror h4) { font-size: 1.25em; }
.editor-instance :deep(.ProseMirror h5) { font-size: 1.1em; }
.editor-instance :deep(.ProseMirror h6) { font-size: 1em; }

.editor-instance :deep(.ProseMirror ul),
.editor-instance :deep(.ProseMirror ol) {
  padding-left: 2em;
  margin: 1em 0;
}

.editor-instance :deep(.ProseMirror blockquote) {
  border-left: 4px solid #e1e5e9;
  padding-left: 1em;
  margin: 1em 0;
  color: #666;
  font-style: italic;
}

.editor-instance :deep(.ProseMirror code) {
  background: #f1f3f4;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9em;
}

.editor-instance :deep(.ProseMirror pre) {
  background: #f1f3f4;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
}

.editor-instance :deep(.ProseMirror table) {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
}

.editor-instance :deep(.ProseMirror table td),
.editor-instance :deep(.ProseMirror table th) {
  border: 1px solid #e1e5e9;
  padding: 8px 12px;
}

.editor-instance :deep(.ProseMirror table th) {
  background: #f8f9fa;
  font-weight: 600;
}

.editor-instance :deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1em 0;
}

.editor-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid #e1e5e9;
  background: #f8f9fa;
  font-size: 12px;
  color: #666;
}

.status-item {
  margin-right: 16px;
}

.ai-suggestions-panel {
  position: absolute;
  top: 100%;
  right: 0;
  width: 300px;
  max-height: 400px;
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
}

.suggestions-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
}

.suggestions-list {
  max-height: 350px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background: #f8f9fa;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-content {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.suggestion-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.confidence {
  color: #28a745;
  font-weight: 500;
}

/* 对话框样式 */
.link-dialog-overlay,
.image-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.link-dialog,
.image-dialog {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 400px;
  max-width: 90vw;
}

.link-dialog h4,
.image-dialog h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
}

.link-dialog input,
.image-dialog input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 16px;
}

.image-input-options {
  margin-bottom: 16px;
}

.image-input-options .option {
  margin-bottom: 12px;
}

.image-input-options label {
  display: block;
  font-weight: 500;
  margin-bottom: 4px;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dialog-buttons button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.dialog-buttons button:last-child {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.dialog-buttons button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-toolbar {
    padding: 6px 8px;
  }

  .toolbar-group {
    margin-right: 8px;
  }

  .editor-instance {
    padding: 12px;
  }

  .editor-status {
    padding: 6px 8px;
    font-size: 11px;
  }

  .link-dialog,
  .image-dialog {
    width: 90vw;
    margin: 20px;
  }

  .ai-suggestions-panel {
    width: 280px;
    right: -10px;
  }
}
</style>
