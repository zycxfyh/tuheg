import * as Sentry from '@sentry/node'
export interface SentryConfigOptions {
  environment?: string
  release?: string
  dsn?: string
  tracesSampleRate?: number
  profilesSampleRate?: number
  enablePerformanceMonitoring?: boolean
  tags?: Record<string, string>
  ignoreErrors?: string[]
}
export declare function configureSentry(options?: SentryConfigOptions): void
export declare function setSentryUser(user: { id: string; email?: string; username?: string }): void
export declare function setSentryContext(key: string, context: Record<string, unknown>): void
export declare function setSentryTag(key: string, value: string): void
export declare function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
    user?: {
      id: string
      email?: string
    }
  }
): void
export declare function captureMessage(
  message: string,
  level?: Sentry.SeverityLevel,
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
  }
): void
//# sourceMappingURL=sentry.config.d.ts.map
