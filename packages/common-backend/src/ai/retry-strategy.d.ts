export declare enum ErrorCategory {
  NETWORK = 'network',
  TEMPORARY_API_ERROR = 'temporary_api_error',
  JSON_PARSE_ERROR = 'json_parse_error',
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  INVALID_REQUEST = 'invalid_request',
  BUSINESS_LOGIC_ERROR = 'business_logic_error',
  UNKNOWN = 'unknown',
}
export interface ErrorClassification {
  category: ErrorCategory
  shouldRetry: boolean
  message: string
  hasFeedback: boolean
  feedback?: string
}
export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  enableJitter: boolean
  jitterRatio: number
}
export declare const DEFAULT_RETRY_CONFIG: RetryConfig
export declare function classifyError(
  error: unknown,
  validationFeedback?: string
): ErrorClassification
export declare function calculateRetryDelay(attemptNumber: number, config?: RetryConfig): number
export declare function getRecommendedDelay(
  category: ErrorCategory,
  attemptNumber: number,
  config?: RetryConfig
): number
export declare function delay(ms: number): Promise<void>
//# sourceMappingURL=retry-strategy.d.ts.map
