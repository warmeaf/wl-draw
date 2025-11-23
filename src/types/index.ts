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

export type { ElementType } from './elementTypes'
export { isValidElementType } from './elementTypes'
export type { ToolType } from './toolTypes'
export { isValidToolType } from './toolTypes'
