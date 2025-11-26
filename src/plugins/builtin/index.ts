/**
 * Builtin plugins initialization and registration
 */

import { errorHandler } from '@/utils/errorHandler'
import { pluginRegistry } from '../registry'
import type { LazyPluginLoader, PluginMetadataInfo, ToolPlugin } from '../types'
import { panPlugin } from './pan'
import { selectPlugin } from './select'

const corePlugins: ToolPlugin[] = [selectPlugin, panPlugin]

const lazyPluginMetadata: PluginMetadataInfo[] = [
  {
    id: 'rect',
    name: 'Rectangle Tool',
    type: 'rect',
    metadata: {
      version: '1.0.0',
      description: 'Rectangle drawing tool',
    },
    category: 'drawing',
    ui: {
      label: '矩形工具',
      iconComponent: 'i-lucide-square',
    },
    shortcut: 'KeyR',
  },
  {
    id: 'circle',
    name: 'Circle Tool',
    type: 'circle',
    metadata: {
      version: '1.0.0',
      description: 'Circle drawing tool',
    },
    category: 'drawing',
    ui: {
      label: '圆形工具',
      iconComponent: 'i-lucide-circle',
    },
    shortcut: 'KeyC',
  },
  {
    id: 'line',
    name: 'Line Tool',
    type: 'line',
    metadata: {
      version: '1.0.0',
      description: 'Line drawing tool',
    },
    category: 'drawing',
    ui: {
      label: '直线工具',
      iconComponent: 'i-lucide-minus',
    },
    shortcut: 'KeyL',
  },
  {
    id: 'arrow',
    name: 'Arrow Tool',
    type: 'arrow',
    metadata: {
      version: '1.0.0',
      description: 'Arrow drawing tool',
    },
    category: 'drawing',
    ui: {
      label: '箭头工具',
      iconComponent: 'i-lucide-arrow-right',
    },
    shortcut: 'KeyA',
  },
  {
    id: 'pen',
    name: 'Pen Tool',
    type: 'pen',
    metadata: {
      version: '1.0.0',
      description: 'Freehand pen drawing tool',
    },
    category: 'drawing',
    ui: {
      label: '画笔工具',
      iconComponent: 'i-lucide-pen-tool',
      dividerAfter: true,
    },
    shortcut: 'KeyP',
  },
  {
    id: 'text',
    name: 'Text Tool',
    type: 'text',
    metadata: {
      version: '1.0.0',
      description: 'Text tool for adding text to canvas',
    },
    category: 'drawing',
    ui: {
      label: '文本工具',
      iconComponent: 'i-lucide-type',
    },
    shortcut: 'KeyT',
  },
  {
    id: 'image',
    name: 'Image Tool',
    type: 'image',
    metadata: {
      version: '1.0.0',
      description: 'Image tool for adding images to canvas',
    },
    category: 'drawing',
    ui: {
      label: '图片工具',
      iconComponent: 'i-lucide-image',
    },
  },
  {
    id: 'export',
    name: 'Export Tool',
    type: 'export',
    metadata: {
      version: '1.0.0',
      description: 'Export canvas as image',
    },
    category: 'utility',
    ui: {
      label: '导出图片',
      iconComponent: 'i-lucide-image-down',
    },
    shortcut: 'Shift+KeyE',
  },
  {
    id: 'exportJson',
    name: 'Export JSON Tool',
    type: 'exportJson',
    metadata: {
      version: '1.0.0',
      description: 'Export canvas as JSON',
    },
    category: 'utility',
    ui: {
      label: '导出 JSON',
      iconComponent: 'i-lucide-file-braces-corner',
    },
    shortcut: 'Shift+KeyJ',
  },
  {
    id: 'undo',
    name: 'Undo Tool',
    type: 'undo',
    metadata: {
      version: '1.0.0',
      description: 'Undo the last canvas operation',
    },
    category: 'utility',
    ui: {
      label: '撤销',
      iconComponent: 'i-lucide-undo-2',
    },
    shortcut: 'Ctrl+KeyZ',
  },
  {
    id: 'redo',
    name: 'Redo Tool',
    type: 'redo',
    metadata: {
      version: '1.0.0',
      description: 'Redo the last undone operation',
    },
    category: 'utility',
    ui: {
      label: '重做',
      iconComponent: 'i-lucide-redo-2',
    },
    shortcut: 'Ctrl+Shift+KeyZ',
  },
  {
    id: 'zoomIn',
    name: 'Zoom In Tool',
    type: 'zoomIn',
    metadata: {
      version: '1.0.0',
      description: 'Zoom in the canvas',
    },
    category: 'utility',
    ui: {
      label: '放大',
      iconComponent: 'i-lucide-zoom-in',
    },
    shortcut: 'Ctrl+Equal',
  },
  {
    id: 'zoomOut',
    name: 'Zoom Out Tool',
    type: 'zoomOut',
    metadata: {
      version: '1.0.0',
      description: 'Zoom out the canvas',
    },
    category: 'utility',
    ui: {
      label: '缩小',
      iconComponent: 'i-lucide-zoom-out',
    },
    shortcut: 'Ctrl+Minus',
  },
]

const lazyPluginLoaders: Map<string, LazyPluginLoader> = new Map([
  ['rect', async () => (await import('./rect')).rectPlugin],
  ['circle', async () => (await import('./circle')).circlePlugin],
  ['line', async () => (await import('./line')).linePlugin],
  ['arrow', async () => (await import('./arrow')).arrowPlugin],
  ['pen', async () => (await import('./pen')).penPlugin],
  ['text', async () => (await import('./text')).textPlugin],
  ['image', async () => (await import('./image')).imagePlugin],
  ['export', async () => (await import('./export')).exportPlugin],
  ['exportJson', async () => (await import('./exportJson')).exportJsonPlugin],
  ['undo', async () => (await import('./undo')).undoPlugin],
  ['redo', async () => (await import('./redo')).redoPlugin],
  ['zoomIn', async () => (await import('./zoomIn')).zoomInPlugin],
  ['zoomOut', async () => (await import('./zoomOut')).zoomOutPlugin],
])

export async function initializeBuiltinPlugins(): Promise<void> {
  for (const plugin of corePlugins) {
    try {
      await pluginRegistry.register(plugin)
    } catch (error) {
      errorHandler.handlePluginError(
        plugin.id,
        `Failed to register core plugin: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined,
        {
          pluginName: plugin.name,
          operation: 'register',
        }
      )
    }
  }

  for (const metadata of lazyPluginMetadata) {
    const loader = lazyPluginLoaders.get(metadata.id)
    if (loader) {
      try {
        await pluginRegistry.register(loader, metadata)
      } catch (error) {
        errorHandler.handlePluginError(
          metadata.id,
          `Failed to register lazy plugin: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error : undefined,
          {
            pluginName: metadata.name,
            operation: 'register',
          }
        )
      }
    } else {
      errorHandler.warn(`Lazy loader not found for plugin "${metadata.id}"`)
    }
  }
}

export async function initializePiniaDependentPlugins(): Promise<void> {
  const { historyCachePlugin } = await import('./historyCache')
  try {
    await pluginRegistry.register(historyCachePlugin)
  } catch (error) {
    errorHandler.handlePluginError(
      historyCachePlugin.id,
      `Failed to register Pinia-dependent plugin: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined,
      {
        pluginName: historyCachePlugin.name,
        operation: 'register',
      }
    )
  }
}
