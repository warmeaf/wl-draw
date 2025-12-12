<script setup lang="ts">
import { computed, inject } from 'vue'
import { useElementPopover } from '@/composables/state/useElementPopover'
import { canvasConfig } from '@/config/canvas'
import { useZoomTool } from '@/plugins/composables/useZoomTool'
import { pluginRegistry } from '@/plugins/registry'
import { useCanvasStore } from '@/stores/canvas'

const ZOOM_IN_TYPE = 'zoomIn'
const ZOOM_OUT_TYPE = 'zoomOut'

const elementPopover = inject<ReturnType<typeof useElementPopover>>(
  'elementPopover',
  useElementPopover()
)

const store = useCanvasStore()
const { zoomIn, zoomOut, resetZoom } = useZoomTool(elementPopover)

const zoomPercent = computed(() => Math.round(store.zoom * 100))

function getZoomPluginMetadata(pluginType: string) {
  const metadata = pluginRegistry.getPluginMetadata(pluginType)
  if (!metadata?.ui) return null
  return {
    type: metadata.type,
    label: metadata.ui.label,
    shortcut: metadata.shortcut,
    iconName: metadata.ui.iconComponent,
  }
}

const zoomOutPlugin = computed(() => getZoomPluginMetadata(ZOOM_OUT_TYPE))
const zoomInPlugin = computed(() => getZoomPluginMetadata(ZOOM_IN_TYPE))

function handleZoomAction(zoomType: string) {
  if (zoomType === ZOOM_IN_TYPE) {
    zoomIn(canvasConfig.zoom.step)
  } else if (zoomType === ZOOM_OUT_TYPE) {
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
            <IconRenderer :name="zoomOutPlugin.iconName" :size="14" />
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
            <IconRenderer :name="zoomInPlugin.iconName" :size="14" />
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
