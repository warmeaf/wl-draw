import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pluginRegistry } from '@/plugins/registry'
import type { PluginMetadataInfo } from '@/plugins/types'
import { createMockLazyPluginLoader, createMockPlugin } from '../../utils/mockPlugin'
import { setupPluginRegistry } from '../../utils/testHelpers'

describe('PluginRegistry - Lazy Loading', () => {
  beforeEach(() => {
    setupPluginRegistry()
  })

  describe('loadPlugin (via get)', () => {
    it('should handle concurrent loading of same plugin', async () => {
      const plugin = createMockPlugin('lazy-plugin')
      const loader = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return plugin
      })
      const metadata: PluginMetadataInfo = {
        id: 'lazy-plugin',
        name: 'Lazy Plugin',
        type: 'lazy-plugin',
        metadata: { version: '1.0.0' },
      }

      await pluginRegistry.register(loader, metadata)

      const [result1, result2, result3] = await Promise.all([
        pluginRegistry.get('lazy-plugin'),
        pluginRegistry.get('lazy-plugin'),
        pluginRegistry.get('lazy-plugin'),
      ])

      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
      expect(result3).toBeDefined()
      expect(result1?.id).toBe('lazy-plugin')
      expect(result2?.id).toBe('lazy-plugin')
      expect(result3?.id).toBe('lazy-plugin')
      expect(loader).toHaveBeenCalledTimes(1)
    })

    it('should automatically load plugin dependencies', async () => {
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

      const loaded = await pluginRegistry.get('main-plugin')
      expect(loaded).toBeDefined()
      expect(loaded?.id).toBe('main-plugin')
      expect(pluginRegistry.has('dep-plugin')).toBe(true)
    })

    it('should handle lazy plugin with mismatched id', async () => {
      const plugin = createMockPlugin('wrong-id')
      const loader = createMockLazyPluginLoader(plugin)
      const metadata: PluginMetadataInfo = {
        id: 'lazy-plugin',
        name: 'Lazy Plugin',
        type: 'lazy-plugin',
        metadata: { version: '1.0.0' },
      }

      await pluginRegistry.register(loader, metadata)

      await expect(pluginRegistry.get('lazy-plugin')).rejects.toThrow('different id')
    })

    it('should handle lazy plugin validation failure', async () => {
      const invalidPlugin = createMockPlugin('lazy-plugin', {
        id: '',
      })
      const loader = createMockLazyPluginLoader(invalidPlugin)
      const metadata: PluginMetadataInfo = {
        id: 'lazy-plugin',
        name: 'Lazy Plugin',
        type: 'lazy-plugin',
        metadata: { version: '1.0.0' },
      }

      await pluginRegistry.register(loader, metadata)

      await expect(pluginRegistry.get('lazy-plugin')).rejects.toThrow()
    })

    it('should rollback on loadPlugin failure', async () => {
      const plugin = createMockPlugin('lazy-plugin', {
        onInstall: async () => {
          throw new Error('Install failed')
        },
      })
      const loader = createMockLazyPluginLoader(plugin)
      const metadata: PluginMetadataInfo = {
        id: 'lazy-plugin',
        name: 'Lazy Plugin',
        type: 'lazy-plugin',
        metadata: { version: '1.0.0' },
      }

      await pluginRegistry.register(loader, metadata)

      await expect(pluginRegistry.get('lazy-plugin')).rejects.toThrow()

      expect(pluginRegistry.has('lazy-plugin')).toBe(false)
      const state = pluginRegistry.getState('lazy-plugin')
      expect(state?.status).toBe('error')
      expect(state?.error).toBeDefined()
    })

    it('should handle lazy plugin not registered error', async () => {
      await expect(pluginRegistry.get('non-existent-lazy')).resolves.toBeUndefined()
    })

    it('should convert lazy plugin to regular plugin after loading', async () => {
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

      await pluginRegistry.get('lazy-plugin')

      const syncPlugin = pluginRegistry.getSync('lazy-plugin')
      expect(syncPlugin).toBeDefined()
      expect(syncPlugin?.id).toBe('lazy-plugin')
    })
  })
})
