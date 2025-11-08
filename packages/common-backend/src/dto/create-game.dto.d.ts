import { z } from 'zod'
export declare const createNarrativeGameSchema: z.ZodObject<
  {
    concept: z.ZodString
  },
  'strip',
  z.ZodTypeAny,
  {
    concept: string
  },
  {
    concept: string
  }
>
export type CreateNarrativeGameDto = z.infer<typeof createNarrativeGameSchema>
//# sourceMappingURL=create-game.dto.d.ts.map
