/**
 * Export tool composable for exporting canvas content as image or JSON
 */

import type { useCanvasStore } from '@/stores/canvas'
import type { Tree } from '@/types'
import { errorHandler } from '@/utils/errorHandler'

interface ExportData {
  version: string
  metadata: {
    exportedAt: string
    canvasZoom: number
    canvasStyles: {
      fillColor: string
      strokeColor: string
      strokeWidth: number
      fontSize: number
      textColor: string
    }
  }
  objects: Array<{
    id: string
    type: string
    data: unknown
  }>
}

function isExportResultWithBlob(result: unknown): result is { blob: Blob } {
  return (
    result !== null &&
    typeof result === 'object' &&
    'blob' in result &&
    (result as { blob: unknown }).blob instanceof Blob
  )
}

function isExportResultWithData(result: unknown): result is { data: string | Blob } {
  if (result === null || typeof result !== 'object' || !('data' in result)) {
    return false
  }

  const data = (result as { data: unknown }).data
  return typeof data === 'string' || data instanceof Blob
}

export function useExportTool(tree: Tree, store: ReturnType<typeof useCanvasStore>) {
  function exportCanvasAsJSON() {
    if (!tree || !store.appInstance) {
      errorHandler.handleExportError('Canvas not initialized')
      return
    }

    try {
      const objects = store.objects.map((obj) => {
        const elementData = obj.element?.toJSON ? obj.element.toJSON() : null
        return {
          id: obj.id,
          type: obj.type,
          data: elementData,
        }
      })

      const exportData: ExportData = {
        version: '1.0.0',
        metadata: {
          exportedAt: new Date().toISOString(),
          canvasZoom: store.zoom,
          canvasStyles: {
            fillColor: store.fillColor,
            strokeColor: store.strokeColor,
            strokeWidth: store.strokeWidth,
            fontSize: store.fontSize,
            textColor: store.textColor,
          },
        },
        objects,
      }

      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `canvas-export-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      errorHandler.handleExportError(
        'JSON export error',
        error instanceof Error ? error : undefined
      )
    }
  }

  async function exportCanvas(format: 'png' | 'jpg' | 'json' = 'png', quality?: number) {
    if (format === 'json') {
      exportCanvasAsJSON()
      return
    }

    if (!tree || !store.appInstance) {
      errorHandler.handleExportError('Canvas not initialized')
      return
    }

    try {
      const exportType = format === 'jpg' ? 'jpg' : 'png'
      const options: {
        quality?: number
        screenshot?: boolean
      } = {
        screenshot: true,
      }

      if (format === 'jpg' && quality !== undefined) {
        options.quality = quality
      }

      const result = await tree.export(exportType, options)

      if (!result) {
        errorHandler.handleExportError('Export failed: result is null')
        return
      }

      let blob: Blob
      if (result instanceof Blob) {
        blob = result
      } else if (typeof result === 'string') {
        const response = await fetch(result)
        blob = await response.blob()
      } else if (isExportResultWithBlob(result)) {
        blob = result.blob
      } else if (isExportResultWithData(result)) {
        const data = result.data
        blob = data instanceof Blob ? data : await (await fetch(data)).blob()
      } else {
        errorHandler.handleExportError('Export failed: unexpected result type', undefined, {
          resultType: typeof result,
        })
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `canvas-export-${Date.now()}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      errorHandler.handleExportError('Export error', error instanceof Error ? error : undefined)
    }
  }

  return {
    exportCanvas,
    exportCanvasAsJSON,
  }
}
