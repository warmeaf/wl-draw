/**
 * Plugin system initialization and management
 * Provides unified entry point for plugin system initialization
 */

import { initializeBuiltinPlugins } from './builtin'

let initialized = false

export async function initializePlugins(): Promise<void> {
  if (initialized) {
    console.warn('Plugin system has already been initialized')
    return
  }

  await initializeBuiltinPlugins()
  initialized = true
}

export { pluginEventBus, pluginEventManager } from './events'
export type { PluginState } from './registry'
export { pluginRegistry } from './registry'
export type {
  PluginCapabilities,
  PluginMetadata,
  ToolContext,
  ToolInstance,
  ToolPlugin,
} from './types'
