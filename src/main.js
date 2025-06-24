import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

// Cart Components
import CartComponent from './components/CartComponent.vue'
import CartButton from './components/CartButton.vue'

// Vuetify theme configuration
const vuetify = createVuetify({
    components,
    directives,
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        },
    },
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                dark: false,
                colors: {
                    primary: '#1976D2',
                    secondary: '#424242',
                    accent: '#82B1FF',
                    error: '#FF5252',
                    info: '#2196F3',
                    success: '#4CAF50',
                    warning: '#FFC107',
                },
            },
            dark: {
                dark: true,
                colors: {
                    primary: '#2196F3',
                    secondary: '#424242',
                    accent: '#FF4081',
                    error: '#FF5252',
                    info: '#2196F3',
                    success: '#4CAF50',
                    warning: '#FB8C00',
                },
            },
        },
    },
    display: {
        mobileBreakpoint: 'sm',
        thresholds: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
        },
    },
    defaults: {
        VBtn: {
            style: 'text-transform: none;',
        },
        VCard: {
            elevation: 2,
        },
    },
})

// Global CSS for kiosk
const globalStyles = `
  * {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  
  body {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    font-family: 'Roboto', sans-serif;
  }
  
  /* Disable right-click context menu */
  body {
    -webkit-context-menu: none;
  }
  
  /* Custom scrollbar for kiosk */
  ::-webkit-scrollbar {
    width: 12px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 6px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 6px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  /* Touch-friendly buttons */
  .v-btn {
    min-height: 48px !important;
  }
  
  /* Prevent text selection on touch */
  .v-card, .v-btn, .v-list-item {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  
  /* Animation classes */
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
  
  .slide-enter-active, .slide-leave-active {
    transition: transform 0.3s ease;
  }
  
  .slide-enter-from {
    transform: translateX(100%);
  }
  
  .slide-leave-to {
    transform: translateX(-100%);
  }

  /* Cart-specific animations */
  .cart-item-enter-active {
    transition: all 0.3s ease;
  }
  
  .cart-item-leave-active {
    transition: all 0.3s ease;
  }
  
  .cart-item-enter-from {
    opacity: 0;
    transform: translateX(30px);
  }
  
  .cart-item-leave-to {
    opacity: 0;
    transform: translateX(-30px);
  }
  
  /* Global cart badge styling */
  .v-badge__badge {
    font-size: 12px;
    font-weight: 700;
    min-width: 20px;
    height: 20px;
  }
`

// Inject global styles
const styleSheet = document.createElement('style')
styleSheet.textContent = globalStyles
document.head.appendChild(styleSheet)

const app = createApp(App)

// Register cart components globally
app.component('CartComponent', CartComponent)
app.component('CartButton', CartButton)

// Global properties for kiosk functionality
app.config.globalProperties.$isKiosk = true
app.config.globalProperties.$kioskSettings = {
    inactivityTimeout: 300000, // 5 minutes
    screensaverDelay: 60000,   // 1 minute
    touchMode: true,
    preventRightClick: true,
}

// Global error handler
app.config.errorHandler = (error, instance, info) => {
    console.error('Kiosk App Error:', error)
    console.error('Component:', instance)
    console.error('Info:', info)

    // Clear cart on critical errors to prevent corrupted state
    if (error.message && error.message.includes('cart')) {
        console.log('Cart-related error detected, clearing cart for safety')
        try {
            const { cartService } = require('./services/cart')
            cartService.clear()
        } catch (cartError) {
            console.error('Failed to clear cart:', cartError)
        }
    }
}

app.use(router)
app.use(vuetify)

app.mount('#app')