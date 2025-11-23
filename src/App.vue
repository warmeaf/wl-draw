/**
 * Main application component
 */

<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'
import { provide } from 'vue'
import { useElementPopover } from '@/composables/state/useElementPopover'
import { themeColors } from '@/config/theme'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: themeColors.primary,
    primaryColorHover: themeColors.primaryHover,
    primaryColorPressed: themeColors.primaryPressed,
    primaryColorSuppl: themeColors.primarySuppl,
  },
}

const elementPopover = useElementPopover()
provide('elementPopover', elementPopover)
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <div class="w-screen h-screen flex flex-col bg-gray-50">
      <Toolbar />
      <div class="flex-1 relative overflow-hidden pt-0"><Canvas /></div>
    </div>
  </n-config-provider>
</template>
