import { z } from 'zod'
declare const numericOperationSchema: z.ZodObject<
  {
    op: z.ZodEnum<['set', 'increment', 'decrement']>
    value: z.ZodNumber
  },
  'strip',
  z.ZodTypeAny,
  {
    value: number
    op: 'set' | 'increment' | 'decrement'
  },
  {
    value: number
    op: 'set' | 'increment' | 'decrement'
  }
>
export type NumericOperation = z.infer<typeof numericOperationSchema>
declare const stringOperationSchema: z.ZodObject<
  {
    op: z.ZodEnum<['set', 'append', 'prepend']>
    value: z.ZodString
  },
  'strip',
  z.ZodTypeAny,
  {
    value: string
    op: 'set' | 'append' | 'prepend'
  },
  {
    value: string
    op: 'set' | 'append' | 'prepend'
  }
>
export type StringOperation = z.infer<typeof stringOperationSchema>
declare const characterUpdateSchema: z.ZodObject<
  {
    hp: z.ZodOptional<
      z.ZodObject<
        {
          op: z.ZodEnum<['set', 'increment', 'decrement']>
          value: z.ZodNumber
        },
        'strip',
        z.ZodTypeAny,
        {
          value: number
          op: 'set' | 'increment' | 'decrement'
        },
        {
          value: number
          op: 'set' | 'increment' | 'decrement'
        }
      >
    >
    mp: z.ZodOptional<
      z.ZodObject<
        {
          op: z.ZodEnum<['set', 'increment', 'decrement']>
          value: z.ZodNumber
        },
        'strip',
        z.ZodTypeAny,
        {
          value: number
          op: 'set' | 'increment' | 'decrement'
        },
        {
          value: number
          op: 'set' | 'increment' | 'decrement'
        }
      >
    >
    status: z.ZodOptional<
      z.ZodObject<
        {
          op: z.ZodEnum<['set', 'append', 'prepend']>
          value: z.ZodString
        },
        'strip',
        z.ZodTypeAny,
        {
          value: string
          op: 'set' | 'append' | 'prepend'
        },
        {
          value: string
          op: 'set' | 'append' | 'prepend'
        }
      >
    >
  },
  'strip',
  z.ZodTypeAny,
  {
    status?:
      | {
          value: string
          op: 'set' | 'append' | 'prepend'
        }
      | undefined
    hp?:
      | {
          value: number
          op: 'set' | 'increment' | 'decrement'
        }
      | undefined
    mp?:
      | {
          value: number
          op: 'set' | 'increment' | 'decrement'
        }
      | undefined
  },
  {
    status?:
      | {
          value: string
          op: 'set' | 'append' | 'prepend'
        }
      | undefined
    hp?:
      | {
          value: number
          op: 'set' | 'increment' | 'decrement'
        }
      | undefined
    mp?:
      | {
          value: number
          op: 'set' | 'increment' | 'decrement'
        }
      | undefined
  }
>
export type CharacterUpdate = z.infer<typeof characterUpdateSchema>
export declare const stateChangeDirectiveSchema: z.ZodObject<
  {
    op: z.ZodEnum<['update_character', 'update_world_book']>
    targetId: z.ZodString
    payload: z.ZodUnion<
      [
        z.ZodObject<
          {
            hp: z.ZodOptional<
              z.ZodObject<
                {
                  op: z.ZodEnum<['set', 'increment', 'decrement']>
                  value: z.ZodNumber
                },
                'strip',
                z.ZodTypeAny,
                {
                  value: number
                  op: 'set' | 'increment' | 'decrement'
                },
                {
                  value: number
                  op: 'set' | 'increment' | 'decrement'
                }
              >
            >
            mp: z.ZodOptional<
              z.ZodObject<
                {
                  op: z.ZodEnum<['set', 'increment', 'decrement']>
                  value: z.ZodNumber
                },
                'strip',
                z.ZodTypeAny,
                {
                  value: number
                  op: 'set' | 'increment' | 'decrement'
                },
                {
                  value: number
                  op: 'set' | 'increment' | 'decrement'
                }
              >
            >
            status: z.ZodOptional<
              z.ZodObject<
                {
                  op: z.ZodEnum<['set', 'append', 'prepend']>
                  value: z.ZodString
                },
                'strip',
                z.ZodTypeAny,
                {
                  value: string
                  op: 'set' | 'append' | 'prepend'
                },
                {
                  value: string
                  op: 'set' | 'append' | 'prepend'
                }
              >
            >
          },
          'strip',
          z.ZodTypeAny,
          {
            status?:
              | {
                  value: string
                  op: 'set' | 'append' | 'prepend'
                }
              | undefined
            hp?:
              | {
                  value: number
                  op: 'set' | 'increment' | 'decrement'
                }
              | undefined
            mp?:
              | {
                  value: number
                  op: 'set' | 'increment' | 'decrement'
                }
              | undefined
          },
          {
            status?:
              | {
                  value: string
                  op: 'set' | 'append' | 'prepend'
                }
              | undefined
            hp?:
              | {
                  value: number
                  op: 'set' | 'increment' | 'decrement'
                }
              | undefined
            mp?:
              | {
                  value: number
                  op: 'set' | 'increment' | 'decrement'
                }
              | undefined
          }
        >,
        z.ZodRecord<z.ZodString, z.ZodAny>,
      ]
    >
  },
  'strip',
  z.ZodTypeAny,
  {
    payload:
      | Record<string, any>
      | {
          status?:
            | {
                value: string
                op: 'set' | 'append' | 'prepend'
              }
            | undefined
          hp?:
            | {
                value: number
                op: 'set' | 'increment' | 'decrement'
              }
            | undefined
          mp?:
            | {
                value: number
                op: 'set' | 'increment' | 'decrement'
              }
            | undefined
        }
    op: 'update_character' | 'update_world_book'
    targetId: string
  },
  {
    payload:
      | Record<string, any>
      | {
          status?:
            | {
                value: string
                op: 'set' | 'append' | 'prepend'
              }
            | undefined
          hp?:
            | {
                value: number
                op: 'set' | 'increment' | 'decrement'
              }
            | undefined
          mp?:
            | {
                value: number
                op: 'set' | 'increment' | 'decrement'
              }
            | undefined
        }
    op: 'update_character' | 'update_world_book'
    targetId: string
  }
>
export type StateChangeDirective = z.infer<typeof stateChangeDirectiveSchema>
export declare const directiveSetSchema: z.ZodArray<
  z.ZodObject<
    {
      op: z.ZodEnum<['update_character', 'update_world_book']>
      targetId: z.ZodString
      payload: z.ZodUnion<
        [
          z.ZodObject<
            {
              hp: z.ZodOptional<
                z.ZodObject<
                  {
                    op: z.ZodEnum<['set', 'increment', 'decrement']>
                    value: z.ZodNumber
                  },
                  'strip',
                  z.ZodTypeAny,
                  {
                    value: number
                    op: 'set' | 'increment' | 'decrement'
                  },
                  {
                    value: number
                    op: 'set' | 'increment' | 'decrement'
                  }
                >
              >
              mp: z.ZodOptional<
                z.ZodObject<
                  {
                    op: z.ZodEnum<['set', 'increment', 'decrement']>
                    value: z.ZodNumber
                  },
                  'strip',
                  z.ZodTypeAny,
                  {
                    value: number
                    op: 'set' | 'increment' | 'decrement'
                  },
                  {
                    value: number
                    op: 'set' | 'increment' | 'decrement'
                  }
                >
              >
              status: z.ZodOptional<
                z.ZodObject<
                  {
                    op: z.ZodEnum<['set', 'append', 'prepend']>
                    value: z.ZodString
                  },
                  'strip',
                  z.ZodTypeAny,
                  {
                    value: string
                    op: 'set' | 'append' | 'prepend'
                  },
                  {
                    value: string
                    op: 'set' | 'append' | 'prepend'
                  }
                >
              >
            },
            'strip',
            z.ZodTypeAny,
            {
              status?:
                | {
                    value: string
                    op: 'set' | 'append' | 'prepend'
                  }
                | undefined
              hp?:
                | {
                    value: number
                    op: 'set' | 'increment' | 'decrement'
                  }
                | undefined
              mp?:
                | {
                    value: number
                    op: 'set' | 'increment' | 'decrement'
                  }
                | undefined
            },
            {
              status?:
                | {
                    value: string
                    op: 'set' | 'append' | 'prepend'
                  }
                | undefined
              hp?:
                | {
                    value: number
                    op: 'set' | 'increment' | 'decrement'
                  }
                | undefined
              mp?:
                | {
                    value: number
                    op: 'set' | 'increment' | 'decrement'
                  }
                | undefined
            }
          >,
          z.ZodRecord<z.ZodString, z.ZodAny>,
        ]
      >
    },
    'strip',
    z.ZodTypeAny,
    {
      payload:
        | Record<string, any>
        | {
            status?:
              | {
                  value: string
                  op: 'set' | 'append' | 'prepend'
                }
              | undefined
            hp?:
              | {
                  value: number
                  op: 'set' | 'increment' | 'decrement'
                }
              | undefined
            mp?:
              | {
                  value: number
                  op: 'set' | 'increment' | 'decrement'
                }
              | undefined
          }
      op: 'update_character' | 'update_world_book'
      targetId: string
    },
    {
      payload:
        | Record<string, any>
        | {
            status?:
              | {
                  value: string
                  op: 'set' | 'append' | 'prepend'
                }
              | undefined
            hp?:
              | {
                  value: number
                  op: 'set' | 'increment' | 'decrement'
                }
              | undefined
            mp?:
              | {
                  value: number
                  op: 'set' | 'increment' | 'decrement'
                }
              | undefined
          }
      op: 'update_character' | 'update_world_book'
      targetId: string
    }
  >,
  'many'
>
export type DirectiveSet = z.infer<typeof directiveSetSchema>
export {}
//# sourceMappingURL=state-change-directive.dto.d.ts.map
