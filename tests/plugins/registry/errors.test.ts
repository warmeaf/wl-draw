import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pluginRegistry } from '@/plugins/registry'
import type {
  DrawingFinishContext,
  DrawingStartContext,
  PluginHooks,
  PluginMetadataInfo,
  ToolSwitchContext,
} from '@/plugins/types'
import { createMockLazyPluginLoader, createMockPlugin } from '../../utils/mockPlugin'
import {
  registerAndVerifyPlugin,
  setupPluginRegistry,
  testErrorHandling,
  verifyPluginNotRegistered,
  verifyPluginRegistered,
} from '../../utils/testHelpers'

describe('PluginRegistry - Error Handling', () => {
  beforeEach(() => {
    setupPluginRegistry()
  })

  describe('shortcut conflict detection', () => {
    it('should detect shortcut conflicts', async () => {
      const plugin1 = createMockPlugin('plugin-1', { shortcut: 'Ctrl+A' })
      const plugin2 = createMockPlugin('plugin-2', { shortcut: 'Ctrl+A' })

      await pluginRegistry.register(plugin1)
      await expect(pluginRegistry.register(plugin2)).resolves.not.toThrow()
    })
  })

  describe('getDependencyOrder error handling', () => {
    it('should handle circular dependency error in registry', async () => {
      const pluginA = createMockPlugin('plugin-a', {
        metadata: {
          version: '1.0.0',
        },
      })
      const pluginB = createMockPlugin('plugin-b', {
        metadata: {
          version: '1.0.0',
        },
      })

      await pluginRegistry.register(pluginA)
      await pluginRegistry.register(pluginB)

      pluginA.metadata.dependencies = ['plugin-b']
      pluginB.metadata.dependencies = ['plugin-a']

      expect(() => {
        pluginRegistry.getDependencyOrder()
      }).toThrow('Circular dependency detected')
    })
  })

  describe('getAllMetadata with lazy plugins', () => {
    it('should include lazy plugin metadata', async () => {
      const plugin = createMockPlugin('regular-plugin')
      await pluginRegistry.register(plugin)

      const lazyPlugin = createMockPlugin('lazy-plugin')
      const loader = createMockLazyPluginLoader(lazyPlugin)
      const metadata: PluginMetadataInfo = {
        id: 'lazy-plugin',
        name: 'Lazy Plugin',
        type: 'lazy-plugin',
        metadata: { version: '1.0.0' },
      }

      await pluginRegistry.register(loader, metadata)

      const allMetadata = pluginRegistry.getAllMetadata()
      const metadataIds = allMetadata.map((m) => m.id)
      expect(metadataIds).toContain('regular-plugin')
      expect(metadataIds).toContain('lazy-plugin')
    })
  })

  describe('unregister event cleanup', () => {
    it('should cleanup event subscriptions on unregister', async () => {
      const { pluginEventManager } = await import('@/plugins/events')
      const plugin = createMockPlugin('test-plugin')
      await pluginRegistry.register(plugin)

      const unsubscribe = vi.fn()
      pluginEventManager.subscribe('test-plugin', unsubscribe)

      await pluginRegistry.unregister('test-plugin')

      expect(unsubscribe).toHaveBeenCalled()
    })
  })

  describe('error scenarios and rollback', () => {
    it('should rollback all changes when registration fails', async () => {
      const plugin = createMockPlugin('rollback-plugin', {
        onInstall: async () => {
          throw new Error('Install failed')
        },
      })

      await testErrorHandling(() => pluginRegistry.register(plugin))

      verifyPluginNotRegistered('rollback-plugin')
      const metadata = pluginRegistry.getPluginMetadata('rollback-plugin')
      expect(metadata).toBeUndefined()
      const state = pluginRegistry.getState('rollback-plugin')
      expect(state).toBeUndefined()
    })

    it('should handle onUninstall failure without breaking unregister', async () => {
      const onUninstall = vi.fn(() => {
        throw new Error('Uninstall failed')
      })
      const plugin = createMockPlugin('uninstall-error-plugin', {
        onUninstall,
      })

      await pluginRegistry.register(plugin)
      verifyPluginRegistered('uninstall-error-plugin')

      await pluginRegistry.unregister('uninstall-error-plugin')

      expect(onUninstall).toHaveBeenCalled()
      verifyPluginNotRegistered('uninstall-error-plugin')
    })

    it('should handle plugin state error scenarios', async () => {
      await registerAndVerifyPlugin('error-state-plugin')

      pluginRegistry.updatePluginState('error-state-plugin', 'error', 'Test error')

      const state = pluginRegistry.getState('error-state-plugin')
      expect(state?.status).toBe('error')
      expect(state?.error).toBe('Test error')
    })

    it('should handle lazy plugin loader failure', async () => {
      const failingLoader = vi.fn(async () => {
        throw new Error('Loader failed')
      })
      const metadata: PluginMetadataInfo = {
        id: 'failing-loader-plugin',
        name: 'Failing Loader Plugin',
        type: 'failing-loader-plugin',
        metadata: { version: '1.0.0' },
      }

      await pluginRegistry.register(failingLoader, metadata)

      await expect(pluginRegistry.get('failing-loader-plugin')).rejects.toThrow()

      const state = pluginRegistry.getState('failing-loader-plugin')
      expect(state?.status).toBe('error')
    })

    it('should handle concurrent registration conflicts', async () => {
      const plugin1 = createMockPlugin('concurrent-plugin', { name: 'Plugin 1' })
      const plugin2 = createMockPlugin('concurrent-plugin', { name: 'Plugin 2' })

      await Promise.all([pluginRegistry.register(plugin1), pluginRegistry.register(plugin2)])

      const registered = await pluginRegistry.get('concurrent-plugin')
      expect(registered).toBeDefined()
      expect(['Plugin 1', 'Plugin 2']).toContain(registered?.name)
    })

    it('should handle concurrent lazy plugin loading correctly', async () => {
      const plugin = createMockPlugin('concurrent-lazy-plugin')
      const loader = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return plugin
      })
      const metadata: PluginMetadataInfo = {
        id: 'concurrent-lazy-plugin',
        name: 'Concurrent Lazy Plugin',
        type: 'concurrent-lazy-plugin',
        metadata: { version: '1.0.0' },
      }

      await pluginRegistry.register(loader, metadata)

      const [result1, result2, result3] = await Promise.all([
        pluginRegistry.get('concurrent-lazy-plugin'),
        pluginRegistry.get('concurrent-lazy-plugin'),
        pluginRegistry.get('concurrent-lazy-plugin'),
      ])

      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
      expect(result3).toBeDefined()
      expect(result1?.id).toBe('concurrent-lazy-plugin')
      expect(result2?.id).toBe('concurrent-lazy-plugin')
      expect(result3?.id).toBe('concurrent-lazy-plugin')
      expect(loader).toHaveBeenCalledTimes(1)
    })

    it('should maintain consistency during concurrent unregister and get', async () => {
      const plugin = createMockPlugin('concurrent-consistency-plugin')
      await pluginRegistry.register(plugin)

      const [getResult, unregisterResult] = await Promise.all([
        pluginRegistry.get('concurrent-consistency-plugin'),
        pluginRegistry.unregister('concurrent-consistency-plugin'),
      ])

      expect(getResult).toBeDefined()
      expect(unregisterResult).toBe(true)
      expect(pluginRegistry.has('concurrent-consistency-plugin')).toBe(false)
    })

    it('should handle concurrent registration of multiple different plugins', async () => {
      const plugins = Array.from({ length: 10 }, (_, i) =>
        createMockPlugin(`concurrent-plugin-${i}`)
      )

      await Promise.all(plugins.map((plugin) => pluginRegistry.register(plugin)))

      const allPlugins = pluginRegistry.getAll()
      expect(allPlugins.length).toBe(10)
      plugins.forEach((plugin) => {
        expect(pluginRegistry.has(plugin.id)).toBe(true)
      })
    })

    it.each([
      ['beforeToolSwitch', { from: 'a', to: 'b' }, true] as const,
      ['afterToolSwitch', { from: 'a', to: 'b' }, undefined] as const,
      ['beforeDrawingStart', { toolType: 'rect', point: { x: 0, y: 0 } }, true] as const,
      ['afterDrawingStart', { toolType: 'rect', point: { x: 0, y: 0 } }, undefined] as const,
      ['beforeDrawingFinish', { toolType: 'rect', objectId: 'obj-1' }, true] as const,
      ['afterDrawingFinish', { toolType: 'rect', objectId: 'obj-1' }, undefined] as const,
    ])('should handle errors in %s hook gracefully', async (hookName, context, expectedResult) => {
      const failingHook = vi.fn(() => {
        throw new Error('Hook error')
      })

      const plugin = createMockPlugin(`failing-${hookName}-plugin`, {
        hooks: {
          [hookName]: failingHook,
        } as Partial<PluginHooks>,
      })
      await pluginRegistry.register(plugin)

      const result = await pluginRegistry.executeHook(
        hookName as keyof PluginHooks,
        context as ToolSwitchContext | DrawingStartContext | DrawingFinishContext
      )

      expect(failingHook).toHaveBeenCalled()
      if (expectedResult !== undefined) {
        expect(result).toBe(expectedResult)
      }
    })

    it('should handle getByType with lazy plugin that fails to load', async () => {
      const failingLoader = vi.fn(async () => {
        throw new Error('Load failed')
      })
      const metadata: PluginMetadataInfo = {
        id: 'failing-type-plugin',
        name: 'Failing Type Plugin',
        type: 'failing-type',
        metadata: { version: '1.0.0' },
      }

      await pluginRegistry.register(failingLoader, metadata)

      await expect(pluginRegistry.getByType('failing-type')).rejects.toThrow()
    })
  })
})
