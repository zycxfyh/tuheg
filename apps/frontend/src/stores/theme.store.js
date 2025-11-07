/**
 * 🎨 主题管理 Store
 * 管理应用的主题切换和配置
 */

import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import {
  THEMES,
  THEME_MODES,
  applyTheme,
  getCurrentTheme,
  watchSystemTheme,
} from '@/assets/themes.js';

export const useThemeStore = defineStore('theme', () => {
  // --- State ---
  const currentTheme = ref(getCurrentTheme());
  const availableThemes = ref(THEMES);
  const themeMode = ref(localStorage.getItem('creation-ring-theme-mode') || THEME_MODES.DARK);
  const systemThemeWatcher = ref(null);

  // --- Getters ---
  const getThemeName = (themeKey) => {
    return availableThemes.value[themeKey]?.name || '未知主题';
  };

  const getThemeIcon = (themeKey) => {
    return availableThemes.value[themeKey]?.icon || '🎨';
  };

  const isDarkTheme = () => {
    return currentTheme.value === 'dark';
  };

  const isLightTheme = () => {
    return currentTheme.value === 'light';
  };

  const isAutoTheme = () => {
    return themeMode.value === THEME_MODES.AUTO;
  };

  // --- Actions ---
  function setTheme(themeName) {
    if (!availableThemes.value[themeName]) {
      console.warn(`Theme "${themeName}" not found`);
      return;
    }

    currentTheme.value = themeName;
    themeMode.value = themeName; // 如果直接设置主题，则不是auto模式
    applyTheme(themeName);

    // 保存到本地存储
    localStorage.setItem('creation-ring-theme', themeName);
    localStorage.setItem('creation-ring-theme-mode', themeName);
  }

  function setThemeMode(mode) {
    themeMode.value = mode;
    localStorage.setItem('creation-ring-theme-mode', mode);

    if (mode === THEME_MODES.AUTO) {
      // 自动模式：根据系统主题设置
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      currentTheme.value = systemTheme;
      applyTheme(systemTheme);

      // 启动系统主题监听
      startSystemThemeWatcher();
    } else {
      // 直接模式：使用指定的主题
      currentTheme.value = mode;
      applyTheme(mode);

      // 停止系统主题监听
      stopSystemThemeWatcher();
    }
  }

  function toggleTheme() {
    const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }

  function startSystemThemeWatcher() {
    if (systemThemeWatcher.value) {
      stopSystemThemeWatcher();
    }

    systemThemeWatcher.value = watchSystemTheme((newTheme) => {
      if (themeMode.value === THEME_MODES.AUTO) {
        currentTheme.value = newTheme;
        applyTheme(newTheme);
      }
    });
  }

  function stopSystemThemeWatcher() {
    if (systemThemeWatcher.value) {
      systemThemeWatcher.value();
      systemThemeWatcher.value = null;
    }
  }

  // 初始化主题系统
  function initTheme() {
    // 根据保存的模式初始化
    if (themeMode.value === THEME_MODES.AUTO) {
      setThemeMode(THEME_MODES.AUTO);
    } else {
      setTheme(currentTheme.value);
    }
  }

  // 获取主题选项用于UI
  function getThemeOptions() {
    return Object.entries(availableThemes.value).map(([key, theme]) => ({
      value: key,
      label: theme.name,
      icon: theme.icon,
    }));
  }

  // 获取主题模式选项
  function getThemeModeOptions() {
    return [
      { value: THEME_MODES.LIGHT, label: '浅色主题', icon: '☀️' },
      { value: THEME_MODES.DARK, label: '深色主题', icon: '🌙' },
      { value: THEME_MODES.AUTO, label: '自动跟随系统', icon: '🔄' },
    ];
  }

  // --- 生命周期 ---
  // 监听主题变化
  watch(currentTheme, (newTheme) => {
    console.log(`Theme changed to: ${newTheme}`);
  });

  return {
    // State
    currentTheme,
    availableThemes,
    themeMode,

    // Getters
    getThemeName,
    getThemeIcon,
    isDarkTheme,
    isLightTheme,
    isAutoTheme,

    // Actions
    setTheme,
    setThemeMode,
    toggleTheme,
    initTheme,
    getThemeOptions,
    getThemeModeOptions,

    // Internal
    startSystemThemeWatcher,
    stopSystemThemeWatcher,
  };
});
