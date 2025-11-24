/**
 * Builtin plugins initialization and registration
 */

import { errorHandler } from '@/utils/errorHandler'
import { pluginRegistry } from '../registry'
import type { ToolPlugin } from '../types'
import { getDependencyOrder } from '../utils'
import { arrowPlugin } from './arrow'
import { circlePlugin } from './circle'
import { exportPlugin } from './export'
import { exportJsonPlugin } from './exportJson'
import { imagePlugin } from './image'
import { linePlugin } from './line'
import { panPlugin } from './pan'
import { penPlugin } from './pen'
import { rectPlugin } from './rect'
import { redoPlugin } from './redo'
import { selectPlugin } from './select'
import { textPlugin } from './text'
import { undoPlugin } from './undo'
import { zoomInPlugin } from './zoomIn'
import { zoomOutPlugin } from './zoomOut'

const builtinPlugins: ToolPlugin[] = [
  selectPlugin,
  panPlugin,
  rectPlugin,
  circlePlugin,
  linePlugin,
  arrowPlugin,
  penPlugin,
  textPlugin,
  imagePlugin,
  exportPlugin,
  exportJsonPlugin,
  undoPlugin,
  redoPlugin,
  zoomInPlugin,
  zoomOutPlugin,
]

export async function initializeBuiltinPlugins(): Promise<void> {
  const pluginMap = new Map<string, ToolPlugin>()
  for (const plugin of builtinPlugins) {
    pluginMap.set(plugin.id, plugin)
  }

  const dependencyOrder = getDependencyOrder(builtinPlugins)

  for (const pluginId of dependencyOrder) {
    const plugin = pluginMap.get(pluginId)
    if (plugin) {
      await pluginRegistry.register(plugin)
    } else {
      errorHandler.warn(`Plugin "${pluginId}" not found in builtin plugins`)
    }
  }

  if (dependencyOrder.length !== builtinPlugins.length) {
    errorHandler.warn(
      `Plugin dependency order mismatch: expected ${builtinPlugins.length} plugins, got ${dependencyOrder.length}`
    )
  }
}

export { builtinPlugins }
