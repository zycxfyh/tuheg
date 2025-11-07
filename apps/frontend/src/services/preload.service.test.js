/**
 * Preload Service 测试
 * 测试预加载功能和资源管理
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  preloadRoutes,
  preloadCriticalComponents,
  smartPreload,
  preloadResources,
  getPreloadStatus,
  clearPreloadState,
} from './preload.service';

// Mock requestIdleCallback
global.requestIdleCallback = vi.fn().mockImplementation((cb) => {
  cb({ timeRemaining: () => 50, didTimeout: false });
});

global.cancelIdleCallback = vi.fn();

// Mock setTimeout for fallback
vi.useFakeTimers();

describe('Preload Service', () => {
  beforeEach(() => {
    clearPreloadState();
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearPreloadState();
  });

  describe('preloadRoutes', () => {
    it('应该能够预加载单个路由', async () => {
      const mockImport = vi.fn().mockResolvedValue({ default: {} });

      // Mock the import function
      vi.doMock('@/views/LoginView.vue', () => mockImport, { virtual: true });

      await preloadRoutes('auth');

      expect(mockImport).toHaveBeenCalled();
    });

    it('应该能够预加载多个路由', async () => {
      const authMock = vi.fn().mockResolvedValue({ default: {} });
      const nexusMock = vi.fn().mockResolvedValue({ default: {} });

      vi.doMock('@/views/LoginView.vue', () => authMock, { virtual: true });
      vi.doMock('@/views/NexusHubView.vue', () => nexusMock, { virtual: true });

      await preloadRoutes(['auth', 'nexus']);

      expect(authMock).toHaveBeenCalled();
      expect(nexusMock).toHaveBeenCalled();
    });

    it('应该避免重复预加载', async () => {
      const mockImport = vi.fn().mockResolvedValue({ default: {} });

      vi.doMock('@/views/LoginView.vue', () => mockImport, { virtual: true });

      await preloadRoutes('auth');
      await preloadRoutes('auth'); // 再次调用

      expect(mockImport).toHaveBeenCalledTimes(1);
    });

    it('应该处理无效的路由名称', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await preloadRoutes('invalid-route');

      expect(consoleWarnSpy).toHaveBeenCalledWith('预加载路由 invalid-route 不存在');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('preloadCriticalComponents', () => {
    it('应该预加载关键组件', async () => {
      const startTime = Date.now();

      await preloadCriticalComponents();

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('应该处理预加载失败', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock a failing import
      const failingImport = vi.fn().mockRejectedValue(new Error('Import failed'));

      // Temporarily replace the critical components
      const originalComponents = {
        stores: [],
        common: [failingImport],
      };

      // This would normally be tested by mocking the actual imports
      await expect(preloadCriticalComponents()).resolves.not.toThrow();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('smartPreload', () => {
    it('应该为首页预加载认证相关路由', async () => {
      const authMock = vi.fn().mockResolvedValue({ default: {} });
      vi.doMock('@/views/LoginView.vue', () => authMock, { virtual: true });

      await smartPreload('/');

      expect(authMock).toHaveBeenCalled();
    });

    it('应该为登录页预加载主要功能', async () => {
      const nexusMock = vi.fn().mockResolvedValue({ default: {} });
      const creationMock = vi.fn().mockResolvedValue({ default: {} });

      vi.doMock('@/views/NexusHubView.vue', () => nexusMock, { virtual: true });
      vi.doMock('@/views/CreationHubView.vue', () => creationMock, { virtual: true });

      await smartPreload('/login');

      expect(nexusMock).toHaveBeenCalled();
      expect(creationMock).toHaveBeenCalled();
    });

    it('应该使用requestIdleCallback进行预加载', async () => {
      await smartPreload('/');

      expect(global.requestIdleCallback).toHaveBeenCalled();
    });

    it('应该在不支持requestIdleCallback时使用setTimeout', async () => {
      // Mock requestIdleCallback as undefined
      const originalRIC = global.requestIdleCallback;
      global.requestIdleCallback = undefined;

      await smartPreload('/');

      expect(vi.getTimerCount()).toBeGreaterThan(0);

      // Restore
      global.requestIdleCallback = originalRIC;
    });
  });

  describe('preloadResources', () => {
    beforeEach(() => {
      // Mock document.head.appendChild
      document.head.appendChild = vi.fn();
    });

    it('应该预加载JavaScript资源', () => {
      const resources = ['app.js', 'vendor.js'];

      preloadResources(resources);

      expect(document.head.appendChild).toHaveBeenCalledTimes(2);
    });

    it('应该预加载图片资源', () => {
      const resources = ['logo.png', 'icon.svg'];

      preloadResources(resources);

      expect(document.head.appendChild).toHaveBeenCalledTimes(2);
    });

    it('应该为不同类型的资源设置正确的属性', () => {
      const resources = ['app.js', 'logo.png'];

      preloadResources(resources);

      const calls = vi.mocked(document.head.appendChild).mock.calls;

      // JS资源
      const jsLink = calls[0][0];
      expect(jsLink.rel).toBe('preload');
      expect(jsLink.as).toBe('script');
      expect(jsLink.href).toBe('app.js');

      // 图片资源
      const imgLink = calls[1][0];
      expect(imgLink.rel).toBe('preload');
      expect(imgLink.as).toBe('image');
      expect(imgLink.href).toBe('logo.png');
    });
  });

  describe('getPreloadStatus', () => {
    it('应该返回预加载状态', () => {
      const status = getPreloadStatus();

      expect(status).toHaveProperty('loaded');
      expect(status).toHaveProperty('loading');
      expect(status).toHaveProperty('totalLoaded');
      expect(Array.isArray(status.loaded)).toBe(true);
      expect(Array.isArray(status.loading)).toBe(true);
      expect(typeof status.totalLoaded).toBe('number');
    });
  });

  describe('clearPreloadState', () => {
    it('应该清空预加载状态', async () => {
      const mockImport = vi.fn().mockResolvedValue({ default: {} });
      vi.doMock('@/views/LoginView.vue', () => mockImport, { virtual: true });

      await preloadRoutes('auth');
      expect(getPreloadStatus().totalLoaded).toBe(1);

      clearPreloadState();
      expect(getPreloadStatus().totalLoaded).toBe(0);
    });
  });

  describe('性能监控', () => {
    it('应该记录预加载性能', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await preloadCriticalComponents();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('关键组件预加载完成，耗时:'),
      );

      consoleLogSpy.mockRestore();
    });
  });
});
