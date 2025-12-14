import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/datasets',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/setup',
      name: 'Setup',
      component: () => import('@/pages/auth/SetupPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/datasets',
      name: 'Datasets',
      component: () => import('@/pages/datasets/DatasetListPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/datasets/new',
      name: 'CreateDataset',
      component: () => import('@/pages/datasets/CreateDatasetPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/datasets/:id',
      name: 'DatasetDetail',
      component: () => import('@/pages/datasets/DatasetDetailPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/datasets/:id/rows/new',
      name: 'AddRow',
      component: () => import('@/pages/datasets/AddRowPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/datasets/:id/rows/:rowId',
      name: 'EditRow',
      component: () => import('@/pages/datasets/EditRowPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/datasets/:id/queue',
      name: 'ReviewQueue',
      component: () => import('@/pages/datasets/ReviewQueuePage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/schemas',
      name: 'Schemas',
      component: () => import('@/pages/schemas/SchemaListPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/schemas/new',
      name: 'CreateSchema',
      component: () => import('@/pages/schemas/CreateSchemaPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/schemas/:id',
      name: 'EditSchema',
      component: () => import('@/pages/schemas/EditSchemaPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/users',
      name: 'Users',
      component: () => import('@/pages/users/UsersPage.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/pages/settings/SettingsPage.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Check if setup is needed (only if not already on setup page)
  if (to.path !== '/setup') {
    try {
      const response = await fetch('/api/v1/setup/check')
      const data = await response.json()
      if (data.needs_setup) {
        return next('/setup')
      }
    } catch (error) {
      // If setup check fails, continue - the backend might not be ready
      console.warn('Failed to check setup status:', error)
    }
  }

  // Check authentication for protected routes
  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    try {
      await authStore.fetchCurrentUser()
    } catch {
      return next('/login')
    }
  }

  // Check admin access
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next('/datasets')
  }

  next()
})

export default router
