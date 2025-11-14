/**
 * Tool selector component for choosing drawing tools
 */

<script setup lang="ts">
import { computed } from 'vue'
import { pluginRegistry } from '@/plugins/registry'
import { useCanvasStore } from '@/stores/canvas'
import type { ToolType } from '@/types'

const store = useCanvasStore()

const tools = computed(() => {
  return pluginRegistry
    .getAll()
    .filter((plugin) => plugin.ui && plugin.type !== 'export')
    .map((plugin) => {
      const ui = plugin.ui as NonNullable<typeof plugin.ui>
      return {
        type: plugin.type as ToolType,
        label: ui.label,
        shortcut: plugin.shortcut,
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
            size="medium"
            circle
            @click="handleToolClick(tool.type)"
          >
            <template #icon>
              <IconRenderer :name="tool.iconName" class="text-xl" />
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
