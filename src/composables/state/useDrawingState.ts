/**
 * Composable for managing drawing-related reactive state
 */

import { useKeyModifier } from '@vueuse/core'
import { computed, ref } from 'vue'
import type { LeaferElement, Point } from '@/types'

export function useDrawingState() {
  const isDrawing = ref(false)
  const startPoint = ref<Point | null>(null)
  const currentElement = ref<LeaferElement>(null)
  const penPathPoints = ref<Array<Point>>([])
  const dragStartPositions = ref<Map<string, { x: number; y: number }>>(new Map())

  const isShiftPressedRaw = useKeyModifier('Shift', { events: ['keydown', 'keyup'] })
  const isShiftPressed = computed(() => isShiftPressedRaw.value ?? false)

  function resetState() {
    isDrawing.value = false
    startPoint.value = null
    currentElement.value = null
    penPathPoints.value = []
  }

  return {
    isDrawing,
    startPoint,
    currentElement,
    penPathPoints,
    dragStartPositions,
    isShiftPressed,
    resetState,
  }
}
