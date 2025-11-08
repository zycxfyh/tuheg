export declare class JsonSanitizationError extends Error {
  readonly context?:
    | {
        raw: string
        lastError?: unknown
      }
    | undefined
  constructor(
    message: string,
    context?:
      | {
          raw: string
          lastError?: unknown
        }
      | undefined
  )
}
export declare function cleanAndParseJson(raw: unknown): Promise<unknown>
//# sourceMappingURL=json-cleaner.d.ts.map
