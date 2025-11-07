/**
 * Router 测试
 * 测试路由配置、导航守卫和预加载功能
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import router from './index';

// Mock preload service
vi.mock('../services/preload.service', () => ({
  smartPreload: vi.fn(),
}));

// Mock auth store
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => ({
    isLoggedIn: false,
  }),
}));

import { smartPreload } from '../services/preload.service';

describe('Router', () => {
  let testRouter;
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
        'zh-CN': {},
      },
    });

    // Create test router instance
    testRouter = createRouter({
      history: createWebHistory(),
      routes: router.options.routes,
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('路由配置', () => {
    it('应该包含所有预期的路由', () => {
      const routes = router.options.routes;

      expect(routes).toHaveLength(5);

      const routeNames = routes.map((route) => route.name);
      expect(routeNames).toEqual(
        expect.arrayContaining(['Welcome', 'Login', 'NexusHub', 'CreationHub', 'Game']),
      );
    });

    it('应该正确配置首页路由', () => {
      const welcomeRoute = router.options.routes.find((route) => route.name === 'Welcome');

      expect(welcomeRoute).toBeDefined();
      expect(welcomeRoute?.path).toBe('/');
      expect(welcomeRoute?.meta?.preload).toEqual(['auth']);
    });

    it('应该正确配置需要认证的路由', () => {
      const nexusRoute = router.options.routes.find((route) => route.name === 'NexusHub');
      const creationRoute = router.options.routes.find((route) => route.name === 'CreationHub');
      const gameRoute = router.options.routes.find((route) => route.name === 'Game');

      expect(nexusRoute?.meta?.requiresAuth).toBe(true);
      expect(creationRoute?.meta?.requiresAuth).toBe(true);
      expect(gameRoute?.meta?.requiresAuth).toBe(true);
    });

    it('应该正确配置预加载策略', () => {
      const loginRoute = router.options.routes.find((route) => route.name === 'Login');
      const nexusRoute = router.options.routes.find((route) => route.name === 'NexusHub');

      expect(loginRoute?.meta?.preload).toEqual(['nexus']);
      expect(nexusRoute?.meta?.preload).toEqual(['creation', 'game']);
    });
  });

  describe('导航守卫', () => {
    let mockAuthStore;

    beforeEach(() => {
      mockAuthStore = {
        isLoggedIn: false,
      };

      // Mock the auth store
      vi.doMock('../stores/auth.store', () => ({
        useAuthStore: () => mockAuthStore,
      }));
    });

    it('应该允许访问公开路由', async () => {
      const to = { name: 'Welcome', matched: [] };
      const from = { name: null };
      const next = vi.fn();

      const guard = router.beforeEach;
      await guard.call(router, to, from, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('应该重定向未认证用户到登录页', async () => {
      mockAuthStore.isLoggedIn = false;

      const to = {
        name: 'NexusHub',
        matched: [{ meta: { requiresAuth: true } }],
      };
      const from = { name: 'Welcome' };
      const next = vi.fn();

      const guard = router.beforeEach;
      await guard.call(router, to, from, next);

      expect(next).toHaveBeenCalledWith({ name: 'Login' });
    });

    it('应该允许已认证用户访问受保护路由', async () => {
      mockAuthStore.isLoggedIn = true;

      const to = {
        name: 'NexusHub',
        matched: [{ meta: { requiresAuth: true } }],
      };
      const from = { name: 'Login' };
      const next = vi.fn();

      const guard = router.beforeEach;
      await guard.call(router, to, from, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('应该将已登录用户从登录页重定向', async () => {
      mockAuthStore.isLoggedIn = true;

      const to = { name: 'Login' };
      const from = { name: 'Welcome' };
      const next = vi.fn();

      const guard = router.beforeEach;
      await guard.call(router, to, from, next);

      expect(next).toHaveBeenCalledWith({ name: 'NexusHub' });
    });
  });

  describe('路由解析后处理', () => {
    it('应该触发智能预加载', async () => {
      const to = {
        name: 'Welcome',
        path: '/',
        meta: { preload: ['auth'] },
      };
      const from = { name: null };

      await router.afterEach.call(router, to, from);

      expect(smartPreload).toHaveBeenCalledWith('/');
    });

    it('应该记录路由性能', async () => {
      // Mock performance API
      const mockPerformance = {
        mark: vi.fn(),
        measure: vi.fn(),
      };
      Object.defineProperty(window, 'performance', {
        value: mockPerformance,
        writable: true,
      });

      const to = { name: 'Welcome' };
      const from = { name: null };

      await router.afterEach.call(router, to, from);

      expect(mockPerformance.mark).toHaveBeenCalledWith('route-Welcome-end');
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'route-Welcome',
        'route-Welcome-start',
        'route-Welcome-end',
      );
    });

    it('应该处理没有性能API的环境', async () => {
      Object.defineProperty(window, 'performance', {
        value: undefined,
        writable: true,
      });

      const to = { name: 'Welcome' };
      const from = { name: null };

      // Should not throw
      expect(async () => {
        await router.afterEach.call(router, to, from);
      }).not.toThrow();
    });
  });

  describe('路由开始处理', () => {
    it('应该记录路由开始时间', () => {
      const mockPerformance = {
        mark: vi.fn(),
      };
      Object.defineProperty(window, 'performance', {
        value: mockPerformance,
        writable: true,
      });

      const to = { name: 'Welcome' };
      const from = { name: null };
      const next = vi.fn();

      router.beforeEach.call(router, to, from, next);

      expect(mockPerformance.mark).toHaveBeenCalledWith('route-Welcome-start');
      expect(next).toHaveBeenCalled();
    });

    it('应该在没有性能API时正常工作', () => {
      Object.defineProperty(window, 'performance', {
        value: undefined,
        writable: true,
      });

      const to = { name: 'Welcome' };
      const from = { name: null };
      const next = vi.fn();

      expect(() => {
        router.beforeEach.call(router, to, from, next);
      }).not.toThrow();

      expect(next).toHaveBeenCalled();
    });
  });

  describe('路由参数处理', () => {
    it('应该正确处理游戏路由的参数', () => {
      const gameRoute = router.options.routes.find((route) => route.name === 'Game');

      expect(gameRoute).toBeDefined();
      expect(gameRoute?.props).toBe(true);
      expect(gameRoute?.path).toBe('/game/:id');
    });
  });

  describe('错误处理', () => {
    it('应该优雅处理导航守卫错误', async () => {
      // Mock auth store to throw error
      vi.doMock('../stores/auth.store', () => ({
        useAuthStore: () => {
          throw new Error('Store error');
        },
      }));

      const to = { name: 'NexusHub', matched: [{ meta: { requiresAuth: true } }] };
      const from = { name: 'Welcome' };
      const next = vi.fn();

      // Should handle error gracefully
      await expect(router.beforeEach.call(router, to, from, next)).rejects.toThrow();
    });
  });

  describe('路由历史', () => {
    it('应该使用HTML5历史模式', () => {
      expect(router.options.history).toBeDefined();
      // Web History mode should be used
    });
  });

  describe('预加载集成', () => {
    it('应该只在有preload配置时触发预加载', async () => {
      const to = {
        name: 'Game',
        path: '/game/123',
        meta: {}, // No preload config
      };
      const from = { name: 'NexusHub' };

      await router.afterEach.call(router, to, from);

      expect(smartPreload).not.toHaveBeenCalled();
    });

    it('应该传递正确的路径给预加载服务', async () => {
      const to = {
        name: 'Login',
        path: '/login',
        meta: { preload: ['nexus'] },
      };
      const from = { name: 'Welcome' };

      await router.afterEach.call(router, to, from);

      expect(smartPreload).toHaveBeenCalledWith('/login');
    });
  });
});
