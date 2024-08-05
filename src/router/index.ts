import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'map',
      component: import('@/views/MapView.vue')
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
      path: '/list',
      name: 'list_view',
      component: () => import('@/views/CampaignListView.vue')
    }
  ]
})

export default router
