export declare enum ProcessingErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AI_GENERATION_ERROR = 'AI_GENERATION_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
export interface ProcessingErrorResponse {
  errorType: ProcessingErrorType
  retryable: boolean
  errorCode: string
  message: string
  details?: unknown
  suggestedAction?: string
}
export declare function classifyProcessingError(
  error: unknown,
  context?: {
    operation?: string
    gameId?: string
    userId?: string
  }
): ProcessingErrorResponse
export declare function shouldRetryError(error: unknown): boolean
export declare function getErrorMessage(error: unknown): string
//# sourceMappingURL=error-classification.d.ts.map
