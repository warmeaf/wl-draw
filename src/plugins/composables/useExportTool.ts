/**
 * Export tool composable for exporting canvas content as image
 */

import type { useCanvasStore } from '@/stores/canvas'
import type { Tree } from '@/types'

export function useExportTool(tree: Tree, store: ReturnType<typeof useCanvasStore>) {
  async function exportCanvas(format: 'png' | 'jpg' = 'png', quality?: number) {
    if (!tree || !store.appInstance) {
      console.error('Canvas not initialized')
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
        console.error('Export failed: result is null')
        return
      }

      let blob: Blob
      if (result instanceof Blob) {
        blob = result
      } else if (typeof result === 'string') {
        const response = await fetch(result)
        blob = await response.blob()
      } else if (result && typeof result === 'object' && 'blob' in result) {
        blob = (result as { blob: Blob }).blob
      } else if (result && typeof result === 'object' && 'data' in result) {
        const data = (result as { data: string | Blob }).data
        blob = data instanceof Blob ? data : await (await fetch(data)).blob()
      } else {
        console.error('Export failed: unexpected result type')
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
      console.error('Export error:', error)
    }
  }

  return {
    exportCanvas,
  }
}
