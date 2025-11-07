/** * Bottom toolbar component providing undo/redo controls and zoom controls. * Displays zoom
percentage and handles zoom in/out/reset actions. */
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

function handleUndo() {
  store.undo()
}

function handleRedo() {
  store.redo()
}
</script>

<template>

  <div
    class="bottom-toolbar bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm z-10"
  >

    <div class="flex items-center gap-2">
       <n-tooltip trigger="hover"
        > <template #trigger
          > <n-button quaternary size="medium" circle :disabled="!store.canUndo" @click="handleUndo"
            > <template #icon> <i-mdi-undo class="text-xl"></i-mdi-undo> </template> </n-button
          > </template
        > 撤销 (Ctrl+Z) </n-tooltip
      > <n-tooltip trigger="hover"
        > <template #trigger
          > <n-button quaternary size="medium" circle :disabled="!store.canRedo" @click="handleRedo"
            > <template #icon> <i-mdi-redo class="text-xl"></i-mdi-redo> </template> </n-button
          > </template
        > 重做 (Ctrl+Shift+Z) </n-tooltip
      >
    </div>

    <div class="flex items-center gap-2">
       <n-tooltip trigger="hover"
        > <template #trigger
          > <n-button quaternary size="medium" circle @click="handleZoomOut"
            > <template #icon
              > <i-mdi-minus-circle-outline class="text-xl"></i-mdi-minus-circle-outline> </template
            > </n-button
          > </template
        > 缩小 </n-tooltip
      > <n-tooltip trigger="hover"
        > <template #trigger
          > <n-button quaternary size="medium" @click="handleZoomReset"
            > {{ zoomPercent }}% </n-button
          > </template
        > 点击重置到 100% </n-tooltip
      > <n-tooltip trigger="hover"
        > <template #trigger
          > <n-button quaternary size="medium" circle @click="handleZoomIn"
            > <template #icon
              > <i-mdi-plus-circle-outline class="text-xl"></i-mdi-plus-circle-outline> </template
            > </n-button
          > </template
        > 放大 </n-tooltip
      >
    </div>

  </div>

</template>

