<script setup lang="ts">
import { App } from 'leafer-ui'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useDeleteTool } from '@/composables/features/useDeleteTool'
import { useElementPopover } from '@/composables/state/useElementPopover'
import { useCanvasTools } from '@/composables/useCanvasTools'
import { canvasConfig } from '@/config/canvas'
import { themeColors } from '@/config/theme'
import { useZoomTool } from '@/plugins/composables/useZoomTool'
import { useCanvasStore } from '@/stores/canvas'

import '@leafer-in/editor'
import '@leafer-in/export'
import '@leafer-in/viewport'
import '@leafer-in/view'
import '@leafer-in/arrow'
import '@leafer-in/text-editor'
import { Snap } from 'leafer-x-easy-snap'

const canvasContainer = ref<HTMLElement | null>(null)
const store = useCanvasStore()
const { setupZoomKeyboardPrevention } = useZoomTool()
const elementPopover = useElementPopover()

let app: App | null = null
let deleteToolCleanup: (() => void) | null = null
let zoomKeyboardCleanup: (() => void) | null = null

const selectedElementStrokeType = computed(() => {
  return elementPopover.selectedElementDashPattern.value ? 'dashed' : 'solid'
})
const handleStrokeTypeChange = (type: 'solid' | 'dashed') => {
  elementPopover.updateElementDashPattern(type === 'dashed' ? [5, 5] : undefined)
}

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

  const snap = new Snap(app, {
    attachEvents: ['move', 'scale'],
    lineColor: themeColors.snapLineColor,
    distanceLabelStyle: {
      text: {
        fill: themeColors.snapLineColor,
      },
    },
  })
  snap.enable(true)

  useCanvasTools(app, elementPopover, canvasContainer.value)
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
      <template
        v-if="
          elementPopover.selectedElementType.value === 'rect' ||
          elementPopover.selectedElementType.value === 'circle'
        "
      >
        <ColorPicker
          size="small"
          :value="elementPopover.selectedElementFillColor.value"
          @update:value="elementPopover.updateElementFillColor"
        />
        <n-popover :show-arrow="false" placement="bottom-start" trigger="click">
          <template #trigger>
            <n-button quaternary size="small" circle>
              <template #icon>
                <div
                  class="flex w-[18px] h-[18px] rounded-full items-center justify-center before:content-[''] before:w-2.5 before:h-2.5 before:rounded-full before:bg-white"
                  :style="{
                    backgroundColor:
                      elementPopover.selectedElementStrokeColor.value,
                  }"
                />
              </template>
            </n-button>
          </template>
          <stroke-config
            :stroke-width="elementPopover.selectedElementStrokeWidth.value"
            :stroke-color="elementPopover.selectedElementStrokeColor.value"
            :stroke-type="selectedElementStrokeType"
            @update:stroke-width="elementPopover.updateElementStrokeWidth"
            @update:stroke-color="elementPopover.updateElementStrokeColor"
            @update:stroke-type="handleStrokeTypeChange"
          />
        </n-popover>
      </template>
    </n-popover>
  </div>
</template>
