/**
 * Export format configuration constants
 */

export const exportFormats = {
  png: 'PNG',
  jpg: 'JPG',
  json: 'JSON',
} as const

export type ExportFormat = keyof typeof exportFormats
