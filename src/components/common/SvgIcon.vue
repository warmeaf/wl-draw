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

type ArrowShapeConfig =
  | {
      type: 'polyline'
      data: string
    }
  | {
      type: 'path'
      data: string
      fill?: boolean
    }
  | {
      type: 'circle'
      data: { cx: number; cy: number; r: number }
      fill?: boolean
    }
  | {
      type: 'rect'
      data: { x: number; y: number; width: number; height: number }
      fill?: boolean
    }
  | {
      type: 'line'
      data: { x1: number; y1: number; x2: number; y2: number }
      strokeWidth?: number
    }

interface ArrowSvgConfig {
  line: { x1: number; y1: number; x2: number; y2: number }
  shape?: ArrowShapeConfig
  requiresRotation?: boolean
}

const arrowConfigs: Record<ArrowType, ArrowSvgConfig> = {
  none: {
    line: { x1: 4, y1: 12, x2: 44, y2: 12 },
  },
  angle: {
    line: { x1: 4, y1: 12, x2: 30, y2: 12 },
    shape: {
      type: 'polyline',
      data: '22 2 30 12 22 22',
    },
  },
  'angle-side': {
    line: { x1: 4, y1: 12, x2: 30, y2: 12 },
    shape: {
      type: 'line',
      data: { x1: 22, y1: 2, x2: 30, y2: 12 },
    },
    requiresRotation: true,
  },
  arrow: {
    line: { x1: 4, y1: 12, x2: 24, y2: 12 },
    shape: {
      type: 'path',
      data: 'M20 2 L24 12 L20 22 L36 12 Z',
      fill: true,
    },
  },
  triangle: {
    line: { x1: 4, y1: 12, x2: 20, y2: 12 },
    shape: {
      type: 'path',
      data: 'M20 2 L36 12 L20 22 Z',
      fill: true,
    },
  },
  'triangle-flip': {
    line: { x1: 4, y1: 12, x2: 36, y2: 12 },
    shape: {
      type: 'path',
      data: 'M36 2 L20 12 L36 22 Z',
      fill: true,
    },
  },
  circle: {
    line: { x1: 4, y1: 12, x2: 24, y2: 12 },
    shape: {
      type: 'circle',
      data: { cx: 32, cy: 12, r: 9 },
      fill: true,
    },
  },
  'circle-line': {
    line: { x1: 4, y1: 12, x2: 22, y2: 12 },
    shape: {
      type: 'circle',
      data: { cx: 32, cy: 12, r: 9 },
      fill: false,
    },
  },
  square: {
    line: { x1: 4, y1: 12, x2: 22, y2: 12 },
    shape: {
      type: 'rect',
      data: { x: 22, y: 3, width: 18, height: 18 },
      fill: true,
    },
  },
  'square-line': {
    line: { x1: 4, y1: 12, x2: 22, y2: 12 },
    shape: {
      type: 'rect',
      data: { x: 22, y: 3, width: 18, height: 18 },
      fill: false,
    },
  },
  diamond: {
    line: { x1: 4, y1: 12, x2: 20, y2: 12 },
    shape: {
      type: 'path',
      data: 'M20 12 L30 2 L40 12 L30 22 Z',
      fill: true,
    },
  },
  'diamond-line': {
    line: { x1: 4, y1: 12, x2: 20, y2: 12 },
    shape: {
      type: 'path',
      data: 'M20 12 L30 2 L40 12 L30 22 Z',
      fill: false,
    },
  },
  mark: {
    line: { x1: 4, y1: 12, x2: 30, y2: 12 },
    shape: {
      type: 'line',
      data: { x1: 30, y1: 2, x2: 30, y2: 22 },
      strokeWidth: 3.5,
    },
  },
}

const currentConfig = computed(() => arrowConfigs[props.type])

const transformStyle = computed(() => {
  const isLeftDirection = props.direction === 'left'
  const requiresRotation = currentConfig.value.requiresRotation

  if (isLeftDirection && requiresRotation) {
    return { transform: 'rotate(180deg)' }
  }
  if (isLeftDirection) {
    return { transform: 'scaleX(-1)' }
  }
  return {}
})
</script>

<template>
  <svg
    viewBox="0 0 48 24"
    :width="size"
    :height="size"
    fill="none"
    :stroke="color"
    stroke-width="3"
    stroke-linecap="round"
    stroke-linejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
    :style="transformStyle"
  >
    <line
      :x1="currentConfig.line.x1"
      :y1="currentConfig.line.y1"
      :x2="currentConfig.line.x2"
      :y2="currentConfig.line.y2"
    />
    <template v-if="currentConfig.shape">
      <polyline
        v-if="currentConfig.shape.type === 'polyline'"
        :points="currentConfig.shape.data"
      />
      <path
        v-else-if="currentConfig.shape.type === 'path'"
        :d="currentConfig.shape.data"
        :fill="currentConfig.shape.fill ? color : 'none'"
        :stroke="currentConfig.shape.fill ? 'none' : undefined"
      />
      <circle
        v-else-if="currentConfig.shape.type === 'circle'"
        :cx="currentConfig.shape.data.cx"
        :cy="currentConfig.shape.data.cy"
        :r="currentConfig.shape.data.r"
        :fill="currentConfig.shape.fill ? color : 'none'"
        :stroke="currentConfig.shape.fill ? 'none' : undefined"
      />
      <rect
        v-else-if="currentConfig.shape.type === 'rect'"
        :x="currentConfig.shape.data.x"
        :y="currentConfig.shape.data.y"
        :width="currentConfig.shape.data.width"
        :height="currentConfig.shape.data.height"
        :fill="currentConfig.shape.fill ? color : 'none'"
        :stroke="currentConfig.shape.fill ? 'none' : undefined"
      />
      <line
        v-else-if="currentConfig.shape.type === 'line'"
        :x1="currentConfig.shape.data.x1"
        :y1="currentConfig.shape.data.y1"
        :x2="currentConfig.shape.data.x2"
        :y2="currentConfig.shape.data.y2"
        :stroke-width="currentConfig.shape.strokeWidth"
      />
    </template>
  </svg>
</template>
