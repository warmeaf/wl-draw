/**
 * Canvas tools composable
 * Handles drawing tools and mouse interactions for the canvas using Leafer App events
 */
import { ref, watch, onBeforeUnmount, computed } from 'vue'
import type { App } from 'leafer-ui'
import { DragEvent, PointerEvent, KeyEvent } from 'leafer-ui'
import { useCanvasStore } from '@/stores/canvas'
import { useKeyModifier } from '@vueuse/core'

import { useRectTool } from './useRectTool'
import { useCircleTool } from './useCircleTool'
import { useLineTool } from './useLineTool'
import { useArrowTool } from './useArrowTool'
import { usePenTool } from './usePenTool'
import { useTextTool } from './useTextTool'
import { useImageTool } from './useImageTool'
import type { Point, LeaferElement } from './types'

export function useCanvasTools(app: App) {
  const store = useCanvasStore()
  const tree = app.tree

  const isDrawing = ref(false)
  const startPoint = ref<Point | null>(null)
  const currentElement = ref<LeaferElement>(null)
  const penPathPoints = ref<Array<Point>>([])
  const isShiftPressedRaw = useKeyModifier('Shift', { events: ['keydown', 'keyup'] })
  const isShiftPressed = computed(() => isShiftPressedRaw.value ?? false)

  const rectTool = useRectTool(tree, store, isDrawing, startPoint, currentElement, isShiftPressed)
  const circleTool = useCircleTool(
    tree,
    store,
    isDrawing,
    startPoint,
    currentElement,
    isShiftPressed
  )
  const lineTool = useLineTool(tree, store, isDrawing, startPoint, currentElement, isShiftPressed)
  const arrowTool = useArrowTool(tree, store, isDrawing, startPoint, currentElement, isShiftPressed)
  const penTool = usePenTool(tree, store, isDrawing, startPoint, currentElement, penPathPoints)
  const textTool = useTextTool(tree, store)
  const imageTool = useImageTool(tree, store)

  watch(
    () => store.currentTool,
    (newTool) => {
      isDrawing.value = false
      startPoint.value = null
      currentElement.value = null
      penPathPoints.value = []
      if (newTool === 'select' || newTool === 'pan') {
        app.mode = 'normal'
      } else {
        app.mode = 'draw'
      }
    }
  )

  function handleDragStart() {
    if (!tree) return

    const tool = store.currentTool

    if (tool === 'select' || tool === 'pan') {
      return
    }

    if (tool === 'text' || tool === 'image') {
      return
    }

    isDrawing.value = true
  }

  function handleDrag(e: DragEvent) {
    if (!tree || !isDrawing.value) return

    const tool = store.currentTool

    switch (tool) {
      case 'rect':
      case 'circle': {
        const bounds = e.getPageBounds()
        if (!bounds) return
        if (tool === 'rect') {
          rectTool.updateDrawing(bounds)
        } else {
          circleTool.updateDrawing(bounds)
        }
        break
      }
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

    isDrawing.value = false
    startPoint.value = null
    penPathPoints.value = []
  }

  function handleTap(e: PointerEvent) {
    if (!tree) return

    const tool = store.currentTool

    if (tool === 'text' || tool === 'image') {
      const point = e.getPagePoint()
      if (!point) return

      if (tool === 'text') {
        textTool.handleMouseDown({ x: point.x, y: point.y })
      } else if (tool === 'image') {
        imageTool.handleMouseDown({ x: point.x, y: point.y })
      }
    }
  }

  const dragStartId = app.on_(DragEvent.START, (e: DragEvent) => {
    const tool = store.currentTool

    if (tool === 'select') {
      return
    }

    if (tool === 'pan') {
      return
    }

    if (tool === 'text' || tool === 'image') {
      return
    }

    const bounds = e.getPageBounds()
    if (!bounds) return

    handleDragStart()
    startPoint.value = { x: bounds.x, y: bounds.y }

    switch (tool) {
      case 'rect':
        rectTool.handleMouseDown({ x: bounds.x, y: bounds.y })
        break
      case 'circle':
        circleTool.handleMouseDown({ x: bounds.x, y: bounds.y })
        break
      case 'line':
        lineTool.handleMouseDown({ x: bounds.x, y: bounds.y })
        break
      case 'arrow':
        arrowTool.handleMouseDown({ x: bounds.x, y: bounds.y })
        break
      case 'pen':
        penTool.handleMouseDown({ x: bounds.x, y: bounds.y })
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

  onBeforeUnmount(() => {
    app.off_(dragStartId)
    app.off_(dragId)
    app.off_(dragEndId)
    app.off_(tapId)
    app.off_(keyDownId)
    app.off_(keyUpId)
  })
}
