import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PluginEventMap } from '@/plugins/events'
import { pluginEventBus, pluginEventManager } from '@/plugins/events'
import { setupEventManager } from '../utils/testHelpers'

describe('PluginEventBus', () => {
  beforeEach(() => {
    setupEventManager()
  })

  describe('on and emit', () => {
    it('should subscribe and emit events', () => {
      const handler = vi.fn()
      const unsubscribe = pluginEventBus.on('plugin:activated', handler)

      pluginEventBus.emit('plugin:activated', {
        pluginId: 'test-plugin',
        toolType: 'test-tool',
      })

      expect(handler).toHaveBeenCalledWith({
        pluginId: 'test-plugin',
        toolType: 'test-tool',
      })

      unsubscribe()
    })

    it('should handle multiple subscribers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      pluginEventBus.on('plugin:activated', handler1)
      pluginEventBus.on('plugin:activated', handler2)

      pluginEventBus.emit('plugin:activated', {
        pluginId: 'test-plugin',
        toolType: 'test-tool',
      })

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('should unsubscribe when called', () => {
      const handler = vi.fn()
      const unsubscribe = pluginEventBus.on('plugin:activated', handler)

      pluginEventBus.emit('plugin:activated', {
        pluginId: 'test-plugin',
        toolType: 'test-tool',
      })

      unsubscribe()

      pluginEventBus.emit('plugin:activated', {
        pluginId: 'test-plugin-2',
        toolType: 'test-tool-2',
      })

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('once', () => {
    it('should call handler only once', () => {
      const handler = vi.fn()
      pluginEventBus.once('plugin:activated', handler)

      pluginEventBus.emit('plugin:activated', {
        pluginId: 'test-plugin',
        toolType: 'test-tool',
      })

      pluginEventBus.emit('plugin:activated', {
        pluginId: 'test-plugin-2',
        toolType: 'test-tool-2',
      })

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('off', () => {
    it('should remove event handler', () => {
      const handler = vi.fn()
      const unsubscribe = pluginEventBus.on('plugin:activated', handler)

      unsubscribe()

      pluginEventBus.emit('plugin:activated', {
        pluginId: 'test-plugin',
        toolType: 'test-tool',
      })

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('different event types', () => {
    it('should handle tool:switched event', () => {
      const handler = vi.fn()
      pluginEventBus.on('tool:switched', handler)

      pluginEventBus.emit('tool:switched', {
        from: 'tool-a',
        to: 'tool-b',
      })

      expect(handler).toHaveBeenCalledWith({
        from: 'tool-a',
        to: 'tool-b',
      })
    })

    it('should handle plugin:deactivated event', () => {
      const handler = vi.fn()
      pluginEventBus.on('plugin:deactivated', handler)

      pluginEventBus.emit('plugin:deactivated', {
        pluginId: 'test-plugin',
        toolType: 'test-tool',
      })

      expect(handler).toHaveBeenCalledWith({
        pluginId: 'test-plugin',
        toolType: 'test-tool',
      })
    })

    it('should handle object:created event', () => {
      const handler = vi.fn()
      pluginEventBus.on('object:created', handler)

      pluginEventBus.emit('object:created', {
        id: 'obj-1',
        type: 'rect',
        element: {} as Parameters<typeof pluginEventBus.emit<'object:created'>>[1]['element'],
      })

      expect(handler).toHaveBeenCalled()
    })

    it('should handle object:deleted event', () => {
      const handler = vi.fn()
      pluginEventBus.on('object:deleted', handler)

      pluginEventBus.emit('object:deleted', {
        id: 'obj-1',
        type: 'rect',
      })

      expect(handler).toHaveBeenCalledWith({
        id: 'obj-1',
        type: 'rect',
      })
    })

    it('should handle object:selected event', () => {
      const handler = vi.fn()
      pluginEventBus.on('object:selected', handler)

      pluginEventBus.emit('object:selected', {
        id: 'obj-1',
        type: 'circle',
      })

      expect(handler).toHaveBeenCalledWith({
        id: 'obj-1',
        type: 'circle',
      })
    })

    it('should handle object:modified event', () => {
      const handler = vi.fn()
      pluginEventBus.on('object:modified', handler)

      pluginEventBus.emit('object:modified', {
        id: 'obj-1',
        type: 'line',
        changes: { x: 10, y: 20 },
      })

      expect(handler).toHaveBeenCalledWith({
        id: 'obj-1',
        type: 'line',
        changes: { x: 10, y: 20 },
      })
    })

    it('should handle canvas:zoom event', () => {
      const handler = vi.fn()
      pluginEventBus.on('canvas:zoom', handler)

      pluginEventBus.emit('canvas:zoom', {
        zoom: 1.5,
      })

      expect(handler).toHaveBeenCalledWith({
        zoom: 1.5,
      })
    })

    it('should handle canvas:pan event', () => {
      const handler = vi.fn()
      pluginEventBus.on('canvas:pan', handler)

      pluginEventBus.emit('canvas:pan', {
        x: 100,
        y: 200,
      })

      expect(handler).toHaveBeenCalledWith({
        x: 100,
        y: 200,
      })
    })

    it('should handle drawing:start event', () => {
      const handler = vi.fn()
      pluginEventBus.on('drawing:start', handler)

      pluginEventBus.emit('drawing:start', {
        toolType: 'rect',
        point: { x: 10, y: 20 },
      })

      expect(handler).toHaveBeenCalledWith({
        toolType: 'rect',
        point: { x: 10, y: 20 },
      })
    })

    it('should handle drawing:update event', () => {
      const handler = vi.fn()
      pluginEventBus.on('drawing:update', handler)

      pluginEventBus.emit('drawing:update', {
        toolType: 'rect',
        bounds: { x: 10, y: 20, width: 100, height: 200 },
      })

      expect(handler).toHaveBeenCalledWith({
        toolType: 'rect',
        bounds: { x: 10, y: 20, width: 100, height: 200 },
      })
    })

    it('should handle drawing:finish event', () => {
      const handler = vi.fn()
      pluginEventBus.on('drawing:finish', handler)

      pluginEventBus.emit('drawing:finish', {
        toolType: 'rect',
        objectId: 'obj-1',
      })

      expect(handler).toHaveBeenCalledWith({
        toolType: 'rect',
        objectId: 'obj-1',
      })
    })

    it('should handle shortcut:triggered event', () => {
      const handler = vi.fn()
      pluginEventBus.on('shortcut:triggered', handler)

      pluginEventBus.emit('shortcut:triggered', {
        shortcut: 'Ctrl+A',
        toolType: 'select',
      })

      expect(handler).toHaveBeenCalledWith({
        shortcut: 'Ctrl+A',
        toolType: 'select',
      })
    })
  })

  describe('error handling for all event types', () => {
    it.each<[keyof PluginEventMap, PluginEventMap[keyof PluginEventMap]]>([
      ['plugin:activated', { pluginId: 'test', toolType: 'test' }],
      ['plugin:deactivated', { pluginId: 'test', toolType: 'test' }],
      ['tool:switched', { from: 'tool-a', to: 'tool-b' }],
      [
        'object:created',
        {
          id: 'obj-1',
          type: 'rect',
          element: {} as Parameters<typeof pluginEventBus.emit<'object:created'>>[1]['element'],
        },
      ],
      ['object:deleted', { id: 'obj-1', type: 'rect' }],
      ['object:selected', { id: 'obj-1', type: 'rect' }],
      ['object:modified', { id: 'obj-1', type: 'rect', changes: {} }],
      ['canvas:zoom', { zoom: 1.0 }],
      ['canvas:pan', { x: 0, y: 0 }],
      ['drawing:start', { toolType: 'rect', point: { x: 0, y: 0 } }],
      ['drawing:update', { toolType: 'rect', bounds: { x: 0, y: 0, width: 0, height: 0 } }],
      ['drawing:finish', { toolType: 'rect', objectId: 'obj-1' }],
      ['shortcut:triggered', { shortcut: 'Ctrl+A', toolType: 'test' }],
    ])('should handle errors in %s event handler', (eventType, payload) => {
      const failingHandler = vi.fn(() => {
        throw new Error('Handler error')
      })
      const workingHandler = vi.fn()

      pluginEventBus.on(eventType, failingHandler)
      pluginEventBus.on(eventType, workingHandler)

      pluginEventBus.emit(eventType, payload)

      expect(failingHandler).toHaveBeenCalled()
      expect(workingHandler).toHaveBeenCalled()
    })
  })

  describe('event bus cleanup', () => {
    it('should properly clean up all event subscriptions', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      const unsubscribe1 = pluginEventBus.on('plugin:activated', handler1)
      const unsubscribe2 = pluginEventBus.on('tool:switched', handler2)
      const unsubscribe3 = pluginEventBus.on('object:created', handler3)

      unsubscribe1()
      unsubscribe2()
      unsubscribe3()

      pluginEventBus.emit('plugin:activated', { pluginId: 'test', toolType: 'test' })
      pluginEventBus.emit('tool:switched', { from: 'a', to: 'b' })
      pluginEventBus.emit('object:created', {
        id: 'obj-1',
        type: 'rect',
        element: {} as Parameters<typeof pluginEventBus.emit<'object:created'>>[1]['element'],
      })

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
      expect(handler3).not.toHaveBeenCalled()
    })
  })
})

describe('PluginEventManager', () => {
  beforeEach(() => {
    setupEventManager()
  })

  describe('subscribe', () => {
    it('should track subscriptions for a plugin', () => {
      const unsubscribe1 = vi.fn()
      const unsubscribe2 = vi.fn()

      pluginEventManager.subscribe('plugin-1', unsubscribe1)
      pluginEventManager.subscribe('plugin-1', unsubscribe2)

      expect(pluginEventManager.getSubscribedPlugins()).toContain('plugin-1')
    })

    it('should track multiple plugins', () => {
      pluginEventManager.subscribe('plugin-1', vi.fn())
      pluginEventManager.subscribe('plugin-2', vi.fn())

      const plugins = pluginEventManager.getSubscribedPlugins()
      expect(plugins).toContain('plugin-1')
      expect(plugins).toContain('plugin-2')
    })
  })

  describe('unsubscribeAll', () => {
    it('should unsubscribe all events for a plugin', () => {
      const unsubscribe1 = vi.fn()
      const unsubscribe2 = vi.fn()

      pluginEventManager.subscribe('plugin-1', unsubscribe1)
      pluginEventManager.subscribe('plugin-1', unsubscribe2)

      pluginEventManager.unsubscribeAll('plugin-1')

      expect(unsubscribe1).toHaveBeenCalled()
      expect(unsubscribe2).toHaveBeenCalled()
      expect(pluginEventManager.getSubscribedPlugins()).not.toContain('plugin-1')
    })

    it('should not affect other plugins', () => {
      const unsubscribe1 = vi.fn()
      const unsubscribe2 = vi.fn()

      pluginEventManager.subscribe('plugin-1', unsubscribe1)
      pluginEventManager.subscribe('plugin-2', unsubscribe2)

      pluginEventManager.unsubscribeAll('plugin-1')

      expect(unsubscribe1).toHaveBeenCalled()
      expect(unsubscribe2).not.toHaveBeenCalled()
      expect(pluginEventManager.getSubscribedPlugins()).toContain('plugin-2')
    })
  })

  describe('clear', () => {
    it('should clear all subscriptions', () => {
      const unsubscribe1 = vi.fn()
      const unsubscribe2 = vi.fn()

      pluginEventManager.subscribe('plugin-1', unsubscribe1)
      pluginEventManager.subscribe('plugin-2', unsubscribe2)

      pluginEventManager.clear()

      expect(unsubscribe1).toHaveBeenCalled()
      expect(unsubscribe2).toHaveBeenCalled()
      expect(pluginEventManager.getSubscribedPlugins()).toHaveLength(0)
    })
  })

  describe('getSubscribedPlugins', () => {
    it('should return empty array when no subscriptions', () => {
      expect(pluginEventManager.getSubscribedPlugins()).toEqual([])
    })

    it('should return all plugin IDs with subscriptions', () => {
      pluginEventManager.subscribe('plugin-1', vi.fn())
      pluginEventManager.subscribe('plugin-2', vi.fn())
      pluginEventManager.subscribe('plugin-1', vi.fn())

      const plugins = pluginEventManager.getSubscribedPlugins()
      expect(plugins).toContain('plugin-1')
      expect(plugins).toContain('plugin-2')
      expect(plugins.length).toBe(2)
    })
  })
})
