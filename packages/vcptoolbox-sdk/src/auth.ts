import type { VCPToolBoxClient } from './client.js'
import {
  type ApiResponse,
  AuthenticationError,
  type LoginCredentials,
  type TokenResponse,
  VCPToolBoxError,
} from './types.js'

/**
 * Authentication Manager
 * 认证管理器
 */
export class AuthManager {
  private tokenStorageKey = 'vcptoolbox_token'
  private refreshTokenStorageKey = 'vcptoolbox_refresh_token'
  private tokenExpiryKey = 'vcptoolbox_token_expiry'

  constructor(private client: VCPToolBoxClient) {}

  /**
   * 用户登录
   */
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    try {
      const response = await this.client.post<TokenResponse>('/auth/login', credentials)

      const tokenData = response.data
      this.setTokens(tokenData)

      return tokenData
    } catch (error) {
      throw new AuthenticationError('Login failed')
    }
  }

  /**
   * 用户注册
   */
  async register(userData: {
    username: string
    email: string
    password: string
    confirmPassword?: string
  }): Promise<ApiResponse<{ message: string; userId?: string }>> {
    return this.client.post('/auth/register', userData)
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = this.getStoredRefreshToken()
    if (!refreshToken) {
      throw new AuthenticationError('No refresh token available')
    }

    try {
      const response = await this.client.post<TokenResponse>('/auth/refresh', {
        refreshToken,
      })

      const tokenData = response.data
      this.setTokens(tokenData)

      return tokenData
    } catch (error) {
      this.clearTokens()
      throw new AuthenticationError('Token refresh failed')
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout')
    } catch (error) {
      // 忽略登出错误
    } finally {
      this.clearTokens()
    }
  }

  /**
   * 验证当前用户
   */
  async verify(): Promise<ApiResponse<any>> {
    return this.client.get('/auth/verify')
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.client.get('/auth/me')
  }

  /**
   * 更新用户信息
   */
  async updateProfile(profileData: {
    username?: string
    email?: string
    avatar?: string
    bio?: string
  }): Promise<ApiResponse<any>> {
    return this.client.put('/auth/profile', profileData)
  }

  /**
   * 更改密码
   */
  async changePassword(passwordData: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }): Promise<ApiResponse<{ message: string }>> {
    return this.client.put('/auth/password', passwordData)
  }

  /**
   * 请求密码重置
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.client.post('/auth/forgot-password', { email })
  }

  /**
   * 重置密码
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.client.post('/auth/reset-password', {
      token,
      newPassword,
    })
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    return this.client.post('/auth/verify-email', { token })
  }

  /**
   * 获取用户会话列表
   */
  async getSessions(): Promise<ApiResponse<any[]>> {
    return this.client.get('/auth/sessions')
  }

  /**
   * 撤销用户会话
   */
  async revokeSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
    return this.client.delete(`/auth/sessions/${sessionId}`)
  }

  /**
   * 撤销所有会话（除了当前会话）
   */
  async revokeAllSessions(): Promise<ApiResponse<{ message: string }>> {
    return this.client.delete('/auth/sessions')
  }

  /**
   * 设置令牌到客户端和存储
   */
  private setTokens(tokenData: TokenResponse): void {
    const { access_token, refresh_token, expires_in } = tokenData

    // 设置到客户端
    this.client.setToken(access_token, refresh_token)

    // 存储到本地存储
    const expiryTime = Date.now() + expires_in * 1000
    this.storeToken(access_token, refresh_token, expiryTime)
  }

  /**
   * 从存储中获取访问令牌
   */
  getStoredToken(): string | null {
    if (typeof window === 'undefined') return null

    try {
      const token = localStorage.getItem(this.tokenStorageKey)
      const expiry = localStorage.getItem(this.tokenExpiryKey)

      if (token && expiry) {
        const expiryTime = parseInt(expiry)
        if (Date.now() < expiryTime) {
          return token
        } else {
          // 令牌已过期，清除存储
          this.clearTokens()
        }
      }
    } catch (error) {
      // 忽略存储错误
    }

    return null
  }

  /**
   * 从存储中获取刷新令牌
   */
  getStoredRefreshToken(): string | null {
    if (typeof window === 'undefined') return null

    try {
      return localStorage.getItem(this.refreshTokenStorageKey)
    } catch (error) {
      return null
    }
  }

  /**
   * 存储令牌到本地存储
   */
  private storeToken(token: string, refreshToken?: string, expiryTime?: number): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.tokenStorageKey, token)
      if (refreshToken) {
        localStorage.setItem(this.refreshTokenStorageKey, refreshToken)
      }
      if (expiryTime) {
        localStorage.setItem(this.tokenExpiryKey, expiryTime.toString())
      }
    } catch (error) {
      // 忽略存储错误
    }
  }

  /**
   * 清除存储的令牌
   */
  clearTokens(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this.tokenStorageKey)
      localStorage.removeItem(this.refreshTokenStorageKey)
      localStorage.removeItem(this.tokenExpiryKey)
    } catch (error) {
      // 忽略存储错误
    }

    // 清除客户端认证
    this.client.clearAuth()
  }

  /**
   * 检查令牌是否即将过期
   */
  isTokenExpiringSoon(bufferSeconds = 300): boolean {
    if (typeof window === 'undefined') return false

    try {
      const expiry = localStorage.getItem(this.tokenExpiryKey)
      if (expiry) {
        const expiryTime = parseInt(expiry)
        return Date.now() + bufferSeconds * 1000 > expiryTime
      }
    } catch (error) {
      // 忽略存储错误
    }

    return false
  }

  /**
   * 自动刷新令牌（如果需要）
   */
  async autoRefreshIfNeeded(): Promise<boolean> {
    if (this.isTokenExpiringSoon()) {
      try {
        await this.refreshToken()
        return true
      } catch (error) {
        return false
      }
    }
    return true
  }

  /**
   * 初始化认证状态（从存储中恢复）
   */
  initializeFromStorage(): void {
    const token = this.getStoredToken()
    if (token) {
      this.client.setToken(token, this.getStoredRefreshToken() || undefined)
    }
  }
}
