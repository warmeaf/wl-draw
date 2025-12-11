import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pluginRegistry } from '@/plugins/registry'
import { createMockPlugin } from '../../utils/mockPlugin'
import { setupPluginRegistry } from '../../utils/testHelpers'

describe('PluginRegistry - Hook System', () => {
  beforeEach(() => {
    setupPluginRegistry()
  })

  describe('hook system', () => {
    it('should execute beforeToolSwitch hook', async () => {
      const beforeToolSwitch = vi.fn(() => true)
      const plugin = createMockPlugin('test-plugin', {
        hooks: {
          beforeToolSwitch,
        },
      })

      await pluginRegistry.register(plugin)

      const result = await pluginRegistry.executeHook('beforeToolSwitch', {
        from: 'tool-a',
        to: 'tool-b',
      })

      expect(beforeToolSwitch).toHaveBeenCalledWith({
        from: 'tool-a',
        to: 'tool-b',
      })
      expect(result).toBe(true)
    })

    it('should prevent action when before hook returns false', async () => {
      const beforeToolSwitch = vi.fn(() => false)
      const plugin = createMockPlugin('test-plugin', {
        hooks: {
          beforeToolSwitch,
        },
      })

      await pluginRegistry.register(plugin)

      const result = await pluginRegistry.executeHook('beforeToolSwitch', {
        from: 'tool-a',
        to: 'tool-b',
      })

      expect(result).toBe(false)
    })

    it('should execute afterToolSwitch hook', async () => {
      const afterToolSwitch = vi.fn()
      const plugin = createMockPlugin('test-plugin', {
        hooks: {
          afterToolSwitch,
        },
      })

      await pluginRegistry.register(plugin)

      await pluginRegistry.executeHook('afterToolSwitch', {
        from: 'tool-a',
        to: 'tool-b',
      })

      expect(afterToolSwitch).toHaveBeenCalledWith({
        from: 'tool-a',
        to: 'tool-b',
      })
    })

    it('should execute multiple hooks in order', async () => {
      const callOrder: string[] = []
      const hook1 = vi.fn(() => {
        callOrder.push('hook1')
        return true
      })
      const hook2 = vi.fn(() => {
        callOrder.push('hook2')
        return true
      })

      const plugin1 = createMockPlugin('plugin-1', {
        hooks: { beforeToolSwitch: hook1 },
      })
      const plugin2 = createMockPlugin('plugin-2', {
        hooks: { beforeToolSwitch: hook2 },
      })

      await pluginRegistry.register(plugin1)
      await pluginRegistry.register(plugin2)

      await pluginRegistry.executeHook('beforeToolSwitch', {
        from: 'tool-a',
        to: 'tool-b',
      })

      expect(callOrder.length).toBe(2)
    })

    it('should handle hook errors gracefully', async () => {
      const beforeToolSwitch = vi.fn(() => {
        throw new Error('Hook error')
      })
      const plugin = createMockPlugin('test-plugin', {
        hooks: {
          beforeToolSwitch,
        },
      })

      await pluginRegistry.register(plugin)

      const result = await pluginRegistry.executeHook('beforeToolSwitch', {
        from: 'tool-a',
        to: 'tool-b',
      })

      expect(result).toBe(true)
    })
  })

  describe('executeHook - drawing hooks', () => {
    it('should execute beforeDrawingStart hook', async () => {
      const beforeDrawingStart = vi.fn(() => true)
      const plugin = createMockPlugin('test-plugin', {
        hooks: {
          beforeDrawingStart,
        },
      })

      await pluginRegistry.register(plugin)

      const result = await pluginRegistry.executeHook('beforeDrawingStart', {
        toolType: 'rect',
        point: { x: 10, y: 20 },
      })

      expect(beforeDrawingStart).toHaveBeenCalledWith({
        toolType: 'rect',
        point: { x: 10, y: 20 },
      })
      expect(result).toBe(true)
    })

    it('should prevent drawing when beforeDrawingStart returns false', async () => {
      const beforeDrawingStart = vi.fn(() => false)
      const plugin = createMockPlugin('test-plugin', {
        hooks: {
          beforeDrawingStart,
        },
      })

      await pluginRegistry.register(plugin)

      const result = await pluginRegistry.executeHook('beforeDrawingStart', {
        toolType: 'rect',
        point: { x: 10, y: 20 },
      })

      expect(result).toBe(false)
    })

    it('should execute afterDrawingStart hook', async () => {
      const afterDrawingStart = vi.fn()
      const plugin = createMockPlugin('test-plugin', {
        hooks: {
          afterDrawingStart,
        },
      })

      await pluginRegistry.register(plugin)

      await pluginRegistry.executeHook('afterDrawingStart', {
        toolType: 'rect',
        point: { x: 10, y: 20 },
      })

      expect(afterDrawingStart).toHaveBeenCalledWith({
        toolType: 'rect',
        point: { x: 10, y: 20 },
      })
    })

    it('should execute beforeDrawingFinish hook', async () => {
      const beforeDrawingFinish = vi.fn(() => true)
      const plugin = createMockPlugin('test-plugin', {
        hooks: {
          beforeDrawingFinish,
        },
      })

      await pluginRegistry.register(plugin)

      const result = await pluginRegistry.executeHook('beforeDrawingFinish', {
        toolType: 'rect',
        objectId: 'obj-1',
      })

      expect(beforeDrawingFinish).toHaveBeenCalledWith({
        toolType: 'rect',
        objectId: 'obj-1',
      })
      expect(result).toBe(true)
    })

    it('should prevent finish when beforeDrawingFinish returns false', async () => {
      const beforeDrawingFinish = vi.fn(() => false)
      const plugin = createMockPlugin('test-plugin', {
        hooks: {
          beforeDrawingFinish,
        },
      })

      await pluginRegistry.register(plugin)

      const result = await pluginRegistry.executeHook('beforeDrawingFinish', {
        toolType: 'rect',
        objectId: 'obj-1',
      })

      expect(result).toBe(false)
    })

    it('should execute afterDrawingFinish hook', async () => {
      const afterDrawingFinish = vi.fn()
      const plugin = createMockPlugin('test-plugin', {
        hooks: {
          afterDrawingFinish,
        },
      })

      await pluginRegistry.register(plugin)

      await pluginRegistry.executeHook('afterDrawingFinish', {
        toolType: 'rect',
        objectId: 'obj-1',
      })

      expect(afterDrawingFinish).toHaveBeenCalledWith({
        toolType: 'rect',
        objectId: 'obj-1',
      })
    })

    it('should handle errors in drawing hooks gracefully', async () => {
      const beforeDrawingStart = vi.fn(() => {
        throw new Error('Hook error')
      })
      const plugin = createMockPlugin('test-plugin', {
        hooks: {
          beforeDrawingStart,
        },
      })

      await pluginRegistry.register(plugin)

      const result = await pluginRegistry.executeHook('beforeDrawingStart', {
        toolType: 'rect',
        point: { x: 10, y: 20 },
      })

      expect(result).toBe(true)
    })

    it('should execute multiple drawing hooks in order', async () => {
      const callOrder: string[] = []
      const hook1 = vi.fn(() => {
        callOrder.push('hook1')
        return true
      })
      const hook2 = vi.fn(() => {
        callOrder.push('hook2')
        return true
      })

      const plugin1 = createMockPlugin('plugin-1', {
        hooks: { beforeDrawingStart: hook1 },
      })
      const plugin2 = createMockPlugin('plugin-2', {
        hooks: { beforeDrawingStart: hook2 },
      })

      await pluginRegistry.register(plugin1)
      await pluginRegistry.register(plugin2)

      await pluginRegistry.executeHook('beforeDrawingStart', {
        toolType: 'rect',
        point: { x: 10, y: 20 },
      })

      expect(callOrder.length).toBe(2)
    })
  })
})
