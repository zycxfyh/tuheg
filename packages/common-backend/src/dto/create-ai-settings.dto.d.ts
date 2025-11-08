import { z } from 'zod'
export declare const allowedProviders: readonly [
  'DeepSeek',
  'Moonshot',
  'OpenAI',
  'Groq',
  'Ollama',
  'CustomOpenAICompatible',
]
export declare const providerSchema: z.ZodEnum<
  ['DeepSeek', 'Moonshot', 'OpenAI', 'Groq', 'Ollama', 'CustomOpenAICompatible']
>
export declare const apiKeySchema: z.ZodString
export declare const modelIdSchema: z.ZodString
export declare const roleNameSchema: z.ZodString
export declare const baseUrlSchema: z.ZodString
export declare const createAiSettingsSchema: z.ZodObject<
  {
    provider: z.ZodEnum<
      ['DeepSeek', 'Moonshot', 'OpenAI', 'Groq', 'Ollama', 'CustomOpenAICompatible']
    >
    apiKey: z.ZodString
    modelId: z.ZodString
    baseUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>
    roles: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>
  },
  'strip',
  z.ZodTypeAny,
  {
    apiKey: string
    provider: 'OpenAI' | 'DeepSeek' | 'Groq' | 'Moonshot' | 'Ollama' | 'CustomOpenAICompatible'
    modelId: string
    baseUrl?: string | null | undefined
    roles?: string[] | undefined
  },
  {
    apiKey: string
    provider: 'OpenAI' | 'DeepSeek' | 'Groq' | 'Moonshot' | 'Ollama' | 'CustomOpenAICompatible'
    modelId: string
    baseUrl?: string | null | undefined
    roles?: string[] | undefined
  }
>
export type CreateAiSettingsDto = z.infer<typeof createAiSettingsSchema>
//# sourceMappingURL=create-ai-settings.dto.d.ts.map
