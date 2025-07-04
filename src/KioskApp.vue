<template>
  <div class="kiosk-app" :class="{ 'offline': !isOnline }">
    <!-- Loading Overlay -->
    <div v-if="initializing" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <h3>Initializing Kiosk...</h3>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>

    <!-- Authentication Screen -->
    <div v-else-if="!authenticated" class="auth-screen">
      <div class="auth-content">
        <div class="kiosk-info">
          <h2>Kiosk Authentication</h2>
          <p class="serial">Serial: {{ deviceSerial }}</p>
          <p class="status" :class="statusClass">{{ statusMessage }}</p>
        </div>

        <button
            @click="authenticate"
            :disabled="authenticating"
            class="auth-btn"
        >
          {{ authenticating ? 'Authenticating...' : 'Authenticate Kiosk' }}
        </button>

        <div v-if="authError" class="auth-error">
          <p>{{ authError }}</p>
          <button @click="retryAuthentication" class="retry-btn">Retry</button>
        </div>
      </div>
    </div>

    <!-- Main Application -->
    <div v-else class="main-app">
      <!-- Screensaver -->
      <ScreensaverView
          v-if="currentView === 'screensaver'"
          :kiosk-name="kioskName"
          :last-activity="lastActivityTime"
          @wake-up="handleWakeUp"
      />

      <!-- Channel Selection -->
      <ChannelSelectionView
          v-else-if="currentView === 'channels'"
          :channels="channels"
          :loading="channelsLoading"
          @channel-selected="handleChannelSelected"
          @back="goToScreensaver"
      />

      <!-- Categories -->
      <CategoriesView
          v-else-if="currentView === 'categories'"
          :categories="categories"
          :loading="categoriesLoading"
          :channel="selectedChannel"
          @category-selected="handleCategorySelected"
          @back="goBack"
      />

      <!-- Products -->
      <ProductsView
          v-else-if="currentView === 'products'"
          :products="products"
          :loading="productsLoading"
          :category="selectedCategory"
          :channel="selectedChannel"
          @product-selected="handleProductSelected"
          @add-to-cart="handleAddToCart"
          @back="goBack"
      />

      <!-- Cart -->
      <CartView
          v-else-if="currentView === 'cart'"
          :cart-items="cartItems"
          :total="cartTotal"
          :processing="processingTransaction"
          @checkout="handleCheckout"
          @remove-item="handleRemoveFromCart"
          @update-quantity="handleUpdateQuantity"
          @clear-cart="handleClearCart"
          @back="goBack"
      />

      <!-- Transaction Success -->
      <TransactionSuccessView
          v-else-if="currentView === 'success'"
          :transaction="lastTransaction"
          @continue="goToScreensaver"
      />
    </div>

    <!-- Global Error Overlay -->
    <div v-if="globalError" class="error-overlay" @click="clearGlobalError">
      <div class="error-content" @click.stop>
        <h3>⚠️ Error</h3>
        <p>{{ globalError }}</p>
        <div class="error-actions">
          <button @click="clearGlobalError" class="btn-primary">Close</button>
          <button v-if="canRetry" @click="retryLastAction" class="btn-secondary">Retry</button>
        </div>
      </div>
    </div>

    <!-- Offline Indicator -->
    <div v-if="!isOnline" class="offline-indicator">
      <span>⚠️ Offline Mode</span>
    </div>

    <!-- Status Bar -->
    <div class="status-bar">
      <span class="connection-status" :class="connectionStatusClass">
        {{ connectionStatusText }}
      </span>
      <span class="time">{{ currentTime }}</span>
      <span class="kiosk-id">ID: {{ kioskId }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useKioskApi } from '@/composables/useKioskApi'
import ScreensaverView from '@/components/ScreensaverView.vue'
import ChannelSelectionView from '@/components/ChannelSelectionView.vue'
import CategoriesView from '@/components/CategoriesView.vue'
import ProductsView from '@/components/ProductsView.vue'
import CartView from '@/components/CartView.vue'
import TransactionSuccessView from '@/components/TransactionSuccessView.vue'

export default {
  name: 'KioskApp',
  components: {
    ScreensaverView,
    ChannelSelectionView,
    CategoriesView,
    ProductsView,
    CartView,
    TransactionSuccessView
  },
  setup() {
    // Kiosk API composable
    const {
      authenticated,
      loading,
      error,
      channels,
      categories,
      products,
      selectedChannel,
      hasMultipleChannels,
      isOnline,
      authenticate: apiAuthenticate,
      loadChannels,
      loadCategories,
      loadProducts,
      processTransaction,
      clearError
    } = useKioskApi()

    // App state
    const initializing = ref(true)
    const authenticating = ref(false)
    const authError = ref(null)
    const loadingMessage = ref('Starting up...')
    const currentView = ref('screensaver')
    const lastActivityTime = ref(Date.now())
    const currentTime = ref(new Date().toLocaleTimeString())

    // Navigation state
    const selectedCategory = ref(null)
    const navigationStack = ref([])

    // Cart state
    const cartItems = ref([])
    const processingTransaction = ref(false)
    const lastTransaction = ref(null)

    // Loading states
    const channelsLoading = ref(false)
    const categoriesLoading = ref(false)
    const productsLoading = ref(false)

    // Global error handling
    const globalError = ref(null)
    const canRetry = ref(false)
    const lastAction = ref(null)

    // Device information
    const deviceSerial = ref(localStorage.getItem('device_serial') || 'UNKNOWN')
    const kioskName = ref('')
    const kioskId = ref('')

    // Computed properties
    const cartTotal = computed(() => {
      return cartItems.value.reduce((total, item) => {
        return total + (parseFloat(item.price) * item.quantity)
      }, 0).toFixed(2)
    })

    const statusClass = computed(() => {
      if (authenticating.value) return 'authenticating'
      if (authError.value) return 'error'
      if (authenticated.value) return 'authenticated'
      return 'disconnected'
    })

    const statusMessage = computed(() => {
      if (authenticating.value) return 'Authenticating...'
      if (authError.value) return 'Authentication Failed'
      if (authenticated.value) return 'Connected'
      return 'Disconnected'
    })

    const connectionStatusClass = computed(() => {
      if (!isOnline.value) return 'offline'
      if (authenticated.value) return 'online'
      return 'disconnected'
    })

    const connectionStatusText = computed(() => {
      if (!isOnline.value) return 'Offline'
      if (authenticated.value) return 'Online'
      return 'Disconnected'
    })

    // Timers
    let screensaverTimer = null
    let clockTimer = null

    // Initialize app
    const initializeApp = async () => {
      try {
        loadingMessage.value = 'Checking authentication...'

        if (apiAuthenticate) {
          await authenticate()
        }

      } catch (err) {
        console.error('App initialization failed:', err)
        globalError.value = 'Failed to initialize kiosk application'
      } finally {
        initializing.value = false
      }
    }

    // Authentication
    const authenticate = async () => {
      authenticating.value = true
      authError.value = null
      loadingMessage.value = 'Authenticating with server...'

      try {
        await apiAuthenticate()

        if (authenticated.value) {
          loadingMessage.value = 'Loading channels...'
          await loadChannels()

          const kioskData = JSON.parse(localStorage.getItem('kiosk_data') || '{}')
          kioskName.value = kioskData.kiosk_name || 'Unknown Kiosk'
          kioskId.value = kioskData.uuid || 'Unknown'

          startScreensaverTimer()
        }
      } catch (err) {
        authError.value = err.message
        console.error('Authentication failed:', err)
      } finally {
        authenticating.value = false
      }
    }

    const retryAuthentication = () => {
      authError.value = null
      authenticate()
    }

    // Navigation and view management
    const updateActivity = () => {
      lastActivityTime.value = Date.now()
      resetScreensaverTimer()
    }

    const handleWakeUp = () => {
      updateActivity()

      if (hasMultipleChannels.value) {
        currentView.value = 'channels'
        navigationStack.value = ['screensaver']
      } else if (channels.value.length === 1) {
        selectedChannel.value = channels.value[0]
        handleChannelSelected(channels.value[0])
      } else {
        // No channels available
        globalError.value = 'No channels available for this kiosk'
      }
    }

    const handleChannelSelected = async (channel) => {
      updateActivity()
      selectedChannel.value = channel
      navigationStack.value.push('channels')

      try {
        categoriesLoading.value = true
        currentView.value = 'categories'
        await loadCategories(channel.id)
      } catch (err) {
        handleError('Failed to load categories', () => handleChannelSelected(channel))
      } finally {
        categoriesLoading.value = false
      }
    }

    const handleCategorySelected = async (category) => {
      updateActivity()
      selectedCategory.value = category
      navigationStack.value.push('categories')

      try {
        productsLoading.value = true
        currentView.value = 'products'
        await loadProducts(category.id, selectedChannel.value.id)
      } catch (err) {
        handleError('Failed to load products', () => handleCategorySelected(category))
      } finally {
        productsLoading.value = false
      }
    }

    const handleProductSelected = (product) => {
      updateActivity()
      // Could show product details or directly add to cart
      handleAddToCart(product)
    }

    const handleAddToCart = (product, quantity = 1) => {
      updateActivity()

      const existingItem = cartItems.value.find(item => item.id === product.id)

      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        cartItems.value.push({
          ...product,
          quantity
        })
      }

      // Navigate to cart
      navigationStack.value.push('products')
      currentView.value = 'cart'
    }

    const handleRemoveFromCart = (productId) => {
      updateActivity()
      const index = cartItems.value.findIndex(item => item.id === productId)
      if (index > -1) {
        cartItems.value.splice(index, 1)
      }
    }

    const handleUpdateQuantity = (productId, newQuantity) => {
      updateActivity()
      const item = cartItems.value.find(item => item.id === productId)
      if (item) {
        item.quantity = newQuantity
      }
    }

    const handleClearCart = () => {
      updateActivity()
      cartItems.value = []
    }

    const handleCheckout = async (paymentData) => {
      updateActivity()
      processingTransaction.value = true

      try {
        // Process each item in the cart
        const transactions = []

        for (const item of cartItems.value) {
          const transactionData = {
            slotNumber: 1, // This should be determined by product placement
            productId: item.id,
            quantity: item.quantity,
            paymentMethod: paymentData.method,
            paymentData: paymentData,
            customerData: null,
            transactionRef: `TXN_${Date.now()}_${item.id}`
          }

          const result = await processTransaction(transactionData)
          transactions.push(result)
        }

        lastTransaction.value = {
          items: cartItems.value,
          total: cartTotal.value,
          timestamp: new Date(),
          transactions
        }

        // Clear cart and show success
        cartItems.value = []
        currentView.value = 'success'
        navigationStack.value = []

        // Auto-return to screensaver after 10 seconds
        setTimeout(() => {
          goToScreensaver()
        }, 10000)

      } catch (err) {
        handleError('Transaction failed: ' + err.message, () => handleCheckout(paymentData))
      } finally {
        processingTransaction.value = false
      }
    }

    // Navigation
    const goBack = () => {
      updateActivity()

      if (navigationStack.value.length > 0) {
        const previousView = navigationStack.value.pop()
        currentView.value = previousView

        // Clear relevant state based on where we're going
        if (previousView === 'categories') {
          selectedCategory.value = null
        } else if (previousView === 'channels') {
          selectedChannel.value = null
          selectedCategory.value = null
        }
      } else {
        goToScreensaver()
      }
    }

    const goToScreensaver = () => {
      currentView.value = 'screensaver'
      navigationStack.value = []
      selectedChannel.value = null
      selectedCategory.value = null
      cartItems.value = []
      lastTransaction.value = null
      startScreensaverTimer()
    }

    // Screensaver management
    const startScreensaverTimer = () => {
      resetScreensaverTimer()
    }

    const resetScreensaverTimer = () => {
      if (screensaverTimer) {
        clearTimeout(screensaverTimer)
      }

      // Go to screensaver after 2 minutes of inactivity
      screensaverTimer = setTimeout(() => {
        if (currentView.value !== 'screensaver') {
          goToScreensaver()
        }
      }, 2 * 60 * 1000)
    }

    // Error handling
    const handleError = (message, retryAction = null) => {
      globalError.value = message
      canRetry.value = !!retryAction
      lastAction.value = retryAction
    }

    const clearGlobalError = () => {
      globalError.value = null
      canRetry.value = false
      lastAction.value = null
    }

    const retryLastAction = () => {
      if (lastAction.value) {
        clearGlobalError()
        lastAction.value()
      }
    }

    // Clock
    const updateClock = () => {
      currentTime.value = new Date().toLocaleTimeString()
    }

    // Lifecycle hooks
    onMounted(async () => {
      await initializeApp()

      // Start clock
      clockTimer = setInterval(updateClock, 1000)

      // Global click handler for activity tracking
      document.addEventListener('click', updateActivity)
      document.addEventListener('touchstart', updateActivity)
      document.addEventListener('mousemove', updateActivity)
      document.addEventListener('keydown', updateActivity)
    })

    onUnmounted(() => {
      if (screensaverTimer) clearTimeout(screensaverTimer)
      if (clockTimer) clearInterval(clockTimer)

      document.removeEventListener('click', updateActivity)
      document.removeEventListener('touchstart', updateActivity)
      document.removeEventListener('mousemove', updateActivity)
      document.removeEventListener('keydown', updateActivity)
    })

    // Watch for authentication changes
    watch(authenticated, (isAuth) => {
      if (!isAuth) {
        currentView.value = 'screensaver'
        navigationStack.value = []
        cartItems.value = []
      }
    })

    return {
      // State
      initializing,
      authenticated,
      authenticating,
      authError,
      loadingMessage,
      currentView,
      lastActivityTime,
      currentTime,
      selectedChannel,
      selectedCategory,
      navigationStack,
      cartItems,
      processingTransaction,
      lastTransaction,
      channels,
      categories,
      products,
      channelsLoading,
      categoriesLoading,
      productsLoading,
      globalError,
      canRetry,
      deviceSerial,
      kioskName,
      kioskId,
      isOnline,
      hasMultipleChannels,

      // Computed
      cartTotal,
      statusClass,
      statusMessage,
      connectionStatusClass,
      connectionStatusText,

      // Methods
      authenticate,
      retryAuthentication,
      handleWakeUp,
      handleChannelSelected,
      handleCategorySelected,
      handleProductSelected,
      handleAddToCart,
      handleRemoveFromCart,
      handleUpdateQuantity,
      handleClearCart,
      handleCheckout,
      goBack,
      goToScreensaver,
      clearGlobalError,
      retryLastAction,
      updateActivity
    }
  }
}
</script>

<style scoped>
.kiosk-app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
  position: relative;
}

.kiosk-app.offline {
  filter: grayscale(50%);
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: white;
}

.spinner {
  width: 64px;
  height: 64px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 2rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Authentication Screen */
.auth-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.auth-content {
  text-align: center;
  max-width: 400px;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.kiosk-info h2 {
  margin: 0 0 1rem;
  font-size: 2rem;
  font-weight: 600;
}

.serial {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.875rem;
  opacity: 0.8;
  margin: 0.5rem 0;
}

.status {
  font-weight: 600;
  margin: 1rem 0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.status.authenticating {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.status.error {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.status.authenticated {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.status.disconnected {
  background: rgba(156, 163, 175, 0.2);
  color: #d1d5db;
}

.auth-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 1rem 0;
  min-width: 200px;
}

.auth-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
}

.auth-btn:disabled {
  background: rgba(59, 130, 246, 0.5);
  cursor: not-allowed;
  transform: none;
}

.auth-error {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
}

.retry-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  margin-top: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Main App */
.main-app {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 60px; /* Space for status bar */
}

/* Error Overlay */
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 8000;
  padding: 2rem;
}

.error-content {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.error-content h3 {
  color: #ef4444;
  margin: 0 0 1rem;
  font-size: 1.5rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Offline Indicator */
.offline-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #f59e0b;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  z-index: 7000;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Status Bar */
.status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #1e293b;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  font-size: 0.875rem;
  z-index: 5000;
}

.connection-status {
  display: flex;
  align-items: center;
  font-weight: 600;
}

.connection-status::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.connection-status.online::before {
  background: #10b981;
}

.connection-status.offline::before {
  background: #f59e0b;
}

.connection-status.disconnected::before {
  background: #6b7280;
}

.time {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
}

.kiosk-id {
  font-family: 'Monaco', 'Menlo', monospace;
  opacity: 0.7;
}

/* Responsive Design */
@media (max-width: 768px) {
  .auth-content {
    margin: 1rem;
    padding: 2rem;
  }

  .error-overlay {
    padding: 1rem;
  }

  .status-bar {
    padding: 0 1rem;
    font-size: 0.75rem;
  }

  .error-actions {
    flex-direction: column;
  }
}

/* Touch-friendly sizing for kiosk */
@media (min-width: 1024px) {
  .auth-btn {
    padding: 1.5rem 3rem;
    font-size: 1.25rem;
  }

  .btn-primary,
  .btn-secondary {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }
}
</style>