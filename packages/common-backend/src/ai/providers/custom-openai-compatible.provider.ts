// [核心修正] 修正了类型定义的导入路径
import type { AiGenerationOptions, AiProvider } from '../../types/ai-providers.types'

export class CustomOpenAICompatibleProvider implements AiProvider {
  public readonly name: string
  public readonly provider: string

  constructor(
    _apiKey: string,
    public readonly modelId: string,
    _baseUrl: string | null,
    _defaultOptions: AiGenerationOptions = {}
  ) {
    this.name = `custom-openai-${modelId}`
    this.provider = 'custom-openai'
  }

  async generate(_options: AiGenerationOptions): Promise<string> {
    // 简化的实现，实际应该使用OpenAI API
    throw new Error('CustomOpenAICompatibleProvider.generate() not implemented')
  }
}
