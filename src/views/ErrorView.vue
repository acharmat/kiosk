<template>
  <div class="error-view">
    <v-container fluid class="h-100">
      <v-row justify="center" align="center" class="h-100">
        <v-col cols="12" md="8" lg="6">
          <v-card class="error-card" elevation="12">
            <!-- Error Icon -->
            <div class="error-header">
              <div class="text-center">
                <v-icon
                    size="120"
                    color="error"
                    class="mb-4 error-icon"
                >
                  mdi-alert-circle
                </v-icon>

                <h1 class="text-h2 font-weight-bold mb-4">
                  {{ errorTitle }}
                </h1>

                <p class="text-h5 text-medium-emphasis mb-6">
                  {{ errorMessage }}
                </p>
              </div>
            </div>

            <v-divider />

            <v-card-text class="pa-8">
              <!-- Error Details -->
              <div class="error-details mb-6">
                <v-alert
                    type="error"
                    variant="tonal"
                    prominent
                    class="mb-4"
                >
                  <v-alert-title>
                    <v-icon class="mr-2">mdi-information</v-icon>
                    Error Details
                  </v-alert-title>
                  <div>
                    <strong>Error Code:</strong> {{ errorCode }}<br>
                    <strong>Time:</strong> {{ formatDateTime(errorTime) }}<br>
                    <strong>Component:</strong> {{ errorComponent || 'Unknown' }}
                  </div>
                </v-alert>

                <!-- Error Description -->
                <div v-if="errorDescription" class="error-description">
                  <v-card variant="outlined" class="pa-4">
                    <h3 class="text-h6 font-weight-bold mb-3">What Happened?</h3>
                    <p class="text-body-1">{{ errorDescription }}</p>
                  </v-card>
                </div>
              </div>

              <!-- Suggested Actions -->
              <div class="suggested-actions mb-6">
                <h3 class="text-h6 font-weight-bold mb-3">Suggested Actions</h3>

                <v-list class="action-list">
                  <v-list-item
                      v-for="(action, index) in suggestedActions"
                      :key="index"
                      class="action-item"
                  >
                    <template v-slot:prepend>
                      <v-icon :color="action.color">{{ action.icon }}</v-icon>
                    </template>

                    <v-list-item-title>{{ action.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ action.description }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </div>

              <!-- Technical Information (collapsible) -->
              <div class="technical-info">
                <v-expansion-panels variant="accordion">
                  <v-expansion-panel title="Technical Information">
                    <v-expansion-panel-text>
                      <div class="tech-details">
                        <div class="detail-row">
                          <span class="detail-label">Error ID:</span>
                          <span class="detail-value">{{ errorId }}</span>
                        </div>

                        <div class="detail-row">
                          <span class="detail-label">Browser:</span>
                          <span class="detail-value">{{ browserInfo }}</span>
                        </div>

                        <div class="detail-row">
                          <span class="detail-label">Device:</span>
                          <span class="detail-value">{{ deviceInfo }}</span>
                        </div>

                        <div class="detail-row">
                          <span class="detail-label">URL:</span>
                          <span class="detail-value">{{ currentUrl }}</span>
                        </div>

                        <div v-if="stackTrace" class="detail-row">
                          <span class="detail-label">Stack Trace:</span>
                          <pre class="stack-trace">{{ stackTrace }}</pre>
                        </div>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-card-text>

            <!-- Actions -->
            <div class="error-actions">
              <v-row>
                <v-col cols="12" sm="4">
                  <v-btn
                      color="primary"
                      variant="elevated"
                      size="large"
                      block
                      @click="goHome"
                  >
                    <v-icon class="mr-2">mdi-home</v-icon>
                    Go Home
                  </v-btn>
                </v-col>

                <v-col cols="12" sm="4">
                  <v-btn
                      color="primary"
                      variant="outlined"
                      size="large"
                      block
                      @click="goBack"
                  >
                    <v-icon class="mr-2">mdi-arrow-left</v-icon>
                    Go Back
                  </v-btn>
                </v-col>

                <v-col cols="12" sm="4">
                  <v-btn
                      color="warning"
                      variant="outlined"
                      size="large"
                      block
                      @click="reportError"
                  >
                    <v-icon class="mr-2">mdi-bug-outline</v-icon>
                    Report Issue
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Emergency Access -->
              <div class="emergency-access mt-4 text-center">
                <v-btn
                    color="error"
                    variant="text"
                    size="small"
                    @click="showMaintenanceDialog = true"
                >
                  <v-icon class="mr-2">mdi-wrench</v-icon>
                  Maintenance Access
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Maintenance Access Dialog -->
    <v-dialog v-model="showMaintenanceDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 bg-error text-white">
          <v-icon class="mr-2">mdi-shield-key</v-icon>
          Maintenance Access
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="maintenanceForm" @submit.prevent="validateMaintenanceCode">
            <v-text-field
                v-model="maintenanceCode"
                label="Maintenance Code"
                type="password"
                variant="outlined"
                :rules="[rules.required]"
                @keyup.enter="validateMaintenanceCode"
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showMaintenanceDialog = false">Cancel</v-btn>
          <v-btn
              color="error"
              :loading="validatingCode"
              @click="validateMaintenanceCode"
          >
            Access
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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { errorService } from '@/services/errorService'

const route = useRoute()
const router = useRouter()

// Form refs
const maintenanceForm = ref()

// State
const errorTitle = ref('Application Error')
const errorMessage = ref('An unexpected error occurred')
const errorCode = ref('UNKNOWN_ERROR')
const errorComponent = ref('')
const errorDescription = ref('')
const errorTime = ref(new Date())
const errorId = ref('')
const stackTrace = ref('')
const showMaintenanceDialog = ref(false)
const maintenanceCode = ref('')
const validatingCode = ref(false)
const showMessage = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('error')

// Validation rules
const rules = {
  required: (value: string) => !!value || 'This field is required'
}

// Computed properties
const currentUrl = computed(() => window.location.href)

const browserInfo = computed(() => {
  return `${navigator.userAgent.split(' ').slice(-2).join(' ')}`
})

const deviceInfo = computed(() => {
  return `${navigator.platform} - ${screen.width}x${screen.height}`
})

const suggestedActions = computed(() => {
  const actions = [
    {
      icon: 'mdi-refresh',
      color: 'primary',
      title: 'Refresh the page',
      description: 'Sometimes a simple refresh can resolve the issue'
    },
    {
      icon: 'mdi-wifi-check',
      color: 'info',
      title: 'Check your connection',
      description: 'Ensure you have a stable internet connection'
    },
    {
      icon: 'mdi-clock',
      color: 'warning',
      title: 'Wait and try again',
      description: 'The issue might be temporary'
    }
  ]

  // Add specific actions based on error type
  if (errorCode.value.includes('NETWORK')) {
    actions.unshift({
      icon: 'mdi-wifi-off',
      color: 'error',
      title: 'Network connection issue',
      description: 'Check your internet connection and try again'
    })
  }

  if (errorCode.value.includes('AUTH')) {
    actions.unshift({
      icon: 'mdi-account-alert',
      color: 'warning',
      title: 'Authentication problem',
      description: 'You may need to re-authenticate your device'
    })
  }

  return actions
})

// Methods
const parseErrorFromRoute = () => {
  const query = route.query

  errorTitle.value = (query.title as string) || 'Application Error'
  errorMessage.value = (query.message as string) || 'An unexpected error occurred'
  errorCode.value = (query.code as string) || 'UNKNOWN_ERROR'
  errorComponent.value = (query.component as string) || ''
  errorDescription.value = (query.description as string) || ''
  errorId.value = (query.id as string) || generateErrorId()
  stackTrace.value = (query.stack as string) || ''

  if (query.timestamp) {
    errorTime.value = new Date(query.timestamp as string)
  }
}

const generateErrorId = (): string => {
  return `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
}

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    goHome()
  }
}

const reportError = async () => {
  try {
    await errorService.reportError({
      error_code: errorCode.value,
      error_message: errorMessage.value,
      error_level: 'error',
      component: errorComponent.value || 'error_view',
      additional_data: {
        errorId: errorId.value,
        url: currentUrl.value,
        timestamp: errorTime.value.toISOString(),
        stackTrace: stackTrace.value,
        userAgent: navigator.userAgent
      }
    })

    showMessage.value = true
    message.value = 'Error report sent successfully'
    messageType.value = 'success'
  } catch (error) {
    showMessage.value = true
    message.value = 'Failed to send error report'
    messageType.value = 'error'
  }
}

const validateMaintenanceCode = async () => {
  if (!maintenanceForm.value) return

  const { valid } = await maintenanceForm.value.validate()
  if (!valid) return

  validatingCode.value = true

  try {
    // Validate maintenance code
    const validCodes = ['ADMIN123', 'MAINTENANCE', 'OVERRIDE', 'EMERGENCY']

    if (validCodes.includes(maintenanceCode.value.toUpperCase())) {
      showMaintenanceDialog.value = false
      maintenanceCode.value = ''

      // Navigate to maintenance view
      router.push('/maintenance')
    } else {
      showMessage.value = true
      message.value = 'Invalid maintenance code'
      messageType.value = 'error'
      maintenanceCode.value = ''
    }
  } catch (error) {
    console.error('Maintenance code validation failed:', error)
    showMessage.value = true
    message.value = 'Validation failed'
    messageType.value = 'error'
  } finally {
    validatingCode.value = false
  }
}

const formatDateTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  parseErrorFromRoute()

  // Report the error automatically
  reportError()
})
</script>

<style scoped>
.error-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  padding: 2rem 0;
}

.error-card {
  border-radius: 20px !important;
  max-width: 800px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.error-header {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  padding: 3rem 2rem;
  border-radius: 20px 20px 0 0;
}

.error-icon {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}

.error-description {
  margin-top: 1.5rem;
}

.action-list {
  background: transparent;
}

.action-item {
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: rgba(var(--v-theme-surface), 0.5);
}

.tech-details {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.detail-row {
  display: flex;
  margin-bottom: 0.75rem;
  align-items: flex-start;
}

.detail-label {
  font-weight: 600;
  min-width: 120px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.detail-value {
  flex: 1;
  word-break: break-all;
}

.stack-trace {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.75rem;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  margin-top: 0.5rem;
  border: 1px solid #ddd;
}

.error-actions {
  padding: 2rem;
  background: rgba(var(--v-theme-surface), 0.3);
  border-radius: 0 0 20px 20px;
}

.emergency-access {
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.emergency-access:hover {
  opacity: 1;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .error-view {
    padding: 1rem 0;
  }

  .error-header {
    padding: 2rem 1rem;
  }

  .error-card .v-card-text {
    padding: 1rem;
  }

  .error-actions {
    padding: 1rem;
  }

  .detail-row {
    flex-direction: column;
  }

  .detail-label {
    min-width: auto;
    margin-bottom: 0.25rem;
  }
}

/* Touch optimization */
@media (hover: none) and (pointer: coarse) {
  .v-btn {
    min-height: 48px;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .error-card {
    border: 3px solid #000;
    background: #fff;
  }

  .error-header {
    background: #000 !important;
    color: #fff !important;
  }

  .action-item {
    border: 1px solid #000;
  }

  .stack-trace {
    border: 2px solid #000;
    background: #fff;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .error-icon {
    animation: none;
  }
}

/* Error severity styling */
.error-view.critical {
  background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
}

.error-view.warning {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
}

.error-view.info {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}
</style>