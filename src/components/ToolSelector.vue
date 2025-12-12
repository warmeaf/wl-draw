/**
 * Tool selector component for choosing drawing tools
 */

<script setup lang="ts">
import { computed } from 'vue'
import { pluginRegistry } from '@/plugins/registry'
import { useCanvasStore } from '@/stores/canvas'
import type { ToolType } from '@/types'
import { isValidToolType } from '@/types'

const store = useCanvasStore()

const tools = computed(() => {
  const excludedTypes = ['export', 'zoomIn', 'zoomOut', 'redo', 'undo']
  return pluginRegistry
    .getAllPluginMetadata()
    .filter(
      (metadata) =>
        metadata.ui && !excludedTypes.includes(metadata.type) && isValidToolType(metadata.type)
    )
    .map((metadata) => {
      const ui = metadata.ui as NonNullable<typeof metadata.ui>
      const toolType = metadata.type
      if (!isValidToolType(toolType)) {
        throw new Error(`Invalid tool type: ${toolType}`)
      }
      return {
        type: toolType,
        label: ui.label,
        shortcut: metadata.shortcut,
        iconName: ui.iconComponent,
        dividerAfter: ui.dividerAfter,
      }
    })
})

const currentTool = computed(() => store.currentTool)

function handleToolClick(toolType: ToolType) {
  store.setTool(toolType)
}
</script>

<template>
  <div
    class="flex items-center gap-2 p-2 shadow-sm backdrop-blur-md bg-white/70 border border-gray-200/50 rounded-full"
  >
    <template v-for="tool in tools" :key="tool.type">
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button
            :type="currentTool === tool.type ? 'primary' : undefined"
            :quaternary="currentTool !== tool.type"
            size="small"
            circle
            @click="handleToolClick(tool.type)"
          >
            <template #icon>
              <IconRenderer :name="tool.iconName" :size="16" />
            </template>
          </n-button>
        </template>
        <template #default>
          <span>{{ tool.label }}</span>
          <span v-if="tool.shortcut" class="text-gray-400 text-xs ml-2">
            {{ tool.shortcut }}
          </span>
        </template>
      </n-tooltip>
      <n-divider v-if="tool.dividerAfter" vertical />
    </template>
  </div>
</template>
