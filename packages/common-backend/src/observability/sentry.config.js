'use strict'
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        var desc = Object.getOwnPropertyDescriptor(m, k)
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k]
            },
          }
        }
        Object.defineProperty(o, k2, desc)
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        o[k2] = m[k]
      })
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v })
      }
    : function (o, v) {
        o['default'] = v
      })
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = []
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k
          return ar
        }
      return ownKeys(o)
    }
    return function (mod) {
      if (mod && mod.__esModule) return mod
      var result = {}
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i])
      __setModuleDefault(result, mod)
      return result
    }
  })()
Object.defineProperty(exports, '__esModule', { value: true })
exports.configureSentry = configureSentry
exports.setSentryUser = setSentryUser
exports.setSentryContext = setSentryContext
exports.setSentryTag = setSentryTag
exports.captureException = captureException
exports.captureMessage = captureMessage
const Sentry = __importStar(require('@sentry/node'))
function configureSentry(options = {}) {
  const {
    environment = process.env.NODE_ENV || 'development',
    release = process.env.APP_VERSION || '1.0.0',
    dsn = process.env.SENTRY_DSN,
    tracesSampleRate = environment === 'production' ? 0.1 : 1.0,
    profilesSampleRate = environment === 'production' ? 0.1 : 1.0,
    enablePerformanceMonitoring = true,
    tags = {},
    ignoreErrors = ['NetworkError', 'Network request failed', 'ResizeObserver loop limit exceeded'],
  } = options
  if (!dsn) {
    console.warn('Sentry DSN not configured, skipping Sentry initialization')
    return
  }
  const sentryOptions = {
    dsn,
    environment,
    release,
    tracesSampleRate,
    profilesSampleRate: enablePerformanceMonitoring ? profilesSampleRate : 0,
    ignoreErrors,
    initialScope: {
      tags: {
        ...tags,
        environment,
        release,
      },
    },
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
    debug: environment === 'development',
    autoSessionTracking: true,
    sendDefaultPii: false,
  }
  Sentry.init(sentryOptions)
  console.log(`Sentry initialized for environment: ${environment}, release: ${release}`)
}
function setSentryUser(user) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  })
}
function setSentryContext(key, context) {
  Sentry.setContext(key, context)
}
function setSentryTag(key, value) {
  Sentry.setTag(key, value)
}
function captureException(error, context) {
  if (context?.tags) {
    for (const [key, value] of Object.entries(context.tags)) {
      Sentry.setTag(key, value)
    }
  }
  if (context?.extra) {
    Sentry.setExtra('context', context.extra)
  }
  if (context?.user) {
    setSentryUser(context.user)
  }
  Sentry.captureException(error)
}
function captureMessage(message, level = 'info', context) {
  if (context?.tags) {
    for (const [key, value] of Object.entries(context.tags)) {
      Sentry.setTag(key, value)
    }
  }
  if (context?.extra) {
    Sentry.setExtra('context', context.extra)
  }
  Sentry.captureMessage(message, level)
}
//# sourceMappingURL=sentry.config.js.map
