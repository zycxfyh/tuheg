import { z } from 'zod'
import type { Runnable } from '@langchain/core/runnables'
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
export declare class PromptInjectionGuard {
  private readonly threshold
  checkInput(
    input: string,
    context?: {
      userId?: string
      correlationId?: string
    }
  ): Promise<PromptInjectionCheckResult>
  ensureSafeOrThrow(
    input: string,
    context?: {
      userId?: string
      correlationId?: string
    }
  ): Promise<void>
}
export declare function callAiWithGuard<T extends z.ZodType>(
  chain: Runnable,
  params: object,
  schema: T,
  timeoutMs?: number
): Promise<z.infer<T>>
//# sourceMappingURL=ai-guard.d.ts.map
