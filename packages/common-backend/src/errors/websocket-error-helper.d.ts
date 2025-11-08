import { type ProcessingErrorResponse, ProcessingErrorType } from './error-classification'
export interface ProcessingFailedEventPayload {
  errorCode: string
  errorMessage: string
  retryable: boolean
  suggestedAction?: string
  correlationId?: string
  errorType?: ProcessingErrorType
  originalError?: string
}
export declare function formatErrorForWebSocket(
  errorResponse: ProcessingErrorResponse,
  correlationId?: string,
  originalError?: string
): ProcessingFailedEventPayload
//# sourceMappingURL=websocket-error-helper.d.ts.map
