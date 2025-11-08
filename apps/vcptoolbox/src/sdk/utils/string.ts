// VCPToolBox SDK - 字符串工具函数

/**
 * 驼峰命名转换为短横线命名
 * @param str 驼峰命名字符串
 * @returns 短横线命名字符串
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * 短横线命名转换为驼峰命名
 * @param str 短横线命名字符串
 * @returns 驼峰命名字符串
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * 字符串首字母大写
 * @param str 输入字符串
 * @returns 首字母大写字符串
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * 生成随机字符串
 * @param length 字符串长度
 * @param charset 字符集
 * @returns 随机字符串
 */
export function randomString(
  length: number = 8,
  charset: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

/**
 * 截断字符串
 * @param str 输入字符串
 * @param maxLength 最大长度
 * @param suffix 后缀
 * @returns 截断后的字符串
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - suffix.length) + suffix
}

/**
 * 移除字符串中的HTML标签
 * @param html HTML字符串
 * @returns 纯文本字符串
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * 转义HTML特殊字符
 * @param text 文本字符串
 * @returns 转义后的HTML字符串
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * 生成slug
 * @param str 输入字符串
 * @returns slug字符串
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化数字
 * @param num 数字
 * @param locale 地区设置
 * @returns 格式化的数字字符串
 */
export function formatNumber(num: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num)
}

/**
 * 检查字符串是否为空或只包含空白字符
 * @param str 输入字符串
 * @returns 是否为空
 */
export function isEmpty(str: string): boolean {
  return !str || str.trim().length === 0
}

/**
 * 移除字符串开头和结尾的空白字符
 * @param str 输入字符串
 * @returns 清理后的字符串
 */
export function trim(str: string): string {
  return str.trim()
}

/**
 * 重复字符串
 * @param str 要重复的字符串
 * @param count 重复次数
 * @returns 重复后的字符串
 */
export function repeat(str: string, count: number): string {
  return str.repeat(count)
}

/**
 * 反转字符串
 * @param str 输入字符串
 * @returns 反转后的字符串
 */
export function reverse(str: string): string {
  return str.split('').reverse().join('')
}

/**
 * 检查字符串是否包含子串（不区分大小写）
 * @param str 源字符串
 * @param search 子串
 * @returns 是否包含
 */
export function containsIgnoreCase(str: string, search: string): boolean {
  return str.toLowerCase().includes(search.toLowerCase())
}

/**
 * 查找所有匹配的子串位置
 * @param str 源字符串
 * @param search 子串
 * @returns 位置数组
 */
export function findAllIndexes(str: string, search: string): number[] {
  const indexes: number[] = []
  let index = str.indexOf(search)
  while (index !== -1) {
    indexes.push(index)
    index = str.indexOf(search, index + 1)
  }
  return indexes
}

/**
 * 替换所有匹配的子串
 * @param str 源字符串
 * @param search 子串
 * @param replacement 替换字符串
 * @returns 替换后的字符串
 */
export function replaceAll(str: string, search: string, replacement: string): string {
  return str.split(search).join(replacement)
}

/**
 * 计算字符串相似度（Levenshtein距离）
 * @param str1 字符串1
 * @param str2 字符串2
 * @returns 相似度（0-1之间）
 */
export function similarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * 计算Levenshtein距离
 * @param str1 字符串1
 * @param str2 字符串2
 * @returns 编辑距离
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1, // 插入
          matrix[i - 1][j] + 1 // 删除
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}
