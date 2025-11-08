/**
 * Canvas store - State management for drawing application
 * Manages tools, objects, selection, zoom, and history
 */
import { defineStore } from 'pinia'
import type { App } from 'leafer-ui'
import { themeColors } from '@/config/theme'

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

import type { Rect, Ellipse, Path, Line, Pen, Text, Image } from 'leafer-ui'

export type LeaferElement = Rect | Ellipse | Path | Line | Pen | Text | Image

export interface CanvasObject {
  id: string
  type: 'rect' | 'circle' | 'line' | 'arrow' | 'pen' | 'text' | 'image'
  element: LeaferElement
  [key: string]: unknown
}

export interface SerializedElement {
  x?: number
  y?: number
  width?: number
  height?: number
  path?: string | number[] | unknown[]
  text?: string | number
  url?: string
  fill?: string | unknown
  stroke?: string | unknown
  strokeWidth?: number | string
  fontSize?: number
}

export interface HistoryState {
  objects: Array<Omit<CanvasObject, 'element'> & { element: SerializedElement | null }>
}

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    currentTool: 'select' as ToolType,
    previousTool: null as ToolType | null,
    isPanningWithSpace: false,
    appInstance: null as App | null,
    objects: [] as CanvasObject[],
    selectedObjectId: null as string | null,
    zoom: 1,
    history: [] as HistoryState[],
    historyIndex: -1,
    fillColor: themeColors.fill,
    strokeColor: themeColors.stroke,
    strokeWidth: 2,
    fontSize: 16,
    textColor: themeColors.text,
  }),

  getters: {
    selectedObject: (state) => {
      if (!state.selectedObjectId) return null
      return state.objects.find((obj) => obj.id === state.selectedObjectId) || null
    },
    canUndo: (state) => state.historyIndex > 0,
    canRedo: (state) => state.historyIndex < state.history.length - 1,
  },

  actions: {
    setTool(tool: ToolType) {
      this.currentTool = tool

      if (tool !== 'select') {
        this.selectedObjectId = null
      }
    },

    enablePanWithSpace() {
      if (this.isPanningWithSpace) return
      if (this.currentTool === 'pan') return

      this.isPanningWithSpace = true
      this.previousTool = this.currentTool
      this.setTool('pan')
    },

    disablePanWithSpace() {
      if (!this.isPanningWithSpace) return

      this.isPanningWithSpace = false
      const toolToRestore = this.previousTool || 'select'
      this.previousTool = null
      this.setTool(toolToRestore)
    },

    setAppInstance(app: App) {
      this.appInstance = app
    },

    addObject(object: CanvasObject) {
      this.objects.push(object)
      if (object.element) {
        object.element.draggable = this.currentTool === 'select'
      }
      this.saveHistory()
    },

    removeObject(id: string) {
      const index = this.objects.findIndex((obj) => obj.id === id)
      if (index !== -1) {
        const obj = this.objects[index]
        if (obj) {
          if (obj.element && this.appInstance?.tree && this.appInstance.editor) {
            this.appInstance.tree.remove(obj.element)
            this.appInstance.editor.cancel()
          }
          this.objects.splice(index, 1)
          if (this.selectedObjectId === id) {
            this.selectedObjectId = null
          }
          this.saveHistory()
        }
      }
    },

    selectObject(id: string | null) {
      this.selectedObjectId = id
    },

    updateZoom(delta: number) {
      const newZoom = Math.max(0.02, Math.min(256, this.zoom + delta))
      this.zoom = newZoom
      this.appInstance?.zoom(newZoom)
    },

    setZoom(zoom: number) {
      const newZoom = Math.max(0.02, Math.min(256, zoom))
      this.zoom = newZoom
      this.appInstance?.zoom(newZoom)
    },

    saveHistory() {
      // Create a snapshot of current state
      const currentState: HistoryState = {
        objects: this.objects.map((obj) => {
          if (!obj.element) {
            return {
              ...obj,
              element: null,
            }
          }

          const element = obj.element
          const serializedElement: SerializedElement = {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            fill: element.fill,
            stroke: element.stroke,
          }

          if (element.strokeWidth !== undefined) {
            serializedElement.strokeWidth = element.strokeWidth as number | string
          }

          if ('path' in element && element.path !== undefined) {
            serializedElement.path = element.path
          }
          if ('text' in element && element.text !== undefined) {
            serializedElement.text = element.text
          }
          if ('url' in element && element.url !== undefined) {
            serializedElement.url = element.url
          }
          if ('fontSize' in element && element.fontSize !== undefined) {
            serializedElement.fontSize = element.fontSize
          }

          return {
            ...obj,
            element: serializedElement,
          }
        }),
      }

      // Remove old history after current index
      this.history = this.history.slice(0, this.historyIndex + 1)
      this.history.push(currentState)
      this.historyIndex = this.history.length - 1

      // Limit history size
      if (this.history.length > 50) {
        this.history.shift()
        this.historyIndex--
      }
    },

    undo() {
      if (this.canUndo && this.historyIndex > 0) {
        this.historyIndex--
        this.restoreHistory()
      }
    },

    redo() {
      if (this.canRedo && this.historyIndex < this.history.length - 1) {
        this.historyIndex++
        this.restoreHistory()
      }
    },

    restoreHistory() {
      if (this.historyIndex >= 0 && this.history[this.historyIndex]) {
        // Remove all current objects from tree
        this.objects.forEach((obj) => {
          if (obj.element && this.appInstance?.tree) {
            this.appInstance.tree.remove(obj.element)
          }
        })

        // Restore objects from history
        // Note: This is a simplified restoration. In production, you'd need to
        // recreate elements from stored properties
        this.objects = []
        this.selectedObjectId = null

        // TODO: Implement proper element restoration from history state
        // This requires recreating Rect, Ellipse, Path, Text, Image elements
        // from the stored properties
      }
    },

    // Style setters
    setFillColor(color: string) {
      this.fillColor = color
    },

    setStrokeColor(color: string) {
      this.strokeColor = color
    },

    setStrokeWidth(width: number) {
      this.strokeWidth = width
    },

    setFontSize(size: number) {
      this.fontSize = size
    },

    setTextColor(color: string) {
      this.textColor = color
    },
  },
})
