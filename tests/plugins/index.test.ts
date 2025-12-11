import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pluginRegistry } from '@/plugins/registry'
import { createMockPlugin } from '../utils/mockPlugin'
import { setupTestEnvironment, testSuccessfulOperation } from '../utils/testHelpers'

const mockInitializeBuiltinPlugins = vi.fn(async () => {
  const mockPlugin1 = createMockPlugin('builtin-1')
  const mockPlugin2 = createMockPlugin('builtin-2')
  await pluginRegistry.register(mockPlugin1)
  await pluginRegistry.register(mockPlugin2)
})

const mockInitializePiniaDependentPlugins = vi.fn(async () => {
  const mockPlugin3 = createMockPlugin('pinia-plugin')
  await pluginRegistry.register(mockPlugin3)
})

vi.mock('@/plugins/builtin', () => ({
  initializeBuiltinPlugins: () => mockInitializeBuiltinPlugins(),
  initializePiniaDependentPlugins: () => mockInitializePiniaDependentPlugins(),
}))

describe('Plugin System Initialization', () => {
  beforeEach(() => {
    setupTestEnvironment()
  })

  describe('initializePlugins', () => {
    it('should initialize plugins', async () => {
      const { initializePlugins } = await import('@/plugins/index')
      await initializePlugins()

      expect(pluginRegistry.has('builtin-1')).toBe(true)
      expect(pluginRegistry.has('builtin-2')).toBe(true)
    })

    it('should not initialize twice', async () => {
      const { initializePlugins } = await import('@/plugins/index')

      await initializePlugins()
      const firstCallCount = mockInitializeBuiltinPlugins.mock.calls.length

      await initializePlugins()
      const secondCallCount = mockInitializeBuiltinPlugins.mock.calls.length

      expect(secondCallCount).toBe(firstCallCount)
    })

    it('should handle initialization errors gracefully', async () => {
      mockInitializeBuiltinPlugins.mockRejectedValueOnce(new Error('Initialization failed'))

      const { initializePlugins } = await import('@/plugins/index')
      await testSuccessfulOperation(() => initializePlugins())
    })
  })

  describe('initializePluginsAfterPinia', () => {
    it('should initialize Pinia-dependent plugins', async () => {
      const { initializePluginsAfterPinia } = await import('@/plugins/index')
      await initializePluginsAfterPinia()

      expect(pluginRegistry.has('pinia-plugin')).toBe(true)
    })

    it('should not initialize twice', async () => {
      const { initializePluginsAfterPinia } = await import('@/plugins/index')

      await initializePluginsAfterPinia()
      const firstCallCount = mockInitializePiniaDependentPlugins.mock.calls.length

      await initializePluginsAfterPinia()
      const secondCallCount = mockInitializePiniaDependentPlugins.mock.calls.length

      expect(secondCallCount).toBe(firstCallCount)
    })

    it('should handle initialization errors gracefully', async () => {
      mockInitializePiniaDependentPlugins.mockRejectedValueOnce(
        new Error('Pinia initialization failed')
      )

      const { initializePluginsAfterPinia } = await import('@/plugins/index')
      await testSuccessfulOperation(() => initializePluginsAfterPinia())
    })
  })

  describe('exports', () => {
    it('should export pluginRegistry', async () => {
      const pluginIndex = await import('@/plugins/index')
      expect(pluginIndex.pluginRegistry).toBeDefined()
    })

    it('should export pluginEventBus', async () => {
      const pluginIndex = await import('@/plugins/index')
      expect(pluginIndex.pluginEventBus).toBeDefined()
    })

    it('should export pluginEventManager', async () => {
      const pluginIndex = await import('@/plugins/index')
      expect(pluginIndex.pluginEventManager).toBeDefined()
    })
  })
})
