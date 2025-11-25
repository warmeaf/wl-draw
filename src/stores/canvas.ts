/**
 * Canvas store for managing drawing state, tools, objects, and history
 */

import type { App } from 'leafer-ui'
import { Ellipse, Image, Line, Path, Pen, Rect, Text } from 'leafer-ui'
import { defineStore } from 'pinia'
import { canvasConfig } from '@/config/canvas'
import { ELEMENT_TYPES, TOOL_TYPES } from '@/constants'
import type { LeaferElement, ToolType } from '@/types'
import type { ElementType } from '@/types/elementTypes'
import type { HistorySnapshot } from '@/types/history'
import { errorHandler } from '@/utils/errorHandler'

export interface CanvasObject {
  id: string
  type: ElementType
  element: NonNullable<LeaferElement>
  [key: string]: unknown
}

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    currentTool: TOOL_TYPES.SELECT as ToolType,
    previousTool: null as ToolType | null,

    isPanningWithSpace: false,

    appInstance: null as App | null,
    objects: [] as CanvasObject[],

    zoom: canvasConfig.zoom.default,
    fillColor: canvasConfig.theme.fill,
    strokeColor: canvasConfig.theme.stroke,
    strokeWidth: 2,
    fontSize: 16,
    textColor: canvasConfig.theme.text,
  }),

  actions: {
    setTool(tool: ToolType) {
      this.currentTool = tool
    },

    enablePanWithSpace() {
      if (this.isPanningWithSpace) return
      if (this.currentTool === TOOL_TYPES.PAN) return

      this.isPanningWithSpace = true
      this.previousTool = this.currentTool
      this.setTool(TOOL_TYPES.PAN)
    },

    disablePanWithSpace() {
      if (!this.isPanningWithSpace) return

      this.isPanningWithSpace = false
      const toolToRestore = this.previousTool || TOOL_TYPES.SELECT
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

    clearCanvas() {
      if (!this.appInstance?.tree) {
        errorHandler.handleCanvasError('Canvas not initialized')
        return false
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
      return true
    },

    createElementFromData(tag: string, data: Record<string, unknown>): LeaferElement | null {
      try {
        switch (tag) {
          case 'Rect':
            return new Rect(data as ConstructorParameters<typeof Rect>[0])
          case 'Ellipse':
            return new Ellipse(data as ConstructorParameters<typeof Ellipse>[0])
          case 'Path':
            return new Path(data as ConstructorParameters<typeof Path>[0])
          case 'Line':
            return new Line(data as ConstructorParameters<typeof Line>[0])
          case 'Pen':
            return new Pen(data as ConstructorParameters<typeof Pen>[0])
          case 'Text':
            return new Text(data as ConstructorParameters<typeof Text>[0])
          case 'Image':
            return new Image(data as ConstructorParameters<typeof Image>[0])
          default:
            errorHandler.warn(`Unknown element tag: ${tag}`)
            return null
        }
      } catch (error) {
        errorHandler.handleRuntimeError(
          `Error creating element from snapshot`,
          error instanceof Error ? error : undefined,
          { tag }
        )
        return null
      }
    },

    /**
     * Type guard to validate element types during snapshot restoration.
     * Prevents invalid types from being restored, maintaining data integrity.
     */
    isValidObjectType(type: string): type is CanvasObject['type'] {
      return (
        type === ELEMENT_TYPES.RECT ||
        type === ELEMENT_TYPES.CIRCLE ||
        type === ELEMENT_TYPES.LINE ||
        type === ELEMENT_TYPES.ARROW ||
        type === ELEMENT_TYPES.PEN ||
        type === ELEMENT_TYPES.TEXT ||
        type === ELEMENT_TYPES.IMAGE
      )
    },

    restoreObjectsFromSnapshot(snapshot: HistorySnapshot) {
      if (!this.appInstance?.tree) return

      const tree = this.appInstance.tree

      snapshot.objects.forEach((objData) => {
        if (!objData.data || typeof objData.data !== 'object') return

        const data = objData.data as Record<string, unknown>
        const tag = typeof data.tag === 'string' ? data.tag : null

        if (!tag) return

        const element = this.createElementFromData(tag, data)

        if (element && this.isValidObjectType(objData.type)) {
          tree.add(element)
          this.objects.push({
            id: objData.id,
            type: objData.type,
            element,
          })
        } else if (element) {
          errorHandler.warn(`Unknown object type: ${objData.type}`)
        }
      })
    },

    restoreCanvasStyles(styles: HistorySnapshot['metadata']['canvasStyles']) {
      this.setFillColor(styles.fillColor)
      this.setStrokeColor(styles.strokeColor)
      this.setStrokeWidth(styles.strokeWidth)
      this.setFontSize(styles.fontSize)
      this.setTextColor(styles.textColor)
    },

    fromSnapshot(snapshot: HistorySnapshot) {
      if (!this.clearCanvas()) return

      this.restoreObjectsFromSnapshot(snapshot)

      if (snapshot.metadata) {
        this.setZoom(snapshot.metadata.canvasZoom)
        this.restoreCanvasStyles(snapshot.metadata.canvasStyles)
      }
    },
  },
})
