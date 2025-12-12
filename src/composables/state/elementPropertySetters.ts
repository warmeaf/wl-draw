/**
 * Property setters for different element types
 */

import type { ArrowType } from '@/components/common/ArrowPicker.vue'

export interface ElementProps {
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  dashPattern?: number[] | undefined
  startArrow?: ArrowType
  endArrow?: ArrowType
  textColor?: string
  fontSize?: number
}

export interface ElementPropertyRefs {
  fillColor: { value: string }
  strokeColor: { value: string }
  strokeWidth: { value: number }
  dashPattern: { value: number[] | undefined }
  startArrow?: { value: ArrowType }
  endArrow?: { value: ArrowType }
  textColor?: { value: string }
  fontSize?: { value: number }
}

export interface ElementPropertySetter {
  setProperties(props: ElementProps | undefined, refs: ElementPropertyRefs): void
}

const DEFAULT_FILL_COLOR = '#ffffff'
const DEFAULT_STROKE_COLOR = '#000000'
const DEFAULT_STROKE_WIDTH = 0
const DEFAULT_START_ARROW: ArrowType = 'none'
const DEFAULT_END_ARROW: ArrowType = 'arrow'
const DEFAULT_TEXT_COLOR = '#000000'
const DEFAULT_FONT_SIZE = 16

class FillableElementPropertySetter implements ElementPropertySetter {
  setProperties(props: ElementProps | undefined, refs: ElementPropertyRefs): void {
    refs.fillColor.value = props?.fillColor ?? DEFAULT_FILL_COLOR
    refs.strokeColor.value = props?.strokeColor ?? DEFAULT_STROKE_COLOR
    refs.strokeWidth.value = props?.strokeWidth ?? DEFAULT_STROKE_WIDTH
    refs.dashPattern.value = props?.dashPattern ?? undefined
  }
}

class StrokeOnlyElementPropertySetter implements ElementPropertySetter {
  setProperties(props: ElementProps | undefined, refs: ElementPropertyRefs): void {
    refs.strokeColor.value = props?.strokeColor ?? DEFAULT_STROKE_COLOR
    refs.strokeWidth.value = props?.strokeWidth ?? DEFAULT_STROKE_WIDTH
    refs.dashPattern.value = props?.dashPattern ?? undefined
  }
}

class ArrowElementPropertySetter implements ElementPropertySetter {
  setProperties(props: ElementProps | undefined, refs: ElementPropertyRefs): void {
    refs.strokeColor.value = props?.strokeColor ?? DEFAULT_STROKE_COLOR
    refs.strokeWidth.value = props?.strokeWidth ?? DEFAULT_STROKE_WIDTH
    refs.dashPattern.value = props?.dashPattern ?? undefined
    if (refs.startArrow) {
      refs.startArrow.value = props?.startArrow ?? DEFAULT_START_ARROW
    }
    if (refs.endArrow) {
      refs.endArrow.value = props?.endArrow ?? DEFAULT_END_ARROW
    }
  }
}

class TextElementPropertySetter implements ElementPropertySetter {
  setProperties(props: ElementProps | undefined, refs: ElementPropertyRefs): void {
    if (refs.textColor) {
      refs.textColor.value = props?.textColor ?? DEFAULT_TEXT_COLOR
    }
    if (refs.fontSize) {
      refs.fontSize.value = props?.fontSize ?? DEFAULT_FONT_SIZE
    }
  }
}

export const fillableElementPropertySetter = new FillableElementPropertySetter()
export const strokeOnlyElementPropertySetter = new StrokeOnlyElementPropertySetter()
export const arrowElementPropertySetter = new ArrowElementPropertySetter()
export const textElementPropertySetter = new TextElementPropertySetter()

export const elementPropertySetterMap: Record<string, ElementPropertySetter> = {
  rect: fillableElementPropertySetter,
  circle: fillableElementPropertySetter,
  line: strokeOnlyElementPropertySetter,
  pen: strokeOnlyElementPropertySetter,
  arrow: arrowElementPropertySetter,
  text: textElementPropertySetter,
}
