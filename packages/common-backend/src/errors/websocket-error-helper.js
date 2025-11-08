'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.formatErrorForWebSocket = formatErrorForWebSocket
const error_classification_1 = require('./error-classification')
function formatErrorForWebSocket(errorResponse, correlationId, originalError) {
  const friendlyMessage = getFriendlyErrorMessage(errorResponse)
  return {
    errorCode: errorResponse.errorCode,
    errorMessage: friendlyMessage,
    retryable: errorResponse.retryable,
    suggestedAction: errorResponse.suggestedAction,
    correlationId,
    errorType: errorResponse.errorType,
    originalError,
  }
}
function getFriendlyErrorMessage(errorResponse) {
  if (errorResponse.suggestedAction) {
    return errorResponse.message
  }
  switch (errorResponse.errorType) {
    case error_classification_1.ProcessingErrorType.VALIDATION_ERROR:
      return '输入格式错误，请检查后重试'
    case error_classification_1.ProcessingErrorType.AI_GENERATION_ERROR:
      return 'AI 处理失败，系统将自动重试。如果问题持续，请联系支持'
    case error_classification_1.ProcessingErrorType.NETWORK_ERROR:
      return '网络连接失败，请检查网络连接后重试'
    case error_classification_1.ProcessingErrorType.DATABASE_ERROR:
      return '数据服务暂时不可用，请稍后重试'
    case error_classification_1.ProcessingErrorType.BUSINESS_LOGIC_ERROR:
      return '处理失败，请检查输入是否正确'
    default:
      return errorResponse.message || '处理失败，请稍后重试'
  }
}
//# sourceMappingURL=websocket-error-helper.js.map
