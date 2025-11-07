/**
 * ErrorBoundary 组件测试
 * 测试错误捕获和恢复机制
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { createRouter, createWebHistory } from 'vue-router';
import ErrorBoundary from './ErrorBoundary.vue';

describe('ErrorBoundary', () => {
  let i18n;
  let router;

  beforeEach(() => {
    i18n = createI18n({
      legacy: false,
      locale: 'zh-CN',
      messages: {
        'zh-CN': {
          common: {
            error: '错误',
            retry: '重试',
            close: '关闭',
            unknownError: '发生了未知错误',
          },
        },
      },
    });

    router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
    });
  });

  it('应该正确渲染错误界面', () => {
    const wrapper = mount(ErrorBoundary, {
      props: {
        error: new Error('Test error'),
      },
      global: {
        plugins: [i18n, router],
      },
    });

    expect(wrapper.find('.error-boundary').exists()).toBe(true);
    expect(wrapper.find('.error-container').exists()).toBe(true);
    expect(wrapper.text()).toContain('错误');
  });

  it('应该显示错误消息', () => {
    const testError = new Error('Custom test error');

    const wrapper = mount(ErrorBoundary, {
      props: {
        error: testError,
      },
      global: {
        plugins: [i18n, router],
      },
    });

    expect(wrapper.text()).toContain('Custom test error');
  });

  it('应该显示默认错误消息当没有提供错误时', () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [i18n, router],
      },
    });

    expect(wrapper.text()).toContain('发生了未知错误');
  });

  it('应该有重试按钮', () => {
    const wrapper = mount(ErrorBoundary, {
      props: {
        error: new Error('Test error'),
      },
      global: {
        plugins: [i18n, router],
      },
    });

    const retryButton = wrapper.findAll('button').find((btn) => btn.text().includes('重试'));
    expect(retryButton).toBeDefined();
  });

  it('应该有返回首页按钮', () => {
    const wrapper = mount(ErrorBoundary, {
      props: {
        error: new Error('Test error'),
      },
      global: {
        plugins: [i18n, router],
      },
    });

    const closeButton = wrapper.findAll('button').find((btn) => btn.text().includes('关闭'));
    expect(closeButton).toBeDefined();
  });

  it('重试按钮应该触发页面刷新', () => {
    // Mock window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    const wrapper = mount(ErrorBoundary, {
      props: {
        error: new Error('Test error'),
      },
      global: {
        plugins: [i18n, router],
      },
    });

    const retryButton = wrapper.findAll('button').find((btn) => btn.text().includes('重试'));
    retryButton?.trigger('click');

    expect(reloadMock).toHaveBeenCalled();
  });

  it('关闭按钮应该导航到首页', () => {
    const pushSpy = vi.spyOn(router, 'push');

    const wrapper = mount(ErrorBoundary, {
      props: {
        error: new Error('Test error'),
      },
      global: {
        plugins: [i18n, router],
      },
    });

    const closeButton = wrapper.findAll('button').find((btn) => btn.text().includes('关闭'));
    closeButton?.trigger('click');

    expect(pushSpy).toHaveBeenCalledWith('/');
  });

  it('应该有适当的错误图标', () => {
    const wrapper = mount(ErrorBoundary, {
      props: {
        error: new Error('Test error'),
      },
      global: {
        plugins: [i18n, router],
      },
    });

    const icon = wrapper.find('.error-icon');
    expect(icon.exists()).toBe(true);
    expect(icon.text()).toContain('⚠️');
  });

  it('应该阻止用户交互', () => {
    const wrapper = mount(ErrorBoundary, {
      props: {
        error: new Error('Test error'),
      },
      global: {
        plugins: [i18n, router],
      },
    });

    const boundary = wrapper.find('.error-boundary');
    expect(boundary.attributes('style')).toContain('z-index: 9999');
  });

  it('应该有正确的动画效果', () => {
    const wrapper = mount(ErrorBoundary, {
      props: {
        error: new Error('Test error'),
      },
      global: {
        plugins: [i18n, router],
      },
    });

    expect(wrapper.html()).toContain('fadeIn');
    expect(wrapper.html()).toContain('slideIn');
  });

  it('应该支持错误详情显示', () => {
    const detailedError = new Error('Detailed error');
    detailedError.details = { code: 'VALIDATION_ERROR', field: 'email' };

    const wrapper = mount(ErrorBoundary, {
      props: {
        error: detailedError,
      },
      global: {
        plugins: [i18n, router],
      },
    });

    // 验证错误对象被正确处理
    expect(wrapper.vm.capturedError).toBe(detailedError);
  });
});
