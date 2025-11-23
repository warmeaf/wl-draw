/**
 * Element type constants for canvas objects
 */

export const ELEMENT_TYPES = {
  RECT: 'rect',
  CIRCLE: 'circle',
  LINE: 'line',
  ARROW: 'arrow',
  PEN: 'pen',
  TEXT: 'text',
  IMAGE: 'image',
} as const

export type ElementTypeValue = (typeof ELEMENT_TYPES)[keyof typeof ELEMENT_TYPES]
