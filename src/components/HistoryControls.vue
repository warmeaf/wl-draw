/** * History controls component for undo/redo operations. * Provides undo and redo buttons with
keyboard shortcut hints. */
<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'

const store = useCanvasStore()

function handleUndo() {
  store.undo()
}

function handleRedo() {
  store.redo()
}
</script>

<template>

  <div
    class="toolbar-module flex items-center gap-2 px-3 py-2 shadow-lg backdrop-blur-md bg-white/70 border border-gray-200/50 rounded-full"
  >
     <n-tooltip trigger="hover"
      > <template #trigger
        > <n-button quaternary size="medium" circle :disabled="!store.canUndo" @click="handleUndo"
          > <template #icon> <i-lucide-undo-2 class="text-xl"></i-lucide-undo-2> </template>
          </n-button
        > </template
      > 撤销 (Ctrl+Z) </n-tooltip
    > <n-tooltip trigger="hover"
      > <template #trigger
        > <n-button quaternary size="medium" circle :disabled="!store.canRedo" @click="handleRedo"
          > <template #icon> <i-lucide-redo-2 class="text-xl"></i-lucide-redo-2> </template>
          </n-button
        > </template
      > 重做 (Ctrl+Shift+Z) </n-tooltip
    >
  </div>

</template>

