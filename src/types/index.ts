/**
 * Core type definitions for the drawing application
 */

import type { App, Ellipse, Image, Line, Path, Pen, Rect, Text } from 'leafer-ui'

export interface Point {
  x: number
  y: number
}

export type Tree = App['tree']

export type LeaferElement = Rect | Ellipse | Path | Line | Pen | Text | Image | null

export type ToolType =
  | 'select'
  | 'pan'
  | 'rect'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'pen'
  | 'text'
  | 'image'

const VALID_TOOL_TYPES: readonly ToolType[] = [
  'select',
  'pan',
  'rect',
  'circle',
  'line',
  'arrow',
  'pen',
  'text',
  'image',
] as const

export function isValidToolType(type: string): type is ToolType {
  return VALID_TOOL_TYPES.includes(type as ToolType)
}
