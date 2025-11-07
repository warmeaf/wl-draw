/** * Main application component that sets up the drawing canvas interface. * Manages keyboard
shortcuts for undo/redo and initializes the application layout. */
<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'
import { themeColors } from '@/config/theme'
import Toolbar from '@/components/Toolbar.vue'
import Canvas from '@/components/Canvas.vue'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: themeColors.primary,
    primaryColorHover: themeColors.primaryHover,
    primaryColorPressed: themeColors.primaryPressed,
    primaryColorSuppl: themeColors.primarySuppl,
  },
}
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <div class="w-screen h-screen flex flex-col bg-gray-50">
      <Toolbar />
      <div class="flex-1 relative overflow-hidden pt-0"><Canvas /></div>
    </div>
  </n-config-provider>
</template>
