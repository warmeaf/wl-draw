/**
 * Canvas component for main drawing canvas using Leafer App and Editor
 */

<script setup lang="ts">
import { App } from 'leafer-ui'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { useCanvasTools } from '@/composables/useCanvasTools'
import { useDeleteTool } from '@/composables/useDeleteTool'
import { useZoomTool } from '@/composables/useZoomTool'
import { canvasConfig } from '@/config/canvas'
import { themeColors } from '@/config/theme'
import { useCanvasStore } from '@/stores/canvas'

import '@leafer-in/editor'
import '@leafer-in/export'
import '@leafer-in/viewport'
import '@leafer-in/view'
import '@leafer-in/arrow'
import '@leafer-in/text-editor'

const canvasContainer = ref<HTMLElement | null>(null)
const store = useCanvasStore()
const { setupZoomKeyboardPrevention } = useZoomTool()

let app: App | null = null
let deleteToolCleanup: (() => void) | null = null
let zoomKeyboardCleanup: (() => void) | null = null

onMounted(() => {
  zoomKeyboardCleanup = setupZoomKeyboardPrevention()

  if (!canvasContainer.value) return

  app = new App({
    view: canvasContainer.value,
    editor: {
      stroke: themeColors.selectionBox,
      pointStroke: themeColors.controlPoint,
    },
    zoom: { min: canvasConfig.zoom.min, max: canvasConfig.zoom.max },
    wheel: {
      zoomSpeed: canvasConfig.wheel.zoomSpeed,
    },
    move: {
      drag: false,
    },
  })
  app.tree.fill = themeColors.canvasBackground

  store.setAppInstance(app)

  useCanvasTools(app)
  deleteToolCleanup = useDeleteTool(app, store)
})

onBeforeUnmount(() => {
  zoomKeyboardCleanup?.()
  deleteToolCleanup?.()

  if (app) {
    app.destroy()
    app = null
  }
})
</script>

<template>
  <div ref="canvasContainer" class="w-full h-full relative overflow-hidden bg-white"></div>
</template>
