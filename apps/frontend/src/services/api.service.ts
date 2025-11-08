import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: string | number
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

class ApiService {
  private axiosInstance: AxiosInstance
  private baseURL: string

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL

    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // 添加认证token
        const token = localStorage.getItem('auth-token')
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // 添加请求ID用于调试
        if (config.headers) {
          config.headers['X-Request-ID'] = Date.now().toString()
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // 处理业务错误
        if (response.data && !response.data.success) {
          const error = new Error(response.data.message || 'API request failed')
          ;(error as any).code = response.data.code
          ;(error as any).data = response.data
          return Promise.reject(error)
        }

        return response
      },
      (error) => {
        // 处理HTTP错误
        if (error.response) {
          const { status, data } = error.response

          switch (status) {
            case 401:
              // 未授权，清除token并跳转到登录页
              localStorage.removeItem('auth-token')
              localStorage.removeItem('auth-user')
              window.location.href = '/login'
              break
            case 403:
              throw new Error('权限不足')
            case 404:
              throw new Error('请求的资源不存在')
            case 422:
              throw new Error(data?.message || '请求参数错误')
            case 429:
              throw new Error('请求过于频繁，请稍后再试')
            case 500:
              throw new Error('服务器内部错误')
            default:
              throw new Error(data?.message || `请求失败 (${status})`)
          }
        } else if (error.request) {
          // 网络错误
          throw new Error('网络连接失败，请检查网络设置')
        } else {
          // 其他错误
          throw error
        }
      }
    )
  }

  // GET 请求
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, config)
    return response.data
  }

  // POST 请求
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config)
    return response.data
  }

  // PUT 请求
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config)
    return response.data
  }

  // PATCH 请求
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.patch<ApiResponse<T>>(url, data, config)
    return response.data
  }

  // DELETE 请求
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config)
    return response.data
  }

  // 文件上传
  async uploadFile(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    }

    return this.post(url, formData, config)
  }

  // 分页查询
  async getPaginated<T = any>(
    url: string,
    params: PaginationParams & Record<string, any> = {}
  ): Promise<PaginatedResponse<T>> {
    const response = await this.axiosInstance.get<PaginatedResponse<T>>(url, { params })
    return response.data
  }

  // 设置认证token
  setAuthToken(token: string | null) {
    if (token) {
      localStorage.setItem('auth-token', token)
    } else {
      localStorage.removeItem('auth-token')
    }
  }

  // 获取认证token
  getAuthToken(): string | null {
    return localStorage.getItem('auth-token')
  }

  // 清除认证信息
  clearAuth() {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('auth-user')
  }

  // 检查是否已认证
  isAuthenticated(): boolean {
    return !!this.getAuthToken()
  }
}

// 创建单例实例
export const apiService = new ApiService()

// 为了向后兼容，提供一些便捷方法
export const api = {
  get: apiService.get.bind(apiService),
  post: apiService.post.bind(apiService),
  put: apiService.put.bind(apiService),
  patch: apiService.patch.bind(apiService),
  delete: apiService.delete.bind(apiService),
  uploadFile: apiService.uploadFile.bind(apiService),
  getPaginated: apiService.getPaginated.bind(apiService),
  setAuthToken: apiService.setAuthToken.bind(apiService),
  getAuthToken: apiService.getAuthToken.bind(apiService),
  clearAuth: apiService.clearAuth.bind(apiService),
  isAuthenticated: apiService.isAuthenticated.bind(apiService),
}
