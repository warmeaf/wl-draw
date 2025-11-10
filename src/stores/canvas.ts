/**
 * Canvas store for managing drawing state, tools, objects, and history
 */

import type { App, Ellipse, Image, Line, Path, Pen, Rect, Text } from 'leafer-ui'
import { defineStore } from 'pinia'
import { themeColors } from '@/config/theme'
import type { ToolType } from '@/types'

export type LeaferElement = Rect | Ellipse | Path | Line | Pen | Text | Image

export interface CanvasObject {
  id: string
  type: 'rect' | 'circle' | 'line' | 'arrow' | 'pen' | 'text' | 'image'
  element: LeaferElement
  [key: string]: unknown
}

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    currentTool: 'select' as ToolType,
    previousTool: null as ToolType | null,

    isPanningWithSpace: false,

    appInstance: null as App | null,
    objects: [] as CanvasObject[],

    zoom: 1,
    fillColor: themeColors.fill,
    strokeColor: themeColors.stroke,
    strokeWidth: 2,
    fontSize: 16,
    textColor: themeColors.text,
  }),

  getters: {
    selectedObjectIds: (state) => {
      return (
        state.appInstance?.editor.list.map((item) => {
          return state.objects.find((obj) => obj.element.innerId === item.innerId)?.id
        }) || []
      )
    },
  },

  actions: {
    setTool(tool: ToolType) {
      this.currentTool = tool
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
        }
      }
    },

    selectObject(id: string) {
      const obj = this.objects.find((obj) => obj.id === id)
      if (obj && this.appInstance?.editor) {
        this.appInstance.editor.select(obj.element)
      }
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
