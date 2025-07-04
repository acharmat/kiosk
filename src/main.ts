import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import vuetify from './plugins/vuetify'
import App from './App.vue'

// Global styles
import './styles/main.css'

// Check if we're in development mode
const isDev = import.meta.env.DEV

// Service worker registration (only in production)
if ('serviceWorker' in navigator && !isDev) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration)
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError)
            })
    })
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen and show main content
    const loadingElement = document.getElementById('app-loading')
    const mainContent = document.getElementById('main-content')

    if (loadingElement) {
        loadingElement.style.display = 'none'
    }

    if (mainContent) {
        mainContent.style.display = 'block'
    }

    // Create Vue app
    const app = createApp(App)
    const pinia = createPinia()

    // Use plugins
    app.use(pinia)
    app.use(router)
    app.use(vuetify)

    // Global error handler
    app.config.errorHandler = (error, instance, info) => {
        console.error('Global error:', error)
        console.error('Component:', instance)
        console.error('Info:', info)

        // Report error to backend if online and not in dev mode
        if (navigator.onLine && !isDev) {
            import('./services/errorService').then(({ errorService }) => {
                errorService.reportError({
                    error_code: 'VUE_ERROR',
                    error_message: error?.toString() || 'Unknown Vue error',
                    error_level: 'error',
                    component: 'vue_app',
                    additional_data: { info }
                })
            })
        }
    }

    // Global properties
    app.config.globalProperties.$version = '1.0.0'
    app.config.globalProperties.$isDev = isDev

    // Mount app to main-content instead of #app
    app.mount('#main-content')

    // Mark app as ready
    document.body.classList.add('app-ready')
    console.log('Vue app mounted successfully')
})