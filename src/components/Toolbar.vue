/** * Top toolbar component for selecting drawing tools. * Displays available tools and highlights
the currently active tool. */
<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore, type ToolType } from '@/stores/canvas'

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
    class="toolbar bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 shadow-sm z-10"
  >
     <template v-for="tool in tools" :key="tool.type"
      > <n-tooltip trigger="hover"
        > <template #trigger
          > <n-button
            :type="currentTool === tool.type ? 'primary' : undefined"
            :quaternary="currentTool !== tool.type"
            size="medium"
            circle
            @click="handleToolClick(tool.type)"
            > <template #icon
              > <i-mdi-cursor-pointer v-if="tool.type === 'select'" class="text-xl" />
              <i-mdi-hand-back-right v-else-if="tool.type === 'pan'" class="text-xl" />
              <i-mdi-rectangle-outline v-else-if="tool.type === 'rect'" class="text-xl" />
              <i-mdi-circle-outline v-else-if="tool.type === 'circle'" class="text-xl" />
              <i-mdi-minus v-else-if="tool.type === 'line'" class="text-xl" /> <i-mdi-arrow-right
                v-else-if="tool.type === 'arrow'"
                class="text-xl"
              /> <i-mdi-pen v-else-if="tool.type === 'pen'" class="text-xl" />
              <i-mdi-format-letter-case v-else-if="tool.type === 'text'" class="text-xl" />
              <i-mdi-image v-else-if="tool.type === 'image'" class="text-xl" /> </template
            > </n-button
          > </template
        > {{ tool.label }} </n-tooltip
      > </template
    >
  </div>

</template>

