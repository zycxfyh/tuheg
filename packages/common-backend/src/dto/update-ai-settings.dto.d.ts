import { z } from 'zod'
export declare const updateAiSettingsSchema: z.ZodObject<
  {
    provider: z.ZodOptional<
      z.ZodEnum<['DeepSeek', 'Moonshot', 'OpenAI', 'Groq', 'Ollama', 'CustomOpenAICompatible']>
    >
    apiKey: z.ZodOptional<z.ZodString>
    modelId: z.ZodOptional<z.ZodString>
    baseUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>
    roles: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>
  },
  'strip',
  z.ZodTypeAny,
  {
    apiKey?: string | undefined
    provider?:
      | 'OpenAI'
      | 'DeepSeek'
      | 'Groq'
      | 'Moonshot'
      | 'Ollama'
      | 'CustomOpenAICompatible'
      | undefined
    modelId?: string | undefined
    baseUrl?: string | null | undefined
    roles?: string[] | undefined
  },
  {
    apiKey?: string | undefined
    provider?:
      | 'OpenAI'
      | 'DeepSeek'
      | 'Groq'
      | 'Moonshot'
      | 'Ollama'
      | 'CustomOpenAICompatible'
      | undefined
    modelId?: string | undefined
    baseUrl?: string | null | undefined
    roles?: string[] | undefined
  }
>
export declare const testAiConnectionSchema: z.ZodObject<
  {
    provider: z.ZodEnum<
      ['DeepSeek', 'Moonshot', 'OpenAI', 'Groq', 'Ollama', 'CustomOpenAICompatible']
    >
    apiKey: z.ZodString
    baseUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>
    modelId: z.ZodOptional<z.ZodString>
  },
  'strip',
  z.ZodTypeAny,
  {
    apiKey: string
    provider: 'OpenAI' | 'DeepSeek' | 'Groq' | 'Moonshot' | 'Ollama' | 'CustomOpenAICompatible'
    modelId?: string | undefined
    baseUrl?: string | null | undefined
  },
  {
    apiKey: string
    provider: 'OpenAI' | 'DeepSeek' | 'Groq' | 'Moonshot' | 'Ollama' | 'CustomOpenAICompatible'
    modelId?: string | undefined
    baseUrl?: string | null | undefined
  }
>
export type UpdateAiSettingsDto = z.infer<typeof updateAiSettingsSchema>
export type TestAiConnectionDto = z.infer<typeof testAiConnectionSchema>
//# sourceMappingURL=update-ai-settings.dto.d.ts.map
