/**
 * Canvas tools composable for handling drawing tools and mouse interactions
 */

import { useKeyModifier } from '@vueuse/core'
import type { App } from 'leafer-ui'
import { DragEvent, KeyEvent, PointerEvent, ZoomEvent } from 'leafer-ui'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import type { LeaferElement, Point, ToolType } from '@/types'
import { useArrowTool } from './useArrowTool'
import { useCircleTool } from './useCircleTool'
import { useImageTool } from './useImageTool'
import { useLineTool } from './useLineTool'
import { usePenTool } from './usePenTool'
import { useRectTool } from './useRectTool'
import { useTextTool } from './useTextTool'

export function useCanvasTools(app: App) {
  const store = useCanvasStore()
  const tree = app.tree

  const isDrawing = ref(false)
  const startPoint = ref<Point | null>(null)
  const currentElement = ref<LeaferElement>(null)
  const penPathPoints = ref<Array<Point>>([])

  const isShiftPressedRaw = useKeyModifier('Shift', { events: ['keydown', 'keyup'] })
  const isShiftPressed = computed(() => isShiftPressedRaw.value ?? false)

  const rectTool = useRectTool(tree, store, startPoint, currentElement, isShiftPressed)
  const circleTool = useCircleTool(tree, store, startPoint, currentElement, isShiftPressed)
  const lineTool = useLineTool(tree, store, startPoint, currentElement, isShiftPressed)
  const arrowTool = useArrowTool(tree, store, startPoint, currentElement, isShiftPressed)
  const penTool = usePenTool(tree, store, startPoint, currentElement, penPathPoints)
  const textTool = useTextTool(tree, store)
  const imageTool = useImageTool(tree, store)

  watch(
    () => store.currentTool,
    (newTool) => {
      resetState()
      autoSetMode(newTool)
      autoSetDrag(newTool)
    }
  )

  function resetState() {
    isDrawing.value = false
    startPoint.value = null
    currentElement.value = null
    penPathPoints.value = []
  }

  function autoSetMode(newTool: ToolType) {
    if (newTool === 'select' || newTool === 'pan') {
      app.mode = 'normal'
    } else {
      app.mode = 'draw'
    }
  }

  function autoSetDrag(newTool: ToolType) {
    if (app.config.move) {
      app.config.move.drag = newTool === 'pan'
    }
  }

  function handleDrag(e: DragEvent) {
    if (!tree || !isDrawing.value) return

    const tool = store.currentTool

    switch (tool) {
      case 'rect':
        rectTool.updateDrawing(e)
        break
      case 'circle':
        circleTool.updateDrawing(e)
        break
      case 'line':
        lineTool.updateDrawing(e)
        break
      case 'arrow':
        arrowTool.updateDrawing(e)
        break
      case 'pen':
        penTool.updateDrawing(e)
        break
    }
  }

  function handleDragEnd() {
    if (!tree || !isDrawing.value) return

    const tool = store.currentTool

    switch (tool) {
      case 'rect':
        rectTool.finishDrawing()
        break
      case 'circle':
        circleTool.finishDrawing()
        break
      case 'line':
        lineTool.finishDrawing()
        break
      case 'arrow':
        arrowTool.finishDrawing()
        break
      case 'pen':
        penTool.finishDrawing()
        break
    }

    resetState()
  }

  function handleTap(e: PointerEvent) {
    if (!tree) return

    const tool = store.currentTool

    if (tool === 'text' || tool === 'image') {
      if (tool === 'text') {
        textTool.handleTap(e)
      } else if (tool === 'image') {
        imageTool.handleTap(e)
      }
    }
  }

  const dragStartId = app.on_(DragEvent.START, (e: DragEvent) => {
    if (!tree) return

    const tool = store.currentTool
    if (tool === 'select' || tool === 'pan' || tool === 'text' || tool === 'image') {
      return
    }

    const bounds = e.getPageBounds()
    if (!bounds) return

    startPoint.value = { x: bounds.x, y: bounds.y }
    penPathPoints.value = [{ x: bounds.x, y: bounds.y }]
    isDrawing.value = true

    switch (tool) {
      case 'rect':
        rectTool.handleMouseDown()
        break
      case 'circle':
        circleTool.handleMouseDown()
        break
      case 'line':
        lineTool.handleMouseDown()
        break
      case 'arrow':
        arrowTool.handleMouseDown()
        break
      case 'pen':
        penTool.handleMouseDown()
        break
    }
  })

  const dragId = app.on_(DragEvent.DRAG, (e: DragEvent) => {
    const tool = store.currentTool

    if (tool === 'pan') {
      return
    }

    handleDrag(e)
  })

  const dragEndId = app.on_(DragEvent.END, () => {
    const tool = store.currentTool

    if (tool === 'pan') {
      return
    }

    handleDragEnd()
  })

  const tapId = app.on_(PointerEvent.TAP, (e: PointerEvent) => {
    handleTap(e)
  })

  const keyDownId = app.on_(KeyEvent.DOWN, (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      store.enablePanWithSpace()
    }
  })

  const keyUpId = app.on_(KeyEvent.UP, (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      store.disablePanWithSpace()
    }
  })

  const zoomId = app.on_(ZoomEvent.ZOOM, (_e: ZoomEvent) => {
    store.setZoom(app.tree.scale as number)
  })

  onBeforeUnmount(() => {
    app.off_(dragStartId)
    app.off_(dragId)
    app.off_(dragEndId)
    app.off_(tapId)
    app.off_(keyDownId)
    app.off_(keyUpId)
    app.off_(zoomId)
  })
}
