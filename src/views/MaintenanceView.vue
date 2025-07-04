<template>
  <div class="maintenance-view">
    <v-container fluid class="h-100">
      <v-row justify="center" align="center" class="h-100">
        <v-col cols="12" md="8" lg="6">
          <v-card class="maintenance-card" elevation="12">
            <!-- Maintenance Icon -->
            <div class="maintenance-header">
              <div class="text-center">
                <v-icon
                    size="120"
                    color="warning"
                    class="mb-4 maintenance-icon"
                >
                  mdi-wrench
                </v-icon>

                <h1 class="text-h2 font-weight-bold mb-4">
                  Maintenance Mode
                </h1>

                <p class="text-h5 text-medium-emphasis mb-6">
                  This kiosk is currently undergoing maintenance
                </p>
              </div>
            </div>

            <v-divider />

            <v-card-text class="pa-8">
              <!-- Maintenance Status -->
              <div class="maintenance-status mb-6">
                <v-alert
                    type="warning"
                    variant="tonal"
                    prominent
                    class="mb-4"
                >
                  <v-alert-title>
                    <v-icon class="mr-2">mdi-alert-circle</v-icon>
                    Service Temporarily Unavailable
                  </v-alert-title>
                  <div>
                    We're performing scheduled maintenance to improve your experience.
                    The kiosk will be back online shortly.
                  </div>
                </v-alert>

                <!-- Maintenance Details -->
                <div v-if="maintenanceInfo" class="maintenance-details">
                  <v-card variant="outlined" class="pa-4">
                    <h3 class="text-h6 font-weight-bold mb-3">Maintenance Information</h3>

                    <div class="detail-row">
                      <span class="detail-label">Started:</span>
                      <span class="detail-value">{{ formatTime(maintenanceInfo.startedAt) }}</span>
                    </div>

                    <div v-if="maintenanceInfo.reason" class="detail-row">
                      <span class="detail-label">Reason:</span>
                      <span class="detail-value">{{ maintenanceInfo.reason }}</span>
                    </div>

                    <div v-if="maintenanceInfo.estimatedDuration" class="detail-row">
                      <span class="detail-label">Est. Duration:</span>
                      <span class="detail-value">{{ maintenanceInfo.estimatedDuration }} minutes</span>
                    </div>

                    <div v-if="maintenanceInfo.estimatedCompletion" class="detail-row">
                      <span class="detail-label">Est. Completion:</span>
                      <span class="detail-value">{{ formatTime(maintenanceInfo.estimatedCompletion) }}</span>
                    </div>
                  </v-card>
                </div>
              </div>

              <!-- Progress Indicator -->
              <div v-if="showProgress" class="maintenance-progress mb-6">
                <div class="text-center mb-4">
                  <h4 class="text-h6 font-weight-medium">Maintenance Progress</h4>
                  <p class="text-body-2 text-medium-emphasis">
                    {{ Math.round(progressPercentage) }}% complete
                  </p>
                </div>

                <v-progress-linear
                    :model-value="progressPercentage"
                    color="warning"
                    height="8"
                    rounded
                    class="mb-3"
                />

                <div class="progress-steps">
                  <div
                      v-for="(step, index) in maintenanceSteps"
                      :key="index"
                      class="progress-step"
                      :class="{
                      'step-completed': index < currentStep,
                      'step-active': index === currentStep,
                      'step-pending': index > currentStep
                    }"
                  >
                    <v-icon
                        :color="getStepColor(index)"
                        size="20"
                        class="mr-2"
                    >
                      {{ getStepIcon(index) }}
                    </v-icon>
                    <span>{{ step.name }}</span>
                  </div>
                </div>
              </div>

              <!-- Alternative Services -->
              <div class="alternative-services mb-6">
                <h3 class="text-h6 font-weight-bold mb-3">Alternative Options</h3>

                <v-row>
                  <v-col cols="12" sm="6">
                    <v-card variant="outlined" class="alternative-card">
                      <v-card-text class="text-center pa-4">
                        <v-icon size="48" color="primary" class="mb-3">
                          mdi-store
                        </v-icon>
                        <h4 class="text-subtitle-1 font-weight-bold mb-2">
                          Visit Our Store
                        </h4>
                        <p class="text-body-2">
                          Find our nearest physical location for immediate service
                        </p>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-card variant="outlined" class="alternative-card">
                      <v-card-text class="text-center pa-4">
                        <v-icon size="48" color="info" class="mb-3">
                          mdi-web
                        </v-icon>
                        <h4 class="text-subtitle-1 font-weight-bold mb-2">
                          Online Store
                        </h4>
                        <p class="text-body-2">
                          Shop online and get your items delivered or for pickup
                        </p>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>

              <!-- Contact Information -->
              <div class="contact-info">
                <v-card variant="tonal" color="info" class="pa-4">
                  <div class="text-center">
                    <v-icon size="32" color="info" class="mb-2">
                      mdi-help-circle
                    </v-icon>
                    <h4 class="text-h6 font-weight-bold mb-3">Need Immediate Help?</h4>

                    <div class="contact-methods">
                      <div class="contact-method">
                        <v-icon class="mr-2">mdi-phone</v-icon>
                        <span>Call: +1 (555) 123-4567</span>
                      </div>

                      <div class="contact-method">
                        <v-icon class="mr-2">mdi-email</v-icon>
                        <span>Email: support@company.com</span>
                      </div>

                      <div class="contact-method">
                        <v-icon class="mr-2">mdi-web</v-icon>
                        <span>Web: www.company.com/support</span>
                      </div>
                    </div>
                  </div>
                </v-card>
              </div>
            </v-card-text>

            <!-- Actions -->
            <div class="maintenance-actions">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-btn
                      :loading="checking"
                      color="primary"
                      variant="outlined"
                      size="large"
                      block
                      @click="checkStatus"
                  >
                    <v-icon class="mr-2">mdi-refresh</v-icon>
                    Check Status
                  </v-btn>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-btn
                      color="info"
                      variant="outlined"
                      size="large"
                      block
                      @click="showNotifyDialog = true"
                  >
                    <v-icon class="mr-2">mdi-bell</v-icon>
                    Notify Me
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Emergency Access (Hidden) -->
              <div v-if="showEmergencyAccess" class="emergency-access mt-4">
                <v-btn
                    color="error"
                    variant="text"
                    size="small"
                    @click="showAdminDialog = true"
                    class="emergency-btn"
                >
                  <v-icon class="mr-2">mdi-shield-key</v-icon>
                  Emergency Access
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Notification Dialog -->
    <v-dialog v-model="showNotifyDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="mr-2">mdi-bell</v-icon>
          Get Notified When Ready
        </v-card-title>

        <v-card-text>
          <p class="text-body-1 mb-4">
            Enter your contact information to be notified when the kiosk is back online.
          </p>

          <v-form ref="notifyForm" @submit.prevent="submitNotification">
            <v-text-field
                v-model="notificationContact"
                :label="notificationType === 'email' ? 'Email Address' : 'Phone Number'"
                :type="notificationType === 'email' ? 'email' : 'tel'"
                variant="outlined"
                :rules="notificationRules"
                :prepend-inner-icon="notificationType === 'email' ? 'mdi-email' : 'mdi-phone'"
            />

            <v-radio-group v-model="notificationType" inline>
              <v-radio label="Email" value="email" />
              <v-radio label="SMS" value="sms" />
            </v-radio-group>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showNotifyDialog = false">Cancel</v-btn>
          <v-btn
              color="primary"
              :loading="submittingNotification"
              @click="submitNotification"
          >
            Notify Me
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Admin Access Dialog -->
    <v-dialog v-model="showAdminDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 bg-error text-white">
          <v-icon class="mr-2">mdi-shield-key</v-icon>
          Emergency Access
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="adminForm" @submit.prevent="validateAdminAccess">
            <v-text-field
                v-model="adminCode"
                label="Emergency Access Code"
                type="password"
                variant="outlined"
                :rules="[rules.required]"
                @keyup.enter="validateAdminAccess"
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showAdminDialog = false">Cancel</v-btn>
          <v-btn
              color="error"
              :loading="validatingAdmin"
              @click="validateAdminAccess"
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Form refs
const notifyForm = ref()
const adminForm = ref()

// State
const maintenanceInfo = ref({
  startedAt: new Date(),
  reason: 'Scheduled system updates and maintenance',
  estimatedDuration: 30,
  estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000)
})

const checking = ref(false)
const showNotifyDialog = ref(false)
const showAdminDialog = ref(false)
const showEmergencyAccess = ref(false)
const notificationContact = ref('')
const notificationType = ref<'email' | 'sms'>('email')
const submittingNotification = ref(false)
const adminCode = ref('')
const validatingAdmin = ref(false)
const showMessage = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

// Progress simulation
const currentStep = ref(0)
const progressPercentage = ref(15)
const showProgress = ref(true)

// Timers
let progressTimer: NodeJS.Timeout | null = null
let statusCheckTimer: NodeJS.Timeout | null = null

// Constants
const maintenanceSteps = [
  { name: 'System shutdown', duration: 2 },
  { name: 'Software updates', duration: 15 },
  { name: 'Hardware checks', duration: 8 },
  { name: 'Testing systems', duration: 3 },
  { name: 'Bringing online', duration: 2 }
]

// Validation rules
const rules = {
  required: (value: string) => !!value || 'This field is required'
}

const notificationRules = computed(() => {
  if (notificationType.value === 'email') {
    return [
      (value: string) => !!value || 'Email is required',
      (value: string) => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return pattern.test(value) || 'Please enter a valid email address'
      }
    ]
  } else {
    return [
      (value: string) => !!value || 'Phone number is required',
      (value: string) => {
        const pattern = /^[\+]?[\d\s\-\(\)]{10,}$/
        return pattern.test(value) || 'Please enter a valid phone number'
      }
    ]
  }
})

// Methods
const simulateProgress = () => {
  // Simulate maintenance progress
  progressTimer = setInterval(() => {
    if (progressPercentage.value < 100) {
      progressPercentage.value += 0.5 // Slow progress

      // Update current step based on progress
      const totalSteps = maintenanceSteps.length
      const stepProgress = Math.floor((progressPercentage.value / 100) * totalSteps)
      currentStep.value = Math.min(stepProgress, totalSteps - 1)
    } else {
      // Maintenance complete
      clearInterval(progressTimer!)
      checkMaintenanceCompletion()
    }
  }, 1000)
}

const checkMaintenanceCompletion = () => {
  // In a real implementation, this would check with the server
  console.log('Maintenance completed')
  showMessage.value = true
  message.value = 'Maintenance completed! Kiosk is coming back online...'
  messageType.value = 'success'

  // Auto-exit maintenance mode
  setTimeout(() => {
    exitMaintenanceMode()
  }, 3000)
}

const checkStatus = async () => {
  checking.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Try to authenticate to check if maintenance mode is still active
    if (authStore.isAuthenticated) {
      await authStore.authenticate()

      if (!authStore.isMaintenanceMode) {
        exitMaintenanceMode()
        return
      }
    }

    showMessage.value = true
    message.value = 'Still in maintenance mode. Please check back later.'
    messageType.value = 'info'

  } catch (error) {
    console.error('Status check failed:', error)
    showMessage.value = true
    message.value = 'Unable to check status. Please try again later.'
    messageType.value = 'error'
  } finally {
    checking.value = false
  }
}

const submitNotification = async () => {
  if (!notifyForm.value) return

  const { valid } = await notifyForm.value.validate()
  if (!valid) return

  submittingNotification.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    showNotifyDialog.value = false
    notificationContact.value = ''

    showMessage.value = true
    message.value = `We'll notify you at ${notificationContact.value} when the kiosk is ready.`
    messageType.value = 'success'

  } catch (error) {
    console.error('Notification submission failed:', error)
    showMessage.value = true
    message.value = 'Failed to set up notification. Please try again.'
    messageType.value = 'error'
  } finally {
    submittingNotification.value = false
  }
}

const validateAdminAccess = async () => {
  if (!adminForm.value) return

  const { valid } = await adminForm.value.validate()
  if (!valid) return

  validatingAdmin.value = true

  try {
    // Validate admin code
    const validCodes = ['ADMIN123', 'EMERGENCY', 'OVERRIDE']

    if (validCodes.includes(adminCode.value.toUpperCase())) {
      showAdminDialog.value = false
      adminCode.value = ''

      // Allow access to setup or force exit maintenance
      try {
        await authStore.exitMaintenanceMode()
        exitMaintenanceMode()
      } catch {
        // If API call fails, just exit locally
        router.push('/setup')
      }
    } else {
      showMessage.value = true
      message.value = 'Invalid access code'
      messageType.value = 'error'
      adminCode.value = ''
    }

  } catch (error) {
    console.error('Admin validation failed:', error)
    showMessage.value = true
    message.value = 'Access validation failed'
    messageType.value = 'error'
  } finally {
    validatingAdmin.value = false
  }
}

const exitMaintenanceMode = () => {
  // Clear timers
  if (progressTimer) clearInterval(progressTimer)
  if (statusCheckTimer) clearInterval(statusCheckTimer)

  // Navigate based on system state
  if (authStore.isAuthenticated) {
    router.push('/channels')
  } else {
    router.push('/')
  }
}

const getStepColor = (index: number): string => {
  if (index < currentStep.value) return 'success'
  if (index === currentStep.value) return 'warning'
  return 'grey'
}

const getStepIcon = (index: number): string => {
  if (index < currentStep.value) return 'mdi-check'
  if (index === currentStep.value) return 'mdi-loading mdi-spin'
  return 'mdi-circle-outline'
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  // Start progress simulation
  simulateProgress()

  // Show emergency access after long press sequence
  let clickCount = 0
  const clickSequence = () => {
    clickCount++
    if (clickCount >= 5) {
      showEmergencyAccess.value = true
      clickCount = 0
    }
    setTimeout(() => {
      if (clickCount > 0) clickCount--
    }, 2000)
  }

  document.addEventListener('click', clickSequence)

  // Periodic status checks
  statusCheckTimer = setInterval(() => {
    checkStatus()
  }, 5 * 60 * 1000) // Check every 5 minutes
})

onUnmounted(() => {
  if (progressTimer) clearInterval(progressTimer)
  if (statusCheckTimer) clearInterval(statusCheckTimer)
})
</script>

<style scoped>
.maintenance-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #FF9800 0%, #FF5722 100%);
  padding: 2rem 0;
}

.maintenance-card {
  border-radius: 20px !important;
  max-width: 700px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.maintenance-header {
  background: linear-gradient(135deg, #FF9800 0%, #FF5722 100%);
  color: white;
  padding: 3rem 2rem;
  border-radius: 20px 20px 0 0;
}

.maintenance-icon {
  animation: wobble 2s ease-in-out infinite;
}

@keyframes wobble {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  50% { transform: rotate(0deg); }
  75% { transform: rotate(5deg); }
  100% { transform: rotate(0deg); }
}

.maintenance-details {
  margin-top: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.detail-value {
  font-weight: 600;
}

.maintenance-progress {
  background: rgba(var(--v-theme-warning), 0.1);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-warning), 0.3);
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.progress-step {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.step-completed {
  background: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
}

.step-active {
  background: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
  font-weight: 600;
}

.step-pending {
  opacity: 0.6;
}

.alternative-services {
  margin: 2rem 0;
}

.alternative-card {
  height: 100%;
  transition: transform 0.2s ease;
  cursor: pointer;
  border-radius: 12px !important;
}

.alternative-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
}

.contact-info {
  margin-top: 2rem;
}

.contact-methods {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.contact-method {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.maintenance-actions {
  padding: 2rem;
  background: rgba(var(--v-theme-surface), 0.3);
  border-radius: 0 0 20px 20px;
}

.emergency-access {
  text-align: center;
}

.emergency-btn {
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.emergency-btn:hover {
  opacity: 1;
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
  .maintenance-view {
    padding: 1rem 0;
  }

  .maintenance-header {
    padding: 2rem 1rem;
  }

  .maintenance-card .v-card-text {
    padding: 1rem;
  }

  .maintenance-actions {
    padding: 1rem;
  }

  .contact-methods {
    align-items: flex-start;
  }

  .contact-method {
    justify-content: flex-start;
  }
}

/* Touch optimization */
@media (hover: none) and (pointer: coarse) {
  .alternative-card:active {
    transform: scale(0.98);
  }

  .v-btn {
    min-height: 48px;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .maintenance-card {
    border: 3px solid #000;
    background: #fff;
  }

  .maintenance-header {
    background: #000 !important;
    color: #fff !important;
  }

  .progress-step {
    border: 1px solid #000;
  }

  .step-active {
    background: #fff;
    border: 2px solid #000;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .maintenance-icon,
  .alternative-card,
  .progress-step {
    animation: none;
    transition: none;
  }

  .alternative-card:hover {
    transform: none;
  }

  .mdi-spin {
    animation: none;
  }
}

/* Maintenance status indicators */
.maintenance-status {
  position: relative;
}

.maintenance-status::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(255, 152, 0, 0.1) 10px,
      rgba(255, 152, 0, 0.1) 20px
  );
  border-radius: 12px;
  pointer-events: none;
}

/* Progress bar animations */
.v-progress-linear {
  transition: all 0.3s ease;
}

/* Notification success */
.notification-success {
  animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Emergency access hidden state */
.emergency-access {
  opacity: 0;
  transition: opacity 0.5s ease;
}

.emergency-access.visible {
  opacity: 1;
}
</style>