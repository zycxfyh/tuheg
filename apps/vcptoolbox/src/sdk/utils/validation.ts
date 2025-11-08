// VCPToolBox SDK - 验证工具函数

/**
 * 邮箱格式验证
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * URL格式验证
 * @param url URL字符串
 * @returns 是否有效
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 手机号格式验证（中国大陆）
 * @param phone 手机号
 * @returns 是否有效
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\s|-/g, ''))
}

/**
 * 身份证号格式验证（中国大陆）
 * @param idCard 身份证号
 * @returns 是否有效
 */
export function isValidIdCard(idCard: string): boolean {
  const idCardRegex = /^\d{17}[\dXx]$/
  if (!idCardRegex.test(idCard)) return false

  // 校验码验证
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCode = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * weights[i]
  }

  const mod = sum % 11
  const lastChar = idCard[17].toUpperCase()

  return checkCode[mod] === lastChar
}

/**
 * 密码强度验证
 * @param password 密码
 * @param options 验证选项
 * @returns 验证结果
 */
export function validatePassword(password: string, options: {
  minLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumbers?: boolean
  requireSpecialChars?: boolean
} = {}): { valid: boolean; errors: string[] } {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false
  } = options

  const errors: string[] = []

  if (password.length < minLength) {
    errors.push(`密码长度至少为${minLength}个字符`)
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母')
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母')
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('密码必须包含数字')
  }

  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('密码必须包含特殊字符')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * JSON格式验证
 * @param str JSON字符串
 * @returns 是否有效
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

/**
 * UUID格式验证
 * @param uuid UUID字符串
 * @returns 是否有效
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * 版本号格式验证
 * @param version 版本号字符串
 * @returns 是否有效
 */
export function isValidVersion(version: string): boolean {
  const versionRegex = /^\d+\.\d+\.\d+(-[\w\.\-]+)?(\+[\w\.\-]+)?$/
  return versionRegex.test(version)
}

/**
 * 插件ID格式验证
 * @param pluginId 插件ID
 * @returns 是否有效
 */
export function isValidPluginId(pluginId: string): boolean {
  const pluginIdRegex = /^[a-z][a-z0-9-]*[a-z0-9]$/
  return pluginIdRegex.test(pluginId) && pluginId.length >= 3 && pluginId.length <= 50
}

/**
 * 文件大小验证
 * @param size 文件大小（字节）
 * @param maxSize 最大大小（字节）
 * @returns 是否有效
 */
export function isValidFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize
}

/**
 * 文件类型验证
 * @param filename 文件名
 * @param allowedTypes 允许的文件类型
 * @returns 是否有效
 */
export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension ? allowedTypes.includes(extension) : false
}

/**
 * 日期格式验证
 * @param date 日期字符串
 * @param format 日期格式
 * @returns 是否有效
 */
export function isValidDate(date: string, format: string = 'YYYY-MM-DD'): boolean {
  // 简化的日期验证
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) return false

  const [year, month, day] = date.split('-').map(Number)
  const dateObj = new Date(year, month - 1, day)

  return dateObj.getFullYear() === year &&
         dateObj.getMonth() === month - 1 &&
         dateObj.getDate() === day
}

/**
 * 数值范围验证
 * @param value 数值
 * @param min 最小值
 * @param max 最大值
 * @returns 是否有效
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * 数组长度验证
 * @param array 数组
 * @param minLength 最小长度
 * @param maxLength 最大长度
 * @returns 是否有效
 */
export function isValidArrayLength(array: any[], minLength: number, maxLength: number): boolean {
  return array.length >= minLength && array.length <= maxLength
}

/**
 * 对象属性验证
 * @param obj 对象
 * @param requiredProps 必需属性
 * @returns 验证结果
 */
export function validateObject(obj: any, requiredProps: string[]): { valid: boolean; missing: string[] } {
  const missing = requiredProps.filter(prop => !(prop in obj) || obj[prop] === undefined || obj[prop] === null)
  return {
    valid: missing.length === 0,
    missing
  }
}

/**
 * 字符串长度验证
 * @param str 字符串
 * @param minLength 最小长度
 * @param maxLength 最大长度
 * @returns 是否有效
 */
export function isValidStringLength(str: string, minLength: number, maxLength: number): boolean {
  return str.length >= minLength && str.length <= maxLength
}

/**
 * 正则表达式验证
 * @param str 字符串
 * @param pattern 正则表达式
 * @returns 是否匹配
 */
export function matchesPattern(str: string, pattern: RegExp): boolean {
  return pattern.test(str)
}

/**
 * 必填字段验证
 * @param value 值
 * @returns 是否有效
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * 枚举值验证
 * @param value 值
 * @param allowedValues 允许的值
 * @returns 是否有效
 */
export function isInEnum<T>(value: T, allowedValues: T[]): boolean {
  return allowedValues.includes(value)
}
