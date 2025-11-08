import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
export type AiRole =
  | 'logic_parsing'
  | 'narrative_synthesis'
  | 'planner'
  | 'critic'
  | 'summarizer'
  | 'converter'
  | 'novelist'
  | 'supervisor'
  | 'specialist_dialogue'
  | 'specialist_description'
  | 'specialist_options'
  | 'image_generation'
export interface AiGenerationOptions {
  temperature?: number
  maxTokens?: number
}
export interface AiProvider {
  model: BaseChatModel
}
//# sourceMappingURL=ai-providers.types.d.ts.map
