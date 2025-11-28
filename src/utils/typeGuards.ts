/**
 * Type guard utilities for runtime type checking
 */

import type { Line, Text } from 'leafer-ui'
import type { ArrowType } from '@/components/common/ArrowPicker.vue'

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number')
}

export function getStringProperty(
  obj: Record<string, unknown>,
  key: string,
  defaultValue: string
): string {
  const value = obj[key]
  return isString(value) ? value : defaultValue
}

export function getNumberProperty(
  obj: Record<string, unknown>,
  key: string,
  defaultValue: number
): number {
  const value = obj[key]
  return isNumber(value) ? value : defaultValue
}

export function getStringArrayProperty(
  obj: Record<string, unknown>,
  key: string
): string[] | undefined {
  const value = obj[key]
  return isStringArray(value) ? value : undefined
}

export function getNumberArrayProperty(
  obj: Record<string, unknown>,
  key: string
): number[] | undefined {
  const value = obj[key]
  return isNumberArray(value) ? value : undefined
}

export function isValidArrowType(value: unknown): value is ArrowType {
  const validArrowTypes: ArrowType[] = [
    'none',
    'angle',
    'angle-side',
    'arrow',
    'triangle',
    'triangle-flip',
    'circle',
    'circle-line',
    'square',
    'square-line',
    'diamond',
    'diamond-line',
    'mark',
  ]
  return isString(value) && validArrowTypes.includes(value as ArrowType)
}

export function getArrowTypeProperty(
  obj: Record<string, unknown>,
  key: string,
  defaultValue: ArrowType
): ArrowType {
  const value = obj[key]
  return isValidArrowType(value) ? value : defaultValue
}

export function getTextFillColor(text: Text): string {
  const fill = text.fill
  return isString(fill) ? fill : '#000000'
}

export function getLineArrowType(line: Line, property: 'startArrow' | 'endArrow'): ArrowType {
  const value = line[property]
  return isValidArrowType(value) ? value : property === 'startArrow' ? 'none' : 'arrow'
}
