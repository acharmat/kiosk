<template>
  <div class="setup-container">
    <v-container fluid class="h-100">
      <v-row justify="center" align="center" class="h-100">
        <v-col cols="12" md="8" lg="6" xl="4">
          <v-card class="setup-card" elevation="8">
            <!-- Header -->
            <v-card-title class="setup-header">
              <div class="text-center w-100">
                <v-icon size="64" color="primary" class="mb-4">
                  mdi-cog-outline
                </v-icon>
                <h1 class="text-h4 font-weight-bold">Kiosk Setup</h1>
                <p class="text-body-1 mt-2 text-medium-emphasis">
                  Configure your kiosk terminal
                </p>
              </div>
            </v-card-title>

            <v-card-text class="pa-6">
              <!-- Setup steps -->
              <v-stepper
                  v-model="currentStep"
                  :items="setupSteps"
                  hide-actions
                  elevation="0"
                  class="setup-stepper"
              >
                <!-- Step 1: Device Information -->
                <template v-slot:item.1>
                  <div class="step-content">
                    <h3 class="text-h6 mb-4">Device Information</h3>

                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                            v-model="deviceInfo.serialNumber"
                            label="Serial Number"
                            prepend-icon="mdi-identifier"
                            variant="outlined"
                            readonly
                            hint="This is automatically detected"
                            persistent-hint
                        />
                      </v-col>

                      <v-col cols="12">
                        <v-text-field
                            v-model="deviceInfo.macAddress"
                            label="MAC Address"
                            prepend-icon="mdi-network"
                            variant="outlined"
                            readonly
                            hint="Network interface identifier"
                            persistent-hint
                        />
                      </v-col>

                      <v-col cols="12">
                        <v-text-field
                            v-model="deviceInfo.uuid"
                            label="Device UUID"
                            prepend-icon="mdi-key"
                            variant="outlined"
                            readonly
                            hint="Unique device identifier"
                            persistent-hint
                        />
                      </v-col>
                    </v-row>

                    <v-alert
                        v-if="deviceInfo.serialNumber && deviceInfo.macAddress"
                        type="success"
                        variant="tonal"
                        class="mt-4"
                    >
                      Device information detected successfully
                    </v-alert>
                  </div>
                </template>

                <!-- Step 2: Server Configuration -->
                <template v-slot:item.2>
                  <div class="step-content">
                    <h3 class="text-h6 mb-4">Server Configuration</h3>

                    <v-form ref="serverForm" @submit.prevent="testConnection">
                      <v-row>
                        <v-col cols="12">
                          <v-text-field
                              v-model="serverConfig.baseUrl"
                              label="Server URL"
                              prepend-icon="mdi-server"
                              variant="outlined"
                              :rules="[rules.required, rules.url]"
                              hint="e.g., https://api.example.com"
                              persistent-hint
                              @blur="validateUrl"
                          />
                        </v-col>

                        <v-col cols="12">
                          <v-btn
                              :loading="testingConnection"
                              :disabled="!serverConfig.baseUrl"
                              color="primary"
                              variant="outlined"
                              @click="testConnection"
                              block
                          >
                            <v-icon class="mr-2">mdi-connection</v-icon>
                            Test Connection
                          </v-btn>
                        </v-col>
                      </v-row>
                    </v-form>

                    <v-alert
                        v-if="connectionStatus.tested"
                        :type="connectionStatus.success ? 'success' : 'error'"
                        variant="tonal"
                        class="mt-4"
                    >
                      <div class="d-flex align-center">
                        <v-icon class="mr-2">
                          {{ connectionStatus.success ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                        </v-icon>
                        {{ connectionStatus.message }}
                      </div>
                    </v-alert>
                  </div>
                </template>

                <!-- Step 3: Registration -->
                <template v-slot:item.3>
                  <div class="step-content">
                    <h3 class="text-h6 mb-4">Device Registration</h3>

                    <v-radio-group v-model="registrationMethod" class="mb-4">
                      <v-radio
                          label="Authenticate existing device"
                          value="authenticate"
                      />
                      <v-radio
                          label="Register new device (if auto-registration enabled)"
                          value="register"
                      />
                    </v-radio-group>

                    <!-- Location permission (for registration) -->
                    <div v-if="registrationMethod === 'register'" class="mb-4">
                      <v-card variant="outlined">
                        <v-card-text>
                          <div class="d-flex align-center mb-3">
                            <v-icon class="mr-2">mdi-map-marker</v-icon>
                            <span class="font-weight-medium">Location Information</span>
                          </div>

                          <p class="text-body-2 mb-3">
                            Optionally share your location to help with device registration and analytics.
                          </p>

                          <v-btn
                              :loading="gettingLocation"
                              color="primary"
                              variant="outlined"
                              @click="requestLocation"
                              small
                          >
                            <v-icon class="mr-2">mdi-crosshairs-gps</v-icon>
                            Get Current Location
                          </v-btn>

                          <div v-if="location" class="mt-3">
                            <v-chip color="success" size="small">
                              <v-icon class="mr-1">mdi-check</v-icon>
                              Location obtained
                            </v-chip>
                            <p class="text-caption mt-1">
                              Latitude: {{ location.latitude.toFixed(6) }}<br>
                              Longitude: {{ location.longitude.toFixed(6) }}
                            </p>
                          </div>
                        </v-card-text>
                      </v-card>
                    </div>

                    <v-btn
                        :loading="processing"
                        :disabled="!connectionStatus.success"
                        color="primary"
                        size="large"
                        @click="processRegistration"
                        block
                    >
                      <v-icon class="mr-2">
                        {{ registrationMethod === 'register' ? 'mdi-account-plus' : 'mdi-login' }}
                      </v-icon>
                      {{ registrationMethod === 'register' ? 'Register Device' : 'Authenticate Device' }}
                    </v-btn>
                  </div>
                </template>

                <!-- Step 4: Completion -->
                <template v-slot:item.4>
                  <div class="step-content text-center">
                    <v-icon
                        size="80"
                        :color="setupComplete ? 'success' : 'primary'"
                        class="mb-4"
                    >
                      {{ setupComplete ? 'mdi-check-circle' : 'mdi-loading mdi-spin' }}
                    </v-icon>

                    <h3 class="text-h5 mb-3">
                      {{ setupComplete ? 'Setup Complete!' : 'Finalizing Setup...' }}
                    </h3>

                    <p class="text-body-1 mb-4">
                      {{
                        setupComplete
                            ? 'Your kiosk is now ready to use'
                            : 'Please wait while we finalize the configuration'
                      }}
                    </p>

                    <div v-if="kioskInfo" class="kiosk-info">
                      <v-card variant="outlined" class="text-left">
                        <v-card-text>
                          <div class="info-row">
                            <strong>Kiosk Name:</strong> {{ kioskInfo.name }}
                          </div>
                          <div class="info-row">
                            <strong>Status:</strong>
                            <v-chip :color="getStatusColor(kioskInfo.status)" size="small" class="ml-2">
                              {{ kioskInfo.status }}
                            </v-chip>
                          </div>
                          <div class="info-row">
                            <strong>Channels:</strong> {{ kioskInfo.channels?.length || 0 }}
                          </div>
                          <div class="info-row">
                            <strong>UUID:</strong> {{ kioskInfo.uuid?.slice(0, 8) }}...
                          </div>
                        </v-card-text>
                      </v-card>
                    </div>

                    <v-btn
                        v-if="setupComplete"
                        color="primary"
                        size="large"
                        @click="startUsing"
                        class="mt-4"
                    >
                      <v-icon class="mr-2">mdi-rocket-launch</v-icon>
                      Start Using Kiosk
                    </v-btn>
                  </div>
                </template>
              </v-stepper>
            </v-card-text>

            <!-- Navigation -->
            <v-card-actions class="pa-6 pt-0">
              <v-btn
                  v-if="currentStep > 1 && !setupComplete"
                  @click="previousStep"
                  variant="outlined"
              >
                <v-icon class="mr-2">mdi-arrow-left</v-icon>
                Previous
              </v-btn>

              <v-spacer />

              <v-btn
                  v-if="currentStep < setupSteps.length && !setupComplete"
                  :disabled="!canProceed"
                  color="primary"
                  @click="nextStep"
              >
                Next
                <v-icon class="ml-2">mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Error dialog -->
    <v-dialog v-model="showErrorDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-h6 bg-error text-white">
          <v-icon class="mr-2">mdi-alert-circle</v-icon>
          Setup Error
        </v-card-title>

        <v-card-text class="pt-4">
          <p>{{ errorMessage }}</p>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showErrorDialog = false">OK</v-btn>
          <v-btn v-if="canRetry" color="primary" @click="retryLastAction">
            Retry
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/apiService'
import type { DeviceInfo } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

// Form refs
const serverForm = ref()

// State
const currentStep = ref(1)
const deviceInfo = ref<DeviceInfo>({
  serialNumber: '',
  macAddress: '',
  uuid: ''
})
const serverConfig = ref({
  baseUrl: ''
})
const connectionStatus = ref({
  tested: false,
  success: false,
  message: ''
})
const registrationMethod = ref<'authenticate' | 'register'>('authenticate')
const location = ref<{ latitude: number; longitude: number } | null>(null)
const gettingLocation = ref(false)
const testingConnection = ref(false)
const processing = ref(false)
const setupComplete = ref(false)
const kioskInfo = ref<any>(null)
const showErrorDialog = ref(false)
const errorMessage = ref('')
const canRetry = ref(false)
const lastAction = ref<(() => Promise<void>) | null>(null)

// Setup steps configuration
const setupSteps = [
  { title: 'Device Info', value: 1 },
  { title: 'Server Config', value: 2 },
  { title: 'Registration', value: 3 },
  { title: 'Complete', value: 4 }
]

// Validation rules
const rules = {
  required: (value: string) => !!value || 'This field is required',
  url: (value: string) => {
    try {
      new URL(value)
      return true
    } catch {
      return 'Please enter a valid URL'
    }
  }
}

// Computed properties
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return deviceInfo.value.serialNumber && deviceInfo.value.macAddress
    case 2:
      return connectionStatus.value.success
    case 3:
      return connectionStatus.value.success
    default:
      return true
  }
})

// Methods
const loadDeviceInfo = async () => {
  try {
    const info = await authStore.loadDeviceInfo()
    deviceInfo.value = authStore.deviceInfo || deviceInfo.value
  } catch (error) {
    showError('Failed to load device information', true)
  }
}

const validateUrl = () => {
  if (serverConfig.value.baseUrl) {
    try {
      new URL(serverConfig.value.baseUrl)
      // Remove trailing slash
      serverConfig.value.baseUrl = serverConfig.value.baseUrl.replace(/\/$/, '')
    } catch {
      // Invalid URL
    }
  }
}

const testConnection = async () => {
  if (!serverConfig.value.baseUrl) return

  testingConnection.value = true
  connectionStatus.value.tested = false

  try {
    // Set base URL for testing
    apiService.setBaseUrl(serverConfig.value.baseUrl)

    // Test connection
    const isConnected = await apiService.testConnection()

    connectionStatus.value = {
      tested: true,
      success: isConnected,
      message: isConnected
          ? 'Connection successful!'
          : 'Connection failed. Please check the URL and try again.'
    }

    // Save server config if successful
    if (isConnected) {
      await authStore.saveApiConfig(serverConfig.value.baseUrl)
    }

  } catch (error) {
    connectionStatus.value = {
      tested: true,
      success: false,
      message: 'Connection failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  } finally {
    testingConnection.value = false
  }
}

const requestLocation = async () => {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by this browser')
    return
  }

  gettingLocation.value = true

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      })
    })

    location.value = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }
  } catch (error) {
    console.error('Geolocation error:', error)
    showError('Failed to get location. You can continue without it.')
  } finally {
    gettingLocation.value = false
  }
}

const processRegistration = async () => {
  processing.value = true

  try {
    if (registrationMethod.value === 'register') {
      await authStore.register(location.value || undefined)

      // After successful registration, try to authenticate
      setTimeout(async () => {
        try {
          const response = await authStore.authenticate()
          kioskInfo.value = response.data
          setupComplete.value = true
          await authStore.completeSetup()
        } catch (error) {
          showError('Registration successful, but authentication failed. You may need admin approval.', false)
          setupComplete.value = true
        }
      }, 2000)

    } else {
      // Authenticate existing device
      const response = await authStore.authenticate()
      kioskInfo.value = response.data
      setupComplete.value = true
      await authStore.completeSetup()
    }

    // Move to completion step
    currentStep.value = 4

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    showError(message, true)
    lastAction.value = processRegistration
  } finally {
    processing.value = false
  }
}

const startUsing = () => {
  // Navigate to appropriate page based on configuration
  if (authStore.kioskConfig?.channels.length === 1) {
    router.push('/categories')
  } else if (authStore.kioskConfig?.channels.length > 1) {
    router.push('/channels')
  } else {
    router.push('/')
  }
}

const nextStep = () => {
  if (currentStep.value < setupSteps.length) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const showError = (message: string, retry: boolean = false) => {
  errorMessage.value = message
  canRetry.value = retry
  showErrorDialog.value = true
}

const retryLastAction = async () => {
  if (lastAction.value) {
    showErrorDialog.value = false
    await lastAction.value()
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'maintenance': return 'warning'
    case 'offline': return 'error'
    default: return 'info'
  }
}

// Lifecycle
onMounted(async () => {
  await loadDeviceInfo()

  // Pre-fill server URL if available
  if (authStore.apiBaseUrl) {
    serverConfig.value.baseUrl = authStore.apiBaseUrl
    // Auto-test connection
    await testConnection()
  }
})
</script>

<style scoped>
.setup-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem 0;
}

.setup-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  max-width: 600px;
  margin: 0 auto;
}

.setup-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 16px 16px 0 0;
}

.setup-stepper {
  background: transparent;
}

.step-content {
  padding: 1rem 0;
  min-height: 300px;
}

.kiosk-info {
  margin-top: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.info-row:last-child {
  border-bottom: none;
}

/* Loading animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.mdi-spin {
  animation: spin 1s linear infinite;
}

/* Responsive design */
@media (max-width: 600px) {
  .setup-container {
    padding: 1rem;
  }

  .setup-card {
    margin: 0;
  }

  .setup-header {
    padding: 1.5rem;
  }

  .step-content {
    min-height: 250px;
  }
}

/* Touch optimization */
@media (hover: none) and (pointer: coarse) {
  .v-btn {
    min-height: 48px;
  }

  .v-text-field {
    font-size: 16px;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .setup-card {
    border: 2px solid #000;
    background: #fff;
  }

  .setup-header {
    background: #000;
    color: #fff;
  }
}
</style>