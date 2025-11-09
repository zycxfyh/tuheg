// 文件路径: packages/common-backend/src/utils/error-utils.ts
// 描述: 错误处理工具函数，提供统一的错误消息提取逻辑

/**
 * 从未知类型的错误对象中提取错误消息
 *
 * @param error - 未知类型的错误对象
 * @param defaultMessage - 默认错误消息（当无法提取消息时使用）
 * @returns 错误消息字符串
 *
 * @example
 * ```typescript
 * try {
 *   throw new Error('Something went wrong')
 * } catch (error) {
 *   const message = getErrorMessage(error, 'Unknown error')
 *   console.log(message) // 'Something went wrong'
 * }
 * ```
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage = 'An unknown error occurred'
): string {
  // 如果是 Error 实例，直接返回 message
  if (error instanceof Error) {
    return error.message
  }

  // 如果是字符串，直接返回
  if (typeof error === 'string') {
    return error
  }

  // 如果是对象且有 message 属性
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message
    if (typeof message === 'string') {
      return message
    }
  }

  // 其他情况返回默认消息
  return defaultMessage
}

/**
 * 从未知类型的错误对象中提取堆栈跟踪
 *
 * @param error - 未知类型的错误对象
 * @returns 堆栈跟踪字符串或 undefined
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack
  }
  return undefined
}

/**
 * 检查错误是否为特定类型
 *
 * @param error - 未知类型的错误对象
 * @param errorClass - 错误类的构造函数
 * @returns 是否为指定类型的错误
 */
export function isErrorOfType<T extends Error>(
  error: unknown,
  errorClass: new (...args: any[]) => T
): error is T {
  return error instanceof errorClass
}
