/**
 * Plugin utility functions
 */

import type { ToolPlugin } from './types'

/**
 * Calculates topological sort order for plugin dependencies using DFS.
 * Ensures plugins are initialized in correct order: dependencies before dependents.
 * Uses 'visiting' set to detect circular dependencies during traversal.
 *
 * @param plugins - Array of plugins to sort
 * @returns Array of plugin IDs in dependency order
 * @throws Error if circular dependency is detected
 */
export function getDependencyOrder(plugins: ToolPlugin[]): string[] {
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
