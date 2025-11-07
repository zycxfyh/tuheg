/**
 * LanguageSwitcher 组件测试
 * 测试语言切换功能和国际化支持
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import LanguageSwitcher from './LanguageSwitcher.vue';

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

describe('LanguageSwitcher', () => {
  let i18n;

  beforeEach(() => {
    // Setup i18n
    i18n = createI18n({
      legacy: false,
      locale: 'zh-CN',
      messages: {
        'zh-CN': {
          common: {
            language: '语言',
          },
        },
        'en-US': {
          common: {
            language: 'Language',
          },
        },
      },
    });

    // Reset localStorage mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('zh-CN');
  });

  it('应该正确渲染语言选择器', () => {
    const wrapper = mount(LanguageSwitcher, {
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.find('label').text()).toContain('语言');
    expect(wrapper.find('select').exists()).toBe(true);
  });

  it('应该显示所有支持的语言选项', () => {
    const wrapper = mount(LanguageSwitcher, {
      global: {
        plugins: [i18n],
      },
    });

    const options = wrapper.findAll('option');
    expect(options).toHaveLength(5);

    const expectedLanguages = [
      { value: 'zh-CN', text: '简体中文' },
      { value: 'en-US', text: 'English' },
      { value: 'zh-TW', text: '繁體中文' },
      { value: 'ja-JP', text: '日本語' },
      { value: 'ko-KR', text: '한국어' },
    ];

    expectedLanguages.forEach((lang, index) => {
      expect(options[index].attributes('value')).toBe(lang.value);
      expect(options[index].text()).toBe(lang.text);
    });
  });

  it('应该能够切换语言', async () => {
    const wrapper = mount(LanguageSwitcher, {
      global: {
        plugins: [i18n],
      },
    });

    const select = wrapper.find('select');
    await select.setValue('en-US');

    expect(localStorageMock.setItem).toHaveBeenCalledWith('locale', 'en-US');
    expect(i18n.global.locale.value).toBe('en-US');
  });

  it('应该从localStorage恢复语言设置', () => {
    localStorageMock.getItem.mockReturnValue('en-US');

    const wrapper = mount(LanguageSwitcher, {
      global: {
        plugins: [i18n],
      },
    });

    const select = wrapper.find('select');
    expect(select.element.value).toBe('en-US');
  });

  it('应该有正确的表单标签关联', () => {
    const wrapper = mount(LanguageSwitcher, {
      global: {
        plugins: [i18n],
      },
    });

    const label = wrapper.find('label');
    const select = wrapper.find('select');

    expect(label.attributes('for')).toBe(select.attributes('id'));
  });

  it('应该有正确的无障碍属性', () => {
    const wrapper = mount(LanguageSwitcher, {
      global: {
        plugins: [i18n],
      },
    });

    const select = wrapper.find('select');
    expect(select.attributes('id')).toBeDefined();
    expect(select.attributes('id')).toBe('language-select');
  });

  it('应该响应语言变化事件', async () => {
    const wrapper = mount(LanguageSwitcher, {
      global: {
        plugins: [i18n],
      },
    });

    // 手动触发change事件
    const select = wrapper.find('select');
    await select.setValue('ja-JP');

    // 验证change事件处理
    expect(localStorageMock.setItem).toHaveBeenCalledWith('locale', 'ja-JP');
  });

  it('应该正确处理不支持的语言', () => {
    localStorageMock.getItem.mockReturnValue('unsupported-lang');

    const wrapper = mount(LanguageSwitcher, {
      global: {
        plugins: [i18n],
      },
    });

    // 应该回退到默认语言
    expect(i18n.global.locale.value).toBe('zh-CN');
  });
});
