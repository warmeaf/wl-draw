/**
 * Builtin plugins initialization and registration
 */

import { pluginRegistry } from '../registry'
import type { ToolPlugin } from '../types'
import { arrowPlugin } from './arrow'
import { circlePlugin } from './circle'
import { exportPlugin } from './export'
import { imagePlugin } from './image'
import { linePlugin } from './line'
import { panPlugin } from './pan'
import { penPlugin } from './pen'
import { rectPlugin } from './rect'
import { selectPlugin } from './select'
import { textPlugin } from './text'

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
      console.warn(`Plugin "${pluginId}" not found in builtin plugins`)
    }
  }

  if (dependencyOrder.length !== builtinPlugins.length) {
    console.warn(
      `Plugin dependency order mismatch: expected ${builtinPlugins.length} plugins, got ${dependencyOrder.length}`
    )
  }
}

function getDependencyOrder(plugins: ToolPlugin[]): string[] {
  const visited = new Set<string>()
  const visiting = new Set<string>()
  const order: string[] = []
  const pluginMap = new Map<string, ToolPlugin>()

  for (const plugin of plugins) {
    pluginMap.set(plugin.id, plugin)
  }

  const visit = (pluginId: string): void => {
    if (visiting.has(pluginId)) {
      throw new Error(`Circular dependency detected involving plugin "${pluginId}"`)
    }
    if (visited.has(pluginId)) {
      return
    }

    const plugin = pluginMap.get(pluginId)
    if (!plugin) {
      return
    }

    visiting.add(pluginId)

    if (plugin.metadata.dependencies) {
      for (const depId of plugin.metadata.dependencies) {
        visit(depId)
      }
    }

    visiting.delete(pluginId)
    visited.add(pluginId)
    order.push(pluginId)
  }

  for (const plugin of plugins) {
    if (!visited.has(plugin.id)) {
      visit(plugin.id)
    }
  }

  return order
}

export { builtinPlugins }
