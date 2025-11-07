/**
 * Canvas store - State management for drawing application
 * Manages tools, objects, selection, zoom, and history
 */
import { defineStore } from 'pinia'
import type { App } from 'leafer-ui'
import type { Editor } from '@leafer-in/editor'

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
    editorInstance: null as Editor | null,
    objects: [] as CanvasObject[],
    selectedObjectId: null as string | null,
    zoom: 1,
    history: [] as HistoryState[],
    historyIndex: -1,
    // Style properties
    fillColor: '#3b82f6',
    strokeColor: '#1e40af',
    strokeWidth: 2,
    fontSize: 16,
    textColor: '#000000',
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
    setTool(tool: ToolType, isTemporary = false) {
      if (!isTemporary) {
        if (tool === 'pan' && this.isPanningWithSpace) {
          this.isPanningWithSpace = false
          this.previousTool = null
        }
        if (!this.isPanningWithSpace && tool !== 'pan') {
          this.previousTool = tool
        }
      }

      this.currentTool = tool

      // Clear selection when switching tools (except select)
      if (tool !== 'select') {
        this.selectedObjectId = null
      }

      // Update draggable state based on tool
      this.objects.forEach((obj) => {
        if (obj.element) {
          if (tool === 'pan') {
            obj.element.draggable = false
          } else if (tool === 'select') {
            obj.element.draggable = true
          }
        }
      })
    },

    enablePanWithSpace() {
      if (this.isPanningWithSpace) return
      if (this.currentTool === 'pan') return

      this.isPanningWithSpace = true
      this.previousTool = this.currentTool
      this.setTool('pan', true)
    },

    disablePanWithSpace() {
      if (!this.isPanningWithSpace) return

      this.isPanningWithSpace = false
      const toolToRestore = this.previousTool || 'select'
      this.previousTool = null
      this.setTool(toolToRestore, false)
    },

    setAppInstance(app: App) {
      this.appInstance = app
    },

    setEditorInstance(editor: Editor) {
      this.editorInstance = editor
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
          // Remove element from tree
          if (obj.element && this.appInstance?.tree) {
            this.appInstance.tree.remove(obj.element)
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
      const newZoom = Math.max(0.1, Math.min(5, this.zoom + delta))
      this.zoom = newZoom
      if (this.appInstance?.tree?.zoomLayer) {
        this.appInstance.tree.zoomLayer.scaleX = newZoom
        this.appInstance.tree.zoomLayer.scaleY = newZoom
      }
    },

    setZoom(zoom: number) {
      const newZoom = Math.max(0.1, Math.min(5, zoom))
      this.zoom = newZoom
      if (this.appInstance?.tree?.zoomLayer) {
        this.appInstance.tree.zoomLayer.scaleX = newZoom
        this.appInstance.tree.zoomLayer.scaleY = newZoom
      }
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
