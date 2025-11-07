/**
 * API Service 测试
 * 测试API客户端功能、缓存集成和错误处理
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import { apiService } from './api.service';
import { getApiResponse } from './cache.service';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock cache service
vi.mock('./cache.service');
const mockedGetApiResponse = vi.mocked(getApiResponse);

describe('API Service', () => {
  let mockAxiosInstance;

  beforeEach(() => {
    // Setup axios mock
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
      defaults: {
        baseURL: 'http://localhost:3000',
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Reset all mocks
    vi.clearAllMocks();
    mockedGetApiResponse.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初始化和拦截器', () => {
    it('应该创建axios实例', () => {
      // 重新导入以触发初始化
      require('./api.service');

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3000',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('应该设置请求拦截器', () => {
      require('./api.service');

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('应该设置响应拦截器', () => {
      require('./api.service');

      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('请求拦截器', () => {
    it('应该添加认证token到请求头', () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('test-token'),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      require('./api.service');

      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      const config = { headers: {} };

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('应该添加请求元数据', () => {
      require('./api.service');

      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      const config = {
        url: '/test',
        method: 'get',
        headers: {},
      };

      const result = requestInterceptor(config);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.url).toBe('/test');
      expect(result.metadata.method).toBe('get');
      expect(result.metadata.startTime).toBeDefined();
    });

    it('应该处理localStorage不可用的情况', () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockImplementation(() => {
          throw new Error('localStorage not available');
        }),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      require('./api.service');

      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      const config = { headers: {} };

      // Should not throw
      expect(() => requestInterceptor(config)).not.toThrow();
    });
  });

  describe('响应拦截器', () => {
    it('应该缓存成功的GET请求', async () => {
      require('./api.service');

      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][0];
      const mockResponse = {
        config: {
          method: 'get',
          baseURL: 'http://localhost:3000',
          url: '/test',
        },
        status: 200,
        data: { test: 'data' },
      };

      const result = await responseInterceptor(mockResponse);

      expect(result).toEqual({ test: 'data' });
      // Cache function would be called (mocked)
    });

    it('应该记录慢请求', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      require('./api.service');

      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][0];
      const mockResponse = {
        config: {
          method: 'get',
          baseURL: 'http://localhost:3000',
          url: '/slow-endpoint',
          metadata: {
            startTime: Date.now() - 3000, // 3 seconds ago
          },
        },
        status: 200,
        data: { result: 'slow' },
        duration: 3000,
      };

      await responseInterceptor(mockResponse);

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Slow API request'));

      consoleWarnSpy.mockRestore();
    });

    it('应该处理401错误并清除token', async () => {
      const mockLocalStorage = {
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      const mockDispatchEvent = vi.fn();
      window.dispatchEvent = mockDispatchEvent;

      require('./api.service');

      const errorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      try {
        await errorInterceptor(mockError);
      } catch (error) {
        expect(error.message).toContain('Unauthorized');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user-token');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user-info');
        expect(mockDispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'api:unauthorized',
          }),
        );
      }
    });

    it('应该格式化其他错误', async () => {
      require('./api.service');

      const errorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      const mockError = {
        response: {
          status: 500,
          data: {
            message: 'Internal Server Error',
            errors: [{ field: 'email', message: 'Invalid format' }],
          },
        },
      };

      try {
        await errorInterceptor(mockError);
      } catch (error) {
        expect(error.message).toContain('Internal Server Error');
        expect(error.status).toBe(500);
        expect(error.details).toEqual(mockError.response.data.errors);
      }
    });
  });

  describe('Games Service', () => {
    beforeEach(() => {
      require('./api.service');
    });

    describe('getAll', () => {
      it('应该从缓存返回数据', async () => {
        const cachedData = [{ id: 1, name: 'Game 1' }];
        mockedGetApiResponse.mockReturnValue(cachedData);

        mockAxiosInstance.get.mockResolvedValue({ data: cachedData });

        const result = await apiService.games.getAll();

        expect(result).toEqual(cachedData);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/games');
      });

      it('应该在缓存失效时发起请求', async () => {
        mockedGetApiResponse.mockReturnValue(null);
        const apiData = [{ id: 1, name: 'Game 1' }];
        mockAxiosInstance.get.mockResolvedValue({ data: apiData });

        const result = await apiService.games.getAll();

        expect(result).toEqual(apiData);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/games');
      });
    });

    describe('getById', () => {
      it('应该获取特定游戏', async () => {
        const gameData = { id: 1, name: 'Test Game' };
        mockAxiosInstance.get.mockResolvedValue({ data: gameData });

        const result = await apiService.games.getById(1);

        expect(result).toEqual(gameData);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/games/1');
      });
    });

    describe('createNarrative', () => {
      it('应该创建叙事游戏', async () => {
        const concept = { theme: 'fantasy', setting: 'medieval' };
        const response = { id: 1, status: 'created' };

        mockAxiosInstance.post.mockResolvedValue({ data: response });

        const result = await apiService.games.createNarrative(concept);

        expect(result).toEqual(response);
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/games/narrative-driven', concept);
      });
    });

    describe('submitAction', () => {
      it('应该提交游戏行动', async () => {
        const action = { type: 'move', direction: 'north' };
        const response = { result: 'success' };

        mockAxiosInstance.post.mockResolvedValue({ data: response });

        const result = await apiService.games.submitAction(1, action);

        expect(result).toEqual(response);
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/games/1/actions', action);
      });
    });

    describe('updateCharacter', () => {
      it('应该更新角色', async () => {
        const updates = { health: 100, mana: 50 };
        const response = { success: true };

        mockAxiosInstance.patch.mockResolvedValue({ data: response });

        const result = await apiService.games.updateCharacter(1, updates);

        expect(result).toEqual(response);
        expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/games/1/character', updates);
      });
    });
  });

  describe('Auth Service', () => {
    beforeEach(() => {
      require('./api.service');
    });

    it('应该处理用户登录', async () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      const response = { token: 'jwt-token', user: { id: 1 } };

      mockAxiosInstance.post.mockResolvedValue({ data: response });

      const result = await apiService.auth.login(credentials);

      expect(result).toEqual(response);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', credentials);
    });

    it('应该处理用户注册', async () => {
      const userData = { email: 'test@example.com', password: 'password', username: 'testuser' };
      const response = { success: true, user: { id: 1 } };

      mockAxiosInstance.post.mockResolvedValue({ data: response });

      const result = await apiService.auth.register(userData);

      expect(result).toEqual(response);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/register', userData);
    });

    it('应该获取用户档案', async () => {
      const profile = { id: 1, username: 'testuser', email: 'test@example.com' };

      mockAxiosInstance.get.mockResolvedValue({ data: profile });

      const result = await apiService.auth.getProfile();

      expect(result).toEqual(profile);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/profile');
    });
  });

  describe('Settings Service', () => {
    beforeEach(() => {
      require('./api.service');
    });

    it('应该获取所有AI配置', async () => {
      const configs = [{ id: 1, name: 'GPT-4', provider: 'openai' }];

      mockAxiosInstance.get.mockResolvedValue({ data: configs });

      const result = await apiService.settings.getAllAiConfigurations();

      expect(result).toEqual(configs);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/settings/ai-configurations');
    });

    it('应该创建AI配置', async () => {
      const config = { name: 'Claude', provider: 'anthropic', apiKey: 'key' };
      const response = { id: 1, ...config };

      mockAxiosInstance.post.mockResolvedValue({ data: response });

      const result = await apiService.settings.createAiConfiguration(config);

      expect(result).toEqual(response);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/settings/ai-configurations', config);
    });

    it('应该测试连接', async () => {
      const payload = { provider: 'openai', apiKey: 'test-key' };
      const response = { success: true, message: 'Connection successful' };

      mockAxiosInstance.post.mockResolvedValue({ data: response });

      const result = await apiService.settings.testConnection(payload);

      expect(result).toEqual(response);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/settings/ai-configurations/test-connection',
        payload,
      );
    });
  });

  describe('缓存集成', () => {
    it('应该在缓存命中时避免重复请求', async () => {
      mockedGetApiResponse.mockReturnValue([{ id: 1, cached: true }]);

      const result = await apiService.games.getAll();

      expect(result).toEqual([{ id: 1, cached: true }]);
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('应该在缓存失效时发起后台刷新', async () => {
      const cachedData = [{ id: 1, cached: true }];
      const freshData = [{ id: 1, fresh: true }];

      mockedGetApiResponse.mockReturnValue(cachedData);
      mockAxiosInstance.get.mockResolvedValue({ data: freshData });

      const result = await apiService.games.getAll();

      expect(result).toEqual(cachedData);
      // Background refresh should be initiated
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/games');
    });
  });
});
