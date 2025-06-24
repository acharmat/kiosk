import { createRouter, createWebHashHistory } from 'vue-router'
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

// Kiosk-specific navigation guards and timers
let inactivityTimer = null
let screensaverTimer = null
let cartInactivityTimer = null

// Cart service import (dynamic to avoid circular dependency)
let cartService = null

// Activity tracking for kiosk
const resetInactivityTimer = () => {
  clearTimeout(inactivityTimer)
  clearTimeout(screensaverTimer)
  clearTimeout(cartInactivityTimer)

  // Return to screensaver after inactivity
  inactivityTimer = setTimeout(() => {
    // Clear cart when returning to screensaver due to inactivity
    if (cartService) {
      cartService.clear()
      cartService.closeCart()
    }
    router.push('/')
  }, 300000) // 5 minutes

  // Show screensaver warning
  screensaverTimer = setTimeout(() => {
    console.log('Screensaver warning - returning to home soon')
    // Could show a warning dialog here
  }, 240000) // 4 minutes

  // Clear cart after extended inactivity (longer than screensaver)
  cartInactivityTimer = setTimeout(() => {
    if (cartService && !cartService.isEmpty) {
      console.log('Clearing cart due to extended inactivity')
      cartService.clear()
      // Could show a notification here
    }
  }, 600000) // 10 minutes
}

// Initialize cart service
const initializeCartService = async () => {
  try {
    const { cartService: cs } = await import('./services/cart')
    cartService = cs
  } catch (error) {
    console.error('Failed to initialize cart service in router:', error)
  }
}

// Global navigation guard
router.beforeEach((to, from, next) => {
  // Initialize cart service if not already done
  if (!cartService) {
    initializeCartService()
  }

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

  // Clear timers and cart when going to screensaver
  if (to.meta.isScreensaver) {
    clearTimeout(inactivityTimer)
    clearTimeout(screensaverTimer)
    clearTimeout(cartInactivityTimer)

    // Clear cart when going to screensaver (user session ended)
    if (cartService) {
      cartService.clear()
      cartService.closeCart()
    }
  }

  next()
})

// Track user activity globally
if (typeof window !== 'undefined') {
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'touchmove', 'click']

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

    // Emergency cart clear (for kiosk maintenance)
    if (e.ctrlKey && e.altKey && e.key === 'c') {
      if (cartService) {
        cartService.clear()
        console.log('Cart cleared via emergency shortcut')
      }
    }

    // Emergency return to screensaver (for kiosk maintenance)
    if (e.ctrlKey && e.altKey && e.key === 'h') {
      router.push('/')
      console.log('Returned to screensaver via emergency shortcut')
    }
  })

  // Handle visibility change (when browser tab is hidden/shown)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Reset timers when tab becomes visible again
      if (router.currentRoute.value.meta.requiresInteraction) {
        resetInactivityTimer()
      }
    }
  })

  // Handle beforeunload to clean up cart if needed
  window.addEventListener('beforeunload', () => {
    if (cartService) {
      // Don't clear cart on beforeunload as user might be refreshing
      // cartService.clear()
    }
  })
}

export default router