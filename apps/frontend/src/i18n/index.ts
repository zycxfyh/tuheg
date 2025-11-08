import { enUs } from './locales/en-US'
import { jaJp } from './locales/ja-JP'
import { koKr } from './locales/ko-KR'
import { zhCn } from './locales/zh-CN'

// 支持的语言列表
export const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', name: '中文', nativeName: '中文', rtl: false },
  { code: 'en-US', name: 'English', nativeName: 'English', rtl: false },
  { code: 'ja-JP', name: '日本語', nativeName: '日本語', rtl: false },
  { code: 'ko-KR', name: '한국어', nativeName: '한국어', rtl: false },
]

// 检查是否为RTL语言
export const isRTL = (locale: string): boolean => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === locale)?.rtl ?? false
}

// 设置语言
export const setLanguage = async (locale: string): Promise<void> => {
  try {
    localStorage.setItem('language', locale)
    // 这里可以添加动态加载语言包的逻辑
    console.log(`Language set to: ${locale}`)
  } catch (error) {
    console.error('Failed to set language:', error)
  }
}

// 获取当前语言
export const getCurrentLanguage = (): string => {
  return localStorage.getItem('language') || 'zh-CN'
}

// 默认语言配置
export const DEFAULT_LOCALE = 'zh-CN'
export const FALLBACK_LOCALE = 'en-US'

export default {
  'zh-CN': zhCn,
  'en-US': enUs,
  'ja-JP': jaJp,
  'ko-KR': koKr,
}
