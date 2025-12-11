import { beforeEach, describe, expect, it } from 'vitest'
import { pluginRegistry } from '@/plugins/registry'
import type { ToolPlugin } from '@/plugins/types'
import { createMockPlugin } from '../../utils/mockPlugin'
import { setupPluginRegistry, TestPlugins, verifyPluginValidation } from '../../utils/testHelpers'

describe('PluginRegistry - validatePlugin', () => {
  beforeEach(() => {
    setupPluginRegistry()
  })

  describe('validatePlugin', () => {
    it('should validate a valid plugin', () => {
      const plugin = TestPlugins.basic('test-plugin')
      const result = pluginRegistry.validatePlugin(plugin)
      verifyPluginValidation(result, true)
    })

    it('should reject plugin without id', () => {
      const plugin = createMockPlugin('test-plugin', { id: '' })
      const result = pluginRegistry.validatePlugin(plugin)
      verifyPluginValidation(result, false)
    })

    it('should reject plugin without name', () => {
      const plugin = createMockPlugin('test-plugin', { name: '' })
      const result = pluginRegistry.validatePlugin(plugin)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('name'))).toBe(true)
    })

    it('should reject plugin without type', () => {
      const plugin = createMockPlugin('test-plugin', { type: '' })
      const result = pluginRegistry.validatePlugin(plugin)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('type'))).toBe(true)
    })

    it('should reject plugin without metadata', () => {
      const plugin = createMockPlugin('test-plugin', {
        metadata: undefined as unknown as ToolPlugin['metadata'],
      })
      const result = pluginRegistry.validatePlugin(plugin)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('metadata'))).toBe(true)
    })

    it('should reject plugin without version', () => {
      const plugin = createMockPlugin('test-plugin', {
        metadata: { version: '' },
      })
      const result = pluginRegistry.validatePlugin(plugin)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('version'))).toBe(true)
    })

    it('should reject plugin without createTool', () => {
      const plugin = createMockPlugin('test-plugin', {
        createTool: undefined as unknown as ToolPlugin['createTool'],
      })
      const result = pluginRegistry.validatePlugin(plugin)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('createTool'))).toBe(true)
    })

    it('should reject plugin with incompatible core version', () => {
      const plugin = createMockPlugin('test-plugin', {
        metadata: {
          version: '1.0.0',
          minCoreVersion: '2.0.0',
        },
      })
      const result = pluginRegistry.validatePlugin(plugin)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('core version'))).toBe(true)
    })

    it('should accept plugin with compatible core version (equal)', () => {
      const plugin = createMockPlugin('test-plugin', {
        metadata: {
          version: '1.0.0',
          minCoreVersion: '1.0.0',
        },
      })
      const result = pluginRegistry.validatePlugin(plugin)
      expect(result.valid).toBe(true)
    })

    it('should accept plugin with compatible core version (lower)', () => {
      const plugin = createMockPlugin('test-plugin', {
        metadata: {
          version: '1.0.0',
          minCoreVersion: '0.9.0',
        },
      })
      const result = pluginRegistry.validatePlugin(plugin)
      expect(result.valid).toBe(true)
    })

    it('should handle version comparison with different length versions', () => {
      const plugin1 = createMockPlugin('test-plugin-1', {
        metadata: {
          version: '1.0.0',
          minCoreVersion: '1.0',
        },
      })
      const result1 = pluginRegistry.validatePlugin(plugin1)
      expect(result1.valid).toBe(true)

      const plugin2 = createMockPlugin('test-plugin-2', {
        metadata: {
          version: '1.0.0',
          minCoreVersion: '1.0.0.1',
        },
      })
      const result2 = pluginRegistry.validatePlugin(plugin2)
      expect(result2.valid).toBe(false)
    })

    it.each([
      ['1.0.0', true],
      ['0.9.9', true],
      ['0.9.0', true],
      ['1.0', true],
      ['1.0.1', false],
      ['2.0.0', false],
      ['1.1.0', false],
    ])('should correctly compare versions: plugin minCoreVersion %s (compatible with core 1.0.0: %s)', (minCoreVersion, shouldBeCompatible) => {
      const plugin = createMockPlugin('version-test-plugin', {
        metadata: {
          version: '1.0.0',
          minCoreVersion,
        },
      })
      const result = pluginRegistry.validatePlugin(plugin)
      if (shouldBeCompatible) {
        expect(result.valid).toBe(true)
      } else {
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.includes('core version'))).toBe(true)
      }
    })

    it('should reject plugin with missing dependencies', () => {
      const plugin = TestPlugins.withDependencies('test-plugin', ['missing-plugin'])
      const result = pluginRegistry.validatePlugin(plugin)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('dependency'))).toBe(true)
    })
  })
})
