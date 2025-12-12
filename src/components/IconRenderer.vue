<script setup lang="ts">
import {
  ArrowRight,
  Circle,
  FileCode,
  FileCode2,
  FileJson,
  FileJson2,
  Github,
  Hand,
  Image,
  ImageDown,
  Menu,
  Minus,
  MousePointer2,
  PenTool,
  Redo2,
  Square,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import { computed } from 'vue'

const props = defineProps<{
  name: string
  class?: string
  size?: number
  color?: string
  strokeWidth?: number
  absoluteStrokeWidth?: boolean
}>()

const iconNameToComponentMap: Record<string, Component> = {
  'i-lucide-square': Square,
  'i-lucide-circle': Circle,
  'i-lucide-minus': Minus,
  'i-lucide-arrow-right': ArrowRight,
  'i-lucide-pen-tool': PenTool,
  'i-lucide-type': Type,
  'i-lucide-image': Image,
  'i-lucide-image-down': ImageDown,
  'i-lucide-undo-2': Undo2,
  'i-lucide-redo-2': Redo2,
  'i-lucide-zoom-in': ZoomIn,
  'i-lucide-zoom-out': ZoomOut,
  'i-lucide-mouse-pointer-2': MousePointer2,
  'i-lucide-hand': Hand,
  'i-lucide-github': Github,
  'i-lucide-menu': Menu,
  'i-lucide-file-braces-corner': FileJson2,
  FileJson2,
  FileJson,
  FileCode2,
  FileCode,
}

const resolvedIconComponent = computed(() => {
  const trimmedIconName = props.name.trim()
  return iconNameToComponentMap[trimmedIconName] ?? null
})
</script>

<template>
  <component
    :is="resolvedIconComponent"
    v-if="resolvedIconComponent"
    :class="class"
    :size="size"
    :color="color"
    :stroke-width="strokeWidth"
    :absolute-stroke-width="absoluteStrokeWidth"
  />
</template>
