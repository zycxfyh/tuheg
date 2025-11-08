import { z } from 'zod'
export declare const gameCreationPayloadSchema: z.ZodObject<
  {
    userId: z.ZodString
    concept: z.ZodString
  },
  'strip',
  z.ZodTypeAny,
  {
    userId: string
    concept: string
  },
  {
    userId: string
    concept: string
  }
>
export type GameCreationPayload = z.infer<typeof gameCreationPayloadSchema>
export declare const gameActionJobDataSchema: z.ZodObject<
  {
    gameId: z.ZodString
    userId: z.ZodString
    playerAction: z.ZodEffects<
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
    gameStateSnapshot: z.ZodObject<
      {
        id: z.ZodString
        name: z.ZodString
        ownerId: z.ZodString
        createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>
        updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>
        character: z.ZodOptional<
          z.ZodNullable<
            z.ZodObject<
              {
                id: z.ZodString
                gameId: z.ZodString
                name: z.ZodString
                card: z.ZodUnknown
                createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>
                updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>
              },
              'strip',
              z.ZodTypeAny,
              {
                name: string
                id: string
                createdAt: string | Date
                updatedAt: string | Date
                gameId: string
                card?: unknown
              },
              {
                name: string
                id: string
                createdAt: string | Date
                updatedAt: string | Date
                gameId: string
                card?: unknown
              }
            >
          >
        >
        worldBook: z.ZodOptional<
          z.ZodArray<
            z.ZodObject<
              {
                id: z.ZodString
                gameId: z.ZodString
                key: z.ZodString
                content: z.ZodUnknown
                createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>
                updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>
              },
              'strip',
              z.ZodTypeAny,
              {
                id: string
                createdAt: string | Date
                updatedAt: string | Date
                key: string
                gameId: string
                content?: unknown
              },
              {
                id: string
                createdAt: string | Date
                updatedAt: string | Date
                key: string
                gameId: string
                content?: unknown
              }
            >,
            'many'
          >
        >
      },
      'strip',
      z.ZodTypeAny,
      {
        name: string
        id: string
        ownerId: string
        createdAt: string | Date
        updatedAt: string | Date
        character?:
          | {
              name: string
              id: string
              createdAt: string | Date
              updatedAt: string | Date
              gameId: string
              card?: unknown
            }
          | null
          | undefined
        worldBook?:
          | {
              id: string
              createdAt: string | Date
              updatedAt: string | Date
              key: string
              gameId: string
              content?: unknown
            }[]
          | undefined
      },
      {
        name: string
        id: string
        ownerId: string
        createdAt: string | Date
        updatedAt: string | Date
        character?:
          | {
              name: string
              id: string
              createdAt: string | Date
              updatedAt: string | Date
              gameId: string
              card?: unknown
            }
          | null
          | undefined
        worldBook?:
          | {
              id: string
              createdAt: string | Date
              updatedAt: string | Date
              key: string
              gameId: string
              content?: unknown
            }[]
          | undefined
      }
    >
    correlationId: z.ZodOptional<z.ZodString>
  },
  'strip',
  z.ZodTypeAny,
  {
    gameId: string
    userId: string
    playerAction: {
      type: 'option' | 'command' | 'meta'
      payload?: any
    }
    gameStateSnapshot: {
      name: string
      id: string
      ownerId: string
      createdAt: string | Date
      updatedAt: string | Date
      character?:
        | {
            name: string
            id: string
            createdAt: string | Date
            updatedAt: string | Date
            gameId: string
            card?: unknown
          }
        | null
        | undefined
      worldBook?:
        | {
            id: string
            createdAt: string | Date
            updatedAt: string | Date
            key: string
            gameId: string
            content?: unknown
          }[]
        | undefined
    }
    correlationId?: string | undefined
  },
  {
    gameId: string
    userId: string
    playerAction: {
      type: 'option' | 'command' | 'meta'
      payload?: any
    }
    gameStateSnapshot: {
      name: string
      id: string
      ownerId: string
      createdAt: string | Date
      updatedAt: string | Date
      character?:
        | {
            name: string
            id: string
            createdAt: string | Date
            updatedAt: string | Date
            gameId: string
            card?: unknown
          }
        | null
        | undefined
      worldBook?:
        | {
            id: string
            createdAt: string | Date
            updatedAt: string | Date
            key: string
            gameId: string
            content?: unknown
          }[]
        | undefined
    }
    correlationId?: string | undefined
  }
>
export declare const narrativeRenderingPayloadSchema: z.ZodObject<
  {
    gameId: z.ZodString
    userId: z.ZodString
    playerAction: z.ZodEffects<
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
    executedDirectives: z.ZodArray<
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
    correlationId: z.ZodString
  },
  'strip',
  z.ZodTypeAny,
  {
    correlationId: string
    gameId: string
    userId: string
    playerAction: {
      type: 'option' | 'command' | 'meta'
      payload?: any
    }
    executedDirectives: {
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
    }[]
  },
  {
    correlationId: string
    gameId: string
    userId: string
    playerAction: {
      type: 'option' | 'command' | 'meta'
      payload?: any
    }
    executedDirectives: {
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
    }[]
  }
>
export type NarrativeRenderingPayload = z.infer<typeof narrativeRenderingPayloadSchema>
//# sourceMappingURL=queue-message-schemas.d.ts.map
