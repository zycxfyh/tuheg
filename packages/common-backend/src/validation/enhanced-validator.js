'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.EnhancedValidator = void 0
const zod_1 = require('zod')
class EnhancedValidator {
  static validate(schema, data) {
    try {
      const parsed = schema.parse(data)
      return {
        success: true,
        data: parsed,
      }
    } catch (error) {
      if (error instanceof zod_1.z.ZodError) {
        return {
          success: false,
          errors: this.formatZodErrors(error),
        }
      }
      return {
        success: false,
        errors: [
          {
            path: [],
            message: error instanceof Error ? error.message : String(error),
            code: 'UNKNOWN_ERROR',
          },
        ],
      }
    }
  }
  static async validateAsync(schema, data) {
    try {
      const parsed = await schema.parseAsync(data)
      return {
        success: true,
        data: parsed,
      }
    } catch (error) {
      if (error instanceof zod_1.z.ZodError) {
        return {
          success: false,
          errors: this.formatZodErrors(error),
        }
      }
      return {
        success: false,
        errors: [
          {
            path: [],
            message: error instanceof Error ? error.message : String(error),
            code: 'UNKNOWN_ERROR',
          },
        ],
      }
    }
  }
  static safeParse(schema, data) {
    const result = schema.safeParse(data)
    if (result.success) {
      return {
        success: true,
        data: result.data,
      }
    }
    return {
      success: false,
      errors: this.formatZodErrors(result.error),
    }
  }
  static formatZodErrors(error) {
    return error.errors.map((err) => {
      const validationError = {
        path: err.path,
        message: this.formatErrorMessage(err),
        code: err.code,
      }
      if (err.code === 'invalid_type') {
        validationError.expected = err.expected
        validationError.received = err.received
      }
      if (err.code === 'too_small' || err.code === 'too_big') {
        const constraintErr = err
        validationError.expected = `minimum: ${constraintErr.minimum ?? 'N/A'}, maximum: ${constraintErr.maximum ?? 'N/A'}`
        validationError.received = constraintErr.received
      }
      return validationError
    })
  }
  static formatErrorMessage(err) {
    const path = err.path.length > 0 ? err.path.join('.') : 'root'
    switch (err.code) {
      case 'invalid_type':
        return `${path}: 期望类型 "${err.expected}"，但收到类型 "${err.received}"`
      case 'invalid_string':
        if (err.validation === 'email') {
          return `${path}: 无效的电子邮件地址`
        }
        if (err.validation === 'url') {
          return `${path}: 无效的 URL`
        }
        if (err.validation === 'uuid') {
          return `${path}: 无效的 UUID`
        }
        return `${path}: 字符串验证失败`
      case 'too_small':
        if (err.type === 'string') {
          return `${path}: 字符串长度至少为 ${err.minimum} 个字符`
        }
        if (err.type === 'number') {
          return `${path}: 数值必须大于或等于 ${err.minimum}`
        }
        if (err.type === 'array') {
          return `${path}: 数组至少需要 ${err.minimum} 个元素`
        }
        return `${path}: 值太小（最小: ${err.minimum}）`
      case 'too_big':
        if (err.type === 'string') {
          return `${path}: 字符串长度不能超过 ${err.maximum} 个字符`
        }
        if (err.type === 'number') {
          return `${path}: 数值不能超过 ${err.maximum}`
        }
        if (err.type === 'array') {
          return `${path}: 数组最多只能包含 ${err.maximum} 个元素`
        }
        return `${path}: 值太大（最大: ${err.maximum}）`
      case 'invalid_enum_value':
        return `${path}: 无效的枚举值。允许的值: ${err.options?.join(', ') ?? 'N/A'}`
      case 'invalid_literal':
        return `${path}: 必须是字面量值 "${err.expected}"`
      case 'unrecognized_keys':
        return `${path}: 未知的键: ${err.keys.join(', ')}`
      case 'invalid_union':
        return `${path}: 值不匹配任何联合类型选项`
      case 'invalid_date':
        return `${path}: 无效的日期格式`
      case 'custom':
        return err.message ?? `${path}: 自定义验证失败`
      default:
        return err.message ?? `${path}: 验证失败`
    }
  }
  static formatErrorsAsString(errors) {
    return errors
      .map((err) => {
        const path = err.path.length > 0 ? err.path.join('.') : 'root'
        let message = `${path}: ${err.message}`
        if (err.expected) {
          message += ` (期望: ${err.expected})`
        }
        if (err.received !== undefined) {
          message += ` (收到: ${JSON.stringify(err.received)})`
        }
        return message
      })
      .join('\n')
  }
}
exports.EnhancedValidator = EnhancedValidator
//# sourceMappingURL=enhanced-validator.js.map
