<template>
  <div class="offline-view">
    <v-container fluid class="h-100">
      <v-row justify="center" align="center" class="h-100">
        <v-col cols="12" md="8" lg="6">
          <v-card class="offline-card" elevation="12">
            <!-- Offline Icon -->
            <div class="offline-header">
              <div class="text-center">
                <v-icon
                    size="120"
                    color="error"
                    class="mb-4 offline-icon"
                >
                  mdi-wifi-off
                </v-icon>

                <h1 class="text-h2 font-weight-bold mb-4">
                  Connection Lost
                </h1>

                <p class="text-h5 text-medium-emphasis mb-6">
                  {{ isRetrying ? 'Attempting to reconnect...' : 'No internet connection detected' }}
                </p>
              </div>
            </div>

            <v-divider />

            <v-card-text class="pa-8">
              <!-- Connection Status -->
              <div class="connection-status mb-6">
                <v-alert
                    :type="connectionAlert.type"
                    variant="tonal"
                    prominent
                    class="mb-4"
                >
                  <v-alert-title>
                    <v-icon class="mr-2">{{ connectionAlert.icon }}</v-icon>
                    {{ connectionAlert.title }}
                  </v-alert-title>
                  <div>{{ connectionAlert.message }}</div>
                </v-alert>

                <!-- Connection Details -->
                <div class="connection-details">
                  <v-card variant="outlined" class="pa-4">
                    <h3 class="text-h6 font-weight-bold mb-3">Connection Status</h3>

                    <div class="status-row">
                      <span class="status-label">Network:</span>
                      <span class="status-value">
                        <v-chip
                            :color="networkStatus.online ? 'success' : 'error'"
                            size="small"
                            variant="flat"
                        >
                          <v-icon size="14" class="mr-1">
                            {{ networkStatus.online ? 'mdi-wifi' : 'mdi-wifi-off' }}
                          </v-icon>
                          {{ networkStatus.online ? 'Connected' : 'Disconnected' }}
                        </v-chip>
                      </span>
                    </div>

                    <div class="status-row">
                      <span class="status-label">Last Connection:</span>
                      <span class="status-value">{{ formatTime(lastConnected) }}</span>
                    </div>

                    <div class="status-row">
                      <span class="status-label">Offline Duration:</span>
                      <span class="status-value">{{ offlineDuration }}</span>
                    </div>

                    <div class="status-row">
                      <span class="status-label">Retry Attempts:</span>
                      <span class="status-value">{{ retryAttempts }}</span>
                    </div>
                  </v-card>
                </div>
              </div>

              <!-- Retry Progress -->
              <div v-if="isRetrying" class="retry-progress mb-6">
                <div class="text-center mb-4">
                  <h4 class="text-h6 font-weight-medium">Reconnecting...</h4>
                  <p class="text-body-2 text-medium-emphasis">
                    Attempt {{ retryAttempts }} of {{ maxRetries }}
                  </p>
                </div>

                <v-progress-linear
                    :model-value="retryProgress"
                    color="primary"
                    height="8"
                    rounded
                    indeterminate
                    class="mb-3"
                />

                <div class="text-center">
                  <span class="text-body-2">
                    Next attempt in {{ nextRetryIn }} seconds
                  </span>
                </div>
              </div>

              <!-- Offline Capabilities -->
              <div class="offline-capabilities mb-6">
                <h3 class="text-h6 font-weight-bold mb-3">What You Can Do Offline</h3>

                <v-row>
                  <v-col cols="12" sm="6">
                    <v-card
                        variant="outlined"
                        class="capability-card"
                        :class="{ 'capability-available': offlineFeatures.browsing }"
                    >
                      <v-card-text class="text-center pa-4">
                        <v-icon
                            :color="offlineFeatures.browsing ? 'success' : 'grey'"
                            size="48"
                            class="mb-3"
                        >
                          mdi-view-grid
                        </v-icon>
                        <h4 class="text-subtitle-1 font-weight-bold mb-2">
                          Browse Products
                        </h4>
                        <p class="text-body-2">
                          {{ offlineFeatures.browsing
                            ? 'View cached products and categories'
                            : 'Requires internet connection' }}
                        </p>
                        <v-chip
                            :color="offlineFeatures.browsing ? 'success' : 'error'"
                            size="small"
                            variant="flat"
                            class="mt-2"
                        >
                          {{ offlineFeatures.browsing ? 'Available' : 'Unavailable' }}
                        </v-chip>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-card
                        variant="outlined"
                        class="capability-card"
                        :class="{ 'capability-available': offlineFeatures.transactions }"
                    >
                      <v-card-text class="text-center pa-4">
                        <v-icon
                            :color="offlineFeatures.transactions ? 'warning' : 'grey'"
                            size="48"
                            class="mb-3"
                        >
                          mdi-credit-card
                        </v-icon>
                        <h4 class="text-subtitle-1 font-weight-bold mb-2">
                          Process Payments
                        </h4>
                        <p class="text-body-2">
                          {{ offlineFeatures.transactions
                            ? 'Limited offline payment processing'
                            : 'Requires internet connection' }}
                        </p>
                        <v-chip
                            :color="offlineFeatures.transactions ? 'warning' : 'error'"
                            size="small"
                            variant="flat"
                            class="mt-2"
                        >
                          {{ offlineFeatures.transactions ? 'Limited' : 'Unavailable' }}
                        </v-chip>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>

              <!-- Cached Data Status -->
              <div class="cached-data mb-6">
                <h3 class="text-h6 font-weight-bold mb-3">Cached Data</h3>

                <v-card variant="tonal" color="info" class="pa-4">
                  <div class="cache-stats">
                    <div class="cache-item">
                      <v-icon class="mr-2">mdi-store</v-icon>
                      <span>Channels: {{ cacheStats.channels }}</span>
                    </div>

                    <div class="cache-item">
                      <v-icon class="mr-2">mdi-view-grid</v-icon>
                      <span>Categories: {{ cacheStats.categories }}</span>
                    </div>

                    <div class="cache-item">
                      <v-icon class="mr-2">mdi-package</v-icon>
                      <span>Products: {{ cacheStats.products }}</span>
                    </div>

                    <div class="cache-item">
                      <v-icon class="mr-2">mdi-clock</v-icon>
                      <span>Last Update: {{ formatTime(cacheStats.lastUpdate) }}</span>
                    </div>
                  </div>
                </v-card>
              </div>

              <!-- Troubleshooting -->
              <div class="troubleshooting">
                <h3 class="text-h6 font-weight-bold mb-3">Troubleshooting</h3>

                <v-expansion-panels variant="accordion">
                  <v-expansion-panel
                      v-for="(item, index) in troubleshootingItems"
                      :key="index"
                      :title="item.title"
                  >
                    <v-expansion-panel-text>
                      <div class="troubleshooting-content">
                        <p class="text-body-2 mb-3">{{ item.description }}</p>

                        <div class="troubleshooting-steps">
                          <h5 class="text-subtitle-2 font-weight-bold mb-2">Steps:</h5>
                          <ol class="steps-list">
                            <li v-for="step in item.steps" :key="step" class="step-item">
                              {{ step }}
                            </li>
                          </ol>
                        </div>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-card-text>

            <!-- Actions -->
            <div class="offline-actions">
              <v-row>
                <v-col cols="12" sm="4">
                  <v-btn
                      :loading="isRetrying"
                      :disabled="isRetrying"
                      color="primary"
                      variant="elevated"
                      size="large"
                      block
                      @click="retryConnection"
                  >
                    <v-icon class="mr-2">mdi-refresh</v-icon>
                    {{ isRetrying ? 'Retrying...' : 'Retry Now' }}
                  </v-btn>
                </v-col>

                <v-col cols="12" sm="4">
                  <v-btn
                      :disabled="!offlineFeatures.browsing"
                      color="success"
                      variant="outlined"
                      size="large"
                      block
                      @click="browseOffline"
                  >
                    <v-icon class="mr-2">mdi-view-grid</v-icon>
                    Browse Offline
                  </v-btn>
                </v-col>

                <v-col cols="12" sm="4">
                  <v-btn
                      color="info"
                      variant="outlined"
                      size="large"
                      block
                      @click="showDiagnostics = true"
                  >
                    <v-icon class="mr-2">mdi-wrench</v-icon>
                    Diagnostics
                  </v-btn>
                </v-col>
              </v-row>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Diagnostics Dialog -->
    <v-dialog v-model="showDiagnostics" max-width="600" persistent>
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="mr-2">mdi-wrench</v-icon>
          Network Diagnostics
        </v-card-title>

        <v-card-text>
          <div class="diagnostics-content">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Connection Tests</h4>

            <div class="diagnostic-tests">
              <div
                  v-for="test in diagnosticTests"
                  :key="test.name"
                  class="diagnostic-test"
              >
                <div class="test-info">
                  <div class="test-name">{{ test.name }}</div>
                  <div class="test-description">{{ test.description }}</div>
                </div>

                <div class="test-status">
                  <v-icon
                      :color="test.status === 'pass' ? 'success' : test.status === 'fail' ? 'error' : 'warning'"
                      size="20"
                  >
                    {{ getTestIcon(test.status) }}
                  </v-icon>
                  <span class="test-result">{{ test.result }}</span>
                </div>
              </div>
            </div>

            <v-divider class="my-4" />

            <div class="system-info">
              <h4 class="text-subtitle-1 font-weight-bold mb-3">System Information</h4>

              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Device ID:</span>
                  <span class="info-value">{{ systemInfo.deviceId }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Network Interface:</span>
                  <span class="info-value">{{ systemInfo.networkInterface }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">DNS Servers:</span>
                  <span class="info-value">{{ systemInfo.dnsServers }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Last Sync:</span>
                  <span class="info-value">{{ formatTime(systemInfo.lastSync) }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDiagnostics = false">Close</v-btn>
          <v-btn
              color="primary"
              :loading="runningDiagnostics"
              @click="runDiagnostics"
          >
            Run Tests
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success/Error Messages -->
    <v-snackbar
        v-model="showMessage"
        :color="messageType"
        :timeout="4000"
        location="top"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">
          {{ messageType === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
        </v-icon>
        {{ message }}
      </div>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { databaseService } from '@/services/databaseService'

const router = useRouter()
const authStore = useAuthStore()

// State
const isRetrying = ref(false)
const retryAttempts = ref(0)
const maxRetries = ref(10)
const retryProgress = ref(0)
const nextRetryIn = ref(0)
const lastConnected = ref(new Date())
const offlineSince = ref(new Date())
const showDiagnostics = ref(false)
const runningDiagnostics = ref(false)
const showMessage = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

// Network status
const networkStatus = ref({
  online: navigator.onLine,
  connectionType: 'unknown',
  strength: 0
})

// Offline features availability
const offlineFeatures = ref({
  browsing: true,
  transactions: false,
  inventory: false
})

// Cache statistics
const cacheStats = ref({
  channels: 0,
  categories: 0,
  products: 0,
  lastUpdate: new Date()
})

// System information
const systemInfo = ref({
  deviceId: 'KIOSK-001',
  networkInterface: 'Ethernet',
  dnsServers: '8.8.8.8, 8.8.4.4',
  lastSync: new Date()
})

// Diagnostic tests
const diagnosticTests = ref([
  {
    name: 'Internet Connectivity',
    description: 'Check if device can reach the internet',
    status: 'fail' as 'pass' | 'fail' | 'running',
    result: 'No connection'
  },
  {
    name: 'DNS Resolution',
    description: 'Verify DNS servers are responding',
    status: 'fail' as 'pass' | 'fail' | 'running',
    result: 'DNS timeout'
  },
  {
    name: 'API Server',
    description: 'Test connection to kiosk API server',
    status: 'fail' as 'pass' | 'fail' | 'running',
    result: 'Server unreachable'
  },
  {
    name: 'Local Storage',
    description: 'Verify local database is accessible',
    status: 'pass' as 'pass' | 'fail' | 'running',
    result: 'Working normally'
  }
])

// Troubleshooting items
const troubleshootingItems = [
  {
    title: 'Check Network Cable',
    description: 'Physical network connection issues',
    steps: [
      'Verify ethernet cable is securely connected',
      'Check for visible damage to the cable',
      'Try a different network port if available',
      'Restart the network switch/router'
    ]
  },
  {
    title: 'WiFi Connection Issues',
    description: 'Wireless network connectivity problems',
    steps: [
      'Check if WiFi is enabled on the device',
      'Verify the correct network is selected',
      'Check WiFi signal strength',
      'Restart the WiFi adapter'
    ]
  },
  {
    title: 'DNS Resolution Problems',
    description: 'Domain name resolution failures',
    steps: [
      'Try using different DNS servers',
      'Clear DNS cache',
      'Check firewall settings',
      'Contact network administrator'
    ]
  },
  {
    title: 'Firewall/Proxy Issues',
    description: 'Network security blocking connections',
    steps: [
      'Check firewall allow rules',
      'Verify proxy settings if applicable',
      'Test with firewall temporarily disabled',
      'Contact IT support for whitelist updates'
    ]
  }
]

// Timers
let retryTimer: NodeJS.Timeout | null = null
let durationTimer: NodeJS.Timeout | null = null
let nextRetryTimer: NodeJS.Timeout | null = null

// Computed properties
const connectionAlert = computed(() => {
  if (isRetrying.value) {
    return {
      type: 'info',
      icon: 'mdi-loading mdi-spin',
      title: 'Reconnecting...',
      message: 'Attempting to restore internet connection. Please wait.'
    }
  } else if (!networkStatus.value.online) {
    return {
      type: 'error',
      icon: 'mdi-wifi-off',
      title: 'No Internet Connection',
      message: 'The kiosk cannot connect to the internet. Some features may be limited.'
    }
  } else {
    return {
      type: 'warning',
      icon: 'mdi-wifi-strength-1',
      title: 'Connection Issues',
      message: 'Internet connection is unstable. Experience may be affected.'
    }
  }
})

const offlineDuration = computed(() => {
  const now = new Date()
  const diff = now.getTime() - offlineSince.value.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else {
    return `${minutes}m`
  }
})

// Methods
const loadCacheStats = async () => {
  try {
    const stats = await databaseService.getCacheStats()
    cacheStats.value = {
      channels: stats.channels,
      categories: stats.categories,
      products: stats.products,
      lastUpdate: stats.lastSync || new Date()
    }

    // Update offline features based on cached data
    offlineFeatures.value.browsing = stats.channels > 0 && stats.products > 0
  } catch (error) {
    console.error('Failed to load cache stats:', error)
  }
}

const retryConnection = async () => {
  if (isRetrying.value) return

  isRetrying.value = true
  retryAttempts.value++
  retryProgress.value = 0

  try {
    // Simulate connection attempt
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if actually online
    if (navigator.onLine) {
      // Try to authenticate to verify connection
      try {
        await authStore.authenticate()

        showMessage.value = true
        message.value = 'Connection restored successfully!'
        messageType.value = 'success'

        // Navigate back to normal flow
        setTimeout(() => {
          router.push('/')
        }, 1500)

        return
      } catch (authError) {
        console.log('Authentication failed, but network is available')
      }
    }

    // Connection still failed
    throw new Error('Connection test failed')

  } catch (error) {
    console.error('Retry connection failed:', error)

    showMessage.value = true
    message.value = `Connection attempt ${retryAttempts.value} failed`
    messageType.value = 'error'

    // Schedule next retry
    if (retryAttempts.value < maxRetries.value) {
      scheduleNextRetry()
    }

  } finally {
    isRetrying.value = false
  }
}

const scheduleNextRetry = () => {
  const delay = Math.min(30, 5 * retryAttempts.value) // Max 30 seconds
  nextRetryIn.value = delay

  nextRetryTimer = setInterval(() => {
    if (nextRetryIn.value > 0) {
      nextRetryIn.value--
    } else {
      clearInterval(nextRetryTimer!)
      retryConnection()
    }
  }, 1000)
}

const browseOffline = () => {
  if (!offlineFeatures.value.browsing) {
    showMessage.value = true
    message.value = 'Offline browsing not available - no cached data'
    messageType.value = 'error'
    return
  }

  // Navigate to categories in offline mode
  router.push('/categories')
}

const runDiagnostics = async () => {
  runningDiagnostics.value = true

  // Reset all tests to running
  diagnosticTests.value.forEach(test => {
    test.status = 'running'
    test.result = 'Testing...'
  })

  // Run each test with delay for visual effect
  for (let i = 0; i < diagnosticTests.value.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const test = diagnosticTests.value[i]

    // Simulate test results
    switch (test.name) {
      case 'Internet Connectivity':
        test.status = navigator.onLine ? 'pass' : 'fail'
        test.result = navigator.onLine ? 'Connected' : 'No connection'
        break

      case 'DNS Resolution':
        test.status = 'fail' // Simulate DNS failure
        test.result = 'DNS timeout'
        break

      case 'API Server':
        test.status = 'fail'
        test.result = 'Server unreachable'
        break

      case 'Local Storage':
        test.status = 'pass'
        test.result = 'Working normally'
        break
    }
  }

  runningDiagnostics.value = false
}

const getTestIcon = (status: string): string => {
  switch (status) {
    case 'pass':
      return 'mdi-check-circle'
    case 'fail':
      return 'mdi-close-circle'
    case 'running':
      return 'mdi-loading mdi-spin'
    default:
      return 'mdi-help-circle'
  }
}

const formatTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Network event handlers
const handleOnline = () => {
  networkStatus.value.online = true
  retryConnection()
}

const handleOffline = () => {
  networkStatus.value.online = false
  offlineSince.value = new Date()
}

// Lifecycle
onMounted(async () => {
  // Load cached data stats
  await loadCacheStats()

  // Set up network event listeners
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Start automatic retry if not already retrying
  if (retryAttempts.value === 0) {
    scheduleNextRetry()
  }

  // Update duration timer
  durationTimer = setInterval(() => {
    // Force reactivity update for duration
  }, 60000) // Update every minute
})

onUnmounted(() => {
  // Clean up timers
  if (retryTimer) clearInterval(retryTimer)
  if (durationTimer) clearInterval(durationTimer)
  if (nextRetryTimer) clearInterval(nextRetryTimer)

  // Remove event listeners
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style scoped>
.offline-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #757575 0%, #424242 100%);
  padding: 2rem 0;
}

.offline-card {
  border-radius: 20px !important;
  max-width: 800px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.offline-header {
  background: linear-gradient(135deg, #757575 0%, #424242 100%);
  color: white;
  padding: 3rem 2rem;
  border-radius: 20px 20px 0 0;
}

.offline-icon {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}

.connection-details {
  margin-top: 1.5rem;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.status-row:last-child {
  border-bottom: none;
}

.status-label {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.status-value {
  font-weight: 600;
}

.retry-progress {
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
}

.capability-card {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 12px !important;
}

.capability-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.capability-available {
  border-color: rgba(var(--v-theme-success), 0.5);
  background: rgba(var(--v-theme-success), 0.05);
}

.cache-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.cache-item {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.troubleshooting-content {
  padding: 1rem 0;
}

.steps-list {
  padding-left: 1.5rem;
}

.step-item {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.offline-actions {
  padding: 2rem;
  background: rgba(var(--v-theme-surface), 0.3);
  border-radius: 0 0 20px 20px;
}

.diagnostics-content {
  max-height: 500px;
  overflow-y: auto;
}

.diagnostic-tests {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.diagnostic-test {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  background: rgba(var(--v-theme-surface), 0.5);
}

.test-info {
  flex: 1;
}

.test-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.test-description {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.test-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.test-result {
  font-weight: 500;
  min-width: 120px;
  text-align: right;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.info-label {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.info-value {
  font-weight: 600;
  text-align: right;
}

/* Loading animation for spinning icon */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.mdi-spin {
  animation: spin 1s linear infinite;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .offline-view {
    padding: 1rem 0;
  }

  .offline-header {
    padding: 2rem 1rem;
  }

  .offline-card .v-card-text {
    padding: 1rem;
  }

  .offline-actions {
    padding: 1rem;
  }

  .cache-stats {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .diagnostic-test {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .test-status {
    align-self: flex-end;
  }
}

/* Touch optimization */
@media (hover: none) and (pointer: coarse) {
  .capability-card:active {
    transform: scale(0.98);
  }

  .v-btn {
    min-height: 48px;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .offline-card {
    border: 3px solid #000;
    background: #fff;
  }

  .offline-header {
    background: #000 !important;
    color: #fff !important;
  }

  .diagnostic-test {
    border: 2px solid #000;
  }

  .capability-available {
    border: 2px solid #000;
    background: #fff;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .offline-icon,
  .capability-card {
    animation: none;
    transition: none;
  }

  .capability-card:hover {
    transform: none;
  }

  .mdi-spin {
    animation: none;
  }
}

/* Connection status indicators */
.connection-status {
  position: relative;
}

.connection-status::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 8px,
      rgba(244, 67, 54, 0.1) 8px,
      rgba(244, 67, 54, 0.1) 16px
  );
  border-radius: 8px;
  pointer-events: none;
}

/* Retry progress animation */
.retry-progress .v-progress-linear {
  animation: progressGlow 2s ease-in-out infinite;
}

@keyframes progressGlow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Success state */
.connection-restored {
  animation: celebrationPulse 0.6s ease;
}

@keyframes celebrationPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); background: rgba(76, 175, 80, 0.1); }
  100% { transform: scale(1); }
}
</style>