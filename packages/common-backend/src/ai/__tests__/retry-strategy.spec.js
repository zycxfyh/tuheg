'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const zod_1 = require('zod')
const retry_strategy_1 = require('./retry-strategy')
describe('retry-strategy', () => {
  describe('classifyError', () => {
    it('should classify network errors as retryable', () => {
      const error = new Error('ECONNREFUSED')
      const classification = (0, retry_strategy_1.classifyError)(error)
      expect(classification.category).toBe(retry_strategy_1.ErrorCategory.NETWORK)
      expect(classification.shouldRetry).toBe(true)
    })
    it('should classify timeout errors as retryable', () => {
      const error = new Error('ETIMEDOUT')
      const classification = (0, retry_strategy_1.classifyError)(error)
      expect(classification.category).toBe(retry_strategy_1.ErrorCategory.NETWORK)
      expect(classification.shouldRetry).toBe(true)
    })
    it('should classify 429 rate limit errors as retryable', () => {
      const error = Object.assign(new Error('Rate limit exceeded'), {
        status: 429,
      })
      const classification = (0, retry_strategy_1.classifyError)(error)
      expect(classification.category).toBe(retry_strategy_1.ErrorCategory.TEMPORARY_API_ERROR)
      expect(classification.shouldRetry).toBe(true)
    })
    it('should classify 503 errors as retryable', () => {
      const error = Object.assign(new Error('Service unavailable'), {
        statusCode: 503,
      })
      const classification = (0, retry_strategy_1.classifyError)(error)
      expect(classification.category).toBe(retry_strategy_1.ErrorCategory.TEMPORARY_API_ERROR)
      expect(classification.shouldRetry).toBe(true)
    })
    it('should classify 401/403 errors as non-retryable', () => {
      const error401 = Object.assign(new Error('Unauthorized'), {
        status: 401,
      })
      const classification401 = (0, retry_strategy_1.classifyError)(error401)
      expect(classification401.category).toBe(retry_strategy_1.ErrorCategory.AUTHENTICATION_ERROR)
      expect(classification401.shouldRetry).toBe(false)
      const error403 = Object.assign(new Error('Forbidden'), { status: 403 })
      const classification403 = (0, retry_strategy_1.classifyError)(error403)
      expect(classification403.category).toBe(retry_strategy_1.ErrorCategory.AUTHENTICATION_ERROR)
      expect(classification403.shouldRetry).toBe(false)
    })
    it('should classify 400 errors as non-retryable', () => {
      const error = Object.assign(new Error('Bad request'), { status: 400 })
      const classification = (0, retry_strategy_1.classifyError)(error)
      expect(classification.category).toBe(retry_strategy_1.ErrorCategory.INVALID_REQUEST)
      expect(classification.shouldRetry).toBe(false)
    })
    it('should classify Zod validation errors as retryable with feedback', () => {
      const schema = zod_1.z.object({ name: zod_1.z.string() })
      const result = schema.safeParse({})
      expect(result.success).toBe(false)
      if (!result.success) {
        const classification = (0, retry_strategy_1.classifyError)(
          result.error,
          'Field name is required'
        )
        expect(classification.category).toBe(retry_strategy_1.ErrorCategory.VALIDATION_ERROR)
        expect(classification.shouldRetry).toBe(true)
        expect(classification.hasFeedback).toBe(true)
        expect(classification.feedback).toBeDefined()
      }
    })
    it('should classify JSON parse errors as retryable', () => {
      const error = new SyntaxError('Unexpected token in JSON')
      const classification = (0, retry_strategy_1.classifyError)(error)
      expect(classification.category).toBe(retry_strategy_1.ErrorCategory.JSON_PARSE_ERROR)
      expect(classification.shouldRetry).toBe(true)
    })
    it('should classify unknown errors as retryable (conservative)', () => {
      const error = new Error('Some unknown error')
      const classification = (0, retry_strategy_1.classifyError)(error)
      expect(classification.category).toBe(retry_strategy_1.ErrorCategory.UNKNOWN)
      expect(classification.shouldRetry).toBe(true)
    })
  })
  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff', () => {
      const config = { ...retry_strategy_1.DEFAULT_RETRY_CONFIG, enableJitter: false }
      expect((0, retry_strategy_1.calculateRetryDelay)(0, config)).toBe(500)
      expect((0, retry_strategy_1.calculateRetryDelay)(1, config)).toBe(1000)
      expect((0, retry_strategy_1.calculateRetryDelay)(2, config)).toBe(2000)
      expect((0, retry_strategy_1.calculateRetryDelay)(3, config)).toBe(4000)
    })
    it('should cap delay at maxDelayMs', () => {
      const config = {
        ...retry_strategy_1.DEFAULT_RETRY_CONFIG,
        maxDelayMs: 1000,
        enableJitter: false,
      }
      expect((0, retry_strategy_1.calculateRetryDelay)(0, config)).toBe(500)
      expect((0, retry_strategy_1.calculateRetryDelay)(1, config)).toBe(1000)
      expect((0, retry_strategy_1.calculateRetryDelay)(10, config)).toBe(1000)
    })
    it('should apply jitter when enabled', () => {
      const config = { ...retry_strategy_1.DEFAULT_RETRY_CONFIG, enableJitter: true }
      const delayMs = (0, retry_strategy_1.calculateRetryDelay)(1, config)
      expect(delayMs).toBeGreaterThan(0)
      expect(delayMs).toBeLessThanOrEqual(1200)
      const delays = Array.from({ length: 5 }, () =>
        (0, retry_strategy_1.calculateRetryDelay)(1, config)
      )
      const uniqueDelays = new Set(delays)
      expect(uniqueDelays.size).toBeGreaterThan(1)
    })
    it('should never return negative delay', () => {
      const config = { ...retry_strategy_1.DEFAULT_RETRY_CONFIG, enableJitter: true }
      for (let i = 0; i < 10; i++) {
        const delayMs = (0, retry_strategy_1.calculateRetryDelay)(i, config)
        expect(delayMs).toBeGreaterThanOrEqual(0)
      }
    })
  })
  describe('getRecommendedDelay', () => {
    it('should use longer delay for rate limit errors', () => {
      const rateLimitDelay = (0, retry_strategy_1.getRecommendedDelay)(
        retry_strategy_1.ErrorCategory.TEMPORARY_API_ERROR,
        0,
        retry_strategy_1.DEFAULT_RETRY_CONFIG
      )
      const networkDelay = (0, retry_strategy_1.getRecommendedDelay)(
        retry_strategy_1.ErrorCategory.NETWORK,
        0,
        retry_strategy_1.DEFAULT_RETRY_CONFIG
      )
      expect(rateLimitDelay).toBeGreaterThan(networkDelay)
    })
    it('should use shorter delay for validation errors', () => {
      const validationDelay = (0, retry_strategy_1.getRecommendedDelay)(
        retry_strategy_1.ErrorCategory.VALIDATION_ERROR,
        0,
        retry_strategy_1.DEFAULT_RETRY_CONFIG
      )
      const networkDelay = (0, retry_strategy_1.getRecommendedDelay)(
        retry_strategy_1.ErrorCategory.NETWORK,
        0,
        retry_strategy_1.DEFAULT_RETRY_CONFIG
      )
      expect(validationDelay).toBeLessThan(networkDelay)
    })
    it('should use standard delay for network errors', () => {
      const delayMs = (0, retry_strategy_1.getRecommendedDelay)(
        retry_strategy_1.ErrorCategory.NETWORK,
        0,
        retry_strategy_1.DEFAULT_RETRY_CONFIG
      )
      expect(delayMs).toBeGreaterThanOrEqual(400)
      expect(delayMs).toBeLessThanOrEqual(600)
    })
  })
  describe('delay', () => {
    it('should delay for specified milliseconds', async () => {
      const start = Date.now()
      await (0, retry_strategy_1.delay)(100)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(90)
      expect(elapsed).toBeLessThan(150)
    })
  })
})
//# sourceMappingURL=retry-strategy.spec.js.map
