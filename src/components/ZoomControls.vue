/**
 * Zoom controls component for canvas zoom operations
 */

<script setup lang="ts">
import { computed } from 'vue'
import { useZoomTool } from '@/composables/useZoomTool'
import { canvasConfig } from '@/config/canvas'
import { useCanvasStore } from '@/stores/canvas'

const size = 'medium'
const store = useCanvasStore()
const { zoomIn, zoomOut, resetZoom } = useZoomTool()

const zoomPercent = computed(() => Math.round(store.zoom * 100))

function handleZoomIn() {
  zoomIn(canvasConfig.zoom.step)
}

function handleZoomOut() {
  zoomOut(canvasConfig.zoom.step)
}
</script>

<template>
  <div
    class="flex items-center gap-2 p-2 shadow-sm backdrop-blur-md bg-white/70 border border-gray-200/50 rounded-full"
  >
    <n-tooltip trigger="hover">
      <template #trigger>
        <n-button quaternary :size="size" circle @click="handleZoomOut">
          <template #icon> <i-lucide-zoom-out class="text-xl"></i-lucide-zoom-out> </template>
        </n-button>
      </template>
      缩小
    </n-tooltip>
    <n-tooltip trigger="hover">
      <template #trigger>
        <n-button quaternary :size="size" style="width: 60px" @click="resetZoom">
          {{ zoomPercent }}%
        </n-button>
      </template>
      点击重置到 100%
    </n-tooltip>
    <n-tooltip trigger="hover">
      <template #trigger>
        <n-button quaternary :size="size" circle @click="handleZoomIn">
          <template #icon> <i-lucide-zoom-in class="text-xl"></i-lucide-zoom-in> </template>
        </n-button>
      </template>
      放大
    </n-tooltip>
  </div>
</template>
