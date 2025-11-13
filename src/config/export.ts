/**
 * Export format configuration constants
 */

export const exportFormats = {
  png: 'PNG',
  jpg: 'JPG',
} as const

export type ExportFormat = keyof typeof exportFormats
