<script setup lang="ts">
import { App } from 'leafer-ui'
import { inject, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ArrowType } from '@/components/common/ArrowPicker.vue'
import { useDeleteTool } from '@/composables/features/useDeleteTool'
import { useElementPopover } from '@/composables/state/useElementPopover'
import { useCanvasTools } from '@/composables/useCanvasTools'
import { canvasConfig } from '@/config/canvas'
import { useZoomTool } from '@/plugins/composables/useZoomTool'
import { useCanvasStore } from '@/stores/canvas'
import { useHistoryStore } from '@/stores/history'

import '@leafer-in/editor'
import '@leafer-in/export'
import '@leafer-in/viewport'
import '@leafer-in/view'
import '@leafer-in/arrow'
import '@leafer-in/text-editor'
import { Snap } from 'leafer-x-easy-snap'

const canvasContainer = ref<HTMLElement | null>(null)
const store = useCanvasStore()
const historyStore = useHistoryStore()
const { setupZoomKeyboardPrevention } = useZoomTool()
const elementPopover = inject<ReturnType<typeof useElementPopover>>(
  'elementPopover',
  useElementPopover()
)

let app: App | null = null
let deleteToolCleanup: (() => void) | null = null
let zoomKeyboardCleanup: (() => void) | null = null

const handleStrokeTypeChange = (type: 'solid' | 'dashed') => {
  elementPopover.updateElementDashPattern(type === 'dashed' ? [5, 5] : undefined)
}

const handleFillColorUpdate = (color: string) => {
  elementPopover.updateElementFillColor(color)
}

const handleStrokeColorUpdate = (color: string) => {
  elementPopover.updateElementStrokeColor(color)
}

const handleStrokeWidthUpdate = (width: number) => {
  elementPopover.updateElementStrokeWidth(width)
}

const handleStartArrowUpdate = (arrowType: ArrowType) => {
  elementPopover.updateElementStartArrow(arrowType)
}

const handleEndArrowUpdate = (arrowType: ArrowType) => {
  elementPopover.updateElementEndArrow(arrowType)
}

const handleTextColorUpdate = (color: string) => {
  elementPopover.updateElementTextColor(color)
}

const handleFontSizeUpdate = (size: number) => {
  elementPopover.updateElementFontSize(size)
}

const restoreCanvasFromHistory = () => {
  if (historyStore.snapshots.length > 0) {
    const lastSnapshot = historyStore.snapshots[historyStore.currentIndex]
    if (lastSnapshot) {
      store.fromSnapshot(lastSnapshot)
    }
  }
}

onMounted(() => {
  zoomKeyboardCleanup = setupZoomKeyboardPrevention()

  if (!canvasContainer.value) return

  app = new App({
    view: canvasContainer.value,
    editor: {
      stroke: canvasConfig.theme.selectionBox,
      selectedStyle: {
        strokeWidth: 0,
      },
      rect: {
        strokeWidth: 1,
        opacity: 0.5,
      },
    },
    zoom: { min: canvasConfig.zoom.min, max: canvasConfig.zoom.max },
    wheel: {
      zoomSpeed: canvasConfig.wheel.zoomSpeed,
    },
    move: {
      drag: false,
    },
  })
  app.tree.fill = canvasConfig.theme.background

  store.setAppInstance(app)

  const snap = new Snap(app, {
    attachEvents: ['move', 'scale'],
    lineColor: canvasConfig.theme.snapLineColor,
    distanceLabelStyle: {
      text: {
        fill: canvasConfig.theme.snapLineColor,
      },
    },
  })
  snap.enable(true)

  useCanvasTools(app, elementPopover, canvasContainer.value)
  deleteToolCleanup = useDeleteTool(app, store, elementPopover)

  restoreCanvasFromHistory()
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
  <div
    ref="canvasContainer"
    class="w-full h-full relative overflow-hidden bg-white"
  >
    <n-popover
      :show="elementPopover.showPopover.value"
      :x="elementPopover.popoverX.value"
      :y="elementPopover.popoverY.value"
      :show-arrow="false"
      :content-style="{ display: 'flex' }"
      placement="right-start"
      trigger="manual"
    >
      <ElementStyleConfig
        :element-type="elementPopover.selectedElementType.value"
        :fill-color="elementPopover.selectedElementFillColor.value"
        :stroke-color="elementPopover.selectedElementStrokeColor.value"
        :stroke-width="elementPopover.selectedElementStrokeWidth.value"
        :dash-pattern="elementPopover.selectedElementDashPattern.value"
        :start-arrow="elementPopover.selectedElementStartArrow.value"
        :end-arrow="elementPopover.selectedElementEndArrow.value"
        :text-color="elementPopover.selectedElementTextColor.value"
        :font-size="elementPopover.selectedElementFontSize.value"
        @update:fill-color="handleFillColorUpdate"
        @update:stroke-color="handleStrokeColorUpdate"
        @update:stroke-width="handleStrokeWidthUpdate"
        @update:stroke-type="handleStrokeTypeChange"
        @update:start-arrow="handleStartArrowUpdate"
        @update:end-arrow="handleEndArrowUpdate"
        @update:text-color="handleTextColorUpdate"
        @update:font-size="handleFontSizeUpdate"
      />
    </n-popover>
  </div>
</template>
