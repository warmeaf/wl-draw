/**
 * Plugin registry for managing tool plugins
 */

import { ErrorSeverity, errorHandler } from '@/utils/errorHandler'
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

  // ==================== Plugin Validation Methods ====================

  private validatePluginId(plugin: ToolPlugin, errors: string[]): void {
    if (!plugin.id || plugin.id.trim() === '') {
      errors.push(
        'Plugin id is required. The id must be a non-empty string that uniquely identifies the plugin.'
      )
    }
  }

  private validatePluginName(plugin: ToolPlugin, errors: string[]): void {
    if (!plugin.name || plugin.name.trim() === '') {
      errors.push(
        'Plugin name is required. The name should be a human-readable string describing the plugin.'
      )
    }
  }

  private validatePluginType(plugin: ToolPlugin, errors: string[]): void {
    if (!plugin.type || plugin.type.trim() === '') {
      errors.push(
        'Plugin type is required. The type should match the tool type used in the application.'
      )
    }
  }

  private validatePluginVersion(metadata: ToolPlugin['metadata'], errors: string[]): void {
    if (!metadata.version || metadata.version.trim() === '') {
      errors.push(
        'Plugin metadata.version is required. Use semantic versioning format (e.g., "1.0.0").'
      )
    }
  }

  private validatePluginCoreVersion(metadata: ToolPlugin['metadata'], errors: string[]): void {
    if (metadata.minCoreVersion) {
      if (compareVersions(metadata.minCoreVersion, CORE_VERSION) > 0) {
        errors.push(
          `Plugin requires core version ${metadata.minCoreVersion} or higher, but current version is ${CORE_VERSION}. Please update the application or use a compatible plugin version.`
        )
      }
    }
  }

  private validatePluginDependencies(metadata: ToolPlugin['metadata'], errors: string[]): void {
    if (metadata.dependencies && metadata.dependencies.length > 0) {
      for (const depId of metadata.dependencies) {
        if (!this.plugins.has(depId) && !this.lazyPlugins.has(depId)) {
          errors.push(
            `Plugin dependency "${depId}" is not registered. Ensure the dependency plugin is registered before this plugin.`
          )
        }
      }
    }
  }

  private validatePluginMetadata(plugin: ToolPlugin, errors: string[]): void {
    if (!plugin.metadata) {
      errors.push(
        'Plugin metadata is required. The metadata object must contain at least a version field.'
      )
      return
    }

    this.validatePluginVersion(plugin.metadata, errors)
    this.validatePluginCoreVersion(plugin.metadata, errors)
    this.validatePluginDependencies(plugin.metadata, errors)
  }

  private validatePluginCreateTool(plugin: ToolPlugin, errors: string[]): void {
    if (!plugin.createTool || typeof plugin.createTool !== 'function') {
      errors.push(
        'Plugin createTool function is required. This function should create and return a ToolInstance.'
      )
    }
  }

  // ==================== Shortcut Conflict Checking ====================

  private checkPluginShortcutConflicts(plugin: ToolPlugin): void {
    if (!plugin.shortcut) {
      return
    }

    const existingShortcuts = Array.from(this.plugins.values())
      .filter((p) => p.shortcut && p.id !== plugin.id)
      .map((p) => {
        if (!p.shortcut) {
          errorHandler.handleRuntimeError(
            'Unexpected: shortcut is undefined during conflict check',
            undefined,
            { pluginId: p.id },
            ErrorSeverity.MEDIUM
          )
          return null
        }
        return { pluginId: p.id, shortcut: p.shortcut }
      })
      .filter((s): s is { pluginId: string; shortcut: string } => s !== null)

    const conflicts = checkShortcutConflict(plugin.shortcut, existingShortcuts)

    if (conflicts.length > 0) {
      const conflictList = conflicts.map((c) => `"${c.pluginId}" (${c.shortcut})`).join(', ')
      errorHandler.warn(
        `Shortcut conflict detected for plugin "${plugin.id}": shortcut "${plugin.shortcut}" conflicts with ${conflictList}`
      )
    }
  }

  // ==================== Plugin Registration Core Logic ====================

  private executeRollback(rollbackStack: Array<() => void>): void {
    if (rollbackStack.length === 0) {
      return
    }
    for (const rollback of rollbackStack.reverse()) {
      rollback()
    }
  }

  private async executePluginInstallHook(
    plugin: ToolPlugin,
    rollbackStack: Array<() => void>
  ): Promise<void> {
    if (!plugin.onInstall) {
      return
    }

    try {
      await plugin.onInstall()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.updatePluginState(plugin.id, 'error', errorMessage)
      errorHandler.handlePluginError(
        plugin.id,
        `onInstall hook failed: ${errorMessage}`,
        error instanceof Error ? error : undefined,
        {
          pluginName: plugin.name,
          operation: 'onInstall',
        },
        ErrorSeverity.HIGH
      )

      this.executeRollback(rollbackStack)

      throw error
    }
  }

  private createPluginMetadata(plugin: ToolPlugin): PluginMetadataInfo {
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

  private async registerPluginCore(
    plugin: ToolPlugin,
    rollbackStack: Array<() => void>
  ): Promise<void> {
    this.plugins.set(plugin.id, plugin)
    rollbackStack.push(() => {
      this.plugins.delete(plugin.id)
    })

    const metadata = this.createPluginMetadata(plugin)
    this.metadataCache.set(plugin.id, metadata)
    rollbackStack.push(() => {
      this.metadataCache.delete(plugin.id)
    })

    this.registerHooks(plugin)
    rollbackStack.push(() => {
      this.unregisterHooks(plugin.id)
    })

    this.updatePluginState(plugin.id, 'registered')
    rollbackStack.push(() => {
      this.pluginStates.delete(plugin.id)
    })

    await this.executePluginInstallHook(plugin, rollbackStack)
  }

  // ==================== Public Plugin Registration API ====================

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
      const lazyPluginLoader = plugin
      if (!metadata) {
        errorHandler.handleValidationError(
          'Metadata is required when registering a lazy plugin',
          { loader: 'LazyPluginLoader' },
          {
            operation: 'register',
          },
          ErrorSeverity.HIGH
        )
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

      this.lazyPlugins.set(metadata.id, lazyPluginLoader)
      this.metadataCache.set(metadata.id, metadata)
      this.updatePluginState(metadata.id, 'registered')
      return
    }

    const validation = this.validatePlugin(plugin)
    if (!validation.valid) {
      const errorMessage = `Plugin validation failed: ${validation.errors.join('; ')}`
      errorHandler.handleValidationError(
        errorMessage,
        { errors: validation.errors },
        {
          pluginId: plugin.id,
          pluginName: plugin.name,
          operation: 'register',
        },
        ErrorSeverity.HIGH
      )
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

    this.checkPluginShortcutConflicts(plugin)

    const rollbackStack: (() => void)[] = []

    try {
      await this.registerPluginCore(plugin, rollbackStack)
    } catch (error) {
      this.executeRollback(rollbackStack)
      throw error
    }
  }

  // ==================== Plugin Retrieval Methods ====================

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
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.updatePluginState(id, 'error', errorMessage)
        errorHandler.handlePluginError(
          id,
          `onUninstall hook failed: ${errorMessage}`,
          error instanceof Error ? error : undefined,
          {
            pluginName: plugin.name,
            operation: 'onUninstall',
          },
          ErrorSeverity.MEDIUM
        )
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

  // ==================== Plugin State Management ====================

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

  // ==================== Hook Management Methods ====================

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
        const hookHandlers = this.hooks.get(hookKey)
        if (hookHandlers) {
          hookHandlers.push({
            pluginId: plugin.id,
            handler: hook as HookHandler | HookInterceptor,
          })
        }
      }
    }
  }

  private unregisterHooks(pluginId: string): void {
    for (const [hookKey, hookHandlers] of this.hooks.entries()) {
      const filtered = hookHandlers.filter((h) => h.pluginId !== pluginId)
      if (filtered.length === 0) {
        this.hooks.delete(hookKey)
      } else {
        this.hooks.set(hookKey, filtered)
      }
    }
  }

  private isInterceptorHook(hookName: keyof PluginHooks): boolean {
    return hookName.startsWith('before')
  }

  private async executeInterceptorHook(
    hookName: keyof PluginHooks,
    hookHandlers: Array<{ pluginId: string; handler: HookHandler | HookInterceptor }>,
    context: ToolSwitchContext | DrawingStartContext | DrawingFinishContext
  ): Promise<boolean> {
    for (const { pluginId, handler } of hookHandlers) {
      try {
        const result = await (handler as HookInterceptor)(context)
        if (result === false) {
          return false
        }
      } catch (error) {
        errorHandler.handlePluginError(
          pluginId,
          `Hook "${hookName}" execution failed`,
          error instanceof Error ? error : undefined,
          {
            operation: hookName,
          },
          ErrorSeverity.MEDIUM
        )
      }
    }
    return true
  }

  private async executeHandlerHook(
    hookName: keyof PluginHooks,
    hookHandlers: Array<{ pluginId: string; handler: HookHandler | HookInterceptor }>,
    context: ToolSwitchContext | DrawingStartContext | DrawingFinishContext
  ): Promise<void> {
    for (const { pluginId, handler } of hookHandlers) {
      try {
        await (handler as HookHandler)(context)
      } catch (error) {
        errorHandler.handlePluginError(
          pluginId,
          `Hook "${hookName}" execution failed`,
          error instanceof Error ? error : undefined,
          {
            operation: hookName,
          },
          ErrorSeverity.MEDIUM
        )
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
    const hookHandlers = this.hooks.get(hookName)
    if (!hookHandlers || hookHandlers.length === 0) {
      return true
    }

    if (this.isInterceptorHook(hookName)) {
      return await this.executeInterceptorHook(hookName, hookHandlers, context)
    } else {
      await this.executeHandlerHook(hookName, hookHandlers, context)
      return true
    }
  }

  /**
   * Calculates topological sort order for plugin dependencies using DFS.
   * Ensures plugins are initialized in correct order: dependencies before dependents.
   * Uses 'visiting' set to detect circular dependencies during traversal.
   *
   * @returns Array of plugin IDs in dependency order
   * @throws Error if circular dependency is detected
   *
   * @example
   * ```typescript
   * try {
   *   const order = pluginRegistry.getDependencyOrder()
   *   // Use order to initialize plugins
   * } catch (error) {
   *   errorHandler.handleValidationError(
   *     `Circular dependency detected: ${error.message}`,
   *     error,
   *     { operation: 'getDependencyOrder' },
   *     ErrorSeverity.HIGH
   *   )
   * }
   * ```
   */
  getDependencyOrder(): string[] {
    try {
      const allPlugins = [
        ...Array.from(this.plugins.values()),
        ...Array.from(this.metadataCache.values()).map((metadata) => ({
          id: metadata.id,
          metadata: metadata.metadata,
        })),
      ]
      return getDependencyOrder(allPlugins as ToolPlugin[])
    } catch (error) {
      errorHandler.handleValidationError(
        `Circular dependency detected: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined,
        { operation: 'getDependencyOrder' },
        ErrorSeverity.HIGH
      )
      throw error
    }
  }

  // ==================== Lazy Plugin Loading ====================

  private async loadPlugin(id: string): Promise<ToolPlugin> {
    const loadedPlugin = this.plugins.get(id)
    if (loadedPlugin) {
      return loadedPlugin
    }

    const existingLoadPromise = this.loadingPromises.get(id)
    if (existingLoadPromise) {
      return await existingLoadPromise
    }

    const lazyPluginLoader = this.lazyPlugins.get(id)
    if (!lazyPluginLoader) {
      errorHandler.handlePluginError(
        id,
        'Plugin is not registered as a lazy plugin',
        undefined,
        {
          operation: 'loadPlugin',
        },
        ErrorSeverity.HIGH
      )
      throw new Error(`Plugin "${id}" is not registered as a lazy plugin`)
    }

    const pluginLoadPromise = (async () => {
      try {
        const plugin = await lazyPluginLoader()

        if (plugin.id !== id) {
          const errorMessage = `Plugin loader returned a plugin with different id "${plugin.id}"`
          errorHandler.handlePluginError(
            id,
            errorMessage,
            undefined,
            {
              expectedId: id,
              actualId: plugin.id,
              operation: 'loadPlugin',
            },
            ErrorSeverity.HIGH
          )
          throw new Error(
            `Plugin loader for "${id}" returned a plugin with different id "${plugin.id}"`
          )
        }

        const validation = this.validatePlugin(plugin)
        if (!validation.valid) {
          const errorMessage = `Plugin validation failed: ${validation.errors.join('; ')}`
          errorHandler.handleValidationError(
            errorMessage,
            { errors: validation.errors },
            {
              pluginId: plugin.id,
              pluginName: plugin.name,
              operation: 'loadPlugin',
            },
            ErrorSeverity.HIGH
          )
          throw new Error(`Plugin validation failed for "${id}": ${validation.errors.join(', ')}`)
        }

        this.checkPluginShortcutConflicts(plugin)

        if (plugin.metadata.dependencies && plugin.metadata.dependencies.length > 0) {
          for (const depId of plugin.metadata.dependencies) {
            if (!this.plugins.has(depId)) {
              await this.loadPlugin(depId)
            }
          }
        }

        const rollbackStack: (() => void)[] = []

        try {
          this.lazyPlugins.delete(plugin.id)

          await this.registerPluginCore(plugin, rollbackStack)
        } catch (error) {
          this.executeRollback(rollbackStack)
          throw error
        }

        return plugin
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.updatePluginState(id, 'error', errorMessage)
        errorHandler.handlePluginError(
          id,
          `Failed to load plugin: ${errorMessage}`,
          error instanceof Error ? error : undefined,
          {
            operation: 'loadPlugin',
          },
          ErrorSeverity.HIGH
        )
        throw error
      } finally {
        this.loadingPromises.delete(id)
      }
    })()

    this.loadingPromises.set(id, pluginLoadPromise)
    return await pluginLoadPromise
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
