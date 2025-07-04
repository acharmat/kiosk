<template>
  <div class="checkout-view">
    <v-container fluid class="pa-6">
      <!-- Header Section -->
      <div class="header-section mb-6">
        <div class="d-flex align-center justify-between">
          <div class="header-info">
            <h1 class="text-h3 font-weight-bold mb-2">Checkout</h1>
            <p class="text-h6 text-medium-emphasis">
              Complete your order
            </p>
          </div>

          <!-- Back to Cart Button -->
          <v-btn
              color="primary"
              variant="outlined"
              size="large"
              @click="goBackToCart"
              class="back-btn"
          >
            <v-icon class="mr-2">mdi-arrow-left</v-icon>
            Back to Cart
          </v-btn>
        </div>
      </div>

      <!-- Checkout Steps -->
      <v-stepper
          v-model="currentStep"
          :items="checkoutSteps"
          hide-actions
          elevation="0"
          class="checkout-stepper mb-6"
      >
        <!-- Step 1: Review Order -->
        <template v-slot:item.1>
          <div class="step-content">
            <v-row>
              <v-col cols="12" md="8">
                <v-card class="order-review-card" elevation="4">
                  <v-card-title class="text-h5">Order Review</v-card-title>

                  <v-divider />

                  <v-card-text class="pa-0">
                    <v-list class="order-items-list">
                      <template v-for="(item, index) in cartStore.items" :key="item.id">
                        <v-list-item class="order-item">
                          <template v-slot:prepend>
                            <v-avatar size="60" rounded="lg" class="order-item-image">
                              <v-img
                                  :src="item.image || defaultProductImage"
                                  :alt="item.name"
                                  cover
                              />
                            </v-avatar>
                          </template>

                          <div class="order-item-content">
                            <v-list-item-title class="text-h6 font-weight-bold">
                              {{ item.name }}
                            </v-list-item-title>
                            <v-list-item-subtitle class="text-body-2 mb-2">
                              {{ formatPrice(item.price) }} each
                            </v-list-item-subtitle>
                            <div class="d-flex align-center">
                              <v-chip size="small" variant="outlined">
                                Qty: {{ item.quantity }}
                              </v-chip>
                            </div>
                          </div>

                          <template v-slot:append>
                            <div class="item-total">
                              <span class="text-h6 font-weight-bold">
                                {{ formatPrice(item.price * item.quantity) }}
                              </span>
                            </div>
                          </template>
                        </v-list-item>

                        <v-divider v-if="index < cartStore.items.length - 1" />
                      </template>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="4">
                <div class="order-summary-sticky">
                  <v-card class="order-summary-card" elevation="4">
                    <v-card-title class="text-h5">Order Summary</v-card-title>

                    <v-divider />

                    <v-card-text>
                      <div class="summary-details">
                        <div class="summary-row">
                          <span>Subtotal</span>
                          <span class="font-weight-bold">{{ cartStore.formattedTotal }}</span>
                        </div>

                        <div class="summary-row">
                          <span>Tax (19%)</span>
                          <span class="font-weight-bold">{{ formatPrice(taxAmount) }}</span>
                        </div>

                        <v-divider class="my-4" />

                        <div class="summary-row total-row">
                          <span class="text-h6 font-weight-bold">Total</span>
                          <span class="text-h5 font-weight-bold text-success">
                            {{ formatPrice(totalWithTax) }}
                          </span>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
              </v-col>
            </v-row>
          </div>
        </template>

        <!-- Step 2: Select Slot -->
        <template v-slot:item.2>
          <div class="step-content">
            <v-card class="slot-selection-card" elevation="4">
              <v-card-title class="text-h5">Select Pickup Slot</v-card-title>
              <v-card-subtitle>Choose an available slot for your order</v-card-subtitle>

              <v-divider />

              <v-card-text>
                <div v-if="loadingSlots" class="text-center pa-8">
                  <v-progress-circular
                      size="60"
                      width="6"
                      color="primary"
                      indeterminate
                  />
                  <p class="text-h6 mt-4">Loading available slots...</p>
                </div>

                <div v-else-if="availableSlots.length === 0" class="text-center pa-8">
                  <v-icon size="80" color="warning" class="mb-4">
                    mdi-alert-circle
                  </v-icon>
                  <h3 class="text-h5 mb-3">No Available Slots</h3>
                  <p class="text-body-1 text-medium-emphasis">
                    All slots are currently full. Please try again later.
                  </p>
                </div>

                <div v-else class="slots-grid">
                  <v-row>
                    <v-col
                        v-for="slot in availableSlots"
                        :key="slot.slot_number"
                        cols="12"
                        sm="6"
                        md="4"
                    >
                      <v-card
                          :class="[
                          'slot-card',
                          { 'slot-selected': selectedSlot === slot.slot_number }
                        ]"
                          :color="selectedSlot === slot.slot_number ? 'primary' : 'default'"
                          :variant="selectedSlot === slot.slot_number ? 'elevated' : 'outlined'"
                          @click="selectSlot(slot.slot_number)"
                      >
                        <v-card-text class="text-center">
                          <v-icon
                              :color="selectedSlot === slot.slot_number ? 'white' : 'primary'"
                              size="48"
                              class="mb-3"
                          >
                            mdi-package-variant
                          </v-icon>

                          <h4 class="text-h6 font-weight-bold mb-2">
                            Slot {{ slot.slot_number }}
                          </h4>

                          <div class="slot-info">
                            <p class="text-body-2 mb-1">
                              <strong>Capacity:</strong> {{ slot.max_capacity - slot.current_stock }}/{{ slot.max_capacity }}
                            </p>
                            <p class="text-body-2">
                              <strong>Status:</strong>
                              <v-chip
                                  :color="getSlotStatusColor(slot.status)"
                                  size="x-small"
                                  variant="flat"
                                  class="ml-1"
                              >
                                {{ slot.status }}
                              </v-chip>
                            </p>
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </template>

        <!-- Step 3: Payment Method -->
        <template v-slot:item.3>
          <div class="step-content">
            <v-card class="payment-method-card" elevation="4">
              <v-card-title class="text-h5">Select Payment Method</v-card-title>
              <v-card-subtitle>Choose how you'd like to pay</v-card-subtitle>

              <v-divider />

              <v-card-text>
                <v-row>
                  <v-col
                      v-for="method in paymentMethods"
                      :key="method.value"
                      cols="12"
                      sm="6"
                  >
                    <v-card
                        :class="[
                        'payment-method-card-option',
                        { 'method-selected': selectedPaymentMethod === method.value }
                      ]"
                        :color="selectedPaymentMethod === method.value ? 'primary' : 'default'"
                        :variant="selectedPaymentMethod === method.value ? 'elevated' : 'outlined'"
                        @click="selectPaymentMethod(method.value)"
                    >
                      <v-card-text class="text-center pa-6">
                        <v-icon
                            :color="selectedPaymentMethod === method.value ? 'white' : method.color"
                            size="60"
                            class="mb-4"
                        >
                          {{ method.icon }}
                        </v-icon>

                        <h4 class="text-h6 font-weight-bold mb-2">
                          {{ method.title }}
                        </h4>

                        <p class="text-body-2">
                          {{ method.description }}
                        </p>

                        <v-chip
                            v-if="method.recommended"
                            color="success"
                            size="small"
                            variant="flat"
                            class="mt-2"
                        >
                          Recommended
                        </v-chip>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </div>
        </template>

        <!-- Step 4: Confirmation -->
        <template v-slot:item.4>
          <div class="step-content">
            <v-card class="confirmation-card" elevation="4">
              <v-card-title class="text-h5">Order Confirmation</v-card-title>
              <v-card-subtitle>Please review your order details</v-card-subtitle>

              <v-divider />

              <v-card-text>
                <v-row>
                  <v-col cols="12" md="8">
                    <!-- Order Summary -->
                    <div class="confirmation-section mb-6">
                      <h4 class="text-h6 font-weight-bold mb-3">Order Details</h4>
                      <v-list density="compact">
                        <v-list-item
                            v-for="item in cartStore.items"
                            :key="item.id"
                            class="confirmation-item"
                        >
                          <template v-slot:prepend>
                            <v-avatar size="40" rounded="lg">
                              <v-img :src="item.image || defaultProductImage" />
                            </v-avatar>
                          </template>

                          <v-list-item-title>{{ item.name }}</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ item.quantity }} × {{ formatPrice(item.price) }}
                          </v-list-item-subtitle>

                          <template v-slot:append>
                            <span class="font-weight-bold">
                              {{ formatPrice(item.price * item.quantity) }}
                            </span>
                          </template>
                        </v-list-item>
                      </v-list>
                    </div>

                    <!-- Pickup Details -->
                    <div class="confirmation-section mb-6">
                      <h4 class="text-h6 font-weight-bold mb-3">Pickup Details</h4>
                      <v-alert type="info" variant="tonal">
                        <div class="d-flex align-center">
                          <v-icon class="mr-3">mdi-package-variant</v-icon>
                          <div>
                            <p class="font-weight-medium mb-1">Slot {{ selectedSlot }}</p>
                            <p class="text-body-2">Your order will be dispensed from this slot</p>
                          </div>
                        </div>
                      </v-alert>
                    </div>

                    <!-- Payment Details -->
                    <div class="confirmation-section">
                      <h4 class="text-h6 font-weight-bold mb-3">Payment Method</h4>
                      <v-alert type="success" variant="tonal">
                        <div class="d-flex align-center">
                          <v-icon class="mr-3">
                            {{ getPaymentMethodIcon(selectedPaymentMethod) }}
                          </v-icon>
                          <div>
                            <p class="font-weight-medium mb-1">
                              {{ getPaymentMethodTitle(selectedPaymentMethod) }}
                            </p>
                            <p class="text-body-2">
                              {{ getPaymentMethodDescription(selectedPaymentMethod) }}
                            </p>
                          </div>
                        </div>
                      </v-alert>
                    </div>
                  </v-col>

                  <v-col cols="12" md="4">
                    <!-- Final Total -->
                    <v-card variant="outlined" class="total-card">
                      <v-card-text>
                        <div class="final-total-section">
                          <div class="total-row">
                            <span>Subtotal</span>
                            <span>{{ cartStore.formattedTotal }}</span>
                          </div>
                          <div class="total-row">
                            <span>Tax</span>
                            <span>{{ formatPrice(taxAmount) }}</span>
                          </div>
                          <v-divider class="my-3" />
                          <div class="total-row final-total">
                            <span class="text-h6 font-weight-bold">Total</span>
                            <span class="text-h5 font-weight-bold text-success">
                              {{ formatPrice(totalWithTax) }}
                            </span>
                          </div>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </div>
        </template>
      </v-stepper>

      <!-- Navigation Controls -->
      <div class="navigation-controls">
        <v-row justify="center">
          <v-col cols="12" md="8">
            <div class="d-flex justify-space-between align-center">
              <v-btn
                  v-if="currentStep > 1"
                  variant="outlined"
                  size="large"
                  @click="previousStep"
              >
                <v-icon class="mr-2">mdi-arrow-left</v-icon>
                Previous
              </v-btn>

              <v-spacer />

              <v-btn
                  v-if="currentStep < checkoutSteps.length"
                  :disabled="!canProceed"
                  color="primary"
                  size="large"
                  @click="nextStep"
              >
                Next
                <v-icon class="ml-2">mdi-arrow-right</v-icon>
              </v-btn>

              <v-btn
                  v-else
                  :disabled="!canCompleteOrder"
                  :loading="processingOrder"
                  color="success"
                  size="x-large"
                  @click="completeOrder"
                  class="complete-order-btn"
              >
                <v-icon class="mr-2">mdi-check-circle</v-icon>
                Complete Order
                <span class="ml-2">({{ formatPrice(totalWithTax) }})</span>
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-container>

    <!-- Error Dialog -->
    <v-dialog v-model="showErrorDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-h6 bg-error text-white">
          <v-icon class="mr-2">mdi-alert-circle</v-icon>
          Order Error
        </v-card-title>

        <v-card-text class="pt-4">
          <p>{{ errorMessage }}</p>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showErrorDialog = false">OK</v-btn>
          <v-btn v-if="canRetryOrder" color="primary" @click="retryOrder">
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
import { useCartStore } from '@/stores/cart'
import { apiService } from '@/services/apiService'
import type { InventorySlot, PaymentMethod } from '@/types'

const router = useRouter()
const cartStore = useCartStore()

// State
const currentStep = ref(1)
const selectedSlot = ref<number | null>(null)
const selectedPaymentMethod = ref<PaymentMethod | null>(null)
const availableSlots = ref<InventorySlot[]>([])
const loadingSlots = ref(false)
const processingOrder = ref(false)
const showErrorDialog = ref(false)
const errorMessage = ref('')
const canRetryOrder = ref(false)

// Constants
const defaultProductImage = '/images/default-product.png'

const checkoutSteps = [
  { title: 'Review', value: 1 },
  { title: 'Select Slot', value: 2 },
  { title: 'Payment', value: 3 },
  { title: 'Confirm', value: 4 }
]

const paymentMethods = [
  {
    value: 'card' as PaymentMethod,
    title: 'Credit/Debit Card',
    description: 'Pay with your card using chip or contactless',
    icon: 'mdi-credit-card',
    color: 'primary',
    recommended: true
  },
  {
    value: 'contactless' as PaymentMethod,
    title: 'Contactless Payment',
    description: 'Tap your card or mobile device',
    icon: 'mdi-contactless-payment',
    color: 'success'
  },
  {
    value: 'mobile' as PaymentMethod,
    title: 'Mobile Payment',
    description: 'Apple Pay, Google Pay, Samsung Pay',
    icon: 'mdi-cellphone',
    color: 'info'
  },
  {
    value: 'cash' as PaymentMethod,
    title: 'Cash',
    description: 'Pay with cash (exact change preferred)',
    icon: 'mdi-cash',
    color: 'warning'
  }
]

// Computed properties
const taxAmount = computed(() => cartStore.totalAmount * 0.19)
const totalWithTax = computed(() => cartStore.totalAmount + taxAmount.value)

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return cartStore.itemCount > 0
    case 2:
      return selectedSlot.value !== null
    case 3:
      return selectedPaymentMethod.value !== null
    case 4:
      return true
    default:
      return false
  }
})

const canCompleteOrder = computed(() => {
  return selectedSlot.value !== null &&
      selectedPaymentMethod.value !== null &&
      cartStore.itemCount > 0 &&
      !processingOrder.value
})

// Methods
const loadAvailableSlots = async () => {
  loadingSlots.value = true

  try {
    const response = await apiService.getInventoryStatus()
    if (response.success) {
      // Filter only active slots with available space
      availableSlots.value = response.data.slots.filter(slot =>
          slot.status === 'active' &&
          slot.current_stock < slot.max_capacity
      )
    } else {
      throw new Error(response.error || 'Failed to load slots')
    }
  } catch (error) {
    console.error('Failed to load slots:', error)
    // Fallback to mock data for development
    availableSlots.value = [
      {
        slot_number: 1,
        product_id: null,
        current_stock: 5,
        max_capacity: 10,
        status: 'active'
      },
      {
        slot_number: 2,
        product_id: null,
        current_stock: 3,
        max_capacity: 10,
        status: 'active'
      },
      {
        slot_number: 3,
        product_id: null,
        current_stock: 8,
        max_capacity: 10,
        status: 'active'
      }
    ]
  } finally {
    loadingSlots.value = false
  }
}

const selectSlot = (slotNumber: number) => {
  selectedSlot.value = slotNumber

  // Haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

const selectPaymentMethod = (method: PaymentMethod) => {
  selectedPaymentMethod.value = method

  // Haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

const nextStep = () => {
  if (canProceed.value && currentStep.value < checkoutSteps.length) {
    currentStep.value++

    // Load slots when reaching step 2
    if (currentStep.value === 2) {
      loadAvailableSlots()
    }
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const completeOrder = async () => {
  if (!canCompleteOrder.value || !selectedSlot.value || !selectedPaymentMethod.value) {
    return
  }

  processingOrder.value = true

  try {
    // Process the transaction
    await cartStore.processCheckout(
        selectedSlot.value,
        selectedPaymentMethod.value,
        {
          // Payment-specific data would go here
          amount: totalWithTax.value,
          currency: 'EUR'
        },
        {
          // Customer data if any
          kiosk_session: Date.now().toString()
        }
    )

    // Navigate to payment processing
    await router.push('/payment')

  } catch (error) {
    console.error('Order processing failed:', error)
    errorMessage.value = error instanceof Error ? error.message : 'Order processing failed'
    canRetryOrder.value = true
    showErrorDialog.value = true
  } finally {
    processingOrder.value = false
  }
}

const retryOrder = () => {
  showErrorDialog.value = false
  completeOrder()
}

const goBackToCart = () => {
  router.push('/cart')
}

const getSlotStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'success'
    case 'maintenance':
      return 'warning'
    case 'inactive':
      return 'error'
    default:
      return 'default'
  }
}

const getPaymentMethodIcon = (method: PaymentMethod | null): string => {
  const paymentMethod = paymentMethods.find(m => m.value === method)
  return paymentMethod?.icon || 'mdi-help'
}

const getPaymentMethodTitle = (method: PaymentMethod | null): string => {
  const paymentMethod = paymentMethods.find(m => m.value === method)
  return paymentMethod?.title || 'Unknown'
}

const getPaymentMethodDescription = (method: PaymentMethod | null): string => {
  const paymentMethod = paymentMethods.find(m => m.value === method)
  return paymentMethod?.description || ''
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

// Lifecycle
onMounted(() => {
  // Redirect if cart is empty
  if (cartStore.isEmpty) {
    router.push('/cart')
  }
})
</script>

<style scoped>
.checkout-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.header-section {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.back-btn {
  border-radius: 25px !important;
  font-weight: 600;
}

.checkout-stepper {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem;
}

.step-content {
  padding: 2rem 0;
  min-height: 400px;
}

.order-review-card,
.slot-selection-card,
.payment-method-card,
.confirmation-card {
  border-radius: 16px !important;
}

.order-items-list {
  background: transparent;
}

.order-item {
  padding: 1.5rem !important;
}

.order-item-image {
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.order-item-content {
  margin-left: 1rem;
}

.item-total {
  text-align: right;
}

.order-summary-sticky {
  position: sticky;
  top: 2rem;
}

.order-summary-card {
  border-radius: 16px !important;
}

.summary-details {
  margin-bottom: 1rem;
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
  padding: 1rem;
  background: rgba(var(--v-theme-success), 0.1);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-success), 0.3);
  margin-bottom: 0 !important;
}

.slots-grid {
  margin-top: 1rem;
}

.slot-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px !important;
  min-height: 180px;
}

.slot-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.slot-selected {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.4) !important;
}

.slot-info {
  text-align: left;
  margin-top: 1rem;
}

.payment-method-card-option {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px !important;
  min-height: 200px;
}

.payment-method-card-option:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.method-selected {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.4) !important;
}

.confirmation-section {
  margin-bottom: 2rem;
}

.confirmation-item {
  padding: 0.5rem 0 !important;
}

.total-card {
  border-radius: 12px !important;
  background: rgba(var(--v-theme-success), 0.05);
  border: 1px solid rgba(var(--v-theme-success), 0.2) !important;
}

.final-total-section {
  padding: 1rem;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.final-total {
  background: rgba(var(--v-theme-success), 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin: 0 -1rem -1rem -1rem;
}

.navigation-controls {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 2rem;
}

.complete-order-btn {
  height: 60px !important;
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  border-radius: 30px !important;
}

.complete-order-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-success), 0.4) !important;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .header-section {
    padding: 1rem;
  }

  .header-section .d-flex {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .step-content {
    padding: 1rem 0;
    min-height: 300px;
  }

  .order-item {
    padding: 1rem !important;
  }

  .order-summary-sticky {
    position: static;
  }

  .slot-card,
  .payment-method-card-option {
    min-height: 150px;
  }

  .navigation-controls {
    padding: 1rem;
  }

  .complete-order-btn {
    height: 56px !important;
    font-size: 1rem !important;
  }
}

/* Touch optimization */
@media (hover: none) and (pointer: coarse) {
  .slot-card,
  .payment-method-card-option {
    transition: transform 0.2s ease;
  }

  .slot-card:active,
  .payment-method-card-option:active {
    transform: scale(0.98);
  }

  .complete-order-btn:active {
    transform: scale(0.98);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .slot-card,
  .payment-method-card-option {
    border: 2px solid #000;
  }

  .slot-selected,
  .method-selected {
    border: 3px solid #000;
    background: #fff;
  }

  .total-row,
  .final-total {
    border: 2px solid #000;
    background: #fff;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .slot-card,
  .payment-method-card-option,
  .complete-order-btn {
    transition: none;
  }

  .slot-card:hover,
  .payment-method-card-option:hover {
    transform: none;
  }
}

/* Loading states */
.slot-card.loading,
.payment-method-card-option.loading {
  opacity: 0.7;
  pointer-events: none;
}

/* Animation for step transitions */
.step-content {
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>