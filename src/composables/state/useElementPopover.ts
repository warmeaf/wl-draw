/**
 * Composable for managing element popover display state and position
 */

import { ref } from 'vue'
import type { LeaferElement } from '@/types'

export function useElementPopover() {
  const showPopover = ref(false)

  const popoverX = ref(0)
  const popoverY = ref(0)

  const selectedElementType = ref<
    'rect' | 'circle' | 'line' | 'arrow' | 'pen' | 'text' | 'image' | null
  >(null)
  const selectedElement = ref<LeaferElement>(null)

  const selectedElementFillColor = ref<string>('#ffffff')
  const selectedElementStrokeColor = ref<string>('#000000')
  const selectedElementStrokeWidth = ref<number>(0)
  const selectedElementDashPattern = ref<number[] | undefined>(undefined)

  function showPopoverAt(
    x: number,
    y: number,
    elementType?: 'rect' | 'circle' | 'line' | 'arrow' | 'pen' | 'text' | 'image' | null,
    element?: LeaferElement | null,
    props?: {
      fillColor?: string
      strokeColor?: string
      strokeWidth?: number
      dashPattern?: number[] | undefined
    }
  ) {
    popoverX.value = x
    popoverY.value = y

    selectedElementType.value = elementType ?? null
    selectedElement.value = element ?? null

    selectedElementFillColor.value = props?.fillColor ?? '#ffffff'
    selectedElementStrokeColor.value = props?.strokeColor ?? '#000000'
    selectedElementStrokeWidth.value = props?.strokeWidth ?? 0
    selectedElementDashPattern.value = props?.dashPattern ?? undefined

    showPopover.value = true
  }

  function hidePopover() {
    showPopover.value = false
    selectedElement.value = null
  }

  function updateElementFillColor(color: string) {
    if (selectedElement.value) {
      selectedElement.value.fill = color
      selectedElementFillColor.value = color
    }
  }

  function updateElementStrokeColor(color: string) {
    if (selectedElement.value) {
      selectedElement.value.stroke = color
      selectedElementStrokeColor.value = color
    }
  }

  function updateElementStrokeWidth(width: number) {
    if (selectedElement.value) {
      selectedElement.value.strokeWidth = width
      selectedElementStrokeWidth.value = width
    }
  }

  function updateElementDashPattern(pattern: number[] | undefined) {
    if (selectedElement.value) {
      selectedElement.value.dashPattern = pattern
      selectedElementDashPattern.value = pattern
    }
  }

  return {
    showPopover,
    popoverX,
    popoverY,
    selectedElementType,
    selectedElement,

    selectedElementFillColor,
    selectedElementStrokeColor,
    selectedElementStrokeWidth,
    selectedElementDashPattern,

    showPopoverAt,
    hidePopover,

    updateElementFillColor,
    updateElementStrokeColor,
    updateElementStrokeWidth,
    updateElementDashPattern,
  }
}
