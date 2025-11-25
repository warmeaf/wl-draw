/**
 * Composable for managing element popover display state and position
 */

import { useDebounceFn } from '@vueuse/core'
import { Line, Pen, Text } from 'leafer-ui'
import { ref } from 'vue'
import type { ArrowType } from '@/components/common/ArrowPicker.vue'
import { TIMING } from '@/constants'
import { useHistory } from '@/plugins/composables/useHistory'
import type { LeaferElement } from '@/types'

type ElementType = 'rect' | 'circle' | 'line' | 'arrow' | 'pen' | 'text' | 'image' | null

interface ElementProps {
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  dashPattern?: number[] | undefined
  startArrow?: ArrowType
  endArrow?: ArrowType
  textColor?: string
  fontSize?: number
}

interface ElementPropertySetter {
  setProperties(
    props: ElementProps | undefined,
    fillColorRef: { value: string },
    strokeColorRef: { value: string },
    strokeWidthRef: { value: number },
    dashPatternRef: { value: number[] | undefined },
    startArrowRef?: { value: ArrowType },
    endArrowRef?: { value: ArrowType },
    textColorRef?: { value: string },
    fontSizeRef?: { value: number }
  ): void
}

class FillableElementPropertySetter implements ElementPropertySetter {
  setProperties(
    props: ElementProps | undefined,
    fillColorRef: { value: string },
    strokeColorRef: { value: string },
    strokeWidthRef: { value: number },
    dashPatternRef: { value: number[] | undefined },
    _startArrowRef?: { value: ArrowType },
    _endArrowRef?: { value: ArrowType },
    _textColorRef?: { value: string },
    _fontSizeRef?: { value: number }
  ): void {
    fillColorRef.value = props?.fillColor ?? '#ffffff'
    strokeColorRef.value = props?.strokeColor ?? '#000000'
    strokeWidthRef.value = props?.strokeWidth ?? 0
    dashPatternRef.value = props?.dashPattern ?? undefined
  }
}

class StrokeOnlyElementPropertySetter implements ElementPropertySetter {
  setProperties(
    props: ElementProps | undefined,
    _fillColorRef: { value: string },
    strokeColorRef: { value: string },
    strokeWidthRef: { value: number },
    dashPatternRef: { value: number[] | undefined },
    _startArrowRef?: { value: ArrowType },
    _endArrowRef?: { value: ArrowType },
    _textColorRef?: { value: string },
    _fontSizeRef?: { value: number }
  ): void {
    strokeColorRef.value = props?.strokeColor ?? '#000000'
    strokeWidthRef.value = props?.strokeWidth ?? 0
    dashPatternRef.value = props?.dashPattern ?? undefined
  }
}

class ArrowElementPropertySetter implements ElementPropertySetter {
  setProperties(
    props: ElementProps | undefined,
    _fillColorRef: { value: string },
    strokeColorRef: { value: string },
    strokeWidthRef: { value: number },
    dashPatternRef: { value: number[] | undefined },
    startArrowRef: { value: ArrowType },
    endArrowRef: { value: ArrowType },
    _textColorRef?: { value: string },
    _fontSizeRef?: { value: number }
  ): void {
    strokeColorRef.value = props?.strokeColor ?? '#000000'
    strokeWidthRef.value = props?.strokeWidth ?? 0
    dashPatternRef.value = props?.dashPattern ?? undefined
    startArrowRef.value = props?.startArrow ?? 'none'
    endArrowRef.value = props?.endArrow ?? 'arrow'
  }
}

class TextElementPropertySetter implements ElementPropertySetter {
  setProperties(
    props: ElementProps | undefined,
    _fillColorRef: { value: string },
    _strokeColorRef: { value: string },
    _strokeWidthRef: { value: number },
    _dashPatternRef: { value: number[] | undefined },
    _startArrowRef?: { value: ArrowType },
    _endArrowRef?: { value: ArrowType },
    textColorRef?: { value: string },
    fontSizeRef?: { value: number }
  ): void {
    if (textColorRef) {
      textColorRef.value = props?.textColor ?? '#000000'
    }
    if (fontSizeRef) {
      fontSizeRef.value = props?.fontSize ?? 16
    }
  }
}

const fillableElementPropertySetter = new FillableElementPropertySetter()
const strokeOnlyElementPropertySetter = new StrokeOnlyElementPropertySetter()
const arrowElementPropertySetter = new ArrowElementPropertySetter()
const textElementPropertySetter = new TextElementPropertySetter()

const elementPropertySetterMap: Record<string, ElementPropertySetter> = {
  rect: fillableElementPropertySetter,
  circle: fillableElementPropertySetter,
  line: strokeOnlyElementPropertySetter,
  pen: strokeOnlyElementPropertySetter,
  arrow: arrowElementPropertySetter,
  text: textElementPropertySetter,
}

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

  const selectedElementFillColor = ref<string>('#ffffff')
  const selectedElementStrokeColor = ref<string>('#000000')
  const selectedElementStrokeWidth = ref<number>(0)
  const selectedElementDashPattern = ref<number[] | undefined>(undefined)
  const selectedElementStartArrow = ref<ArrowType>('none')
  const selectedElementEndArrow = ref<ArrowType>('arrow')
  const selectedElementTextColor = ref<string>('#000000')
  const selectedElementFontSize = ref<number>(16)

  function showPopoverAt(
    x: number,
    y: number,
    elementType?: ElementType,
    element?: LeaferElement | null,
    props?: ElementProps
  ) {
    popoverX.value = x
    popoverY.value = y

    selectedElementType.value = elementType ?? null
    selectedElement.value = element ?? null

    if (elementType) {
      const propertySetter = elementPropertySetterMap[elementType]
      if (propertySetter) {
        propertySetter.setProperties(
          props,
          selectedElementFillColor,
          selectedElementStrokeColor,
          selectedElementStrokeWidth,
          selectedElementDashPattern,
          selectedElementStartArrow,
          selectedElementEndArrow,
          selectedElementTextColor,
          selectedElementFontSize
        )
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
    if (selectedElement.value && selectedElement.value instanceof Pen) {
      selectedElement.value.pathElement.stroke = color
      selectedElementStrokeColor.value = color
      debouncedAddSnapshot()
    } else if (selectedElement.value) {
      selectedElement.value.stroke = color
      selectedElementStrokeColor.value = color
      debouncedAddSnapshot()
    }
  }

  function updateElementStrokeWidth(width: number) {
    if (selectedElement.value && selectedElement.value instanceof Pen) {
      selectedElement.value.pathElement.strokeWidth = width
      selectedElementStrokeWidth.value = width
      debouncedAddSnapshot()
    } else if (selectedElement.value) {
      selectedElement.value.strokeWidth = width
      selectedElementStrokeWidth.value = width
      debouncedAddSnapshot()
    }
  }

  function updateElementDashPattern(pattern: number[] | undefined) {
    if (selectedElement.value && selectedElement.value instanceof Pen) {
      selectedElement.value.pathElement.dashPattern = pattern
      selectedElementDashPattern.value = pattern
      debouncedAddSnapshot()
    } else if (selectedElement.value) {
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
