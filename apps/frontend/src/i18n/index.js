/**
 * 🌐 创世星环国际化配置
 * 支持多语言界面和文化适应
 */

import { createI18n } from 'vue-i18n';
import zhCN from './locales/zh-CN.js';
import zhTW from './locales/zh-TW.js';
import enUS from './locales/en-US.js';
import jaJP from './locales/ja-JP.js';
import koKR from './locales/ko-KR.js';

// 支持的语言列表
export const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳', nativeName: '简体中文' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼', nativeName: '繁體中文' },
  { code: 'en-US', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷', nativeName: '한국어' },
];

// 语言包
const messages = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en-US': enUS,
  'ja-JP': jaJP,
  'ko-KR': koKR,
};

// 获取浏览器语言
function getBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split('-')[0];

  // 检查是否支持该语言
  const supportedLang = SUPPORTED_LANGUAGES.find((lang) => lang.code.startsWith(langCode));
  return supportedLang ? supportedLang.code : 'zh-CN';
}

// 获取保存的语言设置
function getSavedLanguage() {
  return localStorage.getItem('creation-ring-language') || getBrowserLanguage();
}

// 创建i18n实例
const i18n = createI18n({
  legacy: false, // 使用Composition API
  locale: getSavedLanguage(), // 默认语言
  fallbackLocale: 'zh-CN', // 回退语言
  messages,
  // 全局配置
  globalInjection: true, // 全局注入$t方法
  // 日期时间格式化
  datetimeFormats: {
    'zh-CN': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
      },
    },
    'en-US': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
      },
    },
  },
  // 数字格式化
  numberFormats: {
    'zh-CN': {
      currency: {
        style: 'currency',
        currency: 'CNY',
        notation: 'standard',
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
      percent: {
        style: 'percent',
        useGrouping: false,
      },
    },
    'en-US': {
      currency: {
        style: 'currency',
        currency: 'USD',
        notation: 'standard',
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
      percent: {
        style: 'percent',
        useGrouping: false,
      },
    },
  },
});

// 切换语言的方法
export function setLanguage(langCode) {
  if (i18n.global.locale.value !== langCode) {
    i18n.global.locale.value = langCode;
    localStorage.setItem('creation-ring-language', langCode);

    // 设置HTML文档语言属性
    document.documentElement.lang = langCode;

    // 设置页面标题
    const title = i18n.global.t('app.title');
    document.title = title;

    // 触发语言切换事件
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: langCode } }));
  }
}

// 获取当前语言信息
export function getCurrentLanguage() {
  const currentCode = i18n.global.locale.value;
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === currentCode) || SUPPORTED_LANGUAGES[0];
}

// 检测是否为RTL语言
export function isRTL(language) {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(language.split('-')[0]);
}

export default i18n;
