/**
 * Tool selector component for choosing drawing tools
 */
 
<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import type { ToolType } from '@/types'

const store = useCanvasStore()

const tools: Array<{
  type: ToolType
  label: string
}> = [
  { type: 'select', label: '选择工具' },
  { type: 'pan', label: '平移工具' },
  { type: 'rect', label: '矩形工具' },
  { type: 'circle', label: '圆形工具' },
  { type: 'line', label: '直线工具' },
  { type: 'arrow', label: '箭头工具' },
  { type: 'pen', label: '画笔工具' },
  { type: 'text', label: '文本工具' },
  { type: 'image', label: '图片工具' },
]

const currentTool = computed(() => store.currentTool)

function handleToolClick(toolType: ToolType) {
  store.setTool(toolType)
}
</script>

<template>
  <div
    class="toolbar-module flex items-center gap-2 px-3 py-2 shadow-lg backdrop-blur-md bg-white/70 border border-gray-200/50 rounded-full"
  >
    <template v-for="tool in tools" :key="tool.type">
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button
            :type="currentTool === tool.type ? 'primary' : undefined"
            :quaternary="currentTool !== tool.type"
            size="medium"
            circle
            @click="handleToolClick(tool.type)"
          >
            <template #icon>
              <i-lucide-mouse-pointer-2 v-if="tool.type === 'select'" class="text-xl" />
              <i-lucide-hand v-else-if="tool.type === 'pan'" class="text-xl" />
              <i-lucide-square v-else-if="tool.type === 'rect'" class="text-xl" />
              <i-lucide-circle v-else-if="tool.type === 'circle'" class="text-xl" />
              <i-lucide-minus v-else-if="tool.type === 'line'" class="text-xl" />
              <i-lucide-arrow-right v-else-if="tool.type === 'arrow'" class="text-xl" />
              <i-lucide-pen-tool v-else-if="tool.type === 'pen'" class="text-xl" />
              <i-lucide-type v-else-if="tool.type === 'text'" class="text-xl" />
              <i-lucide-image v-else-if="tool.type === 'image'" class="text-xl" />
            </template>
          </n-button>
        </template>
        {{ tool.label }}
      </n-tooltip>
      <n-divider v-if="tool.type === 'pan' || tool.type === 'pen'" vertical />
    </template>
  </div>
</template>
