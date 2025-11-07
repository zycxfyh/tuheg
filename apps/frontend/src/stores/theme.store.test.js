/**
 * Theme Store 测试
 * 测试主题状态管理和切换逻辑
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useThemeStore } from './theme.store';

// Mock matchMedia
const matchMediaMock = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
});

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Theme Store', () => {
  let themeStore;

  beforeEach(() => {
    // Setup Pinia
    const pinia = createPinia();
    setActivePinia(pinia);

    // Reset mocks
    vi.clearAllMocks();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.cssText = '';

    // Reset matchMedia to light mode
    matchMediaMock.mockReturnValue({
      matches: false, // prefers-color-scheme: dark = false (light mode)
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    localStorageMock.getItem.mockReturnValue(null);

    themeStore = useThemeStore();
  });

  it('应该有默认的auto主题', () => {
    expect(themeStore.currentTheme).toBe('auto');
  });

  it('应该能够设置深色主题', () => {
    themeStore.setTheme('dark');

    expect(themeStore.currentTheme).toBe('dark');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('应该能够设置浅色主题', () => {
    themeStore.setTheme('light');

    expect(themeStore.currentTheme).toBe('light');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('应该能够设置自动主题', () => {
    themeStore.setTheme('auto');

    expect(themeStore.currentTheme).toBe('auto');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'auto');
  });

  it('auto主题应该根据系统偏好选择', () => {
    // 系统偏好为浅色
    matchMediaMock.mockReturnValue({
      ...matchMediaMock(),
      matches: false,
    });

    themeStore.setTheme('auto');

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('auto主题应该在深色系统偏好下选择深色', () => {
    // 系统偏好为深色
    matchMediaMock.mockReturnValue({
      ...matchMediaMock(),
      matches: true, // prefers-color-scheme: dark = true
    });

    themeStore.setTheme('auto');

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('应该从localStorage恢复主题设置', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    // 重新创建store来测试初始化
    const newStore = useThemeStore();
    expect(newStore.currentTheme).toBe('dark');
  });

  it('应该监听系统主题变化', () => {
    const mockMediaQuery = matchMediaMock();
    themeStore.setTheme('auto');

    // 模拟系统主题变化
    mockMediaQuery.matches = true; // 切换到深色
    mockMediaQuery.onchange?.();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggleTheme应该在深色和浅色之间切换', () => {
    themeStore.setTheme('dark');
    themeStore.toggleTheme();

    expect(themeStore.currentTheme).toBe('light');

    themeStore.toggleTheme();
    expect(themeStore.currentTheme).toBe('dark');
  });

  it('toggleTheme在auto模式下应该切换到light', () => {
    themeStore.setTheme('auto');
    themeStore.toggleTheme();

    expect(themeStore.currentTheme).toBe('light');
  });

  it('应该应用正确的CSS变量', () => {
    themeStore.setTheme('dark');

    expect(document.documentElement.style.getPropertyValue('--primary-bg')).toBe('#121212');
    expect(document.documentElement.style.getPropertyValue('--primary-text')).toBe('#e0e0e0');
  });

  it('应该在初始化时设置主题', () => {
    localStorageMock.getItem.mockReturnValue('light');

    themeStore.initTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('应该正确处理无效的主题值', () => {
    // 不应该抛出错误
    expect(() => themeStore.setTheme('invalid')).not.toThrow();
  });

  it('应该暴露系统偏好状态', () => {
    expect(themeStore.systemPrefersDark).toBeDefined();
    expect(typeof themeStore.systemPrefersDark).toBe('boolean');
  });
});
