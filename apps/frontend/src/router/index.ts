import { createRouter, createWebHistory } from 'vue-router'
import WelcomeView from '@/views/WelcomeView.vue'
import NexusHubView from '@/views/NexusHubView.vue'
import CreationHubView from '@/views/CreationHubView.vue'
import GameView from '@/views/GameView.vue'
import LoginView from '@/views/LoginView.vue'
import SignUpView from '@/views/SignUpView.vue'
import PluginMarketplace from '@/views/PluginMarketplace.vue'
import MultiAgentCollaboration from '@/views/MultiAgentCollaboration.vue'
import AgentOrchestrationView from '@/views/orchestration/AgentOrchestrationView.vue'
import TenantManagement from '@/views/tenant/TenantManagement.vue'
import PluginMarketplaceAdmin from '@/views/admin/PluginMarketplaceAdmin.vue'

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: WelcomeView
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/signup',
    name: 'SignUp',
    component: SignUpView
  },
  {
    path: '/nexus',
    name: 'NexusHub',
    component: NexusHubView
  },
  {
    path: '/creation',
    name: 'CreationHub',
    component: CreationHubView
  },
  {
    path: '/game/:id',
    name: 'Game',
    component: GameView,
    props: true
  },
  {
    path: '/plugins',
    name: 'PluginMarketplace',
    component: PluginMarketplace
  },
  {
    path: '/collaboration',
    name: 'MultiAgentCollaboration',
    component: MultiAgentCollaboration
  },
  {
    path: '/orchestration',
    name: 'AgentOrchestration',
    component: AgentOrchestrationView
  },
  {
    path: '/tenants',
    name: 'TenantManagement',
    component: TenantManagement
  },
  {
    path: '/admin/plugins',
    name: 'PluginMarketplaceAdmin',
    component: PluginMarketplaceAdmin
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
