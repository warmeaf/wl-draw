<script setup lang="ts">
import { computed, inject } from 'vue'
import { useElementPopover } from '@/composables/state/useElementPopover'
import { canvasConfig } from '@/config/canvas'
import { useZoomTool } from '@/plugins/composables/useZoomTool'
import { pluginRegistry } from '@/plugins/registry'
import { useCanvasStore } from '@/stores/canvas'

const elementPopover = inject<ReturnType<typeof useElementPopover>>(
  'elementPopover',
  useElementPopover()
)

const store = useCanvasStore()
const { zoomIn, zoomOut, resetZoom } = useZoomTool(elementPopover)

const zoomPercent = computed(() => Math.round(store.zoom * 100))

const zoomOutPlugin = computed(() => {
  const plugin = pluginRegistry.getByType('zoomOut')
  if (!plugin?.ui) return null
  return {
    type: plugin.type,
    label: plugin.ui.label,
    shortcut: plugin.shortcut,
    iconName: plugin.ui.iconComponent,
  }
})

const zoomInPlugin = computed(() => {
  const plugin = pluginRegistry.getByType('zoomIn')
  if (!plugin?.ui) return null
  return {
    type: plugin.type,
    label: plugin.ui.label,
    shortcut: plugin.shortcut,
    iconName: plugin.ui.iconComponent,
  }
})

function handleZoomAction(type: string) {
  if (type === 'zoomIn') {
    zoomIn(canvasConfig.zoom.step)
  } else if (type === 'zoomOut') {
    zoomOut(canvasConfig.zoom.step)
  }
}
</script>

<template>
  <div
    class="flex items-center gap-2 p-2 shadow-sm backdrop-blur-md bg-white/70 border border-gray-200/50 rounded-full"
  >
    <n-tooltip v-if="zoomOutPlugin" trigger="hover">
      <template #trigger>
        <n-button
          quaternary
          size="small"
          circle
          @click="handleZoomAction(zoomOutPlugin.type)"
        >
          <template #icon>
            <IconRenderer :name="zoomOutPlugin.iconName" class="text-sm" />
          </template>
        </n-button>
      </template>
      <template #default>
        <span>{{ zoomOutPlugin.label }}</span>
        <span v-if="zoomOutPlugin.shortcut" class="text-gray-400 text-xs ml-2">
          {{ zoomOutPlugin.shortcut }}
        </span>
      </template>
    </n-tooltip>
    <n-tooltip trigger="hover">
      <template #trigger>
        <n-button quaternary size="small" style="width: 60px" @click="resetZoom">
          {{ zoomPercent }}%
        </n-button>
      </template>
      <template #default>
        <span>点击重置到 100%</span>
      </template>
    </n-tooltip>
    <n-tooltip v-if="zoomInPlugin" trigger="hover">
      <template #trigger>
        <n-button
          quaternary
          size="small"
          circle
          @click="handleZoomAction(zoomInPlugin.type)"
        >
          <template #icon>
            <IconRenderer :name="zoomInPlugin.iconName" class="text-sm" />
          </template>
        </n-button>
      </template>
      <template #default>
        <span>{{ zoomInPlugin.label }}</span>
        <span v-if="zoomInPlugin.shortcut" class="text-gray-400 text-xs ml-2">
          {{ zoomInPlugin.shortcut }}
        </span>
      </template>
    </n-tooltip>
  </div>
</template>
