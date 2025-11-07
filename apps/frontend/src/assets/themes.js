/**
 * 🎨 创世星环主题系统配置
 * 支持深色/浅色/自动主题切换
 */

// 主题定义
export const THEMES = {
  dark: {
    name: '深色主题',
    icon: '🌙',
    colors: {
      // 基础背景色
      primaryBg: '#121212',
      secondaryBg: '#1e1e1e',
      tertiaryBg: '#2a2a2a',

      // 文字颜色
      primaryText: '#e0e0e0',
      secondaryText: '#b0b0b0',
      tertiaryText: '#888888',

      // 强调色
      accentColor: '#00aaff',
      accentHover: '#0077cc',
      accentLight: '#4da6ff',

      // 边框和分割线
      borderColor: '#333333',
      borderLight: '#444444',
      borderDark: '#222222',

      // 功能色
      successColor: '#4CAF50',
      errorColor: '#F44336',
      warningColor: '#FF9800',
      infoColor: '#2196F3',

      // 游戏专用颜色
      healthColor: '#d9534f',
      manaColor: '#5bc0de',
      experienceColor: '#9c27b0',

      // 阴影和特效
      shadowColor: 'rgba(0, 170, 255, 0.1)',
      glowColor: 'rgba(0, 170, 255, 0.3)',

      // 特殊状态
      disabledColor: '#555555',
      focusColor: '#0066aa',
      hoverBg: '#2a2a2a',
    },
  },

  light: {
    name: '浅色主题',
    icon: '☀️',
    colors: {
      // 基础背景色
      primaryBg: '#ffffff',
      secondaryBg: '#f8f9fa',
      tertiaryBg: '#e9ecef',

      // 文字颜色
      primaryText: '#212529',
      secondaryText: '#6c757d',
      tertiaryText: '#868e96',

      // 强调色
      accentColor: '#007bff',
      accentHover: '#0056b3',
      accentLight: '#66b3ff',

      // 边框和分割线
      borderColor: '#dee2e6',
      borderLight: '#f8f9fa',
      borderDark: '#adb5bd',

      // 功能色
      successColor: '#28a745',
      errorColor: '#dc3545',
      warningColor: '#ffc107',
      infoColor: '#17a2b8',

      // 游戏专用颜色
      healthColor: '#dc3545',
      manaColor: '#17a2b8',
      experienceColor: '#6f42c1',

      // 阴影和特效
      shadowColor: 'rgba(0, 123, 255, 0.1)',
      glowColor: 'rgba(0, 123, 255, 0.2)',

      // 特殊状态
      disabledColor: '#6c757d',
      focusColor: '#cce7ff',
      hoverBg: '#f8f9fa',
    },
  },
};

// 主题模式
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
};

// 获取系统偏好主题
export function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // 默认深色主题
}

// 应用主题到CSS变量
export function applyTheme(themeName) {
  const theme = THEMES[themeName];
  if (!theme) {
    console.warn(`Theme "${themeName}" not found, using dark theme`);
    return applyTheme('dark');
  }

  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });

  // 设置主题属性用于JavaScript访问
  root.setAttribute('data-theme', themeName);
  localStorage.setItem('creation-ring-theme', themeName);

  return theme;
}

// 获取当前主题
export function getCurrentTheme() {
  const saved = localStorage.getItem('creation-ring-theme');
  if (saved && THEMES[saved]) {
    return saved;
  }

  // 如果设置为auto，使用系统主题
  if (saved === 'auto') {
    return getSystemTheme();
  }

  return 'dark'; // 默认主题
}

// 监听系统主题变化
export function watchSystemTheme(callback) {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      const currentMode = localStorage.getItem('creation-ring-theme');
      if (currentMode === 'auto') {
        const newTheme = e.matches ? 'dark' : 'light';
        applyTheme(newTheme);
        callback && callback(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    // 返回清理函数
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }

  return () => {}; // 空函数用于不支持的环境
}

// 初始化主题系统
export function initThemeSystem() {
  const currentTheme = getCurrentTheme();
  applyTheme(currentTheme);

  // 监听系统主题变化
  watchSystemTheme((newTheme) => {
    console.log(`System theme changed to: ${newTheme}`);
  });
}
