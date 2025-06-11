import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import ScreensaverView from './components/ScreensaverView.vue'
import CategoriesView from './components/CategoriesView.vue'
import ProductsView from './components/ProductsView.vue'

const routes = [
  {
    path: '/',
    name: 'Screensaver',
    component: ScreensaverView,
    meta: {
      title: 'Écran de veille',
      isScreensaver: true,
    }
  },
  {
    path: '/categories',
    name: 'Categories',
    component: CategoriesView,
    meta: {
      title: 'Catégories',
      requiresInteraction: true,
    }
  },
  {
    path: '/products',
    name: 'Products',
    component: ProductsView,
    meta: {
      title: 'Produits',
      requiresInteraction: true,
    }
  },
  {
    path: '/products/:categoryId',
    name: 'ProductsByCategory',
    component: ProductsView,
    props: true,
    meta: {
      title: 'Produits',
      requiresInteraction: true,
    }
  },
  // Catch-all route - redirect to screensaver
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

// Use hash router for Electron compatibility
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Kiosk-specific navigation guards
let inactivityTimer = null
let screensaverTimer = null

// Activity tracking for kiosk
const resetInactivityTimer = () => {
  clearTimeout(inactivityTimer)
  clearTimeout(screensaverTimer)

  // Return to screensaver after inactivity
  inactivityTimer = setTimeout(() => {
    router.push('/')
  }, 300000) // 5 minutes

  // Show screensaver warning
  screensaverTimer = setTimeout(() => {
    console.log('Screensaver warning - returning to home soon')
  }, 240000) // 4 minutes
}

// Global navigation guard
router.beforeEach((to, from, next) => {
  // Set page title
  if (to.meta.title) {
    document.title = `Kiosk - ${to.meta.title}`
  } else {
    document.title = 'Kiosk App'
  }

  // Reset inactivity timer on navigation
  if (to.meta.requiresInteraction) {
    resetInactivityTimer()
  }

  // Clear timers when going to screensaver
  if (to.meta.isScreensaver) {
    clearTimeout(inactivityTimer)
    clearTimeout(screensaverTimer)
  }

  next()
})

// Track user activity globally
if (typeof window !== 'undefined') {
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'touchmove']

  activityEvents.forEach(event => {
    document.addEventListener(event, () => {
      if (router.currentRoute.value.meta.requiresInteraction) {
        resetInactivityTimer()
      }
    }, true)
  })

  // Prevent right-click context menu in kiosk mode
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    return false
  })

  // Prevent certain keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Disable F11 (fullscreen), F12 (dev tools), Ctrl+Shift+I, etc.
    if (e.key === 'F11' || e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'u')) {
      e.preventDefault()
      return false
    }
  })
}

export default router