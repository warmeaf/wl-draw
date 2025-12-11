import { vi } from 'vitest'

vi.mock('@/utils/errorHandler', async () => {
  const actual =
    await vi.importActual<typeof import('@/utils/errorHandler')>('@/utils/errorHandler')
  return {
    ...actual,
    errorHandler: {
      warn: vi.fn(),
      handleValidationError: vi.fn(),
      handleRuntimeError: vi.fn(),
      handlePluginError: vi.fn(),
    },
  }
})
