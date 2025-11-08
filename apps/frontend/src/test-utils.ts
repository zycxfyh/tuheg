// 文件路径: apps/frontend/src/test-utils.ts
// 核心理念: 用户中心的测试，优先使用可访问的查询方式

import { render, mount, type RenderOptions, VueWrapper } from '@vue/test-utils'

// Mock import.meta.env for Vitest
global.importMetaEnv = {
  VITE_API_BASE_URL: 'http://localhost:3000',
}

// Mock import.meta
if (!global.import) {
  global.import = { meta: { env: global.importMetaEnv } }
} else if (!global.import.meta) {
  global.import.meta = { env: global.importMetaEnv }
}
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { routes } from './router'
import type { Component } from 'vue'

/**
 * @interface TestUtilsOptions
 * @description 测试工具选项
 */
export interface TestUtilsOptions extends RenderOptions {
  /** 路由配置 */
  routes?: Array<{ path: string; component: Component }>
  /** 初始路由 */
  initialRoute?: string
  /** 是否创建 Pinia store */
  createStore?: boolean
  /** 初始语言 */
  initialLocale?: string
  /** 初始主题 */
  initialTheme?: string
  /** 认证状态 */
  mockAuth?: { loggedIn: boolean; user?: any }
}

/**
 * @function renderWithProviders
 * @description 使用 Testing Library 理念渲染组件
 * 提供路由、状态管理、国际化等完整上下文
 *
 * @example
 * ```typescript
 * const { getByRole, getByText } = renderWithProviders(MyComponent, {
 *   props: { title: 'Test' },
 *   initialRoute: '/',
 *   initialLocale: 'zh-CN',
 *   mockAuth: { loggedIn: true },
 * });
 *
 * expect(getByRole('heading')).toHaveTextContent('Test');
 * ```
 */
export function renderWithProviders(component: Component, options: TestUtilsOptions = {}) {
  const {
    routes: customRoutes = [],
    initialRoute = '/',
    createStore = true,
    initialLocale = 'zh-CN',
    initialTheme = 'auto',
    mockAuth,
    ...renderOptions
  } = options

  const finalRoutes = customRoutes.length > 0 ? customRoutes : routes

  // 创建 Pinia store（如果需要）
  if (createStore) {
    const pinia = createPinia()
    setActivePinia(pinia)
    renderOptions.global = {
      ...renderOptions.global,
      plugins: [...(renderOptions.global?.plugins ?? []), pinia],
    }
  }

  // 创建 i18n
  const i18n = createI18n({
    legacy: false,
    locale: initialLocale,
    messages: {
      'zh-CN': {
        common: {
          loading: '加载中...',
          error: '错误',
          retry: '重试',
          close: '关闭',
          light: '浅色',
          dark: '深色',
          auto: '自动',
          language: '语言',
        },
        game: {
          processingAction: 'AI正在处理你的行动',
        },
      },
      'en-US': {
        common: {
          loading: 'Loading...',
          error: 'Error',
          retry: 'Retry',
          close: 'Close',
          light: 'Light',
          dark: 'Dark',
          auto: 'Auto',
          language: 'Language',
        },
        game: {
          processingAction: 'AI is processing your action',
        },
      },
    },
  })

  renderOptions.global = {
    ...renderOptions.global,
    plugins: [...(renderOptions.global?.plugins ?? []), i18n],
  }

  // 创建路由（如果需要）
  if (finalRoutes.length > 0) {
    const router = createRouter({
      history: createWebHistory(),
      routes: finalRoutes,
    })
    router.push(initialRoute)
    renderOptions.global = {
      ...renderOptions.global,
      plugins: [...(renderOptions.global?.plugins ?? []), router],
    }
  }

  // 设置主题
  if (initialTheme !== 'auto') {
    document.documentElement.setAttribute('data-theme', initialTheme)
  }

  // 设置认证状态
  if (mockAuth) {
    renderOptions.global = {
      ...renderOptions.global,
      mocks: {
        ...renderOptions.global?.mocks,
        $authStore: {
          isLoggedIn: mockAuth.loggedIn,
          user: mockAuth.user || null,
        },
      },
    }
  }

  return render(component, renderOptions)
}

/**
 * @function mountWithProviders
 * @description 使用完整上下文挂载组件（用于交互测试）
 */
export function mountWithProviders(
  component: Component,
  options: TestUtilsOptions = {}
): VueWrapper {
  const {
    routes: customRoutes = [],
    initialRoute = '/',
    createStore = true,
    initialLocale = 'zh-CN',
    initialTheme = 'auto',
    mockAuth,
    ...mountOptions
  } = options

  const finalRoutes = customRoutes.length > 0 ? customRoutes : routes

  // 创建 Pinia store（如果需要）
  if (createStore) {
    const pinia = createPinia()
    setActivePinia(pinia)
    mountOptions.global = {
      ...mountOptions.global,
      plugins: [...(mountOptions.global?.plugins ?? []), pinia],
    }
  }

  // 创建 i18n
  const i18n = createI18n({
    legacy: false,
    locale: initialLocale,
    messages: {
      'zh-CN': {
        common: {
          loading: '加载中...',
          error: '错误',
          retry: '重试',
          close: '关闭',
          light: '浅色',
          dark: '深色',
          auto: '自动',
          language: '语言',
        },
        game: {
          processingAction: 'AI正在处理你的行动',
        },
      },
      'en-US': {
        common: {
          loading: 'Loading...',
          error: 'Error',
          retry: 'Retry',
          close: 'Close',
          light: 'Light',
          dark: 'Dark',
          auto: 'Auto',
          language: 'Language',
        },
        game: {
          processingAction: 'AI is processing your action',
        },
      },
    },
  })

  mountOptions.global = {
    ...mountOptions.global,
    plugins: [...(mountOptions.global?.plugins ?? []), i18n],
  }

  // 创建路由（如果需要）
  if (finalRoutes.length > 0) {
    const router = createRouter({
      history: createWebHistory(),
      routes: finalRoutes,
    })
    router.push(initialRoute)
    mountOptions.global = {
      ...mountOptions.global,
      plugins: [...(mountOptions.global?.plugins ?? []), router],
    }
  }

  // 设置主题
  if (initialTheme !== 'auto') {
    document.documentElement.setAttribute('data-theme', initialTheme)
  }

  // 设置认证状态
  if (mockAuth) {
    mountOptions.global = {
      ...mountOptions.global,
      mocks: {
        ...mountOptions.global?.mocks,
        $authStore: {
          isLoggedIn: mockAuth.loggedIn,
          user: mockAuth.user || null,
        },
      },
    }
  }

  return mount(component, mountOptions)
}

/**
 * @function waitFor
 * @description 等待异步操作完成
 * 遵循 Testing Library 的异步等待模式
 */
export async function waitFor(
  callback: () => void | Promise<void>,
  options: {
    timeout?: number
    interval?: number
  } = {}
): Promise<void> {
  const { timeout = 1000, interval = 50 } = options
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      await callback()
      return
    } catch (error) {
      if (Date.now() - startTime >= timeout) {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  }

  throw new Error(`waitFor timeout after ${timeout}ms`)
}

/**
 * @function findByRole
 * @description 通过角色查找元素（可访问性优先）
 */
export function findByRole(container: HTMLElement, role: string, options?: { name?: string }) {
  const elements = container.querySelectorAll(`[role="${role}"]`)

  if (options?.name) {
    return Array.from(elements).find((el) => el.textContent?.includes(options.name ?? ''))
  }

  return elements[0] ?? null
}

/**
 * @function findByLabelText
 * @description 通过标签文本查找元素
 */
export function findByLabelText(container: HTMLElement, text: string): HTMLElement | null {
  const labels = Array.from(container.querySelectorAll('label'))
  const label = labels.find((l) => l.textContent?.includes(text))

  if (label && label.htmlFor) {
    return container.querySelector(`#${label.htmlFor}`)
  }

  return label ?? null
}

/**
 * @function findByPlaceholderText
 * @description 通过占位符文本查找元素
 */
export function findByPlaceholderText(container: HTMLElement, text: string): HTMLElement | null {
  const inputs = Array.from(container.querySelectorAll<HTMLInputElement>('input, textarea'))
  return inputs.find((input) => input.placeholder?.includes(text)) ?? null
}

/**
 * @function findByTestId
 * @description 通过测试ID查找元素
 */
export function findByTestId(container: HTMLElement, testId: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${testId}"]`)
}

/**
 * @function simulateUserFlow
 * @description 模拟用户操作流程
 */
export async function simulateUserFlow(
  wrapper: VueWrapper,
  steps: Array<{
    action: 'click' | 'type' | 'submit'
    selector: string
    value?: string
    wait?: number
  }>
): Promise<void> {
  for (const step of steps) {
    if (step.wait) {
      await new Promise((resolve) => setTimeout(resolve, step.wait))
    }

    const element = wrapper.find(step.selector)
    if (!element.exists()) {
      throw new Error(`Element with selector "${step.selector}" not found`)
    }

    switch (step.action) {
      case 'click':
        await element.trigger('click')
        break
      case 'type':
        if (step.value !== undefined) {
          await element.setValue(step.value)
        }
        break
      case 'submit':
        await element.trigger('submit')
        break
    }

    await wrapper.vm.$nextTick()
  }
}

/**
 * @function mockApiResponse
 * @description 创建模拟API响应的辅助函数
 */
export function mockApiResponse(
  method: string,
  url: string,
  response: any,
  options: { status?: number; delay?: number } = {}
) {
  const { status = 200, delay = 0 } = options

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status,
        data: response,
        config: { method, url },
      })
    }, delay)
  })
}

/**
 * @function cleanupTestEnvironment
 * @description 清理测试环境
 */
export function cleanupTestEnvironment(): void {
  // 清理localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear()
  }

  // 重置document样式
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.cssText = ''
  }
}
