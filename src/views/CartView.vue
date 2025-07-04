<template>
  <div class="cart-view">
    <v-container fluid class="pa-6">
      <!-- Header Section -->
      <div class="header-section mb-6">
        <div class="d-flex align-center justify-between">
          <div class="header-info">
            <h1 class="text-h3 font-weight-bold mb-2">Shopping Cart</h1>
            <p class="text-h6 text-medium-emphasis">
              {{ cartStore.itemCount }} {{ cartStore.itemCount === 1 ? 'item' : 'items' }} in your cart
            </p>
          </div>

          <!-- Continue Shopping Button -->
          <v-btn
              color="primary"
              variant="outlined"
              size="large"
              @click="continueShopping"
              class="continue-btn"
          >
            <v-icon class="mr-2">mdi-arrow-left</v-icon>
            Continue Shopping
          </v-btn>
        </div>
      </div>

      <!-- Empty Cart State -->
      <div v-if="cartStore.isEmpty" class="empty-cart">
        <div class="text-center">
          <v-icon size="120" color="grey-lighten-1" class="mb-4">
            mdi-cart-outline
          </v-icon>
          <h2 class="text-h4 font-weight-medium mb-3">Your cart is empty</h2>
          <p class="text-body-1 text-medium-emphasis mb-6">
            Add some products to get started
          </p>

          <v-btn
              color="primary"
              size="large"
              @click="startShopping"
          >
            <v-icon class="mr-2">mdi-storefront</v-icon>
            Start Shopping
          </v-btn>
        </div>
      </div>

      <!-- Cart Content -->
      <div v-else class="cart-content">
        <v-row>
          <!-- Cart Items -->
          <v-col cols="12" md="8">
            <v-card class="cart-items-card" elevation="4">
              <v-card-title class="d-flex align-center justify-between">
                <span class="text-h5">Cart Items</span>
                <v-btn
                    color="error"
                    variant="text"
                    @click="showClearCartDialog = true"
                    :disabled="cartStore.isEmpty"
                >
                  <v-icon class="mr-2">mdi-delete</v-icon>
                  Clear Cart
                </v-btn>
              </v-card-title>

              <v-divider />

              <v-card-text class="pa-0">
                <v-list class="cart-items-list">
                  <template v-for="(item, index) in cartStore.items" :key="item.id">
                    <v-list-item class="cart-item">
                      <template v-slot:prepend>
                        <v-avatar size="80" rounded="lg" class="cart-item-image">
                          <v-img
                              :src="item.image || defaultProductImage"
                              :alt="item.name"
                              cover
                          >
                            <template v-slot:error>
                              <v-icon size="40" color="grey-lighten-1">
                                mdi-image-off
                              </v-icon>
                            </template>
                          </v-img>
                        </v-avatar>
                      </template>

                      <div class="cart-item-content">
                        <div class="item-info">
                          <h3 class="text-h6 font-weight-bold mb-1">{{ item.name }}</h3>
                          <p class="text-body-2 text-medium-emphasis mb-2">
                            {{ truncateDescription(item.description, 80) }}
                          </p>
                          <div class="price-info">
                            <span class="text-h6 font-weight-bold text-success">
                              {{ formatPrice(item.price) }}
                            </span>
                            <span class="text-body-2 text-medium-emphasis ml-2">
                              each
                            </span>
                          </div>
                        </div>

                        <div class="item-controls">
                          <!-- Quantity Controls -->
                          <div class="quantity-controls">
                            <v-btn
                                :disabled="item.quantity <= 1"
                                icon
                                size="small"
                                variant="outlined"
                                @click="decrementQuantity(item.id)"
                                class="quantity-btn"
                            >
                              <v-icon>mdi-minus</v-icon>
                            </v-btn>

                            <div class="quantity-display">
                              <span class="text-h6 font-weight-bold">{{ item.quantity }}</span>
                            </div>

                            <v-btn
                                :disabled="item.quantity >= 10"
                                icon
                                size="small"
                                variant="outlined"
                                @click="incrementQuantity(item.id)"
                                class="quantity-btn"
                            >
                              <v-icon>mdi-plus</v-icon>
                            </v-btn>
                          </div>

                          <!-- Item Total -->
                          <div class="item-total">
                            <span class="text-h6 font-weight-bold">
                              {{ formatPrice(item.price * item.quantity) }}
                            </span>
                          </div>

                          <!-- Remove Button -->
                          <v-btn
                              icon
                              size="small"
                              color="error"
                              variant="text"
                              @click="removeItem(item.id)"
                              class="remove-btn"
                          >
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </div>
                      </div>
                    </v-list-item>

                    <v-divider v-if="index < cartStore.items.length - 1" />
                  </template>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Order Summary -->
          <v-col cols="12" md="4">
            <div class="order-summary-sticky">
              <v-card class="order-summary-card" elevation="4">
                <v-card-title class="text-h5">Order Summary</v-card-title>

                <v-divider />

                <v-card-text>
                  <!-- Order Details -->
                  <div class="order-details">
                    <div class="summary-row">
                      <span>Subtotal ({{ cartStore.itemCount }} items)</span>
                      <span class="font-weight-bold">{{ cartStore.formattedTotal }}</span>
                    </div>

                    <div class="summary-row">
                      <span>Tax (19%)</span>
                      <span class="font-weight-bold">{{ formatPrice(cartStore.totalAmount * 0.19) }}</span>
                    </div>

                    <v-divider class="my-4" />

                    <div class="summary-row total-row">
                      <span class="text-h6 font-weight-bold">Total</span>
                      <span class="text-h5 font-weight-bold text-success">
                        {{ formatPrice(cartStore.totalAmount * 1.19) }}
                      </span>
                    </div>
                  </div>

                  <!-- Payment Methods Preview -->
                  <div class="payment-methods-preview mt-6">
                    <h4 class="text-subtitle-1 font-weight-medium mb-3">We Accept</h4>
                    <div class="payment-icons">
                      <v-chip
                          v-for="method in paymentMethods"
                          :key="method.value"
                          :prepend-icon="method.icon"
                          size="small"
                          variant="outlined"
                          class="mr-2 mb-2"
                      >
                        {{ method.text }}
                      </v-chip>
                    </div>
                  </div>

                  <!-- Checkout Button -->
                  <v-btn
                      :disabled="!cartStore.canCheckout"
                      :loading="processing"
                      color="primary"
                      size="x-large"
                      block
                      @click="proceedToCheckout"
                      class="checkout-btn mt-6"
                  >
                    <v-icon class="mr-2">mdi-credit-card</v-icon>
                    Proceed to Checkout
                  </v-btn>

                  <!-- Security Note -->
                  <div class="security-note mt-4">
                    <div class="d-flex align-center">
                      <v-icon color="success" size="20" class="mr-2">
                        mdi-shield-check
                      </v-icon>
                      <span class="text-body-2 text-medium-emphasis">
                        Secure payment processing
                      </span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>

              <!-- Recommended Products -->
              <v-card v-if="recommendedProducts.length > 0" class="mt-4" elevation="4">
                <v-card-title class="text-h6">You might also like</v-card-title>

                <v-card-text class="pa-2">
                  <div class="recommended-products">
                    <div
                        v-for="product in recommendedProducts"
                        :key="product.id"
                        class="recommended-item"
                    >
                      <v-card
                          variant="outlined"
                          @click="addRecommendedProduct(product)"
                          class="recommended-card"
                      >
                        <div class="d-flex align-center pa-2">
                          <v-avatar size="50" rounded="lg" class="mr-3">
                            <v-img
                                :src="product.image || defaultProductImage"
                                :alt="product.name"
                                cover
                            />
                          </v-avatar>

                          <div class="flex-grow-1">
                            <p class="text-body-2 font-weight-medium mb-1">
                              {{ truncateText(product.name, 30) }}
                            </p>
                            <p class="text-body-2 text-success font-weight-bold">
                              {{ formatPrice(product.price) }}
                            </p>
                          </div>

                          <v-btn
                              icon
                              size="small"
                              color="primary"
                              variant="outlined"
                          >
                            <v-icon>mdi-plus</v-icon>
                          </v-btn>
                        </div>
                      </v-card>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-container>

    <!-- Clear Cart Confirmation Dialog -->
    <v-dialog v-model="showClearCartDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6">
          <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
          Clear Cart?
        </v-card-title>

        <v-card-text>
          Are you sure you want to remove all items from your cart? This action cannot be undone.
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showClearCartDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="clearCart">Clear Cart</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Remove Item Confirmation Dialog -->
    <v-dialog v-model="showRemoveDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6">Remove Item?</v-card-title>

        <v-card-text>
          Remove "{{ itemToRemove?.name }}" from your cart?
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showRemoveDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="confirmRemoveItem">Remove</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Messages -->
    <v-snackbar
        v-model="showSuccessMessage"
        :timeout="3000"
        color="success"
        location="bottom"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-check-circle</v-icon>
        {{ successMessage }}
      </div>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { databaseService } from '@/services/databaseService'
import type { CartItem, Product } from '@/types'

const router = useRouter()
const cartStore = useCartStore()

// State
const processing = ref(false)
const showClearCartDialog = ref(false)
const showRemoveDialog = ref(false)
const itemToRemove = ref<CartItem | null>(null)
const showSuccessMessage = ref(false)
const successMessage = ref('')
const recommendedProducts = ref<Product[]>([])

// Constants
const defaultProductImage = '/images/default-product.png'

const paymentMethods = [
  { value: 'card', text: 'Card', icon: 'mdi-credit-card' },
  { value: 'contactless', text: 'Contactless', icon: 'mdi-contactless-payment' },
  { value: 'mobile', text: 'Mobile Pay', icon: 'mdi-cellphone' },
  { value: 'cash', text: 'Cash', icon: 'mdi-cash' }
]

// Methods
const incrementQuantity = (itemId: string) => {
  cartStore.incrementQuantity(itemId)
  showMessage('Quantity updated')
}

const decrementQuantity = (itemId: string) => {
  cartStore.decrementQuantity(itemId)
  showMessage('Quantity updated')
}

const removeItem = (itemId: string) => {
  const item = cartStore.items.find(i => i.id === itemId)
  if (item) {
    itemToRemove.value = item
    showRemoveDialog.value = true
  }
}

const confirmRemoveItem = () => {
  if (itemToRemove.value) {
    cartStore.removeItem(itemToRemove.value.id)
    showMessage(`${itemToRemove.value.name} removed from cart`)
    showRemoveDialog.value = false
    itemToRemove.value = null
  }
}

const clearCart = () => {
  cartStore.clearCart()
  showClearCartDialog.value = false
  showMessage('Cart cleared')
}

const proceedToCheckout = async () => {
  if (!cartStore.canCheckout) return

  processing.value = true

  try {
    // Add any pre-checkout validation here
    await router.push('/checkout')
  } catch (error) {
    console.error('Failed to proceed to checkout:', error)
    showMessage('Failed to proceed to checkout', 'error')
  } finally {
    processing.value = false
  }
}

const continueShopping = () => {
  // Go back to the last category or products page
  if (cartStore.selectedCategory) {
    router.push('/products')
  } else if (cartStore.selectedChannel) {
    router.push('/categories')
  } else {
    router.push('/channels')
  }
}

const startShopping = () => {
  router.push('/channels')
}

const addRecommendedProduct = (product: Product) => {
  cartStore.addItem(product, 1)
  showMessage(`${product.name} added to cart`)
}

const loadRecommendedProducts = async () => {
  try {
    // In a real implementation, this would be based on current cart items
    // For now, we'll get some random products from the current category
    if (cartStore.selectedCategory) {
      const products = await databaseService.getProducts(cartStore.selectedCategory, 3)
      // Filter out products already in cart
      const cartProductIds = cartStore.items.map(item => item.productId)
      recommendedProducts.value = products.filter(p => !cartProductIds.includes(p.id))
    }
  } catch (error) {
    console.error('Failed to load recommended products:', error)
  }
}

const showMessage = (message: string, type: 'success' | 'error' = 'success') => {
  successMessage.value = message
  showSuccessMessage.value = true
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

const truncateDescription = (description: string, maxLength: number): string => {
  if (description.length <= maxLength) return description
  return description.substring(0, maxLength).trim() + '...'
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

// Lifecycle
onMounted(() => {
  loadRecommendedProducts()
})
</script>

<style scoped>
.cart-view {
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

.continue-btn {
  border-radius: 25px !important;
  font-weight: 600;
}

.empty-cart {
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cart-items-card {
  border-radius: 16px !important;
}

.cart-items-list {
  background: transparent;
}

.cart-item {
  padding: 1.5rem !important;
  min-height: 120px;
}

.cart-item-image {
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.cart-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-left: 1rem;
}

.item-info {
  flex: 1;
  margin-right: 1rem;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 20px;
  padding: 0.25rem;
}

.quantity-btn {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
}

.quantity-display {
  min-width: 40px;
  text-align: center;
  padding: 0 0.5rem;
}

.item-total {
  min-width: 80px;
  text-align: right;
}

.remove-btn {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
}

.order-summary-sticky {
  position: sticky;
  top: 2rem;
}

.order-summary-card {
  border-radius: 16px !important;
}

.order-details {
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

.payment-methods-preview {
  padding: 1rem;
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 8px;
}

.payment-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.checkout-btn {
  height: 60px !important;
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  border-radius: 30px !important;
}

.checkout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.4) !important;
}

.security-note {
  text-align: center;
  padding: 0.5rem;
}

.recommended-products {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recommended-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px !important;
}

.recommended-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  transform: translateY(-1px);
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

  .cart-item {
    padding: 1rem !important;
  }

  .cart-item-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .item-controls {
    width: 100%;
    justify-content: space-between;
  }

  .order-summary-sticky {
    position: static;
  }

  .checkout-btn {
    height: 56px !important;
  }
}

/* Touch optimization */
@media (hover: none) and (pointer: coarse) {
  .quantity-btn,
  .remove-btn {
    min-height: 44px !important;
    min-width: 44px !important;
  }

  .recommended-card:active {
    transform: scale(0.98);
  }

  .checkout-btn:active {
    transform: scale(0.98);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .cart-item {
    border-bottom: 2px solid #000;
  }

  .quantity-controls {
    border: 2px solid #000;
  }

  .total-row {
    border: 2px solid #000;
    background: #fff;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .checkout-btn,
  .recommended-card {
    transition: none;
  }

  .checkout-btn:hover,
  .recommended-card:hover {
    transform: none;
  }
}

/* Loading states */
.cart-item.updating {
  opacity: 0.7;
  pointer-events: none;
}

/* Success animation */
@keyframes itemAdded {
  0% { transform: scale(1); background: transparent; }
  50% { transform: scale(1.02); background: rgba(var(--v-theme-success), 0.1); }
  100% { transform: scale(1); background: transparent; }
}

.cart-item.item-added {
  animation: itemAdded 0.5s ease;
}

/* Empty state animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-cart {
  animation: fadeInUp 0.5s ease;
}
</style>