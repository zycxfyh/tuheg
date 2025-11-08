import type { RouteRecordRaw } from 'vue-router'
import CreationHubView from '../views/CreationHubView.vue'
import GameView from '../views/GameView.vue'
import LoginView from '../views/LoginView.vue'
import MultiAgentCollaboration from '../views/MultiAgentCollaboration.vue'
import NexusHubView from '../views/NexusHubView.vue'
import PluginMarketplace from '../views/PluginMarketplace.vue'
import SignUpView from '../views/SignUpView.vue'
import WelcomeView from '../views/WelcomeView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'welcome',
    component: WelcomeView,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/signup',
    name: 'signup',
    component: SignUpView,
  },
  {
    path: '/creation',
    name: 'creation',
    component: CreationHubView,
  },
  {
    path: '/game',
    name: 'game',
    component: GameView,
  },
  {
    path: '/nexus',
    name: 'nexus',
    component: NexusHubView,
  },
  {
    path: '/plugins',
    name: 'plugins',
    component: PluginMarketplace,
  },
  {
    path: '/collaboration',
    name: 'collaboration',
    component: MultiAgentCollaboration,
  },
]

export default routes
