import { ChatOpenAI } from '@langchain/openai'
import type { AiProvider, AiGenerationOptions } from '../../types/ai-providers.types'
export declare class CustomOpenAICompatibleProvider implements AiProvider {
  readonly model: ChatOpenAI
  constructor(
    apiKey: string,
    modelId: string,
    baseUrl: string | null,
    defaultOptions?: AiGenerationOptions
  )
}
//# sourceMappingURL=custom-openai-compatible.provider.d.ts.map
