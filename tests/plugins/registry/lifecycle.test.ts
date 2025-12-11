import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pluginRegistry } from '@/plugins/registry'
import type { PluginMetadataInfo, ToolPlugin } from '@/plugins/types'
import { createMockLazyPluginLoader, createMockPlugin } from '../../utils/mockPlugin'
import {
  registerAndVerifyPlugin,
  registerMultiplePlugins,
  setupPluginRegistry,
  testErrorHandling,
  verifyArrayContains,
  verifyArrayLength,
  verifyPluginMetadata,
  verifyPluginNotRegistered,
  verifyPluginRegistered,
  verifyPluginState,
} from '../../utils/testHelpers'

describe('PluginRegistry - Lifecycle', () => {
  beforeEach(() => {
    setupPluginRegistry()
  })

  describe('register', () => {
    it('should register a valid plugin', async () => {
      await registerAndVerifyPlugin('test-plugin')
    })

    it('should throw error for invalid plugin', async () => {
      const plugin = createMockPlugin('test-plugin', { id: '' })
      await testErrorHandling(() => pluginRegistry.register(plugin))
    })

    it('should overwrite existing plugin', async () => {
      const plugin1 = createMockPlugin('test-plugin', { name: 'Plugin 1' })
      const plugin2 = createMockPlugin('test-plugin', { name: 'Plugin 2' })

      await pluginRegistry.register(plugin1)
      await pluginRegistry.register(plugin2)

      const registered = await pluginRegistry.get('test-plugin')
      expect(registered?.name).toBe('Plugin 2')
    })

    it('should register lazy plugin with metadata', async () => {
      const plugin = createMockPlugin('lazy-plugin')
      const loader = createMockLazyPluginLoader(plugin)
      const metadata: PluginMetadataInfo = {
        id: 'lazy-plugin',
        name: 'Lazy Plugin',
        type: 'lazy-plugin',
        metadata: { version: '1.0.0' },
      }

      await pluginRegistry.register(loader, metadata)

      expect(pluginRegistry.has('lazy-plugin')).toBe(true)
      const loaded = await pluginRegistry.get('lazy-plugin')
      expect(loaded).toBeDefined()
    })

    it('should throw error for lazy plugin without metadata', async () => {
      const plugin = createMockPlugin('lazy-plugin')
      const loader = createMockLazyPluginLoader(plugin)

      await expect(pluginRegistry.register(loader as unknown as ToolPlugin)).rejects.toThrow()
    })

    it('should call onInstall hook when registering', async () => {
      const onInstall = vi.fn()
      const plugin = createMockPlugin('test-plugin', { onInstall })

      await pluginRegistry.register(plugin)

      expect(onInstall).toHaveBeenCalled()
    })

    it('should rollback on onInstall failure', async () => {
      const onInstall = vi.fn(() => {
        throw new Error('Install failed')
      })
      const plugin = createMockPlugin('test-plugin', { onInstall })

      await testErrorHandling(() => pluginRegistry.register(plugin))

      verifyPluginNotRegistered('test-plugin')
    })

    it('should update plugin state on registration', async () => {
      await registerAndVerifyPlugin('test-plugin')
      verifyPluginState('test-plugin', 'registered')
    })
  })

  describe('get', () => {
    it('should get registered plugin', async () => {
      await registerAndVerifyPlugin('test-plugin')
    })

    it('should return undefined for non-existent plugin', async () => {
      const retrieved = await pluginRegistry.get('non-existent')
      expect(retrieved).toBeUndefined()
    })

    it('should load lazy plugin on get', async () => {
      const plugin = createMockPlugin('lazy-plugin')
      const loader = createMockLazyPluginLoader(plugin)
      const metadata: PluginMetadataInfo = {
        id: 'lazy-plugin',
        name: 'Lazy Plugin',
        type: 'lazy-plugin',
        metadata: { version: '1.0.0' },
      }

      await pluginRegistry.register(loader, metadata)
      const loaded = await pluginRegistry.get('lazy-plugin')

      expect(loaded).toBeDefined()
      expect(loaded?.id).toBe('lazy-plugin')
    })
  })

  describe('getSync', () => {
    it('should get registered plugin synchronously', async () => {
      await registerAndVerifyPlugin('test-plugin')

      const retrieved = pluginRegistry.getSync('test-plugin')
      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe('test-plugin')
    })

    it('should return undefined for non-existent plugin', () => {
      const retrieved = pluginRegistry.getSync('non-existent')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('getByType', () => {
    it('should get plugin by type', async () => {
      await registerAndVerifyPlugin('test-plugin', { type: 'rect' })

      const retrieved = await pluginRegistry.getByType('rect')
      expect(retrieved).toBeDefined()
      expect(retrieved?.type).toBe('rect')
    })

    it('should return undefined for non-existent type', async () => {
      const retrieved = await pluginRegistry.getByType('non-existent')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('getByTypeSync', () => {
    it('should get plugin by type synchronously', async () => {
      await registerAndVerifyPlugin('test-plugin', { type: 'rect' })

      const retrieved = pluginRegistry.getByTypeSync('rect')
      expect(retrieved).toBeDefined()
      expect(retrieved?.type).toBe('rect')
    })
  })

  describe('getAll', () => {
    it('should return all registered plugins', async () => {
      await registerMultiplePlugins(['plugin-1', 'plugin-2'])

      const all = pluginRegistry.getAll()
      verifyArrayLength(all, 2)
      verifyArrayContains(
        all.map((p) => p.id),
        ['plugin-1', 'plugin-2']
      )
    })
  })

  describe('getAllMetadata', () => {
    it('should return metadata for all plugins', async () => {
      await registerMultiplePlugins(['plugin-1', 'plugin-2'])

      const metadata = pluginRegistry.getAllMetadata()
      verifyArrayLength(metadata, 2)
      verifyArrayContains(
        metadata.map((m) => m.id),
        ['plugin-1', 'plugin-2']
      )
    })
  })

  describe('getPluginMetadata', () => {
    it('should return metadata for registered plugin', async () => {
      await registerAndVerifyPlugin('test-plugin')
      verifyPluginMetadata('test-plugin')
    })

    it('should return undefined for non-existent plugin', () => {
      const metadata = pluginRegistry.getPluginMetadata('non-existent')
      expect(metadata).toBeUndefined()
    })
  })

  describe('getByCategory', () => {
    it('should return plugins by category', async () => {
      await registerAndVerifyPlugin('plugin-1', { category: 'drawing' })
      await registerAndVerifyPlugin('plugin-2', { category: 'utility' })
      await registerAndVerifyPlugin('plugin-3', { category: 'drawing' })

      const drawingPlugins = pluginRegistry.getByCategory('drawing')
      verifyArrayLength(drawingPlugins, 2)
      verifyArrayContains(
        drawingPlugins.map((p) => p.id),
        ['plugin-1', 'plugin-3']
      )
    })
  })

  describe('has', () => {
    it('should return true for registered plugin', async () => {
      await registerAndVerifyPlugin('test-plugin')
      verifyPluginRegistered('test-plugin')
    })

    it('should return false for non-existent plugin', () => {
      verifyPluginNotRegistered('non-existent')
    })

    it('should return true for lazy plugin', async () => {
      const plugin = createMockPlugin('lazy-plugin')
      const loader = createMockLazyPluginLoader(plugin)
      const metadata: PluginMetadataInfo = {
        id: 'lazy-plugin',
        name: 'Lazy Plugin',
        type: 'lazy-plugin',
        metadata: { version: '1.0.0' },
      }

      await pluginRegistry.register(loader, metadata)
      expect(pluginRegistry.has('lazy-plugin')).toBe(true)
    })
  })

  describe('unregister', () => {
    it('should unregister a plugin', async () => {
      await registerAndVerifyPlugin('test-plugin')

      const result = await pluginRegistry.unregister('test-plugin')
      expect(result).toBe(true)
      verifyPluginNotRegistered('test-plugin')
    })

    it('should call onUninstall hook when unregistering', async () => {
      const onUninstall = vi.fn()
      const plugin = createMockPlugin('test-plugin', { onUninstall })
      await pluginRegistry.register(plugin)

      await pluginRegistry.unregister('test-plugin')

      expect(onUninstall).toHaveBeenCalled()
    })

    it('should return false for non-existent plugin', async () => {
      const result = await pluginRegistry.unregister('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear all plugins', async () => {
      await registerMultiplePlugins(['plugin-1', 'plugin-2'])

      pluginRegistry.clear()

      verifyArrayLength(pluginRegistry.getAll(), 0)
      verifyPluginNotRegistered('plugin-1')
      verifyPluginNotRegistered('plugin-2')
    })
  })
})
