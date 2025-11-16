/**
 * History type definitions for canvas state snapshots
 */

export interface CanvasStyles {
  fillColor: string
  strokeColor: string
  strokeWidth: number
  fontSize: number
  textColor: string
}

export interface HistoryMetadata {
  exportedAt: string
  canvasZoom: number
  canvasStyles: CanvasStyles
}

export interface HistoryObject {
  id: string
  type: string
  data: unknown
}

export interface HistorySnapshot {
  version: string
  metadata: HistoryMetadata
  objects: HistoryObject[]
}
