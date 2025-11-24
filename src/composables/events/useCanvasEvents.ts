/**
 * Composable for handling canvas interaction events (drag, tap)
 */

import type { App } from 'leafer-ui'
import { DragEvent, Line, MoveEvent, type Pen, PointerEvent, Text } from 'leafer-ui'
import { ref } from 'vue'
import type { ArrowType } from '@/components/common/ArrowPicker.vue'
import { ELEMENT_TYPES, THRESHOLDS, TOOL_TYPES, UI_CONSTANTS } from '@/constants'
import { useHistory } from '@/plugins/composables/useHistory'
import { pluginEventBus } from '@/plugins/events'
import { pluginRegistry } from '@/plugins/registry'
import type { ToolInstance } from '@/plugins/types'
import { type CanvasObject, useCanvasStore } from '@/stores/canvas'
import {
  getLineArrowType,
  getPenDashPattern,
  getPenStrokeColor,
  getPenStrokeWidth,
  getTextFillColor,
} from '@/utils/typeGuards'
import type { DrawingState } from '../tool/useToolInstance'

export function useCanvasEvents(
  app: App,
  drawingState: DrawingState,
  getToolInstance: (toolType: string) => Promise<ToolInstance | null>,
  elementPopover?: ReturnType<typeof import('../state/useElementPopover').useElementPopover>,
  canvasContainer?: HTMLElement | null
) {
  const store = useCanvasStore()
  const tree = app.tree
  const { addSnapshot } = useHistory()
  const wasPopoverVisibleBeforeDrag = ref(false)

  function showPopoverForSelectedElement() {
    if (!elementPopover || !app.editor || !canvasContainer) return

    const selectedElements = app.editor.list
    if (selectedElements.length === 1 && selectedElements[0]) {
      const firstElement = selectedElements[0]
      const obj = store.objects.find((o) => o.element.innerId === firstElement.innerId)
      if (obj?.element && obj.type !== ELEMENT_TYPES.IMAGE) {
        const bounds = obj.element.getBounds()
        if (bounds) {
          const centerX = bounds.x + bounds.width + UI_CONSTANTS.ELEMENT_POPOVER_OFFSET_X
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

  async function handleDrag(e: DragEvent) {
    if (!tree || !drawingState.isDrawing.value) return

    const tool = store.currentTool
    const plugin = await pluginRegistry.getByType(tool)
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

    const toolInstance = await getToolInstance(tool)
    if (toolInstance?.updateDrawing) {
      toolInstance.updateDrawing(e)
    }
  }

  async function finishDrawing() {
    const tool = store.currentTool
    const plugin = await pluginRegistry.getByType(tool)
    if (!plugin || !plugin.capabilities?.handlesDragEnd) return false

    const canFinish = await pluginRegistry.executeHook('beforeDrawingFinish', {
      toolType: tool,
    })
    if (!canFinish) {
      return false
    }

    const objectCountBefore = store.objects.length

    const toolInstance = await getToolInstance(tool)
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
    return true
  }

  /**
   * Checks if any dragged object has moved beyond the minimum threshold.
   * Uses threshold to avoid creating snapshots for micro-movements that don't represent intentional changes.
   */
  function hasObjectPositionChanged(): boolean {
    for (const [objectId, startPosition] of drawingState.dragStartPositions.value.entries()) {
      const obj = store.objects.find((o) => o.id === objectId)
      if (obj?.element) {
        const currentX = obj.element.x ?? 0
        const currentY = obj.element.y ?? 0
        const deltaX = Math.abs(currentX - startPosition.x)
        const deltaY = Math.abs(currentY - startPosition.y)

        if (
          deltaX > THRESHOLDS.POSITION_CHANGE_MIN_DELTA ||
          deltaY > THRESHOLDS.POSITION_CHANGE_MIN_DELTA
        ) {
          return true
        }
      }
    }
    return false
  }

  function handleObjectDragEnd() {
    if (hasObjectPositionChanged()) {
      addSnapshot()
    }

    if (wasPopoverVisibleBeforeDrag.value) {
      showPopoverForSelectedElement()
    }

    wasPopoverVisibleBeforeDrag.value = false
    drawingState.dragStartPositions.value.clear()
  }

  async function handleDragEnd() {
    if (!tree) return

    if (drawingState.isDrawing.value) {
      await finishDrawing()
    } else if (drawingState.dragStartPositions.value.size > 0) {
      handleObjectDragEnd()
    }
  }

  async function handleTap(e: PointerEvent) {
    if (!tree) return

    const tool = store.currentTool

    if (tool === TOOL_TYPES.SELECT && elementPopover && app.editor) {
      const selectedElements = app.editor.list
      if (selectedElements.length === 1) {
        showPopoverForSelectedElement()
      } else {
        elementPopover.hidePopover()
      }
    }

    const plugin = await pluginRegistry.getByType(tool)
    if (!plugin || !plugin.capabilities?.handlesTap) return

    const objectCountBefore = store.objects.length

    const toolInstance = await getToolInstance(tool)
    if (toolInstance?.handleTap) {
      toolInstance.handleTap(e)
    }

    if (tool === TOOL_TYPES.TEXT) {
      const objectCountAfter = store.objects.length
      if (objectCountAfter > objectCountBefore) {
        addSnapshot()
      }
    }
  }

  function getPenElementProps(pen: Pen) {
    return {
      strokeColor: getPenStrokeColor(pen),
      strokeWidth: getPenStrokeWidth(pen),
      dashPattern: getPenDashPattern(pen),
    }
  }

  function getTextElementProps(text: Text) {
    return {
      textColor: getTextFillColor(text),
      fontSize: text.fontSize ?? 16,
    }
  }

  function getStandardElementProps(obj: CanvasObject) {
    const strokeColor = typeof obj.element.stroke === 'string' ? obj.element.stroke : '#000000'
    const strokeWidth = typeof obj.element.strokeWidth === 'number' ? obj.element.strokeWidth : 0
    const dashPattern =
      Array.isArray(obj.element.dashPattern) &&
      obj.element.dashPattern.every((item) => typeof item === 'number')
        ? (obj.element.dashPattern as number[])
        : undefined

    let startArrow: ArrowType = 'none'
    let endArrow: ArrowType = UI_CONSTANTS.DEFAULT_END_ARROW

    if (obj.type === ELEMENT_TYPES.ARROW && obj.element instanceof Line) {
      startArrow = getLineArrowType(obj.element, 'startArrow')
      endArrow = getLineArrowType(obj.element, 'endArrow')
    }

    return {
      strokeColor,
      strokeWidth,
      dashPattern,
      startArrow,
      endArrow,
    }
  }

  function getElementProps(obj: CanvasObject) {
    const fillColor = typeof obj.element.fill === 'string' ? obj.element.fill : '#ffffff'

    if (obj.type === ELEMENT_TYPES.PEN) {
      const penProps = getPenElementProps(obj.element as Pen)
      return {
        fillColor,
        ...penProps,
        startArrow: 'none' as ArrowType,
        endArrow: UI_CONSTANTS.DEFAULT_END_ARROW,
        textColor: undefined,
        fontSize: undefined,
      }
    }

    if (obj.type === ELEMENT_TYPES.TEXT && obj.element instanceof Text) {
      const textProps = getTextElementProps(obj.element)
      return {
        fillColor,
        strokeColor: '',
        strokeWidth: 0,
        dashPattern: undefined,
        startArrow: 'none' as ArrowType,
        endArrow: UI_CONSTANTS.DEFAULT_END_ARROW,
        ...textProps,
      }
    }

    const standardProps = getStandardElementProps(obj)
    return {
      fillColor,
      ...standardProps,
      textColor: undefined,
      fontSize: undefined,
    }
  }

  /**
   * Saves the initial positions of selected objects before dragging starts.
   * This allows us to detect if objects actually moved (vs just clicked) and restore popover state after drag.
   */
  function saveDragStartPositions() {
    if (app.mode !== 'normal' || drawingState.isDrawing.value) return

    const selectedObjectIds = app.editor.list.map((item) => {
      return store.objects.find((obj) => obj.element.innerId === item.innerId)?.id
    })

    if (selectedObjectIds.length === 0) return

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

    // Remember popover state to restore it after drag if objects didn't move significantly
    if (elementPopover?.showPopover.value) {
      wasPopoverVisibleBeforeDrag.value = true
      elementPopover.hidePopover()
    } else {
      wasPopoverVisibleBeforeDrag.value = false
    }
  }

  function initializeDrawingState(point: { x: number; y: number }) {
    drawingState.startPoint.value = point
    drawingState.penPathPoints.value = [point]
    drawingState.isDrawing.value = true
  }

  async function notifyDrawingStart(
    tool: string,
    point: { x: number; y: number },
    toolInstance: ToolInstance | null
  ) {
    const drawingStartContext = {
      toolType: tool,
      point,
    }

    pluginEventBus.emit('drawing:start', drawingStartContext)

    await pluginRegistry.executeHook('afterDrawingStart', drawingStartContext)

    if (toolInstance?.startDrawing) {
      toolInstance.startDrawing()
    }
  }

  async function handleDragStart(e: DragEvent) {
    if (!tree) return

    const tool = store.currentTool
    const plugin = await pluginRegistry.getByType(tool)

    saveDragStartPositions()

    if (!plugin || !plugin.capabilities?.handlesDragStart) return

    const bounds = e.getPageBounds()
    if (!bounds) return

    const point = { x: bounds.x, y: bounds.y }
    const drawingStartContext = {
      toolType: tool,
      point,
    }

    const canStart = await pluginRegistry.executeHook('beforeDrawingStart', drawingStartContext)
    if (!canStart) {
      return
    }

    initializeDrawingState(point)

    const toolInstance = await getToolInstance(tool)
    await notifyDrawingStart(tool, point, toolInstance)
  }

  function handleMove(_e: MoveEvent) {
    if (elementPopover?.showPopover.value) {
      elementPopover.hidePopover()
    }
  }

  const dragStartId = app.on_(DragEvent.START, handleDragStart)
  const dragId = app.on_(DragEvent.DRAG, handleDrag)
  const dragEndId = app.on_(DragEvent.END, handleDragEnd)
  const tapId = app.on_(PointerEvent.TAP, handleTap)
  const moveId = app.tree.on_(MoveEvent.MOVE, handleMove)

  function cleanup() {
    app.off_(dragStartId)
    app.off_(dragId)
    app.off_(dragEndId)
    app.off_(tapId)
    app.tree.off_(moveId)
  }

  return {
    cleanup,
  }
}
