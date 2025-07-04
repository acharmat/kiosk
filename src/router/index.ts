import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Import views
import ScreensaverView from '@/views/ScreensaverView.vue'
import SetupView from '@/views/SetupView.vue'
import ChannelSelectionView from '@/views/ChannelSelectionView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import ProductsView from '@/views/ProductsView.vue'
import CartView from '@/views/CartView.vue'
import CheckoutView from '@/views/CheckoutView.vue'
import PaymentView from '@/views/PaymentView.vue'
import ReceiptView from '@/views/ReceiptView.vue'
import MaintenanceView from '@/views/MaintenanceView.vue'
import ErrorView from '@/views/ErrorView.vue'
import OfflineView from '@/views/OfflineView.vue'

const routes = [
    {
        path: '/',
        name: 'screensaver',
        component: ScreensaverView,
        meta: {
            requiresAuth: false,
            hideNavigation: true,
            fullscreen: true
        }
    },
    {
        path: '/setup',
        name: 'setup',
        component: SetupView,
        meta: {
            requiresAuth: false,
            hideNavigation: true,
            allowInMaintenance: true
        }
    },
    {
        path: '/channels',
        name: 'channel-selection',
        component: ChannelSelectionView,
        meta: {
            requiresAuth: true,
            title: 'Select Channel',
            timeout: 30000 // 30 seconds timeout
        }
    },
    {
        path: '/categories',
        name: 'categories',
        component: CategoriesView,
        meta: {
            requiresAuth: true,
            title: 'Categories',
            timeout: 60000 // 60 seconds timeout
        }
    },
    {
        path: '/products',
        name: 'products',
        component: ProductsView,
        meta: {
            requiresAuth: true,
            title: 'Products',
            timeout: 60000
        }
    },
    {
        path: '/cart',
        name: 'cart',
        component: CartView,
        meta: {
            requiresAuth: true,
            title: 'Shopping Cart',
            timeout: 120000 // 2 minutes timeout
        }
    },
    {
        path: '/checkout',
        name: 'checkout',
        component: CheckoutView,
        meta: {
            requiresAuth: true,
            title: 'Checkout',
            timeout: 300000 // 5 minutes timeout
        }
    },
    {
        path: '/payment',
        name: 'payment',
        component: PaymentView,
        meta: {
            requiresAuth: true,
            title: 'Payment',
            timeout: 300000,
            hideNavigation: true
        }
    },
    {
        path: '/receipt',
        name: 'receipt',
        component: ReceiptView,
        meta: {
            requiresAuth: true,
            title: 'Receipt',
            timeout: 30000,
            hideNavigation: true
        }
    },
    {
        path: '/maintenance',
        name: 'maintenance',
        component: MaintenanceView,
        meta: {
            requiresAuth: false,
            hideNavigation: true,
            allowInMaintenance: true
        }
    },
    {
        path: '/offline',
        name: 'offline',
        component: OfflineView,
        meta: {
            requiresAuth: false,
            hideNavigation: true
        }
    },
    {
        path: '/error',
        name: 'error',
        component: ErrorView,
        meta: {
            requiresAuth: false,
            hideNavigation: true,
            allowInMaintenance: true
        }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // Check if app is in maintenance mode
    if (authStore.isMaintenanceMode && !to.meta.allowInMaintenance) {
        next('/maintenance')
        return
    }

    // Check if device is set up
    if (!authStore.isDeviceSetup && to.name !== 'setup' && to.name !== 'error') {
        next('/setup')
        return
    }

    // Check authentication requirements
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        // Try to authenticate if we have device info
        if (authStore.hasDeviceInfo) {
            try {
                await authStore.authenticate()
                next()
            } catch (error) {
                console.error('Authentication failed:', error)
                next('/setup')
            }
        } else {
            next('/setup')
        }
        return
    }

    // Check network connectivity for certain routes
    if (!navigator.onLine && !['offline', 'error', 'maintenance'].includes(to.name as string)) {
        next('/offline')
        return
    }

    next()
})

// Navigation timeout handler
let navigationTimer: NodeJS.Timeout | null = null

router.afterEach((to) => {
    // Clear existing timer
    if (navigationTimer) {
        clearTimeout(navigationTimer)
        navigationTimer = null
    }

    // Set new timer if route has timeout
    if (to.meta.timeout && typeof to.meta.timeout === 'number') {
        navigationTimer = setTimeout(() => {
            // Return to screensaver after timeout
            router.push('/')
        }, to.meta.timeout)
    }
})

// Clear timer on user interaction
const clearNavigationTimer = () => {
    if (navigationTimer) {
        clearTimeout(navigationTimer)
        navigationTimer = null
    }
}

// Listen for user interactions to reset timer
if (typeof window !== 'undefined') {
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
        document.addEventListener(event, clearNavigationTimer, true)
    })
}

export default router