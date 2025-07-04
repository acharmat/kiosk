<template>
  <v-app>
    <!-- Main Navigation -->
    <v-app-bar
        v-if="!hideNavigation"
        app
        color="primary"
        dark
        :height="80"
        class="kiosk-navbar"
    >
      <v-btn
          v-if="canGoBack"
          icon
          size="large"
          @click="goBack"
          class="mr-4"
      >
        <v-icon size="32">mdi-arrow-left</v-icon>
      </v-btn>

      <v-spacer v-if="!canGoBack" />

      <v-toolbar-title class="text-h4 font-weight-bold">
        {{ pageTitle }}
      </v-toolbar-title>

      <v-spacer />

      <!-- Status indicators -->
      <div class="d-flex align-center mr-4">
        <!-- Network status -->
        <v-chip
            :color="networkStatus.color"
            :prepend-icon="networkStatus.icon"
            variant="flat"
            size="small"
            class="mr-2"
        >
          {{ networkStatus.text }}
        </v-chip>

        <!-- Cart indicator -->
        <v-btn
            v-if="cartStore.itemCount > 0 && showCartButton"
            icon
            color="kiosk-accent"
            @click="goToCart"
            class="mr-2"
        >
          <v-badge
              :content="cartStore.itemCount"
              color="error"
          >
            <v-icon size="28">mdi-cart</v-icon>
          </v-badge>
        </v-btn>

        <!-- Home button -->
        <v-btn
            v-if="showHomeButton"
            icon
            @click="goHome"
        >
          <v-icon size="28">mdi-home</v-icon>
        </v-btn>
      </div>
    </v-app-bar>

    <!-- Main content -->
    <v-main>
      <router-view />

      <!-- Loading overlay -->
      <v-overlay
          v-model="showLoadingOverlay"
          class="align-center justify-center"
          persistent
      >
        <div class="text-center">
          <v-progress-circular
              :size="80"
              :width="8"
              color="primary"
              indeterminate
          />
          <div class="mt-4 text-h6">{{ loadingMessage }}</div>
        </div>
      </v-overlay>

      <!-- Error dialog -->
      <v-dialog
          v-model="showErrorDialog"
          max-width="600"
          persistent
      >
        <v-card>
          <v-card-title class="text-h5 bg-error text-white">
            <v-icon class="mr-2">mdi-alert-circle</v-icon>
            Error
          </v-card-title>

          <v-card-text class="pt-4">
            <p class="text-body-1 mb-4">{{ errorMessage }}</p>
            <p class="text-body-2 text-medium-emphasis">
              Error Code: {{ errorCode }}
            </p>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn
                color="primary"
                @click="dismissError"
            >
              OK
            </v-btn>
            <v-btn
                v-if="errorCanRetry"
                color="primary"
                variant="outlined"
                @click="retryLastAction"
            >
              Retry
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Maintenance mode overlay -->
      <v-overlay
          v-model="authStore.isMaintenanceMode"
          class="align-center justify-center"
          persistent
      >
        <v-card
            class="text-center pa-8"
            max-width="500"
        >
          <v-icon
              size="80"
              color="warning"
              class="mb-4"
          >
            mdi-wrench
          </v-icon>

          <h2 class="text-h4 mb-4">Maintenance Mode</h2>

          <p class="text-body-1 mb-6">
            This kiosk is currently undergoing maintenance.
            Please try again later.
          </p>

          <v-btn
              color="primary"
              size="large"
              @click="checkMaintenanceStatus"
          >
            Check Status
          </v-btn>
        </v-card>
      </v-overlay>
    </v-main>

    <!-- Footer (only on certain pages) -->
    <v-footer
        v-if="showFooter"
        app
        color="surface"
        class="justify-center"
        height="60"
    >
      <div class="text-center">
        <div class="text-body-2 text-medium-emphasis">
          {{ kioskInfo }} | Last sync: {{ lastSyncTime }}
        </div>
      </div>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { errorService } from '@/services/errorService'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

// Loading state
const showLoadingOverlay = ref(false)
const loadingMessage = ref('Loading...')

// Error handling
const showErrorDialog = ref(false)
const errorMessage = ref('')
const errorCode = ref('')
const errorCanRetry = ref(false)
const lastFailedAction = ref<(() => Promise<void>) | null>(null)

// Computed properties
const hideNavigation = computed(() => {
  return route.meta.hideNavigation === true
})

const pageTitle = computed(() => {
  return route.meta.title as string || 'Kiosk Terminal'
})

const canGoBack = computed(() => {
  return router.options.history.state.back &&
      !['/', '/screensaver', '/setup'].includes(route.path)
})

const showCartButton = computed(() => {
  return !['cart', 'checkout', 'payment', 'receipt'].includes(route.name as string)
})

const showHomeButton = computed(() => {
  return !['/', '/screensaver'].includes(route.path)
})

const showFooter = computed(() => {
  return ['categories', 'products'].includes(route.name as string)
})

const networkStatus = computed(() => {
  if (authStore.isOffline) {
    return {
      color: 'error',
      icon: 'mdi-wifi-off',
      text: 'Offline'
    }
  } else if (!authStore.isAuthenticated) {
    return {
      color: 'warning',
      icon: 'mdi-wifi-strength-2',
      text: 'Not Connected'
    }
  } else {
    return {
      color: 'success',
      icon: 'mdi-wifi',
      text: 'Online'
    }
  }
})

const kioskInfo = computed(() => {
  if (authStore.kioskConfig) {
    return `${authStore.kioskConfig.name} | ${authStore.kioskConfig.uuid.slice(0, 8)}`
  }
  return 'Kiosk Terminal'
})

const lastSyncTime = computed(() => {
  if (authStore.lastHeartbeat) {
    return authStore.lastHeartbeat.toLocaleTimeString()
  }
  return 'Never'
})

// Methods
const goBack = () => {
  router.back()
}

const goToCart = () => {
  router.push('/cart')
}

const goHome = () => {
  router.push('/')
}

const showError = (message: string, code: string = 'UNKNOWN', canRetry: boolean = false) => {
  errorMessage.value = message
  errorCode.value = code
  errorCanRetry.value = canRetry
  showErrorDialog.value = true

  // Report error to service
  errorService.reportError({
    error_code: code,
    error_message: message,
    error_level: 'error',
    component: 'app_component'
  })
}

const dismissError = () => {
  showErrorDialog.value = false
  errorMessage.value = ''
  errorCode.value = ''
  errorCanRetry.value = false
  lastFailedAction.value = null
}

const retryLastAction = async () => {
  if (lastFailedAction.value) {
    try {
      dismissError()
      showLoadingOverlay.value = true
      await lastFailedAction.value()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Retry failed'
      showError(message, 'RETRY_FAILED')
    } finally {
      showLoadingOverlay.value = false
    }
  }
}

const checkMaintenanceStatus = async () => {
  try {
    showLoadingOverlay.value = true
    loadingMessage.value = 'Checking maintenance status...'

    // Try to authenticate again to check if maintenance mode is still active
    await authStore.authenticate()
  } catch (error) {
    // Still in maintenance or other error
    console.log('Still in maintenance mode')
  } finally {
    showLoadingOverlay.value = false
    loadingMessage.value = 'Loading...'
  }
}

const showLoading = (message: string = 'Loading...') => {
  loadingMessage.value = message
  showLoadingOverlay.value = true
}

const hideLoading = () => {
  showLoadingOverlay.value = false
}

// Initialize app
onMounted(async () => {
  try {
    showLoading('Initializing device...')

    // Load device information
    await authStore.loadDeviceInfo()

    // Auto-authenticate if device is set up
    if (authStore.isDeviceSetup && !authStore.isAuthenticated) {
      loadingMessage.value = 'Authenticating...'
      try {
        await authStore.authenticate()

        // Navigate to appropriate page based on authentication status
        if (route.path === '/' || route.path === '/setup') {
          router.push('/channels')
        }
      } catch (error) {
        console.log('Auto-authentication failed, staying on current page')
      }
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Initialization failed'
    showError(message, 'INIT_FAILED', true)
    lastFailedAction.value = async () => {
      await authStore.loadDeviceInfo()
    }
  } finally {
    hideLoading()
  }
})

// Watch for route changes and handle navigation timeouts
watch(
    () => route.name,
    (newRoute) => {
      // Clear any existing errors when navigating
      if (showErrorDialog.value) {
        dismissError()
      }
    }
)

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)

  const message = event.reason instanceof Error
      ? event.reason.message
      : 'An unexpected error occurred'

  showError(message, 'UNHANDLED_ERROR')
  event.preventDefault()
})

// Handle network status changes
window.addEventListener('online', () => {
  authStore.updateNetworkStatus(true)
})

window.addEventListener('offline', () => {
  authStore.updateNetworkStatus(false)
})

// Expose methods for use by other components
defineExpose({
  showError,
  showLoading,
  hideLoading
})
</script>

<style scoped>
.kiosk-navbar {
  font-size: 1.2rem;
}

.v-app-bar .v-btn--icon {
  border-radius: 8px;
}

.v-footer {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Loading overlay styling */
.v-overlay__content {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 2rem;
}

/* Error dialog styling */
.v-dialog .v-card {
  border-radius: 16px;
}

/* Animation for smooth transitions */
.v-main {
  transition: all 0.3s ease;
}

/* Touch-friendly styling */
@media (hover: none) and (pointer: coarse) {
  .v-btn {
    min-height: 48px;
    min-width: 48px;
  }

  .v-chip {
    height: 36px;
  }
}
</style>