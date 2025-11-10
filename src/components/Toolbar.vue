/** * Top toolbar container component that combines tool selector,and zoom controls. * Displays
three independent floating modules in a single row. */
<script setup lang="ts">
import ToolSelector from './ToolSelector.vue'
import ZoomControls from './ZoomControls.vue'
</script>

<template>
  <div class="toolbar-container fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
    <ToolSelector /> <ZoomControls />
  </div>
</template>
