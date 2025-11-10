// AI Provider types and interfaces

export interface AiGenerationOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  messages?: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  [key: string]: any
}

export interface AiProvider {
  readonly name: string
  readonly provider: string

  generate(options: AiGenerationOptions): Promise<string>
}

export type AiRole = 'system' | 'user' | 'assistant'

export type AiProviderType = 'OpenAI' | 'Anthropic' | 'Google' | 'Custom'
