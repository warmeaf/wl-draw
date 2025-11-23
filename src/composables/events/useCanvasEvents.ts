/**
 * Composable for handling canvas interaction events (drag, tap)
 */

import type { App } from 'leafer-ui'
import { DragEvent, Line, type Pen, PointerEvent, Text } from 'leafer-ui'
import { ref } from 'vue'
import type { ArrowType } from '@/components/common/ArrowPicker.vue'
import { useHistory } from '@/plugins/composables/useHistory'
import { pluginEventBus } from '@/plugins/events'
import { pluginRegistry } from '@/plugins/registry'
import type { ToolInstance } from '@/plugins/types'
import { type CanvasObject, useCanvasStore } from '@/stores/canvas'
import type { DrawingState } from '../tool/useToolInstance'

export function useCanvasEvents(
  app: App,
  drawingState: DrawingState,
  getToolInstance: (toolType: string) => ToolInstance | null,
  elementPopover?: ReturnType<typeof import('../state/useElementPopover').useElementPopover>,
  canvasContainer?: HTMLElement | null
) {
  const store = useCanvasStore()
  const tree = app.tree
  const { addSnapshot } = useHistory()
  const wasPopoverVisible = ref(false)

  function showPopoverForSelectedElement() {
    if (!elementPopover || !app.editor || !canvasContainer) return

    const selectedElements = app.editor.list
    if (selectedElements.length === 1 && selectedElements[0]) {
      const firstElement = selectedElements[0]
      const obj = store.objects.find((o) => o.element.innerId === firstElement.innerId)
      if (obj?.element && obj.type !== 'image') {
        const bounds = obj.element.getBounds()
        if (bounds) {
          const centerX = bounds.x + bounds.width + 5
          const topY = bounds.y
          const containerRect = canvasContainer.getBoundingClientRect()
          const clientX = containerRect.left + centerX
          const clientY = containerRect.top + topY

          const {
            fillColor,
            strokeColor,
            strokeWidth,
            dashPattern,
            startArrow,
            endArrow,
            textColor,
            fontSize,
          } = getElementProps(obj)
          elementPopover.showPopoverAt(clientX, clientY, obj.type, obj.element, {
            fillColor,
            strokeColor,
            strokeWidth,
            dashPattern,
            startArrow,
            endArrow,
            textColor,
            fontSize,
          })
        }
      }
    }
  }

  function handleDrag(e: DragEvent) {
    if (!tree || !drawingState.isDrawing.value) return

    const tool = store.currentTool
    const plugin = pluginRegistry.getByType(tool)
    if (!plugin || !plugin.capabilities?.handlesDrag) return

    const bounds = e.getPageBounds()
    if (bounds) {
      pluginEventBus.emit('drawing:update', {
        toolType: tool,
        bounds: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        },
      })
    }

    const toolInstance = getToolInstance(tool)
    if (toolInstance?.updateDrawing) {
      toolInstance.updateDrawing(e)
    }
  }

  async function handleDragEnd() {
    if (!tree) return

    if (drawingState.isDrawing.value) {
      const tool = store.currentTool
      const plugin = pluginRegistry.getByType(tool)
      if (!plugin || !plugin.capabilities?.handlesDragEnd) return

      const canFinish = await pluginRegistry.executeHook('beforeDrawingFinish', {
        toolType: tool,
      })
      if (!canFinish) {
        return
      }

      const objectCountBefore = store.objects.length

      const toolInstance = getToolInstance(tool)
      if (toolInstance?.finishDrawing) {
        toolInstance.finishDrawing()
      }

      const objectCountAfter = store.objects.length

      if (objectCountAfter > objectCountBefore) {
        addSnapshot()
      }

      await pluginRegistry.executeHook('afterDrawingFinish', {
        toolType: tool,
      })

      drawingState.resetState()
    } else if (drawingState.dragStartPositions.value.size > 0) {
      let hasPositionChanged = false
      const POSITION_THRESHOLD = 0.5

      for (const [objectId, startPosition] of drawingState.dragStartPositions.value.entries()) {
        const obj = store.objects.find((o) => o.id === objectId)
        if (obj?.element) {
          const currentX = obj.element.x ?? 0
          const currentY = obj.element.y ?? 0
          const deltaX = Math.abs(currentX - startPosition.x)
          const deltaY = Math.abs(currentY - startPosition.y)

          if (deltaX > POSITION_THRESHOLD || deltaY > POSITION_THRESHOLD) {
            hasPositionChanged = true
            break
          }
        }
      }

      if (hasPositionChanged) {
        addSnapshot()
      }

      if (wasPopoverVisible.value) {
        showPopoverForSelectedElement()
      }

      wasPopoverVisible.value = false
      drawingState.dragStartPositions.value.clear()
    }
  }

  function handleTap(e: PointerEvent) {
    if (!tree) return

    const tool = store.currentTool

    if (tool === 'select' && elementPopover && app.editor) {
      const selectedElements = app.editor.list
      if (selectedElements.length === 1) {
        showPopoverForSelectedElement()
      } else {
        elementPopover.hidePopover()
      }
    }

    const plugin = pluginRegistry.getByType(tool)
    if (!plugin || !plugin.capabilities?.handlesTap) return

    const objectCountBefore = store.objects.length

    const toolInstance = getToolInstance(tool)
    if (toolInstance?.handleTap) {
      toolInstance.handleTap(e)
    }

    if (tool === 'text') {
      const objectCountAfter = store.objects.length
      if (objectCountAfter > objectCountBefore) {
        addSnapshot()
      }
    }
  }

  function getElementProps(obj: CanvasObject) {
    const fillColor = (obj.element.fill as string) || '#ffffff'
    let strokeColor = ''
    let strokeWidth = 0
    let dashPattern: number[] | undefined
    let startArrow: ArrowType = 'none'
    let endArrow: ArrowType = 'arrow'
    let textColor: string | undefined
    let fontSize: number | undefined

    if (obj.type === 'pen') {
      strokeColor = (obj.element as Pen).pathElement.stroke as string
      strokeWidth = (obj.element as Pen).pathElement.strokeWidth as number
      dashPattern = (obj.element as Pen).pathElement.dashPattern as number[] | undefined
    } else if (obj.type === 'text' && obj.element instanceof Text) {
      textColor = (obj.element.fill as string) || '#000000'
      fontSize = obj.element.fontSize ?? 16
    } else {
      strokeColor = (obj.element.stroke as string) || '#000000'
      strokeWidth = (obj.element.strokeWidth ?? 0) as number
      dashPattern = (obj.element.dashPattern ?? undefined) as number[] | undefined

      if (obj.type === 'arrow' && obj.element instanceof Line) {
        startArrow = obj.element.startArrow as ArrowType
        endArrow = obj.element.endArrow as ArrowType
      }
    }

    return {
      fillColor,
      strokeColor,
      strokeWidth,
      dashPattern,
      startArrow,
      endArrow,
      textColor,
      fontSize,
    }
  }

  async function handleDragStart(e: DragEvent) {
    if (!tree) return

    const tool = store.currentTool
    const plugin = pluginRegistry.getByType(tool)

    if (app.mode === 'normal' && !drawingState.isDrawing.value) {
      const selectedObjectIds = app.editor.list.map((item) => {
        return store.objects.find((obj) => obj.element.innerId === item.innerId)?.id
      })
      if (selectedObjectIds.length > 0) {
        drawingState.dragStartPositions.value.clear()
        for (const objectId of selectedObjectIds) {
          if (!objectId) continue
          const obj = store.objects.find((o) => o.id === objectId)
          if (obj?.element) {
            drawingState.dragStartPositions.value.set(objectId, {
              x: obj.element.x ?? 0,
              y: obj.element.y ?? 0,
            })
          }
        }

        if (elementPopover?.showPopover.value) {
          wasPopoverVisible.value = true
          elementPopover.hidePopover()
        } else {
          wasPopoverVisible.value = false
        }
      }
    }

    if (!plugin || !plugin.capabilities?.handlesDragStart) return

    const bounds = e.getPageBounds()
    if (!bounds) return

    const drawingStartContext = {
      toolType: tool,
      point: { x: bounds.x, y: bounds.y },
    }

    const canStart = await pluginRegistry.executeHook('beforeDrawingStart', drawingStartContext)
    if (!canStart) {
      return
    }

    drawingState.startPoint.value = { x: bounds.x, y: bounds.y }
    drawingState.penPathPoints.value = [{ x: bounds.x, y: bounds.y }]
    drawingState.isDrawing.value = true

    pluginEventBus.emit('drawing:start', drawingStartContext)

    await pluginRegistry.executeHook('afterDrawingStart', drawingStartContext)

    const toolInstance = getToolInstance(tool)
    if (toolInstance?.startDrawing) {
      toolInstance.startDrawing()
    }
  }

  const dragStartId = app.on_(DragEvent.START, handleDragStart)
  const dragId = app.on_(DragEvent.DRAG, handleDrag)
  const dragEndId = app.on_(DragEvent.END, handleDragEnd)
  const tapId = app.on_(PointerEvent.TAP, handleTap)

  function cleanup() {
    app.off_(dragStartId)
    app.off_(dragId)
    app.off_(dragEndId)
    app.off_(tapId)
  }

  return {
    cleanup,
  }
}
