/**
 * Plugin registry for managing tool plugins
 */

import { checkShortcutConflict } from './shortcut'
import type {
  DrawingFinishContext,
  DrawingStartContext,
  HookHandler,
  HookInterceptor,
  PluginHooks,
  ToolPlugin,
  ToolSwitchContext,
} from './types'

const CORE_VERSION = '1.0.0'

export interface PluginState {
  id: string
  status: 'registered' | 'activated' | 'deactivated' | 'error'
  registeredAt: Date
  activatedAt?: Date
  deactivatedAt?: Date
  error?: string
}

class PluginRegistry {
  private plugins = new Map<string, ToolPlugin>()
  private hooks = new Map<
    keyof PluginHooks,
    Array<{ pluginId: string; handler: HookHandler | HookInterceptor }>
  >()
  private pluginStates = new Map<string, PluginState>()

  validatePlugin(plugin: ToolPlugin): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!plugin.id || plugin.id.trim() === '') {
      errors.push('Plugin id is required')
    }

    if (!plugin.name || plugin.name.trim() === '') {
      errors.push('Plugin name is required')
    }

    if (!plugin.type || plugin.type.trim() === '') {
      errors.push('Plugin type is required')
    }

    if (!plugin.metadata) {
      errors.push('Plugin metadata is required')
    } else {
      if (!plugin.metadata.version || plugin.metadata.version.trim() === '') {
        errors.push('Plugin metadata.version is required')
      }

      if (plugin.metadata.minCoreVersion) {
        if (compareVersions(plugin.metadata.minCoreVersion, CORE_VERSION) > 0) {
          errors.push(
            `Plugin requires core version ${plugin.metadata.minCoreVersion} or higher, but current version is ${CORE_VERSION}`
          )
        }
      }

      if (plugin.metadata.dependencies && plugin.metadata.dependencies.length > 0) {
        for (const depId of plugin.metadata.dependencies) {
          if (!this.plugins.has(depId)) {
            errors.push(`Plugin dependency "${depId}" is not registered`)
          }
        }
      }
    }

    if (!plugin.createTool || typeof plugin.createTool !== 'function') {
      errors.push('Plugin createTool function is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  async register(plugin: ToolPlugin): Promise<void> {
    const validation = this.validatePlugin(plugin)
    if (!validation.valid) {
      throw new Error(
        `Plugin validation failed for "${plugin.id}": ${validation.errors.join(', ')}`
      )
    }

    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin with id "${plugin.id}" is already registered. Overwriting.`)
      this.unregisterHooks(plugin.id)
    }

    if (plugin.shortcut) {
      const existingShortcuts = Array.from(this.plugins.values())
        .filter((p) => p.shortcut && p.id !== plugin.id)
        .map((p) => {
          if (!p.shortcut) {
            throw new Error('Unexpected: shortcut is undefined')
          }
          return { pluginId: p.id, shortcut: p.shortcut }
        })

      const conflicts = checkShortcutConflict(plugin.shortcut, existingShortcuts)

      if (conflicts.length > 0) {
        const conflictList = conflicts.map((c) => `"${c.pluginId}" (${c.shortcut})`).join(', ')
        console.warn(
          `Shortcut conflict detected for plugin "${plugin.id}": shortcut "${plugin.shortcut}" conflicts with ${conflictList}`
        )
      }
    }

    this.plugins.set(plugin.id, plugin)
    this.registerHooks(plugin)
    this.updatePluginState(plugin.id, 'registered')

    if (plugin.onInstall) {
      try {
        await plugin.onInstall()
      } catch (error) {
        this.updatePluginState(
          plugin.id,
          'error',
          error instanceof Error ? error.message : String(error)
        )
        throw error
      }
    }
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

  async unregister(id: string): Promise<boolean> {
    const plugin = this.plugins.get(id)
    if (plugin?.onUninstall) {
      try {
        await plugin.onUninstall()
      } catch (error) {
        this.updatePluginState(id, 'error', error instanceof Error ? error.message : String(error))
      }
    }

    const deleted = this.plugins.delete(id)
    if (deleted) {
      this.unregisterHooks(id)
      this.pluginStates.delete(id)

      const { pluginEventManager } = await import('./events')
      pluginEventManager.unsubscribeAll(id)
    }
    return deleted
  }

  clear(): void {
    this.plugins.clear()
    this.hooks.clear()
    this.pluginStates.clear()
  }

  getState(id: string): PluginState | undefined {
    return this.pluginStates.get(id)
  }

  getAllStates(): PluginState[] {
    return Array.from(this.pluginStates.values())
  }

  updatePluginState(id: string, status: PluginState['status'], error?: string): void {
    const existingState = this.pluginStates.get(id)
    const now = new Date()

    const newState: PluginState = {
      id,
      status,
      registeredAt: existingState?.registeredAt || now,
      activatedAt: status === 'activated' ? now : existingState?.activatedAt,
      deactivatedAt: status === 'deactivated' ? now : existingState?.deactivatedAt,
      error: error || existingState?.error,
    }

    this.pluginStates.set(id, newState)
  }

  private registerHooks(plugin: ToolPlugin): void {
    if (!plugin.hooks) return

    const hookKeys: Array<keyof PluginHooks> = [
      'beforeToolSwitch',
      'afterToolSwitch',
      'beforeDrawingStart',
      'afterDrawingStart',
      'beforeDrawingFinish',
      'afterDrawingFinish',
    ]

    for (const hookKey of hookKeys) {
      const hook = plugin.hooks[hookKey]
      if (hook) {
        if (!this.hooks.has(hookKey)) {
          this.hooks.set(hookKey, [])
        }
        const handlers = this.hooks.get(hookKey)
        if (handlers) {
          handlers.push({
            pluginId: plugin.id,
            handler: hook as HookHandler | HookInterceptor,
          })
        }
      }
    }
  }

  private unregisterHooks(pluginId: string): void {
    for (const [hookKey, handlers] of this.hooks.entries()) {
      const filtered = handlers.filter((h) => h.pluginId !== pluginId)
      if (filtered.length === 0) {
        this.hooks.delete(hookKey)
      } else {
        this.hooks.set(hookKey, filtered)
      }
    }
  }

  async executeHook<T extends keyof PluginHooks>(
    hookName: T,
    context: T extends 'beforeToolSwitch' | 'afterToolSwitch'
      ? ToolSwitchContext
      : T extends 'beforeDrawingStart' | 'afterDrawingStart'
        ? DrawingStartContext
        : T extends 'beforeDrawingFinish' | 'afterDrawingFinish'
          ? DrawingFinishContext
          : never
  ): Promise<boolean> {
    const handlers = this.hooks.get(hookName)
    if (!handlers || handlers.length === 0) {
      return true
    }

    if (hookName.startsWith('before')) {
      for (const { handler } of handlers) {
        const result = await (handler as HookInterceptor)(context)
        if (result === false) {
          return false
        }
      }
    } else {
      for (const { handler } of handlers) {
        await (handler as HookHandler)(context)
      }
    }

    return true
  }

  getDependencyOrder(): string[] {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const order: string[] = []

    const visit = (pluginId: string): void => {
      if (visiting.has(pluginId)) {
        throw new Error(`Circular dependency detected involving plugin "${pluginId}"`)
      }
      if (visited.has(pluginId)) {
        return
      }

      const plugin = this.plugins.get(pluginId)
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

    for (const pluginId of this.plugins.keys()) {
      if (!visited.has(pluginId)) {
        visit(pluginId)
      }
    }

    return order
  }
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  const maxLength = Math.max(parts1.length, parts2.length)

  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0
    if (part1 > part2) return 1
    if (part1 < part2) return -1
  }

  return 0
}

export const pluginRegistry = new PluginRegistry()
