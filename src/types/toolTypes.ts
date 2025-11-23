/**
 * Tool type definitions and type guards
 */

import { TOOL_TYPES } from '@/constants'

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
  TOOL_TYPES.SELECT,
  TOOL_TYPES.PAN,
  TOOL_TYPES.RECT,
  TOOL_TYPES.CIRCLE,
  TOOL_TYPES.LINE,
  TOOL_TYPES.ARROW,
  TOOL_TYPES.PEN,
  TOOL_TYPES.TEXT,
  TOOL_TYPES.IMAGE,
] as const

export function isValidToolType(type: string): type is ToolType {
  return VALID_TOOL_TYPES.includes(type as ToolType)
}
