/**
 * Plugin registry for managing tool plugins
 */

import { errorHandler } from '@/utils/errorHandler'
import { checkShortcutConflict } from './shortcut'
import type {
  DrawingFinishContext,
  DrawingStartContext,
  HookHandler,
  HookInterceptor,
  LazyPluginLoader,
  PluginHooks,
  PluginMetadataInfo,
  ToolPlugin,
  ToolSwitchContext,
} from './types'
import { getDependencyOrder } from './utils'

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
  private lazyPlugins = new Map<string, LazyPluginLoader>()
  private metadataCache = new Map<string, PluginMetadataInfo>()
  private loadingPromises = new Map<string, Promise<ToolPlugin>>()
  private hooks = new Map<
    keyof PluginHooks,
    Array<{ pluginId: string; handler: HookHandler | HookInterceptor }>
  >()
  private pluginStates = new Map<string, PluginState>()

  private validatePluginId(plugin: ToolPlugin, errors: string[]): void {
    if (!plugin.id || plugin.id.trim() === '') {
      errors.push('Plugin id is required')
    }
  }

  private validatePluginName(plugin: ToolPlugin, errors: string[]): void {
    if (!plugin.name || plugin.name.trim() === '') {
      errors.push('Plugin name is required')
    }
  }

  private validatePluginType(plugin: ToolPlugin, errors: string[]): void {
    if (!plugin.type || plugin.type.trim() === '') {
      errors.push('Plugin type is required')
    }
  }

  private validatePluginVersion(metadata: ToolPlugin['metadata'], errors: string[]): void {
    if (!metadata.version || metadata.version.trim() === '') {
      errors.push('Plugin metadata.version is required')
    }
  }

  private validatePluginCoreVersion(metadata: ToolPlugin['metadata'], errors: string[]): void {
    if (metadata.minCoreVersion) {
      if (compareVersions(metadata.minCoreVersion, CORE_VERSION) > 0) {
        errors.push(
          `Plugin requires core version ${metadata.minCoreVersion} or higher, but current version is ${CORE_VERSION}`
        )
      }
    }
  }

  private validatePluginDependencies(metadata: ToolPlugin['metadata'], errors: string[]): void {
    if (metadata.dependencies && metadata.dependencies.length > 0) {
      for (const depId of metadata.dependencies) {
        if (!this.plugins.has(depId) && !this.lazyPlugins.has(depId)) {
          errors.push(`Plugin dependency "${depId}" is not registered`)
        }
      }
    }
  }

  private validatePluginMetadata(plugin: ToolPlugin, errors: string[]): void {
    if (!plugin.metadata) {
      errors.push('Plugin metadata is required')
      return
    }

    this.validatePluginVersion(plugin.metadata, errors)
    this.validatePluginCoreVersion(plugin.metadata, errors)
    this.validatePluginDependencies(plugin.metadata, errors)
  }

  private validatePluginCreateTool(plugin: ToolPlugin, errors: string[]): void {
    if (!plugin.createTool || typeof plugin.createTool !== 'function') {
      errors.push('Plugin createTool function is required')
    }
  }

  validatePlugin(plugin: ToolPlugin): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    this.validatePluginId(plugin, errors)
    this.validatePluginName(plugin, errors)
    this.validatePluginType(plugin, errors)
    this.validatePluginMetadata(plugin, errors)
    this.validatePluginCreateTool(plugin, errors)

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  async register(
    plugin: ToolPlugin | LazyPluginLoader,
    metadata?: PluginMetadataInfo
  ): Promise<void> {
    if (typeof plugin === 'function') {
      const loader = plugin
      if (!metadata) {
        throw new Error('Metadata is required when registering a lazy plugin')
      }

      if (this.plugins.has(metadata.id)) {
        errorHandler.warn(`Plugin with id "${metadata.id}" is already registered. Overwriting.`)
        this.unregisterHooks(metadata.id)
      }

      if (this.lazyPlugins.has(metadata.id)) {
        errorHandler.warn(
          `Lazy plugin with id "${metadata.id}" is already registered. Overwriting.`
        )
      }

      this.lazyPlugins.set(metadata.id, loader)
      this.metadataCache.set(metadata.id, metadata)
      this.updatePluginState(metadata.id, 'registered')
      return
    }

    const validation = this.validatePlugin(plugin)
    if (!validation.valid) {
      throw new Error(
        `Plugin validation failed for "${plugin.id}": ${validation.errors.join(', ')}`
      )
    }

    if (this.plugins.has(plugin.id)) {
      errorHandler.warn(`Plugin with id "${plugin.id}" is already registered. Overwriting.`)
      this.unregisterHooks(plugin.id)
    }

    if (this.lazyPlugins.has(plugin.id)) {
      this.lazyPlugins.delete(plugin.id)
      this.metadataCache.delete(plugin.id)
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
        errorHandler.warn(
          `Shortcut conflict detected for plugin "${plugin.id}": shortcut "${plugin.shortcut}" conflicts with ${conflictList}`
        )
      }
    }

    this.plugins.set(plugin.id, plugin)
    this.metadataCache.set(plugin.id, {
      id: plugin.id,
      name: plugin.name,
      type: plugin.type,
      metadata: plugin.metadata,
      category: plugin.category,
      ui: plugin.ui,
      shortcut: plugin.shortcut,
    })
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

  async get(id: string): Promise<ToolPlugin | undefined> {
    const plugin = this.plugins.get(id)
    if (plugin) {
      return plugin
    }

    if (this.lazyPlugins.has(id)) {
      return await this.loadPlugin(id)
    }

    return undefined
  }

  async getByType(type: string): Promise<ToolPlugin | undefined> {
    const loadedPlugin = Array.from(this.plugins.values()).find((plugin) => plugin.type === type)
    if (loadedPlugin) {
      return loadedPlugin
    }

    for (const [pluginId, metadata] of this.metadataCache.entries()) {
      if (metadata.type === type && this.lazyPlugins.has(pluginId)) {
        return await this.loadPlugin(pluginId)
      }
    }

    return undefined
  }

  getSync(id: string): ToolPlugin | undefined {
    return this.plugins.get(id)
  }

  getByTypeSync(type: string): ToolPlugin | undefined {
    return Array.from(this.plugins.values()).find((plugin) => plugin.type === type)
  }

  getAll(): ToolPlugin[] {
    return Array.from(this.plugins.values())
  }

  getAllMetadata(): PluginMetadataInfo[] {
    const loadedMetadata = Array.from(this.plugins.values()).map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      type: plugin.type,
      metadata: plugin.metadata,
      category: plugin.category,
      ui: plugin.ui,
      shortcut: plugin.shortcut,
    }))

    const lazyMetadata = Array.from(this.metadataCache.values()).filter(
      (metadata) => !this.plugins.has(metadata.id)
    )

    return [...loadedMetadata, ...lazyMetadata]
  }

  getPluginMetadata(id: string): PluginMetadataInfo | undefined {
    const plugin = this.plugins.get(id)
    if (plugin) {
      return {
        id: plugin.id,
        name: plugin.name,
        type: plugin.type,
        metadata: plugin.metadata,
        category: plugin.category,
        ui: plugin.ui,
        shortcut: plugin.shortcut,
      }
    }
    return this.metadataCache.get(id)
  }

  getAllPluginMetadata(): PluginMetadataInfo[] {
    return this.getAllMetadata()
  }

  getByCategory(category: string): ToolPlugin[] {
    return Array.from(this.plugins.values()).filter((plugin) => plugin.category === category)
  }

  has(id: string): boolean {
    return this.plugins.has(id) || this.lazyPlugins.has(id)
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
    this.lazyPlugins.clear()
    this.metadataCache.clear()
    this.loadingPromises.clear()
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

  /**
   * Calculates topological sort order for plugin dependencies using DFS.
   * Ensures plugins are initialized in correct order: dependencies before dependents.
   * Uses 'visiting' set to detect circular dependencies during traversal.
   */
  getDependencyOrder(): string[] {
    const allPlugins = [
      ...Array.from(this.plugins.values()),
      ...Array.from(this.metadataCache.values()).map((metadata) => ({
        id: metadata.id,
        metadata: metadata.metadata,
      })),
    ]
    return getDependencyOrder(allPlugins as ToolPlugin[])
  }

  private async loadPlugin(id: string): Promise<ToolPlugin> {
    const loadedPlugin = this.plugins.get(id)
    if (loadedPlugin) {
      return loadedPlugin
    }

    const existingPromise = this.loadingPromises.get(id)
    if (existingPromise) {
      return await existingPromise
    }

    const loader = this.lazyPlugins.get(id)
    if (!loader) {
      throw new Error(`Plugin "${id}" is not registered as a lazy plugin`)
    }

    const loadPromise = (async () => {
      try {
        const plugin = await loader()

        if (plugin.id !== id) {
          throw new Error(
            `Plugin loader for "${id}" returned a plugin with different id "${plugin.id}"`
          )
        }

        const validation = this.validatePlugin(plugin)
        if (!validation.valid) {
          throw new Error(`Plugin validation failed for "${id}": ${validation.errors.join(', ')}`)
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
            errorHandler.warn(
              `Shortcut conflict detected for plugin "${plugin.id}": shortcut "${plugin.shortcut}" conflicts with ${conflictList}`
            )
          }
        }

        if (plugin.metadata.dependencies && plugin.metadata.dependencies.length > 0) {
          for (const depId of plugin.metadata.dependencies) {
            if (!this.plugins.has(depId)) {
              await this.loadPlugin(depId)
            }
          }
        }

        this.plugins.set(plugin.id, plugin)
        this.lazyPlugins.delete(plugin.id)
        this.metadataCache.set(plugin.id, {
          id: plugin.id,
          name: plugin.name,
          type: plugin.type,
          metadata: plugin.metadata,
          category: plugin.category,
          ui: plugin.ui,
          shortcut: plugin.shortcut,
        })
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

        return plugin
      } catch (error) {
        this.updatePluginState(id, 'error', error instanceof Error ? error.message : String(error))
        throw error
      } finally {
        this.loadingPromises.delete(id)
      }
    })()

    this.loadingPromises.set(id, loadPromise)
    return await loadPromise
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
