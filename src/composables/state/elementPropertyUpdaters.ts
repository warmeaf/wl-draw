/**
 * Utility functions for updating element properties in the popover
 */

import { Line, Text } from 'leafer-ui'
import type { Ref } from 'vue'
import type { ArrowType } from '@/components/common/ArrowPicker.vue'
import type { LeaferElement } from '@/types'

type ElementType = 'rect' | 'circle' | 'line' | 'arrow' | 'pen' | 'text' | 'image' | null

interface ElementPropertyUpdaters {
  selectedElement: Ref<LeaferElement>
  selectedElementType: Ref<ElementType>
  selectedElementFillColor: Ref<string>
  selectedElementStrokeColor: Ref<string>
  selectedElementStrokeWidth: Ref<number>
  selectedElementDashPattern: Ref<number[] | undefined>
  selectedElementStartArrow: Ref<ArrowType>
  selectedElementEndArrow: Ref<ArrowType>
  selectedElementTextColor: Ref<string>
  selectedElementFontSize: Ref<number>
  debouncedAddSnapshot: () => void
}

function isArrowElement(
  selectedElement: LeaferElement | null,
  selectedElementType: ElementType
): boolean {
  return (
    selectedElement !== null && selectedElement instanceof Line && selectedElementType === 'arrow'
  )
}

function isTextElement(selectedElement: LeaferElement | null): boolean {
  return selectedElement !== null && selectedElement instanceof Text
}

export function createElementPropertyUpdaters(updaters: ElementPropertyUpdaters) {
  function updateElementFillColor(color: string) {
    const element = updaters.selectedElement.value
    if (element) {
      element.fill = color
      updaters.selectedElementFillColor.value = color
      updaters.debouncedAddSnapshot()
    }
  }

  function updateElementStrokeColor(color: string) {
    const element = updaters.selectedElement.value
    if (element) {
      element.stroke = color
      updaters.selectedElementStrokeColor.value = color
      updaters.debouncedAddSnapshot()
    }
  }

  function updateElementStrokeWidth(width: number, dashPattern?: number[]) {
    const element = updaters.selectedElement.value
    if (element) {
      element.strokeWidth = width
      updaters.selectedElementStrokeWidth.value = width

      if (dashPattern !== undefined) {
        element.dashPattern = dashPattern
        updaters.selectedElementDashPattern.value = dashPattern
      }

      updaters.debouncedAddSnapshot()
    }
  }

  function updateElementDashPattern(pattern: number[] | undefined) {
    const element = updaters.selectedElement.value
    if (element) {
      element.dashPattern = pattern
      updaters.selectedElementDashPattern.value = pattern
      updaters.debouncedAddSnapshot()
    }
  }

  function updateElementStartArrow(arrowType: ArrowType) {
    const element = updaters.selectedElement.value
    const isArrow = isArrowElement(element, updaters.selectedElementType.value)
    if (isArrow && element instanceof Line) {
      element.startArrow = arrowType
      updaters.selectedElementStartArrow.value = arrowType
      updaters.debouncedAddSnapshot()
    }
  }

  function updateElementEndArrow(arrowType: ArrowType) {
    const element = updaters.selectedElement.value
    const isArrow = isArrowElement(element, updaters.selectedElementType.value)
    if (isArrow && element instanceof Line) {
      element.endArrow = arrowType
      updaters.selectedElementEndArrow.value = arrowType
      updaters.debouncedAddSnapshot()
    }
  }

  function updateElementTextColor(color: string) {
    const element = updaters.selectedElement.value
    if (isTextElement(element) && element instanceof Text) {
      element.fill = color
      updaters.selectedElementTextColor.value = color
      updaters.debouncedAddSnapshot()
    }
  }

  function updateElementFontSize(size: number) {
    const element = updaters.selectedElement.value
    if (isTextElement(element) && element instanceof Text) {
      element.fontSize = size
      updaters.selectedElementFontSize.value = size
      updaters.debouncedAddSnapshot()
    }
  }

  return {
    updateElementFillColor,
    updateElementStrokeColor,
    updateElementStrokeWidth,
    updateElementDashPattern,
    updateElementStartArrow,
    updateElementEndArrow,
    updateElementTextColor,
    updateElementFontSize,
  }
}
