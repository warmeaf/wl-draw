/** * Main application component that sets up the drawing canvas interface. * Manages keyboard
shortcuts for undo/redo and initializes the application layout. */
<script setup lang="ts">
import { onMounted } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useEventListener } from '@vueuse/core'
import Toolbar from '@/components/Toolbar.vue'
import Canvas from '@/components/Canvas.vue'
import BottomToolbar from '@/components/BottomToolbar.vue'

const store = useCanvasStore()

onMounted(() => {
  store.saveHistory()

  useEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      if (store.canUndo) {
        store.undo()
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault()
      if (store.canRedo) {
        store.redo()
      }
    }
  })
})
</script>

<template>
   <n-config-provider
    >
    <div class="w-screen h-screen flex flex-col bg-gray-50">
       <Toolbar />
      <div class="flex-1 relative overflow-hidden"> <Canvas /> </div>
       <BottomToolbar />
    </div>
     </n-config-provider
  >
</template>

