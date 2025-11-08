import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Response } from 'express'

// Type guard for HttpException response objects
function isExceptionResponse(value: unknown): value is { message?: string; error?: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    (typeof (value as any).message === 'string' || typeof (value as any).message === 'undefined') &&
    ((value as any).error === undefined ||
      typeof (value as any).error === 'string' ||
      (typeof (value as any).error === 'object' && (value as any).error !== null))
  )
}

// Sanitize error messages to prevent information leakage
function sanitizeErrorMessage(message: string): string {
  // Remove potential sensitive information patterns
  const sensitivePatterns = [
    // Database connection strings
    /(postgres|mysql|mongodb):\/\/[^\s'"]+/gi,
    // API keys and tokens
    /(sk-|pk-|Bearer\s+)[^\s'"]+/gi,
    // Passwords
    /password['"]?\s*[:=]\s*['"][^\s'"]+/gi,
    // Secret keys
    /(secret|key)['"]?\s*[:=]\s*['"][^\s'"]+/gi,
    // File paths that might reveal structure
    /(\/home\/|\/usr\/|\/var\/|\/etc\/)[^\s'"]+/gi,
  ]

  let sanitized = message
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]')
  }

  return sanitized
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let details: Record<string, unknown> | string | null = null

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = sanitizeErrorMessage(exceptionResponse)
      } else if (isExceptionResponse(exceptionResponse)) {
        // Safe to access properties with type guard
        message = sanitizeErrorMessage(exceptionResponse.message || message)
        details =
          exceptionResponse.error !== undefined
            ? typeof exceptionResponse.error === 'object' && exceptionResponse.error !== null
              ? (exceptionResponse.error as Record<string, unknown>)
              : sanitizeErrorMessage(String(exceptionResponse.error))
            : null
      }
    } else if (exception instanceof Error) {
      message = sanitizeErrorMessage(exception.message)
      // Log full error details internally but don't expose them
      this.logger.error('Internal error occurred:', {
        message: exception.message,
        stack: exception.stack,
        name: exception.name,
      })
    } else {
      // For unknown exceptions, provide generic message
      message = 'An unexpected error occurred'
      this.logger.error('Unknown exception type:', exception)
    }

    const errorResponse = {
      statusCode: status,
      message,
      details,
      timestamp: new Date().toISOString(),
    }

    response.status(status).json(errorResponse)
  }
}
