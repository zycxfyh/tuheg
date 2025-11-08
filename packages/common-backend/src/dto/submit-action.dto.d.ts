import { z } from 'zod'
export declare const submitActionSchema: z.ZodEffects<
  z.ZodObject<
    {
      type: z.ZodEnum<['option', 'command', 'meta']>
      payload: z.ZodAny
    },
    'strip',
    z.ZodTypeAny,
    {
      type: 'option' | 'command' | 'meta'
      payload?: any
    },
    {
      type: 'option' | 'command' | 'meta'
      payload?: any
    }
  >,
  {
    type: 'option' | 'command' | 'meta'
    payload?: any
  },
  {
    type: 'option' | 'command' | 'meta'
    payload?: any
  }
>
export type SubmitActionDto = z.infer<typeof submitActionSchema>
//# sourceMappingURL=submit-action.dto.d.ts.map
