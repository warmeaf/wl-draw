/**
 * Unified error handling system for the application
 * Provides centralized error logging and error type classification
 */

export const ErrorCategory = {
  VALIDATION: 'validation',
  RUNTIME: 'runtime',
  PLUGIN: 'plugin',
  CANVAS: 'canvas',
  EXPORT: 'export',
} as const

export type ErrorCategoryValue = (typeof ErrorCategory)[keyof typeof ErrorCategory]

export interface AppError {
  category: ErrorCategoryValue
  message: string
  details?: unknown
  originalError?: Error
}

class ErrorHandler {
  private logError(error: AppError): void {
    const prefix = `[${error.category.toUpperCase()}]`
    const message = `${prefix} ${error.message}`

    if (error.originalError) {
      console.error(message, error.originalError, error.details)
    } else {
      console.error(message, error.details)
    }
  }

  private logWarning(message: string, details?: unknown): void {
    console.warn(`[WARNING] ${message}`, details)
  }

  handleError(error: AppError): void {
    this.logError(error)
  }

  handleValidationError(message: string, details?: unknown): void {
    this.handleError({
      category: ErrorCategory.VALIDATION,
      message,
      details,
    })
  }

  handleRuntimeError(message: string, error?: Error, details?: unknown): void {
    this.handleError({
      category: ErrorCategory.RUNTIME,
      message,
      originalError: error,
      details,
    })
  }

  handlePluginError(pluginId: string, message: string, error?: Error): void {
    this.handleError({
      category: ErrorCategory.PLUGIN,
      message: `Plugin "${pluginId}": ${message}`,
      originalError: error,
    })
  }

  handleCanvasError(message: string, details?: unknown): void {
    this.handleError({
      category: ErrorCategory.CANVAS,
      message,
      details,
    })
  }

  handleExportError(message: string, error?: Error, details?: unknown): void {
    this.handleError({
      category: ErrorCategory.EXPORT,
      message,
      originalError: error,
      details,
    })
  }

  warn(message: string, details?: unknown): void {
    this.logWarning(message, details)
  }
}

export const errorHandler = new ErrorHandler()
