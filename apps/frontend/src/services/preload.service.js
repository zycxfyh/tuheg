/**
 * 预加载服务 - 智能预加载路由和资源
 */

// 预加载映射表
const PRELOAD_MAP = {
  auth: () => import(/* webpackChunkName: "auth" */ '@/views/LoginView.vue'),
  nexus: () => import(/* webpackChunkName: "nexus" */ '@/views/NexusHubView.vue'),
  creation: () => import(/* webpackChunkName: "creation" */ '@/views/CreationHubView.vue'),
  game: () => import(/* webpackChunkName: "game" */ '@/views/GameView.vue'),
  welcome: () => import(/* webpackChunkName: "welcome" */ '@/views/WelcomeView.vue'),
};

// 关键组件预加载
const CRITICAL_COMPONENTS = {
  stores: [
    () => import('@/stores/auth.store'),
    () => import('@/stores/theme.store'),
    () => import('@/stores/ui.store'),
  ],
  common: [
    () => import('@/components/common/ToastContainer.vue'),
    () => import('@/components/common/LanguageSwitcher.vue'),
    () => import('@/components/common/ThemeSwitcher.vue'),
  ],
};

// 预加载状态管理
const preloadState = {
  loaded: new Set(),
  loading: new Set(),
  promises: new Map(),
};

/**
 * 预加载路由组件
 * @param {string|string[]} routeNames - 要预加载的路由名称
 */
export const preloadRoutes = async (routeNames) => {
  if (!routeNames) {
    return;
  }

  const names = Array.isArray(routeNames) ? routeNames : [routeNames];

  const promises = names
    .filter((name) => !preloadState.loaded.has(name) && !preloadState.loading.has(name))
    .map(async (name) => {
      if (!PRELOAD_MAP[name]) {
        console.warn(`预加载路由 ${name} 不存在`);
        return;
      }

      preloadState.loading.add(name);

      try {
        const startTime = performance.now();
        await PRELOAD_MAP[name]();
        const endTime = performance.now();

        preloadState.loaded.add(name);
        preloadState.loading.delete(name);

        console.log(`预加载路由 ${name} 完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
      } catch (error) {
        preloadState.loading.delete(name);
        console.error(`预加载路由 ${name} 失败:`, error);
      }
    });

  await Promise.allSettled(promises);
};

/**
 * 预加载关键组件
 */
export const preloadCriticalComponents = async () => {
  const startTime = performance.now();

  try {
    // 预加载关键store
    const storePromises = CRITICAL_COMPONENTS.stores.map((loader) =>
      loader().catch((err) => console.warn('Store预加载失败:', err)),
    );

    // 预加载关键组件
    const componentPromises = CRITICAL_COMPONENTS.common.map((loader) =>
      loader().catch((err) => console.warn('Component预加载失败:', err)),
    );

    await Promise.allSettled([...storePromises, ...componentPromises]);

    const endTime = performance.now();
    console.log(`关键组件预加载完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
  } catch (error) {
    console.error('关键组件预加载失败:', error);
  }
};

/**
 * 智能预加载 - 根据用户行为预测
 * @param {string} currentRoute - 当前路由
 * @param {string} _userAction - 用户行为 (预留参数)
 */
export const smartPreload = async (currentRoute, _userAction = '') => {
  const preloadStrategies = {
    '/': () => preloadRoutes(['auth']), // 首页预加载登录
    '/login': () => preloadRoutes(['nexus', 'creation']), // 登录页预加载主要功能
    '/nexus': () => preloadRoutes(['creation', 'game']), // 中枢预加载游戏功能
    '/creation': () => preloadRoutes(['game']), // 创建页预加载游戏
  };

  const strategy = preloadStrategies[currentRoute];
  if (strategy) {
    // 使用requestIdleCallback在空闲时预加载
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => strategy(), { timeout: 2000 });
    } else {
      // 降级到setTimeout
      setTimeout(() => strategy(), 100);
    }
  }
};

/**
 * 预加载资源
 * @param {string[]} resources - 资源URL数组
 */
export const preloadResources = (resources) => {
  resources.forEach((url) => {
    if (url.endsWith('.js')) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = url;
      document.head.appendChild(link);
    } else if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    }
  });
};

/**
 * 获取预加载状态
 */
export const getPreloadStatus = () => ({
  loaded: Array.from(preloadState.loaded),
  loading: Array.from(preloadState.loading),
  totalLoaded: preloadState.loaded.size,
});

/**
 * 清理预加载状态
 */
export const clearPreloadState = () => {
  preloadState.loaded.clear();
  preloadState.loading.clear();
  preloadState.promises.clear();
};
