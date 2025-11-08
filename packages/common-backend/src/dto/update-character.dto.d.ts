import { z } from 'zod'
export declare const updateCharacterSchema: z.ZodEffects<
  z.ZodObject<
    {
      hp: z.ZodOptional<z.ZodNumber>
      mp: z.ZodOptional<z.ZodNumber>
      maxHp: z.ZodOptional<z.ZodNumber>
      maxMp: z.ZodOptional<z.ZodNumber>
      status: z.ZodOptional<z.ZodString>
    },
    'strict',
    z.ZodTypeAny,
    {
      status?: string | undefined
      hp?: number | undefined
      maxHp?: number | undefined
      mp?: number | undefined
      maxMp?: number | undefined
    },
    {
      status?: string | undefined
      hp?: number | undefined
      maxHp?: number | undefined
      mp?: number | undefined
      maxMp?: number | undefined
    }
  >,
  {
    status?: string | undefined
    hp?: number | undefined
    maxHp?: number | undefined
    mp?: number | undefined
    maxMp?: number | undefined
  },
  {
    status?: string | undefined
    hp?: number | undefined
    maxHp?: number | undefined
    mp?: number | undefined
    maxMp?: number | undefined
  }
>
export type UpdateCharacterDto = z.infer<typeof updateCharacterSchema>
//# sourceMappingURL=update-character.dto.d.ts.map
