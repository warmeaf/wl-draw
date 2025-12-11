import { vi } from 'vitest'
import { ref } from 'vue'
import type { ToolContext } from '@/plugins/types'

export function createMockToolContext(overrides?: Partial<ToolContext>): ToolContext {
  return {
    tree: {} as ToolContext['tree'],
    store: {} as ToolContext['store'],
    isDrawing: ref(false),
    startPoint: ref(null),
    currentElement: ref({} as ToolContext['currentElement']['value']),
    isShiftPressed: ref(false),
    penPathPoints: ref([]),
    eventBus: {
      on: vi.fn(() => () => {}),
      off: vi.fn(),
      emit: vi.fn(),
      once: vi.fn(() => () => {}),
    } as ToolContext['eventBus'],
    ...overrides,
  }
}
