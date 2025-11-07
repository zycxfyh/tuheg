/**
 * ThemeSwitcher 组件测试
 * 测试主题切换功能和用户交互
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import ThemeSwitcher from './ThemeSwitcher.vue';
import { useThemeStore } from '@/stores/theme.store';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ThemeSwitcher', () => {
  let pinia;
  let i18n;

  beforeEach(() => {
    // Setup Pinia
    pinia = createPinia();
    setActivePinia(pinia);

    // Setup i18n
    i18n = createI18n({
      legacy: false,
      locale: 'zh-CN',
      messages: {
        'zh-CN': {
          common: {
            light: '浅色',
            dark: '深色',
            auto: '自动',
          },
        },
      },
    });

    // Reset localStorage mocks
    vi.clearAllMocks();
  });

  it('应该正确渲染主题切换按钮', () => {
    const wrapper = mount(ThemeSwitcher, {
      global: {
        plugins: [pinia, i18n],
      },
    });

    expect(wrapper.findAll('button')).toHaveLength(3);
    expect(wrapper.text()).toContain('浅色');
    expect(wrapper.text()).toContain('深色');
    expect(wrapper.text()).toContain('自动');
  });

  it('应该能够切换到浅色主题', async () => {
    const themeStore = useThemeStore();

    const wrapper = mount(ThemeSwitcher, {
      global: {
        plugins: [pinia, i18n],
      },
    });

    const lightButton = wrapper.findAll('button')[0]; // 浅色按钮
    await lightButton.trigger('click');

    expect(themeStore.setTheme).toHaveBeenCalledWith('light');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  it('应该能够切换到深色主题', async () => {
    const themeStore = useThemeStore();

    const wrapper = mount(ThemeSwitcher, {
      global: {
        plugins: [pinia, i18n],
      },
    });

    const darkButton = wrapper.findAll('button')[1]; // 深色按钮
    await darkButton.trigger('click');

    expect(themeStore.setTheme).toHaveBeenCalledWith('dark');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('应该能够切换到自动主题', async () => {
    const themeStore = useThemeStore();

    const wrapper = mount(ThemeSwitcher, {
      global: {
        plugins: [pinia, i18n],
      },
    });

    const autoButton = wrapper.findAll('button')[2]; // 自动按钮
    await autoButton.trigger('click');

    expect(themeStore.setTheme).toHaveBeenCalledWith('auto');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'auto');
  });

  it('应该显示当前激活的主题', async () => {
    const themeStore = useThemeStore();
    themeStore.currentTheme = 'dark';

    const wrapper = mount(ThemeSwitcher, {
      global: {
        plugins: [pinia, i18n],
      },
    });

    const darkButton = wrapper.findAll('button')[1];
    expect(darkButton.classes()).toContain('active');
  });

  it('应该有正确的无障碍属性', () => {
    const wrapper = mount(ThemeSwitcher, {
      global: {
        plugins: [pinia, i18n],
      },
    });

    const buttons = wrapper.findAll('button');
    buttons.forEach((button) => {
      expect(button.attributes('type')).toBe('button');
    });
  });

  it('应该响应主题变化', async () => {
    const themeStore = useThemeStore();

    const wrapper = mount(ThemeSwitcher, {
      global: {
        plugins: [pinia, i18n],
      },
    });

    // 模拟主题变化
    themeStore.currentTheme = 'light';
    await wrapper.vm.$nextTick();

    const lightButton = wrapper.findAll('button')[0];
    expect(lightButton.classes()).toContain('active');
  });
});
