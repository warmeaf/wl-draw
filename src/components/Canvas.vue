/**
 * Canvas component for main drawing canvas using Leafer App and Editor
 */
 
<script setup lang="ts">
import { App } from 'leafer-ui'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import '@leafer-in/editor'
import '@leafer-in/viewport'
import '@leafer-in/view'
import '@leafer-in/arrow'
import '@leafer-in/text-editor'

import { useCanvasTools } from '@/composables/useCanvasTools'
import { useDeleteTool } from '@/composables/useDeleteTool'
import { themeColors } from '@/config/theme'
import { useCanvasStore } from '@/stores/canvas'

const canvasContainer = ref<HTMLElement | null>(null)
const store = useCanvasStore()

let app: App | null = null
let cleanupDeleteTool: (() => void) | null = null

onMounted(() => {
  if (!canvasContainer.value) return

  app = new App({
    view: canvasContainer.value,
    editor: {
      stroke: themeColors.selectionBox,
      pointStroke: themeColors.controlPoint,
    },
    zoom: { min: 0.02, max: 256 },
    wheel: {
      zoomSpeed: 0.1,
    },
    move: {
      drag: false,
    },
  })
  app.tree.fill = themeColors.canvasBackground

  store.setAppInstance(app)

  useCanvasTools(app)
  cleanupDeleteTool = useDeleteTool(app, store)
})

onBeforeUnmount(() => {
  cleanupDeleteTool?.()

  if (app) {
    app.destroy()
    app = null
  }
})
</script>

<template>
  <div ref="canvasContainer" class="w-full h-full relative overflow-hidden bg-white"></div>
</template>
