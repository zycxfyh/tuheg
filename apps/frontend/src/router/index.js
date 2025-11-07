// 文件路径: apps/frontend/src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { smartPreload } from '@/services/preload.service';

// 路由懒加载 - 按需加载页面组件，带代码分割和加载优化
const WelcomeView = () => import(/* webpackChunkName: "welcome" */ '@/views/WelcomeView.vue');
const LoginView = () => import(/* webpackChunkName: "auth" */ '@/views/LoginView.vue');
const NexusHubView = () => import(/* webpackChunkName: "nexus" */ '@/views/NexusHubView.vue');
const CreationHubView = () =>
  import(/* webpackChunkName: "creation" */ '@/views/CreationHubView.vue');
const GameView = () => import(/* webpackChunkName: "game" */ '@/views/GameView.vue');

// 异步组件包装器已移除，使用原生动态导入配合Vue Router的Suspense支持

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: WelcomeView,
    meta: {
      preload: ['auth'], // 预加载认证相关组件
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      preload: ['nexus'], // 登录后预加载主要功能
    },
  },
  {
    path: '/nexus',
    name: 'NexusHub',
    component: NexusHubView,
    meta: {
      requiresAuth: true,
      preload: ['creation', 'game'], // 预加载创建和游戏功能
    },
  },
  {
    path: '/creation',
    name: 'CreationHub',
    component: CreationHubView,
    meta: {
      requiresAuth: true,
      preload: ['game'], // 创建后预加载游戏功能
    },
  },
  {
    path: '/game/:id',
    name: 'Game',
    component: GameView,
    props: true,
    meta: {
      requiresAuth: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  // Pinia store必须在导航守卫函数内部获取，以确保Pinia已初始化
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Login' });
  } else if (to.name === 'Login' && authStore.isLoggedIn) {
    next({ name: 'NexusHub' });
  } else {
    next();
  }
});

// 路由解析后触发预加载
router.afterEach((to, _from) => {
  // 智能预加载相关路由
  if (to.meta?.preload) {
    smartPreload(to.path);
  }

  // 记录导航性能
  if (window.performance && window.performance.mark) {
    window.performance.mark(`route-${to.name}-end`);
    window.performance.measure(
      `route-${to.name}`,
      `route-${to.name}-start`,
      `route-${to.name}-end`,
    );
  }
});

// 路由开始时记录性能标记
router.beforeEach((to, from, next) => {
  if (window.performance && window.performance.mark) {
    window.performance.mark(`route-${to.name}-start`);
  }
  next();
});

export default router;
