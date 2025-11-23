<script setup lang="ts">
import { computed } from 'vue'
import type { ArrowType } from './ArrowPicker.vue'

interface Props {
  type: ArrowType
  size?: number | string
  color?: string
  direction?: 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  size: 48,
  color: 'currentColor',
  direction: 'right',
})

const style = computed(() => {
  if (props.direction === 'left' && props.type === 'angle-side') {
    return {
      transform: 'rotate(180deg)',
    }
  }
  if (props.direction === 'left') {
    return {
      transform: props.direction === 'left' ? 'scaleX(-1)' : undefined,
    }
  }
})
</script>

<template>
  <svg
    viewBox="0 0 48 24"
    :width="props.size"
    :height="props.size"
    fill="none"
    :stroke="props.color"
    stroke-width="3"
    stroke-linecap="round"
    stroke-linejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
    :style="style"
  >
    <!-- None -->
    <template v-if="type === 'none'">
      <line x1="4" y1="12" x2="44" y2="12" />
    </template>

    <!-- Angle -->
    <template v-else-if="type === 'angle'">
      <line x1="4" y1="12" x2="30" y2="12" />
      <polyline points="22 2 30 12 22 22" />
    </template>

    <!-- Angle Side -->
    <template v-else-if="type === 'angle-side'">
      <line x1="4" y1="12" x2="30" y2="12" /> 
      <line x1="22" y1="2" x2="30" y2="12" />
    </template>

    <!-- Arrow -->
    <template v-else-if="type === 'arrow'">
      <line x1="4" y1="12" x2="24" y2="12" />
      <path d="M20 2 L24 12 L20 22 L36 12 Z" :fill="props.color" stroke="none" />
    </template>

    <!-- Triangle -->
    <template v-else-if="type === 'triangle'">
      <line x1="4" y1="12" x2="20" y2="12" />
      <path d="M20 2 L36 12 L20 22 Z" :fill="props.color" stroke="none" />
    </template>

    <!-- Triangle Flip -->
    <template v-else-if="type === 'triangle-flip'">
      <line x1="4" y1="12" x2="36" y2="12" />
      <path d="M36 2 L20 12 L36 22 Z" :fill="props.color" stroke="none" />
    </template>

    <!-- Circle -->
    <template v-else-if="type === 'circle'">
      <line x1="4" y1="12" x2="24" y2="12" />
      <circle cx="32" cy="12" r="9" :fill="props.color" stroke="none" />
    </template>

    <!-- Circle Line -->
    <template v-else-if="type === 'circle-line'">
      <line x1="4" y1="12" x2="22" y2="12" />
      <circle cx="32" cy="12" r="9" />
    </template>

    <!-- Square -->
    <template v-else-if="type === 'square'">
      <line x1="4" y1="12" x2="22" y2="12" />
      <rect
        x="22"
        y="3"
        width="18"
        height="18"
        :fill="props.color"
        stroke="none"
      />
    </template>

    <!-- Square Line -->
    <template v-else-if="type === 'square-line'">
      <line x1="4" y1="12" x2="22" y2="12" />
      <rect x="22" y="3" width="18" height="18" />
    </template>

    <!-- Diamond -->
    <template v-else-if="type === 'diamond'">
      <line x1="4" y1="12" x2="20" y2="12" />
      <path
        d="M20 12 L30 2 L40 12 L30 22 Z"
        :fill="props.color"
        stroke="none"
      />
    </template>

    <!-- Diamond Line -->
    <template v-else-if="type === 'diamond-line'">
      <line x1="4" y1="12" x2="20" y2="12" />
      <path d="M20 12 L30 2 L40 12 L30 22 Z" />
    </template>

    <!-- Mark -->
    <template v-else-if="type === 'mark'">
      <line x1="4" y1="12" x2="30" y2="12" />
      <line x1="30" y1="2" x2="30" y2="22" stroke-width="3.5" />
    </template>
  </svg>
</template>
