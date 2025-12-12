/**
 * Composable for managing element popover display state and position
 */

import { useDebounceFn } from '@vueuse/core'
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
import { createElementPropertyUpdaters } from './elementPropertyUpdaters'

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

  const isPopoverVisible = ref(false)

  const popoverPositionX = ref(0)
  const popoverPositionY = ref(0)

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

  function displayPopoverAt(
    x: number,
    y: number,
    elementType?: ElementType,
    element?: LeaferElement | null,
    elementProps?: ElementProps
  ) {
    popoverPositionX.value = x
    popoverPositionY.value = y

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

    isPopoverVisible.value = true
  }

  function closePopover() {
    isPopoverVisible.value = false
    selectedElement.value = null
  }

  const propertyUpdaters = createElementPropertyUpdaters({
    selectedElement,
    selectedElementType,
    selectedElementFillColor,
    selectedElementStrokeColor,
    selectedElementStrokeWidth,
    selectedElementDashPattern,
    selectedElementStartArrow,
    selectedElementEndArrow,
    selectedElementTextColor,
    selectedElementFontSize,
    debouncedAddSnapshot,
  })

  return {
    showPopover: isPopoverVisible,
    popoverX: popoverPositionX,
    popoverY: popoverPositionY,
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

    showPopoverAt: displayPopoverAt,
    hidePopover: closePopover,

    updateElementFillColor: propertyUpdaters.updateElementFillColor,
    updateElementStrokeColor: propertyUpdaters.updateElementStrokeColor,
    updateElementStrokeWidth: propertyUpdaters.updateElementStrokeWidth,
    updateElementDashPattern: propertyUpdaters.updateElementDashPattern,
    updateElementStartArrow: propertyUpdaters.updateElementStartArrow,
    updateElementEndArrow: propertyUpdaters.updateElementEndArrow,
    updateElementTextColor: propertyUpdaters.updateElementTextColor,
    updateElementFontSize: propertyUpdaters.updateElementFontSize,
  }
}
