/**
 * Plugin registry for managing tool plugins
 */

import type { ToolPlugin } from './types'

class PluginRegistry {
  private plugins = new Map<string, ToolPlugin>()

  register(plugin: ToolPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin with id "${plugin.id}" is already registered. Overwriting.`)
    }
    this.plugins.set(plugin.id, plugin)
  }

  get(id: string): ToolPlugin | undefined {
    return this.plugins.get(id)
  }

  getByType(type: string): ToolPlugin | undefined {
    return Array.from(this.plugins.values()).find((plugin) => plugin.type === type)
  }

  getAll(): ToolPlugin[] {
    return Array.from(this.plugins.values())
  }

  getByCategory(category: string): ToolPlugin[] {
    return Array.from(this.plugins.values()).filter((plugin) => plugin.category === category)
  }

  has(id: string): boolean {
    return this.plugins.has(id)
  }

  unregister(id: string): boolean {
    return this.plugins.delete(id)
  }

  clear(): void {
    this.plugins.clear()
  }
}

export const pluginRegistry = new PluginRegistry()
