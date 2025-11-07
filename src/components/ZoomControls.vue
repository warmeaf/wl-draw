/** * Zoom controls component for canvas zoom operations. * Provides zoom in, zoom out, and reset
zoom functionality. */
<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'

const store = useCanvasStore()

const zoomPercent = computed(() => Math.round(store.zoom * 100))

function handleZoomIn() {
  store.updateZoom(0.1)
}

function handleZoomOut() {
  store.updateZoom(-0.1)
}

function handleZoomReset() {
  store.setZoom(1)
}
</script>

<template>
  <div
    class="toolbar-module flex items-center gap-2 px-3 py-2 shadow-lg backdrop-blur-md bg-white/70 border border-gray-200/50 rounded-full"
  >
    <n-tooltip trigger="hover">
      <template #trigger>
        <n-button quaternary size="medium" circle @click="handleZoomOut">
          <template #icon> <i-lucide-zoom-out class="text-xl"></i-lucide-zoom-out> </template>
        </n-button>
      </template>
      缩小
    </n-tooltip>
    <n-tooltip trigger="hover">
      <template #trigger>
        <n-button quaternary size="medium" style="width: 60px" @click="handleZoomReset">
          {{ zoomPercent }}%
        </n-button>
      </template>
      点击重置到 100%
    </n-tooltip>
    <n-tooltip trigger="hover">
      <template #trigger>
        <n-button quaternary size="medium" circle @click="handleZoomIn">
          <template #icon> <i-lucide-zoom-in class="text-xl"></i-lucide-zoom-in> </template>
        </n-button>
      </template>
      放大
    </n-tooltip>
  </div>
</template>
