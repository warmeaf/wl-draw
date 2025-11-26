/**
 * Plugin system initialization and management
 * Provides unified entry point for plugin system initialization
 */

import { errorHandler } from '@/utils/errorHandler'
import { initializeBuiltinPlugins, initializePiniaDependentPlugins } from './builtin'

let initialized = false
let piniaPluginsInitialized = false

export async function initializePlugins(): Promise<void> {
  if (initialized) {
    errorHandler.warn('Plugin system has already been initialized')
    return
  }

  await initializeBuiltinPlugins()
  initialized = true
}

export async function initializePluginsAfterPinia(): Promise<void> {
  if (piniaPluginsInitialized) {
    errorHandler.warn('Pinia-dependent plugins have already been initialized')
    return
  }

  await initializePiniaDependentPlugins()
  piniaPluginsInitialized = true
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
