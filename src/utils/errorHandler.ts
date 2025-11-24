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

export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

export type ErrorSeverityValue = (typeof ErrorSeverity)[keyof typeof ErrorSeverity]

export interface ErrorContext {
  pluginId?: string
  pluginName?: string
  operation?: string
  [key: string]: unknown
}

export interface ErrorRecoverySuggestion {
  action: string
  description: string
  example?: string
}

export interface AppError {
  category: ErrorCategoryValue
  message: string
  details?: unknown
  originalError?: Error
  severity?: ErrorSeverityValue
  context?: ErrorContext
  recoverySuggestions?: ErrorRecoverySuggestion[]
}

class ErrorHandler {
  private formatErrorMessage(error: AppError): string {
    const parts: string[] = []
    const severity = error.severity ? `[${error.severity.toUpperCase()}]` : ''
    const category = `[${error.category.toUpperCase()}]`

    if (severity) {
      parts.push(severity)
    }
    parts.push(category)

    if (error.context?.pluginId) {
      parts.push(`Plugin "${error.context.pluginId}"`)
    }

    parts.push(error.message)

    return parts.join(' ')
  }

  private formatDetailedError(error: AppError): string {
    const lines: string[] = []

    lines.push(this.formatErrorMessage(error))

    if (error.context) {
      const contextInfo: string[] = []
      if (error.context.pluginName) {
        contextInfo.push(`Plugin Name: ${error.context.pluginName}`)
      }
      if (error.context.operation) {
        contextInfo.push(`Operation: ${error.context.operation}`)
      }
      if (contextInfo.length > 0) {
        lines.push(`Context: ${contextInfo.join(', ')}`)
      }
    }

    if (error.recoverySuggestions && error.recoverySuggestions.length > 0) {
      lines.push('Recovery Suggestions:')
      error.recoverySuggestions.forEach((suggestion, index) => {
        lines.push(`  ${index + 1}. ${suggestion.action}`)
        lines.push(`     ${suggestion.description}`)
        if (suggestion.example) {
          lines.push(`     Example: ${suggestion.example}`)
        }
      })
    }

    return lines.join('\n')
  }

  private generateRecoverySuggestions(
    category: ErrorCategoryValue,
    context?: ErrorContext
  ): ErrorRecoverySuggestion[] {
    const suggestions: ErrorRecoverySuggestion[] = []

    if (category === ErrorCategory.VALIDATION) {
      if (context?.pluginId) {
        suggestions.push({
          action: 'Check plugin definition',
          description: `Verify that plugin "${context.pluginId}" has all required fields properly defined`,
          example: 'Ensure id, name, type, metadata, and createTool are all present',
        })
        suggestions.push({
          action: 'Verify plugin metadata',
          description:
            'Check that metadata.version is set and dependencies are correctly specified',
        })
      } else {
        suggestions.push({
          action: 'Review plugin structure',
          description: 'Ensure the plugin follows the ToolPlugin interface structure',
        })
      }
    } else if (category === ErrorCategory.PLUGIN) {
      suggestions.push({
        action: 'Check plugin implementation',
        description: 'Review the plugin code for runtime errors or missing dependencies',
      })
      if (context?.operation === 'onInstall') {
        suggestions.push({
          action: 'Review onInstall hook',
          description:
            'Check if the onInstall hook is throwing errors or accessing unavailable resources',
        })
      }
    } else if (category === ErrorCategory.RUNTIME) {
      suggestions.push({
        action: 'Check console for details',
        description: 'Review the full error stack trace for more information',
      })
    }

    return suggestions
  }

  private logError(error: AppError): void {
    const formattedMessage = this.formatDetailedError(error)
    const logMessage = `\n${formattedMessage}`

    if (error.originalError) {
      console.error(logMessage, error.originalError, error.details)
    } else {
      console.error(logMessage, error.details)
    }
  }

  private logWarning(message: string, details?: unknown): void {
    console.warn(`[WARNING] ${message}`, details)
  }

  handleError(error: AppError): void {
    const enhancedError: AppError = {
      ...error,
      recoverySuggestions:
        error.recoverySuggestions ||
        this.generateRecoverySuggestions(error.category, error.context),
    }
    this.logError(enhancedError)
  }

  handleValidationError(
    message: string,
    details?: unknown,
    context?: ErrorContext,
    severity?: ErrorSeverityValue
  ): void {
    this.handleError({
      category: ErrorCategory.VALIDATION,
      message,
      details,
      context,
      severity: severity || ErrorSeverity.MEDIUM,
    })
  }

  handleRuntimeError(
    message: string,
    error?: Error,
    details?: unknown,
    severity?: ErrorSeverityValue
  ): void {
    this.handleError({
      category: ErrorCategory.RUNTIME,
      message,
      originalError: error,
      details,
      severity: severity || ErrorSeverity.HIGH,
    })
  }

  handlePluginError(
    pluginId: string,
    message: string,
    error?: Error,
    context?: Omit<ErrorContext, 'pluginId'>,
    severity?: ErrorSeverityValue
  ): void {
    this.handleError({
      category: ErrorCategory.PLUGIN,
      message,
      originalError: error,
      context: { ...context, pluginId },
      severity: severity || ErrorSeverity.MEDIUM,
    })
  }

  handleCanvasError(message: string, details?: unknown, severity?: ErrorSeverityValue): void {
    this.handleError({
      category: ErrorCategory.CANVAS,
      message,
      details,
      severity: severity || ErrorSeverity.MEDIUM,
    })
  }

  handleExportError(
    message: string,
    error?: Error,
    details?: unknown,
    severity?: ErrorSeverityValue
  ): void {
    this.handleError({
      category: ErrorCategory.EXPORT,
      message,
      originalError: error,
      details,
      severity: severity || ErrorSeverity.LOW,
    })
  }

  warn(message: string, details?: unknown): void {
    this.logWarning(message, details)
  }
}

export const errorHandler = new ErrorHandler()
