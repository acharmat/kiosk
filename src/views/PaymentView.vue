<template>
  <div class="payment-view">
    <v-container fluid class="pa-6">
      <!-- Payment Status Card -->
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card class="payment-card" elevation="8">
            <!-- Header -->
            <v-card-title class="payment-header text-center">
              <div class="w-100">
                <v-icon
                    :color="getStatusIcon().color"
                    :size="80"
                    class="mb-4"
                    :class="{ 'rotating': paymentStatus === 'processing' }"
                >
                  {{ getStatusIcon().icon }}
                </v-icon>

                <h1 class="text-h4 font-weight-bold mb-2">
                  {{ getStatusTitle() }}
                </h1>

                <p class="text-h6 text-medium-emphasis">
                  {{ getStatusMessage() }}
                </p>
              </div>
            </v-card-title>

            <v-divider />

            <!-- Payment Content -->
            <v-card-text class="pa-8">
              <!-- Processing State -->
              <div v-if="paymentStatus === 'processing'" class="payment-processing">
                <div class="text-center mb-6">
                  <v-progress-circular
                      :size="60"
                      :width="6"
                      color="primary"
                      indeterminate
                      class="mb-4"
                  />

                  <h3 class="text-h6 mb-3">Processing Payment</h3>

                  <div class="processing-steps">
                    <div
                        v-for="(step, index) in processingSteps"
                        :key="index"
                        class="processing-step"
                        :class="{
                        'step-active': index === currentProcessingStep,
                        'step-completed': index < currentProcessingStep
                      }"
                    >
                      <v-icon
                          :color="index <= currentProcessingStep ? 'primary' : 'grey'"
                          size="20"
                          class="mr-2"
                      >
                        {{ index < currentProcessingStep ? 'mdi-check' : step.icon }}
                      </v-icon>
                      <span :class="{ 'text-primary': index <= currentProcessingStep }">
                        {{ step.text }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Payment Method Instructions -->
                <v-alert
                    :type="getPaymentMethodAlert().type"
                    variant="tonal"
                    prominent
                    class="payment-instructions"
                >
                  <v-alert-title>{{ getPaymentMethodAlert().title }}</v-alert-title>
                  <div>{{ getPaymentMethodAlert().message }}</div>
                </v-alert>

                <!-- Payment Details -->
                <div class="payment-details">
                  <v-row>
                    <v-col cols="6">
                      <div class="detail-item">
                        <span class="detail-label">Amount:</span>
                        <span class="detail-value">{{ formatPrice(paymentAmount) }}</span>
                      </div>
                    </v-col>
                    <v-col cols="6">
                      <div class="detail-item">
                        <span class="detail-label">Method:</span>
                        <span class="detail-value">{{ getPaymentMethodName() }}</span>
                      </div>
                    </v-col>
                    <v-col cols="6">
                      <div class="detail-item">
                        <span class="detail-label">Slot:</span>
                        <span class="detail-value">{{ selectedSlot }}</span>
                      </div>
                    </v-col>
                    <v-col cols="6">
                      <div class="detail-item">
                        <span class="detail-label">Items:</span>
                        <span class="detail-value">{{ cartStore.itemCount }}</span>
                      </div>
                    </v-col>
                  </v-row>
                </div>

                <!-- Cancel Button -->
                <div class="text-center mt-6">
                  <v-btn
                      :disabled="!canCancel"
                      color="error"
                      variant="outlined"
                      @click="cancelPayment"
                  >
                    <v-icon class="mr-2">mdi-close</v-icon>
                    Cancel Payment
                  </v-btn>
                </div>
              </div>

              <!-- Success State -->
              <div v-else-if="paymentStatus === 'success'" class="payment-success">
                <div class="text-center mb-6">
                  <v-icon color="success" size="100" class="mb-4 success-icon">
                    mdi-check-circle
                  </v-icon>

                  <h2 class="text-h4 font-weight-bold text-success mb-3">
                    Payment Successful!
                  </h2>

                  <p class="text-h6 mb-4">
                    Your order is being prepared
                  </p>
                </div>

                <!-- Transaction Details -->
                <v-card variant="outlined" class="transaction-details">
                  <v-card-title class="text-h6">Transaction Details</v-card-title>

                  <v-card-text>
                    <div class="transaction-info">
                      <div class="info-row">
                        <span>Transaction ID:</span>
                        <span class="font-weight-bold">{{ transactionId }}</span>
                      </div>
                      <div class="info-row">
                        <span>Amount Paid:</span>
                        <span class="font-weight-bold text-success">{{ formatPrice(paymentAmount) }}</span>
                      </div>
                      <div class="info-row">
                        <span>Payment Method:</span>
                        <span class="font-weight-bold">{{ getPaymentMethodName() }}</span>
                      </div>
                      <div class="info-row">
                        <span>Date & Time:</span>
                        <span class="font-weight-bold">{{ formatDateTime(paymentTime) }}</span>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- Pickup Instructions -->
                <v-alert type="info" variant="tonal" class="mt-6">
                  <v-alert-title>Pickup Instructions</v-alert-title>
                  <div>
                    Please wait for your items to be dispensed from <strong>Slot {{ selectedSlot }}</strong>.
                    Your order will be ready in approximately <strong>{{ estimatedWaitTime }} seconds</strong>.
                  </div>
                </v-alert>

                <!-- Progress to Dispensing -->
                <div class="dispensing-progress mt-6">
                  <div class="d-flex align-center justify-center mb-3">
                    <v-icon color="info" class="mr-2">mdi-package-variant</v-icon>
                    <span class="text-h6">Preparing your order...</span>
                  </div>

                  <v-progress-linear
                      :model-value="dispensingProgress"
                      color="primary"
                      height="8"
                      rounded
                      class="mb-2"
                  />

                  <div class="text-center">
                    <span class="text-body-2">{{ Math.round(dispensingProgress) }}% complete</span>
                  </div>
                </div>

                <!-- Continue Button -->
                <div class="text-center mt-6">
                  <v-btn
                      color="primary"
                      size="large"
                      @click="goToReceipt"
                  >
                    <v-icon class="mr-2">mdi-receipt</v-icon>
                    View Receipt
                  </v-btn>
                </div>
              </div>

              <!-- Error State -->
              <div v-else-if="paymentStatus === 'error'" class="payment-error">
                <div class="text-center mb-6">
                  <v-icon color="error" size="100" class="mb-4">
                    mdi-alert-circle
                  </v-icon>

                  <h2 class="text-h4 font-weight-bold text-error mb-3">
                    Payment Failed
                  </h2>

                  <p class="text-h6 mb-4">
                    {{ errorMessage || 'Unable to process your payment' }}
                  </p>
                </div>

                <!-- Error Details -->
                <v-alert type="error" variant="tonal" class="mb-6">
                  <v-alert-title>What happened?</v-alert-title>
                  <div>{{ getErrorExplanation() }}</div>
                </v-alert>

                <!-- Retry Options -->
                <div class="retry-options">
                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-btn
                          color="primary"
                          variant="elevated"
                          size="large"
                          block
                          @click="retryPayment"
                      >
                        <v-icon class="mr-2">mdi-refresh</v-icon>
                        Try Again
                      </v-btn>
                    </v-col>

                    <v-col cols="12" sm="6">
                      <v-btn
                          color="primary"
                          variant="outlined"
                          size="large"
                          block
                          @click="changePaymentMethod"
                      >
                        <v-icon class="mr-2">mdi-credit-card</v-icon>
                        Different Method
                      </v-btn>
                    </v-col>
                  </v-row>
                </div>

                <!-- Support Information -->
                <v-card variant="outlined" class="mt-6">
                  <v-card-text class="text-center">
                    <v-icon color="info" class="mb-2">mdi-help-circle</v-icon>
                    <p class="text-body-2">
                      Need help? Contact support or try a different payment method.
                    </p>
                  </v-card-text>
                </v-card>

                <!-- Cancel Transaction -->
                <div class="text-center mt-6">
                  <v-btn
                      color="error"
                      variant="text"
                      @click="cancelTransaction"
                  >
                    <v-icon class="mr-2">mdi-close</v-icon>
                    Cancel Order
                  </v-btn>
                </div>
              </div>

              <!-- Timeout State -->
              <div v-else-if="paymentStatus === 'timeout'" class="payment-timeout">
                <div class="text-center mb-6">
                  <v-icon color="warning" size="100" class="mb-4">
                    mdi-clock-alert
                  </v-icon>

                  <h2 class="text-h4 font-weight-bold text-warning mb-3">
                    Payment Timeout
                  </h2>

                  <p class="text-h6 mb-4">
                    Payment took too long to process
                  </p>
                </div>

                <v-alert type="warning" variant="tonal" class="mb-6">
                  <v-alert-title>Session Expired</v-alert-title>
                  <div>
                    Your payment session has expired for security reasons.
                    Please start a new transaction.
                  </div>
                </v-alert>

                <div class="text-center">
                  <v-btn
                      color="primary"
                      size="large"
                      @click="startNewTransaction"
                  >
                    <v-icon class="mr-2">mdi-restart</v-icon>
                    Start New Transaction
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Countdown Dialog -->
    <v-dialog v-model="showCountdown" persistent max-width="400">
      <v-card>
        <v-card-title class="text-center">
          <v-icon color="warning" class="mr-2">mdi-timer</v-icon>
          Session Timeout
        </v-card-title>

        <v-card-text class="text-center">
          <div class="countdown-display">
            <span class="text-h2 font-weight-bold text-warning">{{ countdownSeconds }}</span>
          </div>
          <p class="text-body-1 mt-3">
            Your session will expire in {{ countdownSeconds }} seconds due to inactivity.
          </p>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-btn color="primary" @click="extendSession">
            Continue Session
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import type { PaymentMethod } from '@/types'

const router = useRouter()
const cartStore = useCartStore()

// State
const paymentStatus = ref<'processing' | 'success' | 'error' | 'timeout'>('processing')
const currentProcessingStep = ref(0)
const paymentAmount = ref(0)
const selectedSlot = ref<number | null>(null)
const paymentMethod = ref<PaymentMethod | null>(null)
const transactionId = ref('')
const paymentTime = ref<Date | null>(null)
const errorMessage = ref('')
const estimatedWaitTime = ref(30)
const dispensingProgress = ref(0)
const canCancel = ref(true)
const showCountdown = ref(false)
const countdownSeconds = ref(30)

// Timers
let processingTimer: NodeJS.Timeout | null = null
let dispensingTimer: NodeJS.Timeout | null = null
let timeoutTimer: NodeJS.Timeout | null = null
let countdownTimer: NodeJS.Timeout | null = null

// Constants
const processingSteps = [
  { icon: 'mdi-credit-card-scan', text: 'Validating payment method' },
  { icon: 'mdi-bank', text: 'Processing payment' },
  { icon: 'mdi-check-network', text: 'Confirming transaction' },
  { icon: 'mdi-package-variant', text: 'Preparing order' }
]

// Computed properties
const getStatusIcon = () => {
  switch (paymentStatus.value) {
    case 'processing':
      return { icon: 'mdi-credit-card-clock', color: 'primary' }
    case 'success':
      return { icon: 'mdi-check-circle', color: 'success' }
    case 'error':
      return { icon: 'mdi-alert-circle', color: 'error' }
    case 'timeout':
      return { icon: 'mdi-clock-alert', color: 'warning' }
    default:
      return { icon: 'mdi-help', color: 'grey' }
  }
}

const getStatusTitle = () => {
  switch (paymentStatus.value) {
    case 'processing':
      return 'Processing Payment'
    case 'success':
      return 'Payment Complete'
    case 'error':
      return 'Payment Failed'
    case 'timeout':
      return 'Session Timeout'
    default:
      return 'Payment'
  }
}

const getStatusMessage = () => {
  switch (paymentStatus.value) {
    case 'processing':
      return 'Please wait while we process your payment'
    case 'success':
      return 'Your payment has been processed successfully'
    case 'error':
      return 'There was an issue processing your payment'
    case 'timeout':
      return 'Your payment session has expired'
    default:
      return ''
  }
}

// Methods
const initializePayment = () => {
  // Get payment details from cart store
  paymentAmount.value = cartStore.totalAmount * 1.19 // Include tax
  selectedSlot.value = 1 // This would come from checkout
  paymentMethod.value = 'card' // This would come from checkout

  // Start payment processing simulation
  startPaymentProcessing()

  // Set timeout for session
  startSessionTimeout()
}

const startPaymentProcessing = () => {
  paymentStatus.value = 'processing'
  currentProcessingStep.value = 0

  // Simulate processing steps
  processingTimer = setInterval(() => {
    if (currentProcessingStep.value < processingSteps.length - 1) {
      currentProcessingStep.value++
    } else {
      // Processing complete
      clearInterval(processingTimer!)

      // Simulate success or failure (90% success rate)
      const success = Math.random() > 0.1

      if (success) {
        completePayment()
      } else {
        failPayment('Payment was declined by your card issuer')
      }
    }
  }, 1500)
}

const completePayment = () => {
  paymentStatus.value = 'success'
  transactionId.value = 'TXN-' + Date.now().toString(36).toUpperCase()
  paymentTime.value = new Date()
  canCancel.value = false

  // Clear timeout timer
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
  }

  // Start dispensing progress
  startDispensingProgress()

  // Auto-navigate to receipt after dispensing
  setTimeout(() => {
    router.push('/receipt')
  }, estimatedWaitTime.value * 1000)
}

const failPayment = (message: string) => {
  paymentStatus.value = 'error'
  errorMessage.value = message
  canCancel.value = true

  // Clear timers
  if (processingTimer) {
    clearInterval(processingTimer)
  }
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
  }
}

const startDispensingProgress = () => {
  dispensingProgress.value = 0

  dispensingTimer = setInterval(() => {
    if (dispensingProgress.value < 100) {
      dispensingProgress.value += 100 / (estimatedWaitTime.value * 10) // Update every 100ms
    } else {
      clearInterval(dispensingTimer!)
    }
  }, 100)
}

const startSessionTimeout = () => {
  // 5 minute timeout
  timeoutTimer = setTimeout(() => {
    if (paymentStatus.value === 'processing') {
      paymentStatus.value = 'timeout'
      if (processingTimer) {
        clearInterval(processingTimer)
      }
    }
  }, 5 * 60 * 1000)

  // Show countdown warning 30 seconds before timeout
  setTimeout(() => {
    if (paymentStatus.value === 'processing') {
      showTimeoutWarning()
    }
  }, 4.5 * 60 * 1000)
}

const showTimeoutWarning = () => {
  showCountdown.value = true
  countdownSeconds.value = 30

  countdownTimer = setInterval(() => {
    if (countdownSeconds.value > 0) {
      countdownSeconds.value--
    } else {
      clearInterval(countdownTimer!)
      showCountdown.value = false
      paymentStatus.value = 'timeout'
    }
  }, 1000)
}

const extendSession = () => {
  showCountdown.value = false
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }

  // Restart timeout timer
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
  }
  startSessionTimeout()
}

const getPaymentMethodAlert = () => {
  switch (paymentMethod.value) {
    case 'card':
      return {
        type: 'info',
        title: 'Insert or tap your card',
        message: 'Please insert your chip card or tap for contactless payment'
      }
    case 'contactless':
      return {
        type: 'info',
        title: 'Tap your card or device',
        message: 'Hold your contactless card or mobile device near the reader'
      }
    case 'mobile':
      return {
        type: 'info',
        title: 'Use your mobile wallet',
        message: 'Open your mobile wallet app and hold near the payment terminal'
      }
    case 'cash':
      return {
        type: 'warning',
        title: 'Insert cash',
        message: 'Please insert exact change or bills into the cash acceptor'
      }
    default:
      return {
        type: 'info',
        title: 'Complete payment',
        message: 'Follow the instructions to complete your payment'
      }
  }
}

const getPaymentMethodName = () => {
  switch (paymentMethod.value) {
    case 'card':
      return 'Credit/Debit Card'
    case 'contactless':
      return 'Contactless Payment'
    case 'mobile':
      return 'Mobile Payment'
    case 'cash':
      return 'Cash'
    default:
      return 'Unknown'
  }
}

const getErrorExplanation = () => {
  if (errorMessage.value.includes('declined')) {
    return 'Your card was declined. This could be due to insufficient funds, expired card, or security restrictions.'
  } else if (errorMessage.value.includes('timeout')) {
    return 'The payment took too long to process. This might be due to network issues.'
  } else {
    return 'An unexpected error occurred during payment processing. Please try again or use a different payment method.'
  }
}

const cancelPayment = () => {
  // Clear all timers
  if (processingTimer) clearInterval(processingTimer)
  if (timeoutTimer) clearTimeout(timeoutTimer)
  if (countdownTimer) clearInterval(countdownTimer)

  // Go back to checkout
  router.push('/checkout')
}

const retryPayment = () => {
  errorMessage.value = ''
  initializePayment()
}

const changePaymentMethod = () => {
  router.push('/checkout')
}

const cancelTransaction = () => {
  cartStore.clearCart()
  router.push('/')
}

const startNewTransaction = () => {
  router.push('/checkout')
}

const goToReceipt = () => {
  router.push('/receipt')
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

const formatDateTime = (date: Date | null): string => {
  if (!date) return ''
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  // Redirect if no cart items
  if (cartStore.isEmpty) {
    router.push('/cart')
    return
  }

  initializePayment()
})

onUnmounted(() => {
  // Clean up timers
  if (processingTimer) clearInterval(processingTimer)
  if (dispensingTimer) clearInterval(dispensingTimer)
  if (timeoutTimer) clearTimeout(timeoutTimer)
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
.payment-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-card {
  border-radius: 20px !important;
  max-width: 600px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.payment-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2rem;
  border-radius: 20px 20px 0 0;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.processing-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.processing-step {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.step-active {
  background: rgba(var(--v-theme-primary), 0.1);
  font-weight: 600;
}

.step-completed {
  opacity: 0.7;
}

.payment-instructions {
  margin: 2rem 0;
}

.payment-details {
  background: rgba(var(--v-theme-surface), 0.5);
  padding: 1.5rem;
  border-radius: 12px;
  margin: 2rem 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.detail-label {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.detail-value {
  font-weight: 600;
}

.success-icon {
  animation: successBounce 0.6s ease;
}

@keyframes successBounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.transaction-details {
  border-radius: 12px !important;
  margin: 2rem 0;
}

.transaction-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.info-row:last-child {
  border-bottom: none;
}

.dispensing-progress {
  background: rgba(var(--v-theme-info), 0.1);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-info), 0.3);
}

.retry-options {
  margin: 2rem 0;
}

.countdown-display {
  background: rgba(var(--v-theme-warning), 0.1);
  border: 2px solid rgba(var(--v-theme-warning), 0.3);
  border-radius: 50%;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .payment-header {
    padding: 2rem 1rem;
  }

  .payment-details {
    padding: 1rem;
  }

  .processing-steps {
    gap: 0.5rem;
  }

  .retry-options .v-col {
    margin-bottom: 1rem;
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
  .payment-card {
    border: 3px solid #000;
    background: #fff;
  }

  .processing-step {
    border: 1px solid #000;
  }

  .step-active {
    background: #000;
    color: #fff;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .rotating,
  .success-icon {
    animation: none;
  }

  .processing-step {
    transition: none;
  }
}

/* Loading animations */
.payment-processing {
  animation: fadeIn 0.5s ease;
}

.payment-success {
  animation: slideInUp 0.5s ease;
}

.payment-error {
  animation: shakeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shakeIn {
  0% { transform: translateX(-10px); }
  25% { transform: translateX(10px); }
  50% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
  100% { transform: translateX(0); }
}

/* Progress bar animation */
.v-progress-linear {
  transition: all 0.3s ease;
}

/* Status-specific styling */
.payment-processing .payment-card {
  border-left: 4px solid rgb(var(--v-theme-primary));
}

.payment-success .payment-card {
  border-left: 4px solid rgb(var(--v-theme-success));
}

.payment-error .payment-card {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.payment-timeout .payment-card {
  border-left: 4px solid rgb(var(--v-theme-warning));
}
</style>