'use strict'
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return (c > 3 && r && Object.defineProperty(target, key, r), r)
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.PromptInjectionGuard = void 0
exports.callAiWithGuard = callAiWithGuard
const common_1 = require('@nestjs/common')
const ai_exception_1 = require('../exceptions/ai-exception')
const prompt_injection_detected_exception_1 = require('../errors/prompt-injection-detected.exception')
let PromptInjectionGuard = class PromptInjectionGuard {
  threshold = 0.7
  async checkInput(input, context) {
    const suspiciousPatterns = [
      /ignore.*previous.*instructions/i,
      /system.*prompt/i,
      /override.*settings/i,
      /bypass.*restrictions/i,
    ]
    const score = suspiciousPatterns.some((pattern) => pattern.test(input)) ? 0.9 : 0.1
    if (score >= this.threshold) {
      throw new prompt_injection_detected_exception_1.PromptInjectionDetectedException(
        'Potential prompt injection detected',
        {
          score,
          threshold: this.threshold,
          preview: input.substring(0, 100),
          context: context?.correlationId,
          correlationId: context?.correlationId,
          userId: context?.userId,
        }
      )
    }
    return {
      allowed: true,
      score,
      threshold: this.threshold,
      reason: score < this.threshold ? 'passed' : 'failed',
      details: {
        preview: input.substring(0, 100),
      },
    }
  }
  async ensureSafeOrThrow(input, context) {
    const result = await this.checkInput(input, context)
    if (!result.allowed) {
      throw new prompt_injection_detected_exception_1.PromptInjectionDetectedException(
        'Input failed security check',
        {
          score: result.score,
          threshold: result.threshold,
          preview: result.details?.preview,
          context: context?.correlationId,
          correlationId: context?.correlationId,
          userId: context?.userId,
        }
      )
    }
  }
}
exports.PromptInjectionGuard = PromptInjectionGuard
exports.PromptInjectionGuard = PromptInjectionGuard = __decorate(
  [(0, common_1.Injectable)()],
  PromptInjectionGuard
)
const MAX_RETRIES = 2
async function callAiWithGuard(chain, params, schema, timeoutMs = 30000) {
  let lastError = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`AI request timed out after ${timeoutMs}ms`))
        }, timeoutMs)
      })
      const response = await Promise.race([chain.invoke(params), timeoutPromise])
      const dataToParse = typeof response === 'string' ? JSON.parse(response) : response
      const parseResult = await schema.safeParseAsync(dataToParse)
      if (parseResult.success) {
        return parseResult.data
      } else {
        lastError = parseResult.error
        console.warn(`[AI Guard] Attempt ${attempt + 1} failed validation:`, lastError)
      }
    } catch (error) {
      lastError = error
      console.error(`[AI Guard] Attempt ${attempt + 1} failed with invocation error:`, error)
      if (error instanceof Error && error.message.includes('timed out')) {
        throw new ai_exception_1.AiGenerationException(
          `AI request timed out after ${timeoutMs}ms`,
          error
        )
      }
    }
  }
  throw new ai_exception_1.AiGenerationException(
    `AI failed to generate valid data after ${MAX_RETRIES + 1} attempts.`,
    lastError
  )
}
//# sourceMappingURL=ai-guard.js.map
