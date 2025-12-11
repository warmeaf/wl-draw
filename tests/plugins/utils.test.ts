import { describe, expect, it } from 'vitest'
import { getDependencyOrder } from '@/plugins/utils'
import { createMockPlugin } from '../utils/mockPlugin'

describe('getDependencyOrder', () => {
  it('should return plugins in dependency order', () => {
    const pluginA = createMockPlugin('plugin-a')
    const pluginB = createMockPlugin('plugin-b', {
      metadata: {
        version: '1.0.0',
        dependencies: ['plugin-a'],
      },
    })
    const pluginC = createMockPlugin('plugin-c', {
      metadata: {
        version: '1.0.0',
        dependencies: ['plugin-b'],
      },
    })

    const order = getDependencyOrder([pluginC, pluginB, pluginA])
    expect(order).toEqual(['plugin-a', 'plugin-b', 'plugin-c'])
  })

  it('should handle plugins without dependencies', () => {
    const pluginA = createMockPlugin('plugin-a')
    const pluginB = createMockPlugin('plugin-b')

    const order = getDependencyOrder([pluginB, pluginA])
    expect(order).toContain('plugin-a')
    expect(order).toContain('plugin-b')
  })

  it('should handle multiple plugins with same dependency', () => {
    const pluginA = createMockPlugin('plugin-a')
    const pluginB = createMockPlugin('plugin-b', {
      metadata: {
        version: '1.0.0',
        dependencies: ['plugin-a'],
      },
    })
    const pluginC = createMockPlugin('plugin-c', {
      metadata: {
        version: '1.0.0',
        dependencies: ['plugin-a'],
      },
    })

    const order = getDependencyOrder([pluginC, pluginB, pluginA])
    expect(order[0]).toBe('plugin-a')
    expect(order).toContain('plugin-b')
    expect(order).toContain('plugin-c')
  })

  it('should throw error for circular dependencies', () => {
    const pluginA = createMockPlugin('plugin-a', {
      metadata: {
        version: '1.0.0',
        dependencies: ['plugin-b'],
      },
    })
    const pluginB = createMockPlugin('plugin-b', {
      metadata: {
        version: '1.0.0',
        dependencies: ['plugin-a'],
      },
    })

    expect(() => {
      getDependencyOrder([pluginA, pluginB])
    }).toThrow('Circular dependency detected')
  })

  it('should throw error for complex circular dependencies', () => {
    const pluginA = createMockPlugin('plugin-a', {
      metadata: {
        version: '1.0.0',
        dependencies: ['plugin-b'],
      },
    })
    const pluginB = createMockPlugin('plugin-b', {
      metadata: {
        version: '1.0.0',
        dependencies: ['plugin-c'],
      },
    })
    const pluginC = createMockPlugin('plugin-c', {
      metadata: {
        version: '1.0.0',
        dependencies: ['plugin-a'],
      },
    })

    expect(() => {
      getDependencyOrder([pluginA, pluginB, pluginC])
    }).toThrow('Circular dependency detected')
  })

  it('should handle self-referencing plugin', () => {
    const pluginA = createMockPlugin('plugin-a', {
      metadata: {
        version: '1.0.0',
        dependencies: ['plugin-a'],
      },
    })

    expect(() => {
      getDependencyOrder([pluginA])
    }).toThrow('Circular dependency detected')
  })

  it('should handle empty plugin array', () => {
    const order = getDependencyOrder([])
    expect(order).toEqual([])
  })

  it('should handle plugins with missing dependencies', () => {
    const pluginA = createMockPlugin('plugin-a', {
      metadata: {
        version: '1.0.0',
        dependencies: ['non-existent'],
      },
    })

    const order = getDependencyOrder([pluginA])
    expect(order).toContain('plugin-a')
  })
})
