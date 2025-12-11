import { beforeEach, describe, expect, it } from 'vitest'
import { pluginRegistry } from '@/plugins/registry'
import {
  registerAndVerifyPlugin,
  registerMultiplePlugins,
  setupPluginRegistry,
  verifyArrayContains,
  verifyArrayLength,
  verifyPluginState,
} from '../../utils/testHelpers'

describe('PluginRegistry - plugin state management', () => {
  beforeEach(() => {
    setupPluginRegistry()
  })

  describe('plugin state management', () => {
    it('should get plugin state', async () => {
      await registerAndVerifyPlugin('test-plugin')

      const state = pluginRegistry.getState('test-plugin')
      expect(state).toBeDefined()
      expect(state?.id).toBe('test-plugin')
      expect(state?.status).toBe('registered')
      expect(state?.registeredAt).toBeInstanceOf(Date)
    })

    it('should update plugin state', async () => {
      await registerAndVerifyPlugin('test-plugin')

      pluginRegistry.updatePluginState('test-plugin', 'activated')
      verifyPluginState('test-plugin', 'activated')
      const state = pluginRegistry.getState('test-plugin')
      expect(state?.activatedAt).toBeInstanceOf(Date)
    })

    it('should get all plugin states', async () => {
      await registerMultiplePlugins(['plugin-1', 'plugin-2'])

      const states = pluginRegistry.getAllStates()
      verifyArrayLength(states, 2)
      verifyArrayContains(
        states.map((s) => s.id),
        ['plugin-1', 'plugin-2']
      )
    })
  })
})
