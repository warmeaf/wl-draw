/**
 * Composable for handling canvas interaction events (drag, tap)
 */

import { InnerEditorEvent } from '@leafer-in/editor'
import { useThrottleFn } from '@vueuse/core'
import type { App } from 'leafer-ui'
import { DragEvent, MoveEvent, PointerEvent, Text } from 'leafer-ui'
import { ref } from 'vue'
import { ELEMENT_TYPES, TIMING, TOOL_TYPES, UI_CONSTANTS } from '@/constants'
import { useHistory } from '@/plugins/composables/useHistory'
import { pluginEventBus } from '@/plugins/events'
import { pluginRegistry } from '@/plugins/registry'
import type { ToolInstance } from '@/plugins/types'
import { useCanvasStore } from '@/stores/canvas'
import { useHistoryStore } from '@/stores/history'
import type { HistorySnapshot } from '@/types/history'
import { errorHandler } from '@/utils/errorHandler'
import type { DrawingState } from '../tool/useToolInstance'
import { getElementProperties } from './elementPropsUtils'

const SINGLE_SELECTION_COUNT = 1
const EMPTY_EXPORTED_AT = ''
const DEFAULT_POSITION = 0

export function useCanvasEvents(
  app: App,
  drawingState: DrawingState,
  getToolInstance: (toolType: string) => Promise<ToolInstance | null>,
  elementPopover?: ReturnType<typeof import('../state/useElementPopover').useElementPopover>,
  canvasContainer?: HTMLElement | null
) {
  const store = useCanvasStore()
  const canvasTree = app.tree
  const { addSnapshot } = useHistory()
  const historyStore = useHistoryStore()
  const wasPopoverVisibleBeforeDrag = ref(false)
  const originalTextValue = ref<string | null>(null)

  const throttledEmitDrawingUpdate = useThrottleFn(
    (payload: {
      toolType: string
      bounds: { x: number; y: number; width: number; height: number }
    }) => {
      pluginEventBus.emit('drawing:update', payload)
    },
    TIMING.DRAWING_UPDATE_THROTTLE
  )

  function calculatePopoverPosition(
    elementBounds: { x: number; y: number; width: number },
    containerRect: DOMRect
  ): { clientX: number; clientY: number } {
    const popoverX = elementBounds.x + elementBounds.width + UI_CONSTANTS.ELEMENT_POPOVER_OFFSET_X
    const popoverY = elementBounds.y
    const clientX = containerRect.left + popoverX
    const clientY = containerRect.top + popoverY
    return { clientX, clientY }
  }

  function showPopoverForSelectedElement() {
    if (!elementPopover || !app.editor || !canvasContainer) return

    const selectedElements = app.editor.list
    const hasSingleSelection = selectedElements.length === SINGLE_SELECTION_COUNT
    if (!hasSingleSelection || !selectedElements[0]) return

    const selectedElement = selectedElements[0]
    const canvasObject = store.objects.find(
      (object) => object.element.innerId === selectedElement.innerId
    )

    if (!canvasObject?.element) return
    if (canvasObject.type === ELEMENT_TYPES.IMAGE) return

    const elementBounds = canvasObject.element.getBounds()
    if (!elementBounds) return

    const containerRect = canvasContainer.getBoundingClientRect()
    const { clientX, clientY } = calculatePopoverPosition(elementBounds, containerRect)
    const elementProps = getElementProperties(canvasObject)

    elementPopover.showPopoverAt(
      clientX,
      clientY,
      canvasObject.type,
      canvasObject.element,
      elementProps
    )
  }

  function emitDrawingUpdateBounds(
    currentTool: string,
    pageBounds: { x: number; y: number; width: number; height: number }
  ) {
    throttledEmitDrawingUpdate({
      toolType: currentTool,
      bounds: {
        x: pageBounds.x,
        y: pageBounds.y,
        width: pageBounds.width,
        height: pageBounds.height,
      },
    })
  }

  async function handleDrag(dragEvent: DragEvent) {
    if (!canvasTree || !drawingState.isDrawing.value) return

    const currentTool = store.currentTool
    try {
      const plugin = await pluginRegistry.getByType(currentTool)
      if (!plugin || !plugin.capabilities?.handlesDrag) return

      const pageBounds = dragEvent.getPageBounds()
      if (pageBounds) {
        emitDrawingUpdateBounds(currentTool, pageBounds)
      }

      const toolInstance = await getToolInstance(currentTool)
      if (toolInstance?.updateDrawing) {
        toolInstance.updateDrawing(dragEvent)
      }
    } catch (error) {
      errorHandler.handleRuntimeError(
        `Failed to handle drag event`,
        error instanceof Error ? error : undefined,
        { toolType: currentTool, operation: 'handleDrag' }
      )
    }
  }

  async function finishDrawing(): Promise<boolean> {
    const currentTool = store.currentTool
    try {
      const plugin = await pluginRegistry.getByType(currentTool)
      if (!plugin || !plugin.capabilities?.handlesDragEnd) return false

      const canFinish = await pluginRegistry.executeHook('beforeDrawingFinish', {
        toolType: currentTool,
      })
      if (!canFinish) {
        return false
      }

      const toolInstance = await getToolInstance(currentTool)
      if (toolInstance?.finishDrawing) {
        toolInstance.finishDrawing()
      }

      await pluginRegistry.executeHook('afterDrawingFinish', {
        toolType: currentTool,
      })

      drawingState.resetState()
      return true
    } catch (error) {
      errorHandler.handleRuntimeError(
        `Failed to finish drawing`,
        error instanceof Error ? error : undefined,
        { toolType: currentTool, operation: 'finishDrawing' }
      )
      return false
    }
  }

  function normalizeSnapshotForComparison(snapshot: HistorySnapshot): HistorySnapshot {
    return {
      ...snapshot,
      metadata: {
        ...snapshot.metadata,
        exportedAt: EMPTY_EXPORTED_AT,
      },
    }
  }

  function compareSnapshots(
    currentSnapshot: HistorySnapshot,
    previousSnapshot: HistorySnapshot | null
  ): boolean {
    const normalizedCurrent = normalizeSnapshotForComparison(currentSnapshot)
    const normalizedPrevious = previousSnapshot
      ? normalizeSnapshotForComparison(previousSnapshot)
      : null
    return JSON.stringify(normalizedCurrent) === JSON.stringify(normalizedPrevious)
  }

  function restorePopoverAfterObjectDrag() {
    if (wasPopoverVisibleBeforeDrag.value) {
      showPopoverForSelectedElement()
    }
    wasPopoverVisibleBeforeDrag.value = false
  }

  function handleObjectDragEnd() {
    restorePopoverAfterObjectDrag()
    drawingState.dragStartPositions.value.clear()
  }

  function shouldCreateSnapshot(currentSnapshot: HistorySnapshot): boolean {
    const previousSnapshot = historyStore.snapshots[historyStore.currentIndex] ?? null
    return !compareSnapshots(currentSnapshot, previousSnapshot)
  }

  async function handleDragEnd() {
    if (!canvasTree) return

    const isCurrentlyDrawing = drawingState.isDrawing.value
    const hasObjectDragPositions = drawingState.dragStartPositions.value.size > 0

    if (isCurrentlyDrawing) {
      await finishDrawing()
    } else if (hasObjectDragPositions) {
      handleObjectDragEnd()
    }

    const currentSnapshot = store.toSnapshot()
    if (shouldCreateSnapshot(currentSnapshot)) {
      addSnapshot()
    }
  }

  function handleSelectToolTap() {
    if (!elementPopover || !app.editor) return

    const selectedElements = app.editor.list
    const hasSingleSelection = selectedElements.length === SINGLE_SELECTION_COUNT

    if (hasSingleSelection) {
      showPopoverForSelectedElement()
    } else {
      elementPopover.hidePopover()
    }
  }

  function handleTextToolTap(objectCountBefore: number) {
    const objectCountAfter = store.objects.length
    const hasNewTextObject = objectCountAfter > objectCountBefore
    if (hasNewTextObject) {
      addSnapshot()
    }
  }

  async function handleTap(pointerEvent: PointerEvent) {
    if (!canvasTree) return

    const currentTool = store.currentTool

    if (currentTool === TOOL_TYPES.SELECT) {
      handleSelectToolTap()
    }

    try {
      const plugin = await pluginRegistry.getByType(currentTool)
      if (!plugin || !plugin.capabilities?.handlesTap) return

      const objectCountBefore = store.objects.length

      const toolInstance = await getToolInstance(currentTool)
      if (toolInstance?.handleTap) {
        toolInstance.handleTap(pointerEvent)
      }

      if (currentTool === TOOL_TYPES.TEXT) {
        handleTextToolTap(objectCountBefore)
      }
    } catch (error) {
      errorHandler.handleRuntimeError(
        `Failed to handle tap event`,
        error instanceof Error ? error : undefined,
        { toolType: currentTool, operation: 'handleTap' }
      )
    }
  }

  function getSelectedObjectIds(): string[] {
    return app.editor.list
      .map((editorItem) => {
        const canvasObject = store.objects.find(
          (object) => object.element.innerId === editorItem.innerId
        )
        return canvasObject?.id
      })
      .filter((id): id is string => id !== undefined)
  }

  function saveObjectDragStartPositions(selectedObjectIds: string[]) {
    drawingState.dragStartPositions.value.clear()
    for (const objectId of selectedObjectIds) {
      const canvasObject = store.objects.find((object) => object.id === objectId)
      if (canvasObject?.element) {
        drawingState.dragStartPositions.value.set(objectId, {
          x: canvasObject.element.x ?? DEFAULT_POSITION,
          y: canvasObject.element.y ?? DEFAULT_POSITION,
        })
      }
    }
  }

  function savePopoverStateBeforeDrag() {
    if (!elementPopover) return

    const isPopoverVisible = elementPopover.showPopover.value
    wasPopoverVisibleBeforeDrag.value = isPopoverVisible

    if (isPopoverVisible) {
      elementPopover.hidePopover()
    }
  }

  function saveDragStartPositions() {
    const isNormalMode = app.mode === 'normal'
    const isCurrentlyDrawing = drawingState.isDrawing.value
    if (!isNormalMode || isCurrentlyDrawing) return

    const selectedObjectIds = getSelectedObjectIds()
    if (selectedObjectIds.length === 0) return

    saveObjectDragStartPositions(selectedObjectIds)
    savePopoverStateBeforeDrag()
  }

  function initializeDrawingState(startPoint: { x: number; y: number }) {
    drawingState.startPoint.value = startPoint
    drawingState.penPathPoints.value = [startPoint]
    drawingState.isDrawing.value = true
  }

  async function notifyDrawingStart(
    currentTool: string,
    startPoint: { x: number; y: number },
    toolInstance: ToolInstance | null
  ) {
    const drawingStartContext = {
      toolType: currentTool,
      point: startPoint,
    }

    pluginEventBus.emit('drawing:start', drawingStartContext)

    await pluginRegistry.executeHook('afterDrawingStart', drawingStartContext)

    if (toolInstance?.startDrawing) {
      toolInstance.startDrawing()
    }
  }

  async function handleDragStart(dragEvent: DragEvent) {
    if (!canvasTree) return

    const currentTool = store.currentTool
    try {
      const plugin = await pluginRegistry.getByType(currentTool)

      saveDragStartPositions()

      if (!plugin || !plugin.capabilities?.handlesDragStart) return

      const pageBounds = dragEvent.getPageBounds()
      if (!pageBounds) return

      const startPoint = { x: pageBounds.x, y: pageBounds.y }
      const drawingStartContext = {
        toolType: currentTool,
        point: startPoint,
      }

      const canStart = await pluginRegistry.executeHook('beforeDrawingStart', drawingStartContext)
      if (!canStart) {
        return
      }

      initializeDrawingState(startPoint)

      const toolInstance = await getToolInstance(currentTool)
      await notifyDrawingStart(currentTool, startPoint, toolInstance)
    } catch (error) {
      errorHandler.handleRuntimeError(
        `Failed to handle drag start event`,
        error instanceof Error ? error : undefined,
        { toolType: currentTool, operation: 'handleDragStart' }
      )
    }
  }

  function handleMove(_moveEvent: MoveEvent) {
    if (elementPopover?.showPopover.value) {
      elementPopover.hidePopover()
    }
  }

  function handleOpenInnerEditor() {
    const editTarget = app.editor.innerEditor?.editTarget
    const isTextElement = editTarget instanceof Text
    if (isTextElement) {
      originalTextValue.value = String(editTarget.text ?? '')
    }
  }

  function handleCloseInnerEditor() {
    const editTarget = app.editor.innerEditor?.editTarget
    const isTextElement = editTarget instanceof Text
    const hasOriginalValue = originalTextValue.value !== null

    if (isTextElement && hasOriginalValue) {
      const currentText = String(editTarget.text ?? '')
      const textHasChanged = currentText !== originalTextValue.value
      if (textHasChanged) {
        addSnapshot()
      }
    }

    originalTextValue.value = null
  }

  const dragStartId = app.on_(DragEvent.START, handleDragStart)
  const dragId = app.on_(DragEvent.DRAG, handleDrag)
  const dragEndId = app.on_(DragEvent.END, handleDragEnd)
  const tapId = app.on_(PointerEvent.TAP, handleTap)
  const moveId = app.tree.on_(MoveEvent.MOVE, handleMove)
  app.editor.on(InnerEditorEvent.OPEN, handleOpenInnerEditor)
  app.editor.on(InnerEditorEvent.CLOSE, handleCloseInnerEditor)

  function cleanup() {
    app.off_(dragStartId)
    app.off_(dragId)
    app.off_(dragEndId)
    app.off_(tapId)
    app.tree.off_(moveId)
    app.editor.off(InnerEditorEvent.OPEN, handleOpenInnerEditor)
    app.editor.off(InnerEditorEvent.CLOSE, handleCloseInnerEditor)
  }

  return {
    cleanup,
  }
}
