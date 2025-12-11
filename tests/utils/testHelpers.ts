import { vi } from 'vitest'
import { pluginEventManager } from '@/plugins/events'
import { pluginRegistry } from '@/plugins/registry'
import type { PluginCategory, PluginHooks, ToolPlugin } from '@/plugins/types'
import { createMockPlugin, createMockToolInstance } from './mockPlugin'

export function setupTestEnvironment(): void {
  pluginRegistry.clear()
  pluginEventManager.clear()
  vi.clearAllMocks()
}

export function setupPluginRegistry(): void {
  pluginRegistry.clear()
}

export function setupEventManager(): void {
  pluginEventManager.clear()
}

export async function registerAndVerifyPlugin(
  pluginId: string,
  overrides?: Partial<ToolPlugin>
): Promise<ToolPlugin> {
  const plugin = createMockPlugin(pluginId, overrides)
  await pluginRegistry.register(plugin)

  const retrieved = await pluginRegistry.get(pluginId)
  expect(retrieved).toBeDefined()
  expect(retrieved?.id).toBe(pluginId)

  return retrieved as ToolPlugin
}

export async function registerMultiplePlugins(pluginIds: string[]): Promise<ToolPlugin[]> {
  const plugins: ToolPlugin[] = []

  for (const id of pluginIds) {
    const plugin = await registerAndVerifyPlugin(id)
    plugins.push(plugin)
  }

  return plugins
}

export function verifyPluginNotRegistered(pluginId: string): void {
  expect(pluginRegistry.has(pluginId)).toBe(false)
}

export function verifyPluginRegistered(pluginId: string): void {
  expect(pluginRegistry.has(pluginId)).toBe(true)
}

export function verifyPluginState(pluginId: string, expectedStatus: string): void {
  const state = pluginRegistry.getState(pluginId)
  expect(state).toBeDefined()
  expect(state?.status).toBe(expectedStatus)
}

export function verifyPluginValidation(
  result: { valid: boolean; errors: string[] },
  shouldBeValid: boolean
): void {
  expect(result.valid).toBe(shouldBeValid)
  if (shouldBeValid) {
    expect(result.errors).toHaveLength(0)
  } else {
    expect(result.errors.length).toBeGreaterThan(0)
  }
}

export function verifyPluginMetadata(
  pluginId: string,
  expectedMetadata?: Partial<ToolPlugin['metadata']>
): void {
  const metadata = pluginRegistry.getPluginMetadata(pluginId)
  expect(metadata).toBeDefined()
  expect(metadata?.id).toBe(pluginId)

  if (expectedMetadata && metadata) {
    Object.entries(expectedMetadata).forEach(([key, value]) => {
      expect((metadata as unknown as Record<string, unknown>)[key]).toBe(value)
    })
  }
}

export const TestPlugins = {
  basic: (id: string = 'test-plugin') => createMockPlugin(id),

  withShortcut: (id: string, shortcut: string) => createMockPlugin(id, { shortcut }),

  withCategory: (id: string, category: PluginCategory) => createMockPlugin(id, { category }),

  withDependencies: (id: string, dependencies: string[]) =>
    createMockPlugin(id, {
      metadata: {
        version: '1.0.0',
        dependencies,
      },
    }),

  withHooks: (id: string, hooks: Partial<PluginHooks>) => createMockPlugin(id, { hooks }),

  toolInstance: () => createMockToolInstance(),
}

export async function testErrorHandling(
  operation: () => Promise<void> | void,
  errorMessage?: string
): Promise<void> {
  if (errorMessage) {
    await expect(operation()).rejects.toThrow(errorMessage)
  } else {
    await expect(operation()).rejects.toThrow()
  }
}

export async function testSuccessfulOperation(
  operation: () => Promise<void> | void
): Promise<void> {
  await expect(operation()).resolves.not.toThrow()
}

export function verifyArrayContains<T>(array: T[], expectedItems: T[]): void {
  expectedItems.forEach((item) => {
    expect(array).toContain(item)
  })
}

export function verifyArrayLength<T>(array: T[], expectedLength: number): void {
  expect(array).toHaveLength(expectedLength)
}
