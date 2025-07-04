<template>
  <div class="receipt-view">
    <v-container fluid class="pa-6">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <!-- Receipt Card -->
          <v-card class="receipt-card" elevation="8">
            <!-- Header -->
            <div class="receipt-header">
              <div class="text-center">
                <v-icon size="80" color="success" class="mb-4 success-icon">
                  mdi-check-circle
                </v-icon>

                <h1 class="text-h3 font-weight-bold mb-2">
                  Order Complete!
                </h1>

                <p class="text-h6 text-medium-emphasis mb-4">
                  Thank you for your purchase
                </p>

                <!-- QR Code for Digital Receipt -->
                <div class="qr-code-container">
                  <div class="qr-code-placeholder">
                    <canvas
                        ref="qrCanvas"
                        width="120"
                        height="120"
                        class="qr-canvas"
                    ></canvas>
                  </div>
                  <p class="text-body-2 mt-2">
                    Scan for digital receipt
                  </p>
                </div>
              </div>
            </div>

            <v-divider />

            <!-- Receipt Content -->
            <div class="receipt-content">
              <!-- Business Info -->
              <div class="business-info">
                <div class="text-center mb-4">
                  <h2 class="text-h5 font-weight-bold">{{ kioskInfo.name }}</h2>
                  <p class="text-body-2 text-medium-emphasis">
                    {{ kioskInfo.location || 'Self-Service Kiosk' }}
                  </p>
                  <p class="text-body-2 text-medium-emphasis">
                    Kiosk ID: {{ kioskInfo.uuid }}
                  </p>
                </div>
              </div>

              <!-- Transaction Details -->
              <div class="transaction-details mb-4">
                <v-row class="receipt-row">
                  <v-col cols="6">
                    <strong>Receipt #:</strong>
                  </v-col>
                  <v-col cols="6" class="text-right">
                    {{ receiptData.receiptNumber }}
                  </v-col>
                </v-row>

                <v-row class="receipt-row">
                  <v-col cols="6">
                    <strong>Transaction ID:</strong>
                  </v-col>
                  <v-col cols="6" class="text-right">
                    {{ receiptData.transactionId }}
                  </v-col>
                </v-row>

                <v-row class="receipt-row">
                  <v-col cols="6">
                    <strong>Date & Time:</strong>
                  </v-col>
                  <v-col cols="6" class="text-right">
                    {{ formatDateTime(receiptData.timestamp) }}
                  </v-col>
                </v-row>

                <v-row class="receipt-row">
                  <v-col cols="6">
                    <strong>Payment Method:</strong>
                  </v-col>
                  <v-col cols="6" class="text-right">
                    {{ getPaymentMethodName(receiptData.paymentMethod) }}
                  </v-col>
                </v-row>

                <v-row class="receipt-row">
                  <v-col cols="6">
                    <strong>Pickup Slot:</strong>
                  </v-col>
                  <v-col cols="6" class="text-right">
                    Slot {{ receiptData.slotNumber }}
                  </v-col>
                </v-row>
              </div>

              <v-divider class="my-4" />

              <!-- Items List -->
              <div class="items-section mb-4">
                <h3 class="text-h6 font-weight-bold mb-3">Items Purchased</h3>

                <div class="items-list">
                  <div
                      v-for="item in receiptData.items"
                      :key="item.id"
                      class="receipt-item"
                  >
                    <div class="item-info">
                      <div class="item-name">{{ item.name }}</div>
                      <div class="item-details">
                        {{ item.quantity }} × {{ formatPrice(item.price) }}
                      </div>
                    </div>
                    <div class="item-total">
                      {{ formatPrice(item.price * item.quantity) }}
                    </div>
                  </div>
                </div>
              </div>

              <v-divider class="my-4" />

              <!-- Order Summary -->
              <div class="order-summary mb-4">
                <div class="summary-row">
                  <span>Subtotal:</span>
                  <span>{{ formatPrice(receiptData.subtotal) }}</span>
                </div>

                <div class="summary-row">
                  <span>Tax (19%):</span>
                  <span>{{ formatPrice(receiptData.tax) }}</span>
                </div>

                <div class="summary-row total-row">
                  <span><strong>Total:</strong></span>
                  <span><strong>{{ formatPrice(receiptData.total) }}</strong></span>
                </div>

                <div v-if="receiptData.changeGiven" class="summary-row">
                  <span>Change Given:</span>
                  <span>{{ formatPrice(receiptData.changeGiven) }}</span>
                </div>
              </div>

              <v-divider class="my-4" />

              <!-- Pickup Instructions -->
              <div class="pickup-instructions mb-4">
                <v-alert type="info" variant="tonal" class="mb-3">
                  <v-alert-title>
                    <v-icon class="mr-2">mdi-package-variant</v-icon>
                    Pickup Instructions
                  </v-alert-title>
                  <div>
                    Your items have been dispensed from <strong>Slot {{ receiptData.slotNumber }}</strong>.
                    Please collect your items now.
                  </div>
                </v-alert>

                <!-- Pickup Status -->
                <div class="pickup-status">
                  <div class="d-flex align-center justify-center mb-3">
                    <v-icon
                        :color="pickupStatus.color"
                        size="32"
                        class="mr-2"
                    >
                      {{ pickupStatus.icon }}
                    </v-icon>
                    <span class="text-h6">{{ pickupStatus.text }}</span>
                  </div>

                  <div v-if="!itemsCollected" class="collection-reminder">
                    <v-progress-linear
                        :model-value="collectionProgress"
                        color="warning"
                        height="6"
                        rounded
                        class="mb-2"
                    />
                    <p class="text-center text-body-2">
                      Please collect your items within {{ remainingTime }} seconds
                    </p>
                  </div>
                </div>
              </div>

              <!-- Additional Information -->
              <div class="additional-info">
                <div class="info-section">
                  <h4 class="text-subtitle-1 font-weight-bold mb-2">Important Notes</h4>
                  <ul class="info-list">
                    <li>Keep this receipt for your records</li>
                    <li>Items are dispensed only once</li>
                    <li>Contact support if you experience any issues</li>
                    <li>Thank you for using our kiosk service</li>
                  </ul>
                </div>

                <div class="support-info mt-4">
                  <v-card variant="outlined" class="pa-3">
                    <div class="text-center">
                      <v-icon color="info" class="mb-2">mdi-help-circle</v-icon>
                      <p class="text-body-2 mb-1"><strong>Need Help?</strong></p>
                      <p class="text-body-2">
                        Contact support or scan the QR code above for assistance
                      </p>
                    </div>
                  </v-card>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="receipt-actions">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-btn
                      color="primary"
                      variant="outlined"
                      size="large"
                      block
                      @click="printReceipt"
                      :disabled="printing"
                      :loading="printing"
                  >
                    <v-icon class="mr-2">mdi-printer</v-icon>
                    Print Receipt
                  </v-btn>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-btn
                      color="primary"
                      variant="outlined"
                      size="large"
                      block
                      @click="emailReceipt"
                      :disabled="emailing"
                      :loading="emailing"
                  >
                    <v-icon class="mr-2">mdi-email</v-icon>
                    Email Receipt
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Main Action Button -->
              <div class="main-action mt-4">
                <v-btn
                    color="success"
                    size="x-large"
                    block
                    @click="completePurchase"
                    class="complete-btn"
                >
                  <v-icon class="mr-2">mdi-check</v-icon>
                  {{ itemsCollected ? 'Start New Order' : 'Complete & Start New Order' }}
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Email Dialog -->
    <v-dialog v-model="showEmailDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="mr-2">mdi-email</v-icon>
          Email Receipt
        </v-card-title>

        <v-card-text>
          <v-form ref="emailForm" @submit.prevent="sendEmail">
            <v-text-field
                v-model="emailAddress"
                label="Email Address"
                type="email"
                variant="outlined"
                :rules="[rules.required, rules.email]"
                prepend-inner-icon="mdi-email"
                hint="We'll send your receipt to this email address"
                persistent-hint
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showEmailDialog = false">Cancel</v-btn>
          <v-btn
              color="primary"
              :loading="sendingEmail"
              @click="sendEmail"
          >
            Send Receipt
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Messages -->
    <v-snackbar
        v-model="showSuccessMessage"
        :timeout="4000"
        color="success"
        location="top"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-check-circle</v-icon>
        {{ successMessage }}
      </div>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import type { ReceiptData, CartItem } from '@/types'
import QRCode from 'qrcode'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

// Form refs
const emailForm = ref()
const qrCanvas = ref<HTMLCanvasElement>()

// State
const receiptData = ref<ReceiptData>({
  transactionId: '',
  kioskName: '',
  location: '',
  timestamp: new Date(),
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  paymentMethod: 'card',
  receiptNumber: '',
  slotNumber: 1
})

const itemsCollected = ref(false)
const collectionProgress = ref(0)
const remainingTime = ref(60)
const printing = ref(false)
const emailing = ref(false)
const showEmailDialog = ref(false)
const emailAddress = ref('')
const sendingEmail = ref(false)
const showSuccessMessage = ref(false)
const successMessage = ref('')

// Timers
let collectionTimer: NodeJS.Timeout | null = null
let progressTimer: NodeJS.Timeout | null = null

// Validation rules
const rules = {
  required: (value: string) => !!value || 'This field is required',
  email: (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Please enter a valid email address'
  }
}

// Computed properties
const kioskInfo = computed(() => ({
  name: authStore.kioskConfig?.name || 'Smart Kiosk',
  location: 'Self-Service Terminal',
  uuid: authStore.kioskConfig?.uuid?.slice(0, 8) || 'UNKNOWN'
}))

const pickupStatus = computed(() => {
  if (itemsCollected.value) {
    return {
      icon: 'mdi-check-circle',
      color: 'success',
      text: 'Items Collected'
    }
  } else {
    return {
      icon: 'mdi-clock-alert',
      color: 'warning',
      text: 'Awaiting Collection'
    }
  }
})

// Methods
const initializeReceipt = () => {
  // Get transaction data from cart store
  const transaction = cartStore.currentTransaction

  if (transaction) {
    receiptData.value = {
      transactionId: transaction.uuid,
      kioskName: kioskInfo.value.name,
      location: kioskInfo.value.location,
      timestamp: transaction.createdAt,
      items: transaction.items,
      subtotal: transaction.totalAmount,
      tax: transaction.totalAmount * 0.19,
      total: transaction.totalAmount * 1.19,
      paymentMethod: transaction.paymentMethod,
      receiptNumber: generateReceiptNumber(),
      slotNumber: transaction.slotNumber
    }
  } else {
    // Fallback data
    receiptData.value = {
      transactionId: 'TXN-' + Date.now().toString(36).toUpperCase(),
      kioskName: kioskInfo.value.name,
      location: kioskInfo.value.location,
      timestamp: new Date(),
      items: cartStore.items,
      subtotal: cartStore.totalAmount,
      tax: cartStore.totalAmount * 0.19,
      total: cartStore.totalAmount * 1.19,
      paymentMethod: 'card',
      receiptNumber: generateReceiptNumber(),
      slotNumber: 1
    }
  }

  // Generate QR code
  generateQRCode()

  // Start collection timer
  startCollectionTimer()
}

const generateReceiptNumber = (): string => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStr = date.getTime().toString().slice(-6)
  return `RCP-${dateStr}-${timeStr}`
}

const generateQRCode = async () => {
  if (!qrCanvas.value) return

  try {
    const receiptUrl = `${window.location.origin}/receipt/${receiptData.value.transactionId}`
    await QRCode.toCanvas(qrCanvas.value, receiptUrl, {
      width: 120,
      margin: 1,
      color: {
        dark: '#1976D2',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('Failed to generate QR code:', error)
  }
}

const startCollectionTimer = () => {
  remainingTime.value = 60
  collectionProgress.value = 0

  // Progress timer
  progressTimer = setInterval(() => {
    if (collectionProgress.value < 100) {
      collectionProgress.value += 100 / 60 // 60 seconds
    }
  }, 1000)

  // Collection timer
  collectionTimer = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      // Auto-mark as collected after timeout
      itemsCollected.value = true
      clearTimers()
    }
  }, 1000)

  // Simulate item collection after random time (for demo)
  setTimeout(() => {
    if (!itemsCollected.value) {
      markItemsCollected()
    }
  }, Math.random() * 20000 + 10000) // 10-30 seconds
}

const markItemsCollected = () => {
  itemsCollected.value = true
  collectionProgress.value = 100
  clearTimers()

  showMessage('Items collected successfully!')
}

const clearTimers = () => {
  if (collectionTimer) {
    clearInterval(collectionTimer)
    collectionTimer = null
  }
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

const printReceipt = async () => {
  printing.value = true

  try {
    // Simulate printing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // In a real implementation, this would interface with a thermal printer
    // For now, we'll use browser print
    window.print()

    showMessage('Receipt sent to printer')
  } catch (error) {
    console.error('Print failed:', error)
    showMessage('Print failed. Please try again.')
  } finally {
    printing.value = false
  }
}

const emailReceipt = () => {
  showEmailDialog.value = true
}

const sendEmail = async () => {
  if (!emailForm.value) return

  const { valid } = await emailForm.value.validate()
  if (!valid) return

  sendingEmail.value = true

  try {
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 2000))

    // In a real implementation, this would call an API to send the email
    console.log('Sending receipt to:', emailAddress.value)

    showEmailDialog.value = false
    emailAddress.value = ''
    showMessage('Receipt sent to ' + emailAddress.value)
  } catch (error) {
    console.error('Email sending failed:', error)
    showMessage('Failed to send email. Please try again.')
  } finally {
    sendingEmail.value = false
  }
}

const completePurchase = () => {
  // Clear cart and transaction data
  cartStore.clearCart()

  // Return to screensaver/home
  router.push('/')
}

const showMessage = (message: string) => {
  successMessage.value = message
  showSuccessMessage.value = true
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
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

const getPaymentMethodName = (method: string): string => {
  switch (method) {
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

// Lifecycle
onMounted(() => {
  // Redirect if no transaction data
  if (cartStore.isEmpty && !cartStore.currentTransaction) {
    router.push('/')
    return
  }

  initializeReceipt()
})

onUnmounted(() => {
  clearTimers()
})
</script>

<style scoped>
.receipt-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 2rem 0;
}

.receipt-card {
  border-radius: 20px !important;
  max-width: 600px;
  margin: 0 auto;
  background: white;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.receipt-header {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  padding: 3rem 2rem;
  border-radius: 20px 20px 0 0;
}

.success-icon {
  animation: successPulse 1s ease-in-out;
}

@keyframes successPulse {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.qr-code-container {
  margin-top: 2rem;
}

.qr-code-placeholder {
  display: inline-block;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.qr-canvas {
  display: block;
  border-radius: 8px;
}

.receipt-content {
  padding: 2rem;
}

.business-info {
  text-align: center;
  margin-bottom: 2rem;
}

.transaction-details {
  background: rgba(var(--v-theme-surface), 0.5);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.receipt-row {
  margin-bottom: 0.5rem;
}

.receipt-row:last-child {
  margin-bottom: 0;
}

.items-section {
  margin: 2rem 0;
}

.items-list {
  background: rgba(var(--v-theme-surface), 0.3);
  border-radius: 8px;
  padding: 1rem;
}

.receipt-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
}

.receipt-item:last-child {
  border-bottom: none;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.item-details {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.item-total {
  font-weight: 600;
  text-align: right;
}

.order-summary {
  background: rgba(var(--v-theme-success), 0.1);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-success), 0.3);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.total-row {
  font-size: 1.125rem;
  padding-top: 0.75rem;
  border-top: 2px solid rgba(var(--v-theme-success), 0.3);
  margin-top: 0.75rem;
}

.pickup-instructions {
  margin: 2rem 0;
}

.pickup-status {
  text-align: center;
}

.collection-reminder {
  background: rgba(var(--v-theme-warning), 0.1);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-warning), 0.3);
}

.additional-info {
  margin-top: 2rem;
}

.info-section {
  margin-bottom: 1.5rem;
}

.info-list {
  list-style: none;
  padding: 0;
}

.info-list li {
  padding: 0.25rem 0;
  position: relative;
  padding-left: 1.5rem;
}

.info-list li::before {
  content: '•';
  color: rgb(var(--v-theme-primary));
  font-weight: bold;
  position: absolute;
  left: 0;
}

.support-info {
  text-align: center;
}

.receipt-actions {
  padding: 2rem;
  background: rgba(var(--v-theme-surface), 0.3);
  border-radius: 0 0 20px 20px;
}

.complete-btn {
  height: 60px !important;
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  border-radius: 30px !important;
}

.complete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-success), 0.4) !important;
}

/* Print styles */
@media print {
  .receipt-view {
    background: white;
    padding: 0;
  }

  .receipt-card {
    box-shadow: none;
    border: none;
    border-radius: 0 !important;
  }

  .receipt-header {
    background: white !important;
    color: black !important;
    border-radius: 0 !important;
  }

  .receipt-actions,
  .pickup-instructions,
  .v-btn {
    display: none !important;
  }

  .qr-code-container {
    margin: 1rem 0;
  }

  .success-icon {
    display: none;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .receipt-view {
    padding: 1rem 0;
  }

  .receipt-header {
    padding: 2rem 1rem;
  }

  .receipt-content {
    padding: 1rem;
  }

  .transaction-details,
  .order-summary {
    padding: 1rem;
  }

  .receipt-actions {
    padding: 1rem;
  }

  .complete-btn {
    height: 56px !important;
    font-size: 1rem !important;
  }

  .qr-code-placeholder {
    padding: 0.5rem;
  }
}

/* Touch optimization */
@media (hover: none) and (pointer: coarse) {
  .v-btn {
    min-height: 48px;
  }

  .complete-btn:active {
    transform: scale(0.98);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .receipt-card {
    border: 3px solid #000;
    background: #fff;
  }

  .receipt-header {
    background: #000 !important;
    color: #fff !important;
  }

  .transaction-details,
  .order-summary,
  .collection-reminder {
    border: 2px solid #000;
    background: #fff;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .success-icon,
  .complete-btn {
    animation: none;
    transition: none;
  }

  .complete-btn:hover {
    transform: none;
  }
}

/* Loading states */
.receipt-item.loading {
  opacity: 0.7;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Success animations */
.pickup-status {
  transition: all 0.3s ease;
}

.pickup-status.collected {
  animation: celebration 0.6s ease;
}

@keyframes celebration {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Progress bar styling */
.v-progress-linear {
  border-radius: 4px;
  overflow: hidden;
}

/* Receipt paper effect */
.receipt-card {
  position: relative;
}

.receipt-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
      radial-gradient(circle at 20px 20px, transparent 2px, white 2px),
      radial-gradient(circle at 60px 20px, transparent 2px, white 2px),
      radial-gradient(circle at 100px 20px, transparent 2px, white 2px);
  background-size: 40px 40px;
  background-position: 0 0, 40px 0, 80px 0;
  opacity: 0.05;
  pointer-events: none;
  border-radius: 20px;
}
</style>