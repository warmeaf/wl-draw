/**
 * Canvas store for managing drawing state, tools, objects, and history
 */

import type { App } from 'leafer-ui'
import { Ellipse, Image, Line, Path, Pen, Rect, Text } from 'leafer-ui'
import { defineStore } from 'pinia'
import { canvasConfig } from '@/config/canvas'
import { themeColors } from '@/config/theme'
import type { LeaferElement, ToolType } from '@/types'
import type { HistorySnapshot } from '@/types/history'

export interface CanvasObject {
  id: string
  type: 'rect' | 'circle' | 'line' | 'arrow' | 'pen' | 'text' | 'image'
  element: NonNullable<LeaferElement>
  [key: string]: unknown
}

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    currentTool: 'select' as ToolType,
    previousTool: null as ToolType | null,

    isPanningWithSpace: false,

    appInstance: null as App | null,
    objects: [] as CanvasObject[],

    zoom: canvasConfig.zoom.default,
    fillColor: themeColors.fill,
    strokeColor: themeColors.stroke,
    strokeWidth: 2,
    fontSize: 16,
    textColor: themeColors.text,
  }),

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
      const newZoom = Math.max(
        canvasConfig.zoom.min,
        Math.min(canvasConfig.zoom.max, this.zoom + delta)
      )
      this.zoom = newZoom
      this.appInstance?.zoom(newZoom)
    },

    setZoom(zoom: number) {
      const newZoom = Math.max(canvasConfig.zoom.min, Math.min(canvasConfig.zoom.max, zoom))
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

    toSnapshot(): HistorySnapshot {
      const objects = this.objects.map((obj) => {
        const elementData = obj.element?.toJSON ? obj.element.toJSON() : null
        return {
          id: obj.id,
          type: obj.type,
          data: elementData,
        }
      })

      return {
        version: '1.0.0',
        metadata: {
          exportedAt: new Date().toISOString(),
          canvasZoom: this.zoom,
          canvasStyles: {
            fillColor: this.fillColor,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            fontSize: this.fontSize,
            textColor: this.textColor,
          },
        },
        objects,
      }
    },

    fromSnapshot(snapshot: HistorySnapshot) {
      if (!this.appInstance?.tree) {
        console.error('Canvas not initialized')
        return
      }

      const tree = this.appInstance.tree

      if (this.appInstance?.editor) {
        this.appInstance.editor.cancel()
      }

      this.objects.forEach((obj) => {
        if (obj.element && tree) {
          tree.remove(obj.element)
        }
      })

      this.objects = []

      snapshot.objects.forEach((objData) => {
        if (!objData.data || typeof objData.data !== 'object') return

        const data = objData.data as Record<string, unknown>
        const tag = data.tag as string

        if (!tag) return

        let element: LeaferElement = null

        try {
          switch (tag) {
            case 'Rect':
              element = new Rect(data as ConstructorParameters<typeof Rect>[0])
              break
            case 'Ellipse':
              element = new Ellipse(data as ConstructorParameters<typeof Ellipse>[0])
              break
            case 'Path':
              element = new Path(data as ConstructorParameters<typeof Path>[0])
              break
            case 'Line':
              element = new Line(data as ConstructorParameters<typeof Line>[0])
              break
            case 'Pen':
              element = new Pen(data as ConstructorParameters<typeof Pen>[0])
              break
            case 'Text':
              element = new Text(data as ConstructorParameters<typeof Text>[0])
              break
            case 'Image':
              element = new Image(data as ConstructorParameters<typeof Image>[0])
              break
            default:
              console.warn(`Unknown element tag: ${tag}`)
              return
          }

          if (element) {
            tree.add(element)
            this.objects.push({
              id: objData.id,
              type: objData.type as CanvasObject['type'],
              element,
            })
          }
        } catch (error) {
          console.error(`Error creating element from snapshot:`, error)
        }
      })

      if (snapshot.metadata) {
        this.setZoom(snapshot.metadata.canvasZoom)
        this.setFillColor(snapshot.metadata.canvasStyles.fillColor)
        this.setStrokeColor(snapshot.metadata.canvasStyles.strokeColor)
        this.setStrokeWidth(snapshot.metadata.canvasStyles.strokeWidth)
        this.setFontSize(snapshot.metadata.canvasStyles.fontSize)
        this.setTextColor(snapshot.metadata.canvasStyles.textColor)
      }
    },
  },
})
