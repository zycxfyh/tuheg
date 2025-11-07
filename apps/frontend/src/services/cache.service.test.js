/**
 * Cache Service 测试
 * 测试多层缓存策略和API响应缓存
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getCache,
  setCache,
  deleteCache,
  clearCache,
  cacheApiResponse,
  getApiResponse,
  cacheComponentRender,
  getComponentRender,
  getCacheStats,
} from './cache.service';

describe('Cache Service', () => {
  beforeEach(() => {
    // Clear all caches before each test
    clearCache('all');

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    // Reset localStorage data
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => true);
    localStorageMock.removeItem.mockImplementation(() => true);
    localStorageMock.clear.mockImplementation(() => true);

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    clearCache('all');
  });

  describe('基本缓存操作', () => {
    it('应该能够设置和获取缓存', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      setCache(key, value);
      const cached = getCache(key);

      expect(cached).toEqual(value);
    });

    it('应该返回null当缓存不存在时', () => {
      const result = getCache('non-existent-key');
      expect(result).toBeNull();
    });

    it('应该能够删除缓存', () => {
      const key = 'test-key';
      const value = 'test-value';

      setCache(key, value);
      expect(getCache(key)).toEqual(value);

      deleteCache(key);
      expect(getCache(key)).toBeNull();
    });

    it('应该支持TTL过期', async () => {
      vi.useFakeTimers();

      const key = 'ttl-test';
      const value = 'expires-soon';

      setCache(key, value, { ttl: 1000 }); // 1秒TTL

      expect(getCache(key)).toEqual(value);

      // 快进1秒
      vi.advanceTimersByTime(1000);

      expect(getCache(key)).toBeNull();

      vi.useRealTimers();
    });

    it('应该支持持久化缓存', () => {
      const key = 'persistent-key';
      const value = 'persistent-value';

      setCache(key, value, { persist: true });

      // 模拟从localStorage恢复
      const localStorageMock = window.localStorage;
      const storedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);

      expect(storedData.value).toEqual(value);
      expect(storedData.expiry).toBeDefined();
    });
  });

  describe('API响应缓存', () => {
    it('应该缓存API响应', () => {
      const url = 'https://api.example.com/users';
      const response = { users: [{ id: 1, name: 'John' }] };

      cacheApiResponse(url, response);

      const cached = getApiResponse(url);
      expect(cached).toEqual(response);
    });

    it('应该返回null当API缓存不存在时', () => {
      const cached = getApiResponse('https://api.example.com/non-existent');
      expect(cached).toBeNull();
    });

    it('应该支持API缓存TTL', async () => {
      vi.useFakeTimers();

      const url = 'https://api.example.com/temp-data';
      const response = { temp: 'data' };

      cacheApiResponse(url, response, { ttl: 5000 }); // 5秒TTL

      expect(getApiResponse(url)).toEqual(response);

      // 快进5秒
      vi.advanceTimersByTime(5000);

      expect(getApiResponse(url)).toBeNull();

      vi.useRealTimers();
    });

    it('应该处理URL编码', () => {
      const url = 'https://api.example.com/users?page=1&limit=10';
      const response = { users: [], pagination: { page: 1, limit: 10 } };

      cacheApiResponse(url, response);

      const cached = getApiResponse(url);
      expect(cached).toEqual(response);
    });
  });

  describe('组件渲染缓存', () => {
    it('应该缓存组件渲染结果', () => {
      const componentName = 'UserProfile';
      const props = { userId: 123, showAvatar: true };
      const renderResult = '<div>Rendered User</div>';

      cacheComponentRender(componentName, props, renderResult);

      const cached = getComponentRender(componentName, props);
      expect(cached).toEqual(renderResult);
    });

    it('应该区分不同的props', () => {
      const componentName = 'UserProfile';

      const props1 = { userId: 123 };
      const props2 = { userId: 456 };
      const render1 = '<div>User 123</div>';
      const render2 = '<div>User 456</div>';

      cacheComponentRender(componentName, props1, render1);
      cacheComponentRender(componentName, props2, render2);

      expect(getComponentRender(componentName, props1)).toEqual(render1);
      expect(getComponentRender(componentName, props2)).toEqual(render2);
    });

    it('应该只在内存中缓存组件渲染结果', () => {
      const componentName = 'TestComponent';
      const props = { test: true };
      const renderResult = '<div>Test</div>';

      cacheComponentRender(componentName, props, renderResult);

      // 检查localStorage没有被调用
      const localStorageMock = window.localStorage;
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('缓存层管理', () => {
    it('应该支持只清除内存缓存', () => {
      setCache('memory-only', 'value1');
      setCache('persistent', 'value2', { persist: true });

      clearCache('memory');

      expect(getCache('memory-only')).toBeNull();
      // persistent缓存应该还在localStorage中
    });

    it('应该支持只清除持久化缓存', () => {
      setCache('memory-only', 'value1');
      setCache('persistent', 'value2', { persist: true });

      clearCache('storage');

      expect(getCache('memory-only')).toEqual('value1');
      expect(getCache('persistent')).toBeNull(); // 从localStorage清除
    });

    it('应该支持清除所有缓存', () => {
      setCache('key1', 'value1');
      setCache('key2', 'value2', { persist: true });

      clearCache('all');

      expect(getCache('key1')).toBeNull();
      expect(getCache('key2')).toBeNull();
    });
  });

  describe('缓存统计', () => {
    it('应该提供缓存统计信息', () => {
      setCache('key1', 'value1');
      setCache('key2', 'value2');
      setCache('persistent', 'value3', { persist: true });

      const stats = getCacheStats();

      expect(stats).toHaveProperty('memory');
      expect(stats).toHaveProperty('storage');
      expect(stats.memory.size).toBeGreaterThanOrEqual(2); // 至少2个内存缓存
      expect(stats.storage.estimatedSize).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该处理localStorage不可用的情况', () => {
      // Mock localStorage to throw error
      const localStorageMock = window.localStorage;
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // 应该不抛出错误，继续工作
      expect(() => setCache('test', 'value', { persist: true })).not.toThrow();
    });

    it('应该处理损坏的localStorage数据', () => {
      const localStorageMock = window.localStorage;
      localStorageMock.getItem.mockReturnValue('invalid-json');

      // 应该不抛出错误，返回null
      expect(() => getCache('corrupted')).not.toThrow();
      expect(getCache('corrupted')).toBeNull();
    });
  });

  describe('缓存优先级', () => {
    it('应该优先返回内存缓存', () => {
      const key = 'priority-test';

      // 先设置内存缓存
      setCache(key, 'memory-value', { persist: false });

      // 再设置持久化缓存
      setCache(key, 'storage-value', { persist: true });

      // 应该返回内存缓存的值
      expect(getCache(key)).toEqual('memory-value');
    });

    it('应该在内存缓存失效时返回持久化缓存', () => {
      vi.useFakeTimers();

      const key = 'fallback-test';

      // 设置短暂的内存缓存
      setCache(key, 'memory-value', { ttl: 1000, persist: false });

      // 设置持久化缓存
      setCache(key, 'storage-value', { persist: true });

      // 内存缓存过期
      vi.advanceTimersByTime(1000);

      // 应该返回持久化缓存的值
      expect(getCache(key)).toEqual('storage-value');

      vi.useRealTimers();
    });
  });
});
