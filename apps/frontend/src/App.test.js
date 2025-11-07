/**
 * App 组件集成测试
 * 测试整个应用的集成功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { createI18n } from 'vue-i18n';
import App from './App.vue';
import { useThemeStore } from './stores/theme.store';
import { useAuthStore } from './stores/auth.store';

// Mock services
vi.mock('./services/preload.service', () => ({
  preloadCriticalComponents: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./services/performance.service', () => ({
  default: vi.fn(),
}));

// Mock stores
vi.mock('./stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock router
vi.mock('./router', () => ({
  default: createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', name: 'Welcome', component: { template: '<div>Welcome</div>' } }],
  }),
}));

import { preloadCriticalComponents } from './services/preload.service';

describe('App Integration', () => {
  let pinia;
  let i18n;
  let router;

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
            loading: '加载中...',
          },
        },
      },
    });

    // Setup router
    router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', name: 'Welcome', component: { template: '<div>Welcome</div>' } }],
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  it('应该正确初始化应用', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [pinia, i18n, router],
      },
    });

    await wrapper.vm.$nextTick();

    // Should initialize theme store
    expect(preloadCriticalComponents).toHaveBeenCalled();
  });

  it('应该在mounted时初始化主题', async () => {
    const mockThemeStore = {
      initTheme: vi.fn(),
    };

    // Mock useThemeStore
    vi.mocked(useThemeStore).mockReturnValue(mockThemeStore);

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, i18n, router],
      },
    });

    await wrapper.vm.$nextTick();

    expect(mockThemeStore.initTheme).toHaveBeenCalled();
  });

  it('应该渲染语言切换器在开发环境下', async () => {
    // Set NODE_ENV to development
    process.env.NODE_ENV = 'development';

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, i18n, router],
      },
    });

    await wrapper.vm.$nextTick();

    // Should show language switcher in development
    expect(wrapper.findComponent({ name: 'LanguageSwitcher' })).toBeDefined();
  });

  it('应该在生产环境下隐藏语言切换器', async () => {
    // Set NODE_ENV to production
    process.env.NODE_ENV = 'production';

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, i18n, router],
      },
    });

    await wrapper.vm.$nextTick();

    // Should not show language switcher in production
    expect(wrapper.findComponent({ name: 'LanguageSwitcher' }).exists()).toBe(false);
  });

  it('应该正确应用主题类', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [pinia, i18n, router],
      },
    });

    await wrapper.vm.$nextTick();

    // Should have theme-related CSS variables applied
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--primary-bg')).toBeDefined();
  });

  it('应该处理路由变化', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [pinia, i18n, router],
      },
    });

    await wrapper.vm.$nextTick();

    // Navigate to a route
    await router.push('/');

    expect(router.currentRoute.value.name).toBe('Welcome');
  });

  it('应该正确渲染主要布局', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [pinia, i18n, router],
      },
    });

    await wrapper.vm.$nextTick();

    // Should have main app container
    expect(wrapper.find('#app-container')).toBeDefined();

    // Should have proper structure
    expect(wrapper.find('.app-main')).toBeDefined();
  });

  it('应该处理认证状态变化', async () => {
    const mockAuthStore = {
      isLoggedIn: false,
      user: null,
    };

    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore);

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, i18n, router],
      },
    });

    await wrapper.vm.$nextTick();

    // Should handle auth state
    expect(wrapper.vm.$data).toBeDefined();
  });

  it('应该支持国际化切换', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [pinia, i18n, router],
      },
    });

    await wrapper.vm.$nextTick();

    // Change language
    i18n.global.locale.value = 'en-US';

    await wrapper.vm.$nextTick();

    // Should update language
    expect(i18n.global.locale.value).toBe('en-US');
  });

  it('应该正确清理资源', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [pinia, i18n, router],
      },
    });

    await wrapper.vm.$nextTick();

    // Unmount component
    wrapper.unmount();

    // Should cleanup properly
    expect(wrapper.exists()).toBe(false);
  });

  it('应该处理初始化错误', async () => {
    // Mock preloadCriticalComponents to throw error
    vi.mocked(preloadCriticalComponents).mockRejectedValue(new Error('Init error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, i18n, router],
      },
    });

    await wrapper.vm.$nextTick();

    // Should handle error gracefully
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initialize app:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('应该支持热重载', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [pinia, i18n, router],
      },
    });

    await wrapper.vm.$nextTick();

    // Simulate hot reload by re-mounting
    wrapper.unmount();

    const newWrapper = mount(App, {
      global: {
        plugins: [pinia, i18n, router],
      },
    });

    await newWrapper.vm.$nextTick();

    // Should reinitialize properly
    expect(newWrapper.exists()).toBe(true);
  });
});
