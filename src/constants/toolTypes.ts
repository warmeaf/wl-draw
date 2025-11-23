/**
 * Tool type constants for the drawing application
 */

export const TOOL_TYPES = {
  SELECT: 'select',
  PAN: 'pan',
  RECT: 'rect',
  CIRCLE: 'circle',
  LINE: 'line',
  ARROW: 'arrow',
  PEN: 'pen',
  TEXT: 'text',
  IMAGE: 'image',
} as const

export type ToolTypeValue = (typeof TOOL_TYPES)[keyof typeof TOOL_TYPES]
