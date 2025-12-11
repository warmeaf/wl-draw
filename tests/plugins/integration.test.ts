import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pluginEventBus, pluginEventManager } from '@/plugins/events'
import { pluginRegistry } from '@/plugins/registry'
import type { PluginMetadataInfo } from '@/plugins/types'
import { createMockToolContext } from '../utils/mockContext'
import { createMockLazyPluginLoader, createMockPlugin } from '../utils/mockPlugin'
import {
  setupTestEnvironment,
  verifyPluginNotRegistered,
  verifyPluginState,
} from '../utils/testHelpers'

describe('Plugin System Integration', () => {
  beforeEach(() => {
    setupTestEnvironment()
  })

  describe('Plugin Lifecycle Integration', () => {
    it('should complete full plugin lifecycle: register → load → activate → use → unregister', async () => {
      const onInstall = vi.fn()
      const onUninstall = vi.fn()
      const onActivate = vi.fn()
      const onDeactivate = vi.fn()

      const plugin = createMockPlugin('lifecycle-plugin', {
        onInstall,
        onUninstall,
        createTool: () => ({
          onActivate,
          onDeactivate,
        }),
      })

      await pluginRegistry.register(plugin)
      expect(onInstall).toHaveBeenCalled()
      verifyPluginState('lifecycle-plugin', 'registered')

      const loaded = await pluginRegistry.get('lifecycle-plugin')
      expect(loaded).toBeDefined()

      const mockContext = createMockToolContext()
      const toolInstance = loaded?.createTool(mockContext)
      toolInstance?.onActivate?.()
      expect(onActivate).toHaveBeenCalled()

      toolInstance?.onDeactivate?.()
      expect(onDeactivate).toHaveBeenCalled()

      await pluginRegistry.unregister('lifecycle-plugin')
      expect(onUninstall).toHaveBeenCalled()
      verifyPluginNotRegistered('lifecycle-plugin')
    })

    it('should handle lazy plugin complete lifecycle', async () => {
      const onInstall = vi.fn()
      const plugin = createMockPlugin('lazy-lifecycle-plugin', {
        onInstall,
      })
      const loader = createMockLazyPluginLoader(plugin)
      const metadata: PluginMetadataInfo = {
        id: 'lazy-lifecycle-plugin',
        name: 'Lazy Lifecycle Plugin',
        type: 'lazy-lifecycle-plugin',
        metadata: { version: '1.0.0' },
      }

      await pluginRegistry.register(loader, metadata)
      expect(pluginRegistry.has('lazy-lifecycle-plugin')).toBe(true)

      const loaded = await pluginRegistry.get('lazy-lifecycle-plugin')
      expect(loaded).toBeDefined()
      expect(onInstall).toHaveBeenCalled()
      expect(loaded?.id).toBe('lazy-lifecycle-plugin')

      await pluginRegistry.unregister('lazy-lifecycle-plugin')
      verifyPluginNotRegistered('lazy-lifecycle-plugin')
    })

    it('should handle plugin dependency loading flow', async () => {
      const depPlugin = createMockPlugin('dep-plugin')
      const depLoader = createMockLazyPluginLoader(depPlugin)
      const depMetadata: PluginMetadataInfo = {
        id: 'dep-plugin',
        name: 'Dependency Plugin',
        type: 'dep-plugin',
        metadata: { version: '1.0.0' },
      }

      const mainPlugin = createMockPlugin('main-plugin', {
        metadata: {
          version: '1.0.0',
          dependencies: ['dep-plugin'],
        },
      })
      const mainLoader = createMockLazyPluginLoader(mainPlugin)
      const mainMetadata: PluginMetadataInfo = {
        id: 'main-plugin',
        name: 'Main Plugin',
        type: 'main-plugin',
        metadata: {
          version: '1.0.0',
          dependencies: ['dep-plugin'],
        },
      }

      await pluginRegistry.register(depLoader, depMetadata)
      await pluginRegistry.register(mainLoader, mainMetadata)

      const mainLoaded = await pluginRegistry.get('main-plugin')
      expect(mainLoaded).toBeDefined()

      const depLoaded = await pluginRegistry.get('dep-plugin')
      expect(depLoaded).toBeDefined()
    })
  })

  describe('Plugin Registry + Event System Integration', () => {
    it('should emit events when plugin is activated/deactivated', async () => {
      const activatedHandler = vi.fn()
      const deactivatedHandler = vi.fn()

      pluginEventBus.on('plugin:activated', activatedHandler)
      pluginEventBus.on('plugin:deactivated', deactivatedHandler)

      const plugin = createMockPlugin('event-plugin')
      await pluginRegistry.register(plugin)

      pluginEventBus.emit('plugin:activated', {
        pluginId: 'event-plugin',
        toolType: 'event-tool',
      })

      expect(activatedHandler).toHaveBeenCalledWith({
        pluginId: 'event-plugin',
        toolType: 'event-tool',
      })

      pluginEventBus.emit('plugin:deactivated', {
        pluginId: 'event-plugin',
        toolType: 'event-tool',
      })

      expect(deactivatedHandler).toHaveBeenCalledWith({
        pluginId: 'event-plugin',
        toolType: 'event-tool',
      })
    })

    it('should cleanup event subscriptions on plugin unregister', async () => {
      const plugin = createMockPlugin('event-cleanup-plugin')
      await pluginRegistry.register(plugin)

      const unsubscribe1 = vi.fn()
      const unsubscribe2 = vi.fn()

      pluginEventManager.subscribe('event-cleanup-plugin', unsubscribe1)
      pluginEventManager.subscribe('event-cleanup-plugin', unsubscribe2)

      expect(pluginEventManager.getSubscribedPlugins()).toContain('event-cleanup-plugin')

      await pluginRegistry.unregister('event-cleanup-plugin')

      expect(unsubscribe1).toHaveBeenCalled()
      expect(unsubscribe2).toHaveBeenCalled()
      expect(pluginEventManager.getSubscribedPlugins()).not.toContain('event-cleanup-plugin')
    })
  })

  describe('Plugin Registry + Hook System Integration', () => {
    it('should execute hooks during tool switching', async () => {
      const beforeToolSwitch = vi.fn(() => true)
      const afterToolSwitch = vi.fn()

      const plugin = createMockPlugin('hook-plugin', {
        hooks: {
          beforeToolSwitch,
          afterToolSwitch,
        },
      })

      await pluginRegistry.register(plugin)

      const beforeResult = await pluginRegistry.executeHook('beforeToolSwitch', {
        from: 'tool-a',
        to: 'tool-b',
      })

      expect(beforeResult).toBe(true)
      expect(beforeToolSwitch).toHaveBeenCalledWith({
        from: 'tool-a',
        to: 'tool-b',
      })

      await pluginRegistry.executeHook('afterToolSwitch', {
        from: 'tool-a',
        to: 'tool-b',
      })

      expect(afterToolSwitch).toHaveBeenCalledWith({
        from: 'tool-a',
        to: 'tool-b',
      })
    })

    it('should execute hooks during drawing lifecycle', async () => {
      const beforeDrawingStart = vi.fn(() => true)
      const afterDrawingStart = vi.fn()
      const beforeDrawingFinish = vi.fn(() => true)
      const afterDrawingFinish = vi.fn()

      const plugin = createMockPlugin('drawing-hook-plugin', {
        hooks: {
          beforeDrawingStart,
          afterDrawingStart,
          beforeDrawingFinish,
          afterDrawingFinish,
        },
      })

      await pluginRegistry.register(plugin)

      const startResult = await pluginRegistry.executeHook('beforeDrawingStart', {
        toolType: 'rect',
        point: { x: 10, y: 20 },
      })

      expect(startResult).toBe(true)
      expect(beforeDrawingStart).toHaveBeenCalled()

      await pluginRegistry.executeHook('afterDrawingStart', {
        toolType: 'rect',
        point: { x: 10, y: 20 },
      })

      expect(afterDrawingStart).toHaveBeenCalled()

      const finishResult = await pluginRegistry.executeHook('beforeDrawingFinish', {
        toolType: 'rect',
        objectId: 'obj-1',
      })

      expect(finishResult).toBe(true)
      expect(beforeDrawingFinish).toHaveBeenCalled()

      await pluginRegistry.executeHook('afterDrawingFinish', {
        toolType: 'rect',
        objectId: 'obj-1',
      })

      expect(afterDrawingFinish).toHaveBeenCalled()
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle plugin registration errors gracefully', async () => {
      const invalidPlugin = createMockPlugin('invalid-plugin', {
        id: '',
      })

      await expect(pluginRegistry.register(invalidPlugin)).rejects.toThrow()

      verifyPluginNotRegistered('invalid-plugin')
    })

    it('should handle hook execution errors without breaking system', async () => {
      const failingHook = vi.fn(() => {
        throw new Error('Hook error')
      })

      const plugin = createMockPlugin('failing-hook-plugin', {
        hooks: {
          beforeToolSwitch: failingHook,
        },
      })

      await pluginRegistry.register(plugin)

      const result = await pluginRegistry.executeHook('beforeToolSwitch', {
        from: 'tool-a',
        to: 'tool-b',
      })

      expect(result).toBe(true)
      expect(failingHook).toHaveBeenCalled()
    })

    it('should handle event handler errors gracefully', () => {
      const failingHandler = vi.fn(() => {
        throw new Error('Event handler error')
      })
      const workingHandler = vi.fn()

      pluginEventBus.on('tool:switched', failingHandler)
      pluginEventBus.on('tool:switched', workingHandler)

      pluginEventBus.emit('tool:switched', {
        from: 'tool-a',
        to: 'tool-b',
      })

      expect(failingHandler).toHaveBeenCalled()
      expect(workingHandler).toHaveBeenCalled()
    })
  })
})
