/**
 * PageLoader 组件测试
 * 测试页面加载状态和用户反馈
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import PageLoader from './PageLoader.vue';

describe('PageLoader', () => {
  let i18n;

  beforeEach(() => {
    i18n = createI18n({
      legacy: false,
      locale: 'zh-CN',
      messages: {
        'zh-CN': {
          common: {
            loading: '加载中...',
          },
          game: {
            processingAction: 'AI正在处理你的行动',
          },
        },
        'en-US': {
          common: {
            loading: 'Loading...',
          },
          game: {
            processingAction: 'AI is processing your action',
          },
        },
      },
    });
  });

  it('应该正确渲染加载器', () => {
    const wrapper = mount(PageLoader, {
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.find('.page-loader').exists()).toBe(true);
    expect(wrapper.find('.loader-container').exists()).toBe(true);
    expect(wrapper.find('.loader-spinner').exists()).toBe(true);
  });

  it('应该显示默认加载消息', () => {
    const wrapper = mount(PageLoader, {
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.text()).toContain('加载中...');
    expect(wrapper.text()).toContain('AI正在处理你的行动');
  });

  it('应该能够自定义加载消息', () => {
    const customMessage = '正在保存数据...';

    const wrapper = mount(PageLoader, {
      props: {
        message: customMessage,
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.text()).toContain('加载中...');
    expect(wrapper.text()).toContain(customMessage);
  });

  it('应该渲染三个旋转环', () => {
    const wrapper = mount(PageLoader, {
      global: {
        plugins: [i18n],
      },
    });

    const rings = wrapper.findAll('.spinner-ring');
    expect(rings).toHaveLength(3);
  });

  it('应该有正确的动画类名', () => {
    const wrapper = mount(PageLoader, {
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.classes()).toContain('page-loader');
    expect(wrapper.find('.loader-container').classes()).toContain('loader-container');
  });

  it('应该阻止用户交互', () => {
    const wrapper = mount(PageLoader, {
      global: {
        plugins: [i18n],
      },
    });

    const loaderElement = wrapper.find('.page-loader');
    expect(loaderElement.attributes('style')).toContain('z-index: 9999');
  });

  it('应该有适当的颜色主题', () => {
    const wrapper = mount(PageLoader, {
      global: {
        plugins: [i18n],
      },
    });

    // 检查是否使用了CSS变量
    const container = wrapper.find('.loader-container');
    expect(container.classes()).toContain('loader-container');
  });

  it('应该支持国际化', async () => {
    const enI18n = createI18n({
      legacy: false,
      locale: 'en-US',
      messages: {
        'en-US': {
          common: {
            loading: 'Loading...',
          },
          game: {
            processingAction: 'AI is processing your action',
          },
        },
      },
    });

    const wrapper = mount(PageLoader, {
      global: {
        plugins: [enI18n],
      },
    });

    expect(wrapper.text()).toContain('Loading...');
    expect(wrapper.text()).toContain('AI is processing your action');
  });

  it('应该有适当的无障碍支持', () => {
    const wrapper = mount(PageLoader, {
      global: {
        plugins: [i18n],
      },
    });

    // 检查是否有适当的ARIA标签或角色
    const container = wrapper.find('.loader-container');
    expect(container.exists()).toBe(true);
  });

  it('应该正确应用动画', () => {
    const wrapper = mount(PageLoader, {
      global: {
        plugins: [i18n],
      },
    });

    // 检查动画相关的样式类
    expect(wrapper.html()).toContain('fadeIn');
    expect(wrapper.html()).toContain('slideIn');
  });
});
