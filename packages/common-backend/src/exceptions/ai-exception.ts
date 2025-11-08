// 文件路径: packages/common-backend/src/exceptions/ai-exception.ts

export class AiGenerationException extends Error {
  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AiGenerationException'
  }
}
