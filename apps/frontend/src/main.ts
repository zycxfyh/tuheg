import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'

// 样式文件
import './assets/main.css'

// 应用组件
import App from './App.vue'
// 国际化配置
import messages from './i18n'
// 路由配置
import routes from './router'

// 创建应用实例
const app = createApp(App)

// 创建状态管理
const pinia = createPinia()

// 创建路由
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 创建国际化
const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  messages,
})

// 安装插件
app.use(pinia)
app.use(router)
app.use(i18n)

// 挂载应用
app.mount('#app')
