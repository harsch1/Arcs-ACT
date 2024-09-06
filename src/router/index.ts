import { createRouter, createWebHistory } from 'vue-router'
import { useGameStore } from '@/stores/game'
import HomeView from '@/views/HomeView.vue'

import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router'
import { Screen } from '@/stores/ui'

function checkGameLoaded(to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded) {
  const gameStore = useGameStore()
  const hasGameId = gameStore.settings.id || to.query.id !== undefined

  if (to.name !== 'home' && to.name !== 'campaign' && !hasGameId) {
    return { name: 'home' }
  }
}

function setCampaignQuery(to: RouteLocationNormalized) {
  const gameStore = useGameStore()

  to.query = {
    mode: to.query.mode ?? gameStore.isGameLoaded ? 'edit' : 'create',
    screen: to.query.screen ?? `${Screen.Settings}`,
    ...to.query
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        hideNavigation: true
      }
    },
    {
      path: '/map_debug',
      name: 'map_debug',
      component: () => import('@/views/MapView.vue')
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
      path: '/campaign',
      name: 'campaign',
      component: () => import('@/views/CampaignCreatorView.vue'),
      beforeEnter: setCampaignQuery
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('@/views/CampaignView.vue')
      // beforeEnter: checkGameLoaded
    },
    {
      path: '/list',
      name: 'list_view',
      component: () => import('@/views/CampaignListView.vue')
      // beforeEnter: checkGameLoaded
    }
  ]
})

router.beforeEach((to) => {
  const gameStore = useGameStore()

  // Keep the game id if loaded
  if (to.query.id === undefined && gameStore.settings.id) {
    return { name: to.name, replace: true, query: { ...to.query, id: gameStore.settings.id } }
  }
})

export default router
