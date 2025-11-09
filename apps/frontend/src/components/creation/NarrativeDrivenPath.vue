<!-- 文件路径: src/components/creation/NarrativeDrivenPath.vue -->
<script setup>
// 2. 定义可以向上传递的事件
const emit = defineEmits(['back', 'start-creation'])

// 3. 定义一个处理函数，它会简单地将从 CreationForm 组件收到的事件再次向上抛出
function _handleStartCreation(creationData) {
  emit('start-creation', creationData)
}
</script>

<template>
  <!-- 
    4. 这个组件现在变成了一个简单的“包装器”。
    它唯一的职责就是渲染 CreationForm 组件，并作为事件传递的“中继站”。
    当 CreationForm 发出 @start-creation 事件时，它会在这里被捕获，然后再次发出。
  -->
  <CreationForm @back="emit('back')" @start-creation="handleStartCreation" />
</template>
