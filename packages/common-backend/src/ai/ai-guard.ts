// 文件路径: packages/common-backend/src/ai/ai-guard.ts

import { Injectable } from '@nestjs/common'
import type { z } from 'zod'
import { PromptInjectionDetectedException } from '../errors/prompt-injection-detected.exception'
import { AiGenerationException } from '../exceptions/ai-exception'

/**
 * 提示注入检查结果类型
 */
export type PromptInjectionCheckResult = {
  allowed: boolean
  score: number
  threshold: number
  reason: string
  inputPreview?: string
  details?: {
    preview?: string
    context?: string
  }
}

/**
 * 提示注入防护服务
 * 提供AI输入的安全检查功能
 */
@Injectable()
export class PromptInjectionGuard {
  private readonly threshold = 0.7

  /**
   * 检查输入是否包含提示注入攻击
   * @param input 用户输入
   * @param context 上下文信息
   * @returns 检查结果
   */
  async checkInput(
    input: string,
    context?: { userId?: string; correlationId?: string }
  ): Promise<PromptInjectionCheckResult> {
    // 简单的实现 - 在实际项目中应该使用更复杂的检测逻辑
    const suspiciousPatterns = [
      /ignore.*previous.*instructions/i,
      /system.*prompt/i,
      /override.*settings/i,
      /bypass.*restrictions/i,
    ]

    const score = suspiciousPatterns.some((pattern) => pattern.test(input)) ? 0.9 : 0.1

    if (score >= this.threshold) {
      throw new PromptInjectionDetectedException('Potential prompt injection detected', {
        score,
        threshold: this.threshold,
        preview: input.substring(0, 100),
        context: context?.correlationId ?? undefined,
        correlationId: context?.correlationId ?? undefined,
        userId: context?.userId,
      })
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

  /**
   * 检查输入并在不安全时抛出异常
   * @param input 用户输入
   * @param context 上下文信息
   */
  async ensureSafeOrThrow(
    input: string,
    context?: { userId?: string; correlationId?: string }
  ): Promise<void> {
    const result = await this.checkInput(input, context)
    if (!result.allowed) {
      throw new PromptInjectionDetectedException('Input failed security check', {
        score: result.score,
        threshold: result.threshold,
        preview: result.details?.preview ?? undefined,
        context: context?.correlationId ?? undefined,
        correlationId: context?.correlationId ?? undefined,
        userId: context?.userId ?? undefined,
      })
    }
  }
}

const MAX_RETRIES = 2

/**
 * [核心护栏] 使用Zod Schema安全地调用AI提供商，并提供自动重试和超时机制。
 * @param provider AI提供商实例
 * @param prompt 要发送给AI的提示文本
 * @param schema 用于验证输出的Zod Schema
 * @param timeoutMs 超时时间（毫秒），默认为30000ms (30秒)
 * @returns 一个Promise，成功时解析为符合Schema的类型安全数据
 * @throws {AiGenerationException} 如果AI在多次重试后仍无法生成有效数据或超时
 */
export async function callAiWithGuard<T extends z.ZodType>(
  provider: { generate: (options: { prompt: string; temperature?: number }) => Promise<string> }, // 简化的接口
  prompt: string,
  schema: T,
  timeoutMs: number = 30000 // 默认30秒超时
): Promise<z.infer<T>> {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // [新增] 创建带超时的Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`AI request timed out after ${timeoutMs}ms`))
        }, timeoutMs)
      })

      // 竞态执行：AI调用 vs 超时
      const response = await Promise.race([
        provider.generate({ prompt, temperature: 0.7 }),
        timeoutPromise,
      ])

      // 尝试解析响应字符串
      const dataToParse = JSON.parse(response)

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

      // 如果是超时错误，直接抛出，不再重试
      if (error instanceof Error && error.message.includes('timed out')) {
        throw new AiGenerationException(`AI request timed out after ${timeoutMs}ms`, error)
      }
    }
  }

  // 如果所有尝试都失败了，则抛出最终的异常
  throw new AiGenerationException(
    `AI failed to generate valid data after ${MAX_RETRIES + 1} attempts.`,
    lastError
  )
}
