/**
 * Utility functions for extracting element properties from canvas objects
 */

import { Line, Text } from 'leafer-ui'
import type { ArrowType } from '@/components/common/ArrowPicker.vue'
import { ELEMENT_TYPES, UI_CONSTANTS } from '@/constants'
import type { CanvasObject } from '@/stores/canvas'
import { getLineArrowType, getTextFillColor } from '@/utils/typeGuards'

const DEFAULT_FILL_COLOR = '#ffffff'
const DEFAULT_STROKE_COLOR = '#000000'
const DEFAULT_STROKE_WIDTH = 0
const DEFAULT_FONT_SIZE = 16

export interface ElementProps {
  fillColor: string
  strokeColor: string
  strokeWidth: number
  dashPattern?: number[] | undefined
  startArrow: ArrowType
  endArrow: ArrowType
  textColor?: string
  fontSize?: number
}

function getTextElementProperties(text: Text): { textColor: string; fontSize: number } {
  return {
    textColor: getTextFillColor(text),
    fontSize: text.fontSize ?? DEFAULT_FONT_SIZE,
  }
}

function getStandardElementProperties(obj: CanvasObject): {
  strokeColor: string
  strokeWidth: number
  dashPattern?: number[] | undefined
  startArrow: ArrowType
  endArrow: ArrowType
} {
  const strokeColor =
    typeof obj.element.stroke === 'string' ? obj.element.stroke : DEFAULT_STROKE_COLOR
  const strokeWidth =
    typeof obj.element.strokeWidth === 'number' ? obj.element.strokeWidth : DEFAULT_STROKE_WIDTH
  const dashPattern =
    Array.isArray(obj.element.dashPattern) &&
    obj.element.dashPattern.every((item) => typeof item === 'number')
      ? (obj.element.dashPattern as number[])
      : undefined

  let startArrow: ArrowType = 'none'
  let endArrow: ArrowType = UI_CONSTANTS.DEFAULT_END_ARROW

  if (obj.type === ELEMENT_TYPES.ARROW && obj.element instanceof Line) {
    startArrow = getLineArrowType(obj.element, 'startArrow')
    endArrow = getLineArrowType(obj.element, 'endArrow')
  }

  return {
    strokeColor,
    strokeWidth,
    dashPattern,
    startArrow,
    endArrow,
  }
}

export function getElementProperties(obj: CanvasObject): ElementProps {
  const fillColor = typeof obj.element.fill === 'string' ? obj.element.fill : DEFAULT_FILL_COLOR

  if (obj.type === ELEMENT_TYPES.TEXT && obj.element instanceof Text) {
    const textProps = getTextElementProperties(obj.element)
    return {
      fillColor,
      strokeColor: '',
      strokeWidth: 0,
      dashPattern: undefined,
      startArrow: 'none' as ArrowType,
      endArrow: UI_CONSTANTS.DEFAULT_END_ARROW,
      ...textProps,
    }
  }

  const standardProps = getStandardElementProperties(obj)
  return {
    fillColor,
    ...standardProps,
    textColor: undefined,
    fontSize: undefined,
  }
}
