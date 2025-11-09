import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface User {
  id: string
  email: string
  username: string
  avatar?: string
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => !!user.value && !!token.value)

  // 动作
  const login = async (email: string, _password: string) => {
    try {
      // TODO: 实现实际登录逻辑
      console.log('Login attempt:', email)
      // 模拟登录
      user.value = {
        id: '1',
        email,
        username: email.split('@')[0],
        avatar: undefined,
      }
      token.value = 'mock-token'
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const signup = async (email: string, _password: string, username: string) => {
    try {
      // TODO: 实现实际注册逻辑
      console.log('Signup attempt:', email, username)
      // 模拟注册
      user.value = {
        id: '1',
        email,
        username,
        avatar: undefined,
      }
      token.value = 'mock-token'
    } catch (error) {
      console.error('Signup failed:', error)
      throw error
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
  }

  const verifyAuthOnLoad = () => {
    // TODO: 实现从localStorage或session检查认证状态
    const savedToken = localStorage.getItem('auth-token')
    const savedUser = localStorage.getItem('auth-user')

    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
      } catch (error) {
        console.error('Failed to restore auth state:', error)
        logout()
      }
    }
  }

  return {
    // 状态
    user,
    token,
    isAuthenticated,

    // 动作
    login,
    signup,
    logout,
    verifyAuthOnLoad,
  }
})
