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
exports.withErrorHandling = withErrorHandling
exports.handleRabbitMQMessage = handleRabbitMQMessage
exports.withRMQErrorHandling = withRMQErrorHandling
const Sentry = __importStar(require('@sentry/node'))
const error_classification_1 = require('./error-classification')
const websocket_error_helper_1 = require('./websocket-error-helper')
function withErrorHandling(handler, logger, context, options = {}) {
  const {
    maxRetries = 2,
    logDetails = true,
    reportToSentry = true,
    publishErrorEvent = false,
    errorEventPublisher,
    userId,
    errorEventName = 'processing_failed',
  } = options
  return async (data, _channel, message) => {
    const correlationId = context?.correlationId || data.correlationId || 'unknown'
    const gameId = context?.gameId || data.gameId || 'unknown'
    const operation = context?.operation || 'process_message'
    const startTime = Date.now()
    try {
      await handler(data)
      const duration = Date.now() - startTime
      logger.log(
        `[${correlationId}] ${operation} completed successfully for game: ${gameId} (${duration}ms)`
      )
      return 'ack'
    } catch (error) {
      const errorResponse = (0, error_classification_1.classifyProcessingError)(error, {
        operation,
        gameId,
        userId: context?.userId || data.userId,
      })
      if (reportToSentry) {
        Sentry.captureException(error, {
          tags: {
            correlationId,
            gameId,
            errorType: errorResponse.errorType,
            errorCode: errorResponse.errorCode,
            retryable: String(errorResponse.retryable),
          },
          extra: {
            jobData: data,
            errorDetails: errorResponse.details,
          },
        })
      }
      if (logDetails) {
        logger.error(
          `[${correlationId}] ${operation} failed for game ${gameId}: ${errorResponse.message}`,
          error instanceof Error ? error.stack : undefined,
          errorResponse.details
        )
      } else {
        logger.error(`[${correlationId}] ${operation} failed: ${errorResponse.errorCode}`)
      }
      if (publishErrorEvent && errorEventPublisher) {
        const effectiveUserId = userId || context?.userId || data.userId
        if (effectiveUserId) {
          try {
            const errorPayload = (0, websocket_error_helper_1.formatErrorForWebSocket)(
              errorResponse,
              correlationId,
              error instanceof Error ? error.message : 'Unknown error'
            )
            errorEventPublisher({
              userId: effectiveUserId,
              event: errorEventName,
              data: errorPayload,
            })
            logger.debug(`[${correlationId}] Published enhanced error event: ${errorEventName}`)
          } catch (eventError) {
            logger.warn(
              `[${correlationId}] Failed to publish error event: ${eventError instanceof Error ? eventError.message : String(eventError)}`
            )
          }
        }
      }
      if (!errorResponse.retryable) {
        logger.warn(
          `[${correlationId}] Error is not retryable (${errorResponse.errorType}). Discarding message.`
        )
        return 'nack'
      }
      const retryCount = (message.properties.headers?.['x-death'] || []).length
      if (retryCount < maxRetries) {
        logger.warn(
          `[${correlationId}] ${operation} failed. Will retry (${retryCount + 1}/${maxRetries + 1}). Error: ${errorResponse.errorCode}`
        )
        return 'requeue'
      } else {
        logger.error(
          `[${correlationId}] ${operation} failed after ${maxRetries + 1} attempts. Sending to DLQ. Error: ${errorResponse.errorCode}`
        )
        return 'nack'
      }
    }
  }
}
async function handleRabbitMQMessage(handler, channel, message, logger, context, options = {}) {
  const wrappedHandler = withErrorHandling(handler, logger, context, options)
  const result = await wrappedHandler(message.content, channel, message)
  if (result === 'ack') {
    channel.ack(message)
  } else if (result === 'requeue') {
    channel.nack(message, false, true)
  } else {
    channel.nack(message, false, false)
  }
}
function withRMQErrorHandling(handler, logger, context, options = {}) {
  const {
    maxRetries: _maxRetries = 2,
    logDetails = true,
    reportToSentry = true,
    publishErrorEvent = false,
    errorEventPublisher,
    userId,
    errorEventName = 'processing_failed',
  } = options
  return async (data) => {
    const correlationId = context?.correlationId || data.correlationId || 'unknown'
    const gameId = context?.gameId || data.gameId || 'unknown'
    const operation = context?.operation || 'process_message'
    const startTime = Date.now()
    try {
      await handler(data)
      const duration = Date.now() - startTime
      logger.log(
        `[${correlationId}] ${operation} completed successfully for game: ${gameId} (${duration}ms)`
      )
      return 'ack'
    } catch (error) {
      const errorResponse = (0, error_classification_1.classifyProcessingError)(error, {
        operation,
        gameId,
        userId: context?.userId || data.userId,
      })
      if (reportToSentry) {
        Sentry.captureException(error, {
          tags: {
            correlationId,
            gameId,
            errorType: errorResponse.errorType,
            errorCode: errorResponse.errorCode,
            retryable: String(errorResponse.retryable),
          },
          extra: {
            jobData: data,
            errorDetails: errorResponse.details,
          },
        })
      }
      if (logDetails) {
        logger.error(
          `[${correlationId}] ${operation} failed for game ${gameId}: ${errorResponse.message}`,
          error instanceof Error ? error.stack : undefined,
          errorResponse.details
        )
      } else {
        logger.error(`[${correlationId}] ${operation} failed: ${errorResponse.errorCode}`)
      }
      if (publishErrorEvent && errorEventPublisher) {
        const effectiveUserId = userId || context?.userId || data.userId
        if (effectiveUserId) {
          try {
            const errorPayload = (0, websocket_error_helper_1.formatErrorForWebSocket)(
              errorResponse,
              correlationId,
              error instanceof Error ? error.message : 'Unknown error'
            )
            errorEventPublisher({
              userId: effectiveUserId,
              event: errorEventName,
              data: errorPayload,
            })
            logger.debug(`[${correlationId}] Published enhanced error event: ${errorEventName}`)
          } catch (eventError) {
            logger.warn(
              `[${correlationId}] Failed to publish error event: ${eventError instanceof Error ? eventError.message : String(eventError)}`
            )
          }
        }
      }
      if (!errorResponse.retryable) {
        logger.warn(
          `[${correlationId}] Error is not retryable (${errorResponse.errorType}). Discarding message.`
        )
        return 'nack'
      }
      logger.warn(
        `[${correlationId}] ${operation} failed. Will be requeued by RabbitMQ. Error: ${errorResponse.errorCode}`
      )
      return 'requeue'
    }
  }
}
//# sourceMappingURL=message-handler-helper.js.map
