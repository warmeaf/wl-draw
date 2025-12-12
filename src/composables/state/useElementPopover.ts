/**
 * Composable for managing element popover display state and position
 */

import { useDebounceFn } from '@vueuse/core'
import { Line, Text } from 'leafer-ui'
import { ref } from 'vue'
import type { ArrowType } from '@/components/common/ArrowPicker.vue'
import { TIMING } from '@/constants'
import { useHistory } from '@/plugins/composables/useHistory'
import type { LeaferElement } from '@/types'
import {
  type ElementPropertyRefs,
  type ElementProps,
  elementPropertySetterMap,
} from './elementPropertySetters'

type ElementType = 'rect' | 'circle' | 'line' | 'arrow' | 'pen' | 'text' | 'image' | null

const DEFAULT_FILL_COLOR = '#ffffff'
const DEFAULT_STROKE_COLOR = '#000000'
const DEFAULT_STROKE_WIDTH = 0
const DEFAULT_START_ARROW: ArrowType = 'none'
const DEFAULT_END_ARROW: ArrowType = 'arrow'
const DEFAULT_TEXT_COLOR = '#000000'
const DEFAULT_FONT_SIZE = 16

export function useElementPopover() {
  const { addSnapshot } = useHistory()

  const debouncedAddSnapshot = useDebounceFn(() => {
    addSnapshot()
  }, TIMING.HISTORY_SNAPSHOT_THROTTLE)

  const showPopover = ref(false)

  const popoverX = ref(0)
  const popoverY = ref(0)

  const selectedElementType = ref<ElementType>(null)
  const selectedElement = ref<LeaferElement>(null)

  const selectedElementFillColor = ref<string>(DEFAULT_FILL_COLOR)
  const selectedElementStrokeColor = ref<string>(DEFAULT_STROKE_COLOR)
  const selectedElementStrokeWidth = ref<number>(DEFAULT_STROKE_WIDTH)
  const selectedElementDashPattern = ref<number[] | undefined>(undefined)
  const selectedElementStartArrow = ref<ArrowType>(DEFAULT_START_ARROW)
  const selectedElementEndArrow = ref<ArrowType>(DEFAULT_END_ARROW)
  const selectedElementTextColor = ref<string>(DEFAULT_TEXT_COLOR)
  const selectedElementFontSize = ref<number>(DEFAULT_FONT_SIZE)

  function showPopoverAt(
    x: number,
    y: number,
    elementType?: ElementType,
    element?: LeaferElement | null,
    elementProps?: ElementProps
  ) {
    popoverX.value = x
    popoverY.value = y

    selectedElementType.value = elementType ?? null
    selectedElement.value = element ?? null

    if (elementType) {
      const propertySetter = elementPropertySetterMap[elementType]
      if (propertySetter) {
        const propertyRefs: ElementPropertyRefs = {
          fillColor: selectedElementFillColor,
          strokeColor: selectedElementStrokeColor,
          strokeWidth: selectedElementStrokeWidth,
          dashPattern: selectedElementDashPattern,
          startArrow: selectedElementStartArrow,
          endArrow: selectedElementEndArrow,
          textColor: selectedElementTextColor,
          fontSize: selectedElementFontSize,
        }
        propertySetter.setProperties(elementProps, propertyRefs)
      }
    }

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
      debouncedAddSnapshot()
    }
  }

  function updateElementStrokeColor(color: string) {
    if (selectedElement.value) {
      selectedElement.value.stroke = color
      selectedElementStrokeColor.value = color
      debouncedAddSnapshot()
    }
  }

  function updateElementStrokeWidth(width: number, dashPattern?: number[]) {
    if (selectedElement.value) {
      selectedElement.value.strokeWidth = width
      selectedElementStrokeWidth.value = width

      if (dashPattern !== undefined) {
        selectedElement.value.dashPattern = dashPattern
        selectedElementDashPattern.value = dashPattern
      }

      debouncedAddSnapshot()
    }
  }

  function updateElementDashPattern(pattern: number[] | undefined) {
    if (selectedElement.value) {
      selectedElement.value.dashPattern = pattern
      selectedElementDashPattern.value = pattern
      debouncedAddSnapshot()
    }
  }

  function updateElementStartArrow(arrowType: ArrowType) {
    if (
      selectedElement.value &&
      selectedElement.value instanceof Line &&
      selectedElementType.value === 'arrow'
    ) {
      selectedElement.value.startArrow = arrowType
      selectedElementStartArrow.value = arrowType
      debouncedAddSnapshot()
    }
  }

  function updateElementEndArrow(arrowType: ArrowType) {
    if (
      selectedElement.value &&
      selectedElement.value instanceof Line &&
      selectedElementType.value === 'arrow'
    ) {
      selectedElement.value.endArrow = arrowType
      selectedElementEndArrow.value = arrowType
      debouncedAddSnapshot()
    }
  }

  function updateElementTextColor(color: string) {
    if (selectedElement.value && selectedElement.value instanceof Text) {
      selectedElement.value.fill = color
      selectedElementTextColor.value = color
      debouncedAddSnapshot()
    }
  }

  function updateElementFontSize(size: number) {
    if (selectedElement.value && selectedElement.value instanceof Text) {
      selectedElement.value.fontSize = size
      selectedElementFontSize.value = size
      debouncedAddSnapshot()
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
    selectedElementStartArrow,
    selectedElementEndArrow,
    selectedElementTextColor,
    selectedElementFontSize,

    showPopoverAt,
    hidePopover,

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
