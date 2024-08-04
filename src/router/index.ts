import { createRouter, createWebHistory } from 'vue-router'
import MapView from '../views/MapView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/map',
      name: 'map',
      component: MapView
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // },
    {
      path: '/new_campaign',
      name: 'new_campaign',
      component: () => import('@/views/CampaignCreatorView.vue')
    },
    {
      path: '/campaign',
      name: 'campaign',
      component: () => import('@/views/CampaignView.vue')
    },
    {
      path: '/player',
      name: 'player',
      component: () => import('@/views/PlayerView.vue')
    }
  ]
})

export default router
