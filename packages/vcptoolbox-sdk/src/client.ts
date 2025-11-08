import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import EventEmitter from 'eventemitter3'
import {
  type ApiResponse,
  type AuthConfig,
  AuthenticationError,
  type ClientConfig,
  NetworkError,
  type RequestConfig,
  type SDKEventMap,
  TokenResponse,
  VCPToolBoxError,
} from './types.js'

/**
 * VCPToolBox API Client
 * VCPToolBox API 客户端
 */
export class VCPToolBoxClient extends EventEmitter<SDKEventMap> {
  private axiosInstance: AxiosInstance
  private config: ClientConfig
  private token?: string
  private refreshToken?: string
  private isAuthenticated = false

  constructor(config: ClientConfig) {
    super()
    this.config = { ...config }

    // 创建 axios 实例
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VCPToolBox-SDK/1.0.0',
        ...this.config.headers,
      },
    })

    // 设置请求拦截器
    this.setupRequestInterceptors()

    // 设置响应拦截器
    this.setupResponseInterceptors()

    this.emit('ready')
  }

  /**
   * 设置请求拦截器
   */
  private setupRequestInterceptors() {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // 添加认证头
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`
        } else if (this.config.auth?.apiKey) {
          config.headers['X-API-Key'] = this.config.auth.apiKey
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )
  }

  /**
   * 设置响应拦截器
   */
  private setupResponseInterceptors() {
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      (error) => {
        if (error.response) {
          // 服务器响应错误
          const status = error.response.status
          const message = error.response.data?.message || error.message

          if (status === 401) {
            this.isAuthenticated = false
            this.emit('error', new AuthenticationError('Authentication required'))
          } else if (status >= 400 && status < 500) {
            throw new VCPToolBoxError(message, 'CLIENT_ERROR', status, error.response.data)
          } else if (status >= 500) {
            throw new VCPToolBoxError(message, 'SERVER_ERROR', status, error.response.data)
          }
        } else if (error.request) {
          // 网络错误
          throw new NetworkError('Network request failed', error)
        } else {
          // 其他错误
          throw new VCPToolBoxError(error.message, 'UNKNOWN_ERROR', undefined, error)
        }

        return Promise.reject(error)
      }
    )
  }

  /**
   * 设置认证配置
   */
  setAuth(auth: AuthConfig) {
    this.config.auth = { ...auth }

    if (auth.bearerToken) {
      this.token = auth.bearerToken
      this.isAuthenticated = true
      this.emit('authenticated', {
        access_token: auth.bearerToken,
        token_type: 'Bearer',
        expires_in: 3600, // 默认1小时
      })
    }
  }

  /**
   * 设置认证令牌
   */
  setToken(token: string, refreshToken?: string) {
    this.token = token
    this.refreshToken = refreshToken
    this.isAuthenticated = true

    this.emit('authenticated', {
      access_token: token,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
    })
  }

  /**
   * 清除认证
   */
  clearAuth() {
    this.token = undefined
    this.refreshToken = undefined
    this.isAuthenticated = false
    this.config.auth = undefined
  }

  /**
   * 检查是否已认证
   */
  isAuth(): boolean {
    return this.isAuthenticated
  }

  /**
   * 发送 HTTP 请求
   */
  async request<T = any>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.request({
      url,
      method: config.method || 'GET',
      headers: config.headers,
      params: config.params,
      data: config.data,
      timeout: config.timeout,
    })

    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      request: response.request,
    }
  }

  /**
   * GET 请求
   */
  async get<T = any>(
    url: string,
    params?: Record<string, any>,
    config: Omit<RequestConfig, 'method' | 'params'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET', params })
  }

  /**
   * POST 请求
   */
  async post<T = any>(
    url: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'data'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', data })
  }

  /**
   * PUT 请求
   */
  async put<T = any>(
    url: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'data'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', data })
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(
    url: string,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' })
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'data'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', data })
  }

  /**
   * 获取客户端配置
   */
  getConfig(): ClientConfig {
    return { ...this.config }
  }

  /**
   * 更新客户端配置
   */
  updateConfig(updates: Partial<ClientConfig>) {
    this.config = { ...this.config, ...updates }

    // 重新配置 axios 实例
    if (updates.baseURL) {
      this.axiosInstance.defaults.baseURL = updates.baseURL
    }

    if (updates.timeout) {
      this.axiosInstance.defaults.timeout = updates.timeout
    }

    if (updates.headers) {
      Object.assign(this.axiosInstance.defaults.headers, updates.headers)
    }
  }

  /**
   * 获取 SDK 版本信息
   */
  getVersion(): string {
    return '1.0.0'
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health')
      return response.status === 200
    } catch (error) {
      return false
    }
  }
}
