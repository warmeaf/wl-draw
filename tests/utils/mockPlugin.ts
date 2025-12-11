import { vi } from 'vitest'
import type { PluginMetadata, ToolInstance, ToolPlugin } from '@/plugins/types'

export function createMockToolInstance(overrides?: Partial<ToolInstance>): ToolInstance {
  return {
    startDrawing: vi.fn(),
    updateDrawing: vi.fn(),
    finishDrawing: vi.fn(),
    handleTap: vi.fn(),
    onActivate: vi.fn(),
    onDeactivate: vi.fn(),
    onDestroy: vi.fn(),
    ...overrides,
  }
}

export function createMockPlugin(id: string, overrides?: Partial<ToolPlugin>): ToolPlugin {
  const defaultMetadata: PluginMetadata = {
    version: '1.0.0',
    description: `Mock plugin ${id}`,
  }

  return {
    id,
    name: `Mock Plugin ${id}`,
    type: id,
    metadata: defaultMetadata,
    createTool: vi.fn(() => createMockToolInstance()),
    ...overrides,
  }
}

export function createMockLazyPluginLoader(plugin: ToolPlugin): () => Promise<ToolPlugin> {
  return async () => plugin
}
