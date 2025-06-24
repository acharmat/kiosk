<template>
  <v-dialog v-model="cartService.isOpen" fullscreen transition="dialog-bottom-transition">
    <v-card class="kiosk-cart">
      <!-- Simplified Header -->
      <v-toolbar color="primary" dark height="80" elevation="0">
        <v-btn icon size="large" @click="cartService.closeCart()">
          <v-icon size="32">mdi-arrow-left</v-icon>
        </v-btn>
        <v-toolbar-title class="text-h5 font-weight-bold ml-4">
          Panier ({{ cartComputed.itemCount.value }})
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
            v-if="!cartComputed.isEmpty.value"
            icon
            size="large"
            @click="clearCart"
            color="error"
        >
          <v-icon size="28">mdi-trash-can</v-icon>
        </v-btn>
      </v-toolbar>

      <!-- Empty Cart State -->
      <div v-if="cartComputed.isEmpty.value" class="empty-state">
        <v-icon size="80" color="grey-lighten-2" class="mb-6">mdi-cart-outline</v-icon>
        <h2 class="text-h5 font-weight-bold mb-4">Panier vide</h2>
        <v-btn
            color="primary"
            size="x-large"
            @click="cartService.closeCart()"
            class="px-8 py-4"
        >
          Continuer
        </v-btn>
      </div>

      <!-- Cart Content -->
      <div v-else class="cart-container">
        <!-- Items List -->
        <div class="items-section">
          <v-card
              v-for="item in cartComputed.items.value"
              :key="item.id"
              class="cart-item"
              elevation="2"
          >
            <div class="item-content">
              <!-- Product Image -->
              <div class="item-image">
                <v-img
                    :src="item.image"
                    :alt="item.name"
                    cover
                    height="80"
                    width="80"
                >
                  <template v-slot:placeholder>
                    <div class="image-placeholder">
                      <v-icon color="grey">mdi-food</v-icon>
                    </div>
                  </template>
                </v-img>
              </div>

              <!-- Product Info -->
              <div class="item-info">
                <h3 class="item-name">{{ item.name }}</h3>
                <p class="item-price">{{ item.price.toFixed(2) }}€</p>
              </div>

              <!-- Quantity Controls -->
              <div class="quantity-section">
                <v-btn
                    icon
                    size="large"
                    variant="outlined"
                    @click="decreaseQuantity(item)"
                    :disabled="item.quantity <= 1"
                    class="quantity-btn"
                >
                  <v-icon size="24">mdi-minus</v-icon>
                </v-btn>

                <span class="quantity-display">{{ item.quantity }}</span>

                <v-btn
                    icon
                    size="large"
                    variant="outlined"
                    color="primary"
                    @click="increaseQuantity(item)"
                    class="quantity-btn"
                >
                  <v-icon size="24">mdi-plus</v-icon>
                </v-btn>
              </div>

              <!-- Item Total & Remove -->
              <div class="item-actions">
                <div class="item-total">{{ (item.price * item.quantity).toFixed(2) }}€</div>
                <v-btn
                    icon
                    size="large"
                    variant="text"
                    color="error"
                    @click="removeItem(item)"
                >
                  <v-icon size="24">mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </v-card>
        </div>

        <!-- Bottom Summary & Checkout -->
        <div class="checkout-section">
          <div class="total-summary">
            <span class="total-label">Total</span>
            <span class="total-amount">{{ cartComputed.totalPrice.value.toFixed(2) }}€</span>
          </div>

          <div class="checkout-actions">
            <v-btn
                color="primary"
                size="x-large"
                block
                @click="proceedToCheckout"
                class="checkout-btn"
                :loading="isProcessing"
            >
              <v-icon start size="28">mdi-credit-card</v-icon>
              Payer {{ cartComputed.totalPrice.value.toFixed(2) }}€
            </v-btn>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>

  <!-- Simplified Processing Dialog -->
  <v-dialog v-model="showCheckoutDialog" fullscreen persistent>
    <v-card class="processing-screen">
      <div class="processing-content">
        <v-progress-circular
            indeterminate
            size="80"
            width="8"
            color="white"
            class="mb-8"
        ></v-progress-circular>

        <h2 class="text-h4 font-weight-bold text-white mb-4">
          Traitement du paiement
        </h2>

        <div class="payment-card">
          <v-icon size="48" color="primary" class="mb-4">mdi-monitor</v-icon>
          <h3 class="text-h6 mb-4">Suivez les instructions sur le terminal</h3>
          <div class="amount-display">{{ cartComputed.totalPrice.value.toFixed(2) }}€</div>
        </div>
      </div>
    </v-card>
  </v-dialog>

  <!-- Success/Error Messages -->
  <v-snackbar
      v-model="showSuccess"
      timeout="3000"
      color="success"
      location="top"
  >
    <v-icon start>mdi-check-circle</v-icon>
    Paiement réussi !
  </v-snackbar>

  <v-snackbar
      v-model="showErrorSnackbar"
      timeout="5000"
      color="error"
      location="top"
  >
    <v-icon start>mdi-alert-circle</v-icon>
    {{ errorMessage }}
  </v-snackbar>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { cartService, cartComputed } from '@/services/cart'

const router = useRouter()

const showCheckoutDialog = ref(false)
const showSuccess = ref(false)
const showErrorSnackbar = ref(false)
const errorMessage = ref('')
const isProcessing = ref(false)

const increaseQuantity = (item) => {
  cartService.updateQuantity(item.id, item.quantity + 1)
}

const decreaseQuantity = (item) => {
  if (item.quantity > 1) {
    cartService.updateQuantity(item.id, item.quantity - 1)
  }
}

const removeItem = (item) => {
  cartService.removeItem(item.id)
}

const clearCart = () => {
  cartService.clear()
}

const proceedToCheckout = async () => {
  if (cartComputed.isEmpty.value) return

  try {
    isProcessing.value = true
    cartService.closeCart()
    showCheckoutDialog.value = true

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 4000))

    const paymentSuccess = Math.random() > 0.1 // 90% success rate

    if (paymentSuccess) {
      showCheckoutDialog.value = false
      showSuccess.value = true
      cartService.clear()

      setTimeout(() => {
        router.push('/categories')
      }, 2000)
    } else {
      throw new Error('Paiement échoué')
    }
  } catch (error) {
    console.error('Checkout error:', error)
    showCheckoutDialog.value = false
    errorMessage.value = error.message || 'Erreur de paiement'
    showErrorSnackbar.value = true
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
/* Kiosk-optimized styles for 7-inch screens */
.kiosk-cart {
  background: #f8f9fa;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Empty State */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

/* Cart Container */
.cart-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
}

/* Items Section */
.items-section {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 0;
}

.cart-item {
  margin-bottom: 12px;
  border-radius: 16px;
  background: white;
}

.item-content {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 16px;
}

.item-image {
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
}

.image-placeholder {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 12px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  font-size: 16px;
  color: #666;
  margin: 0;
}

/* Quantity Controls */
.quantity-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.quantity-btn {
  min-width: 48px;
  height: 48px;
}

.quantity-display {
  font-size: 20px;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

/* Item Actions */
.item-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.item-total {
  font-size: 18px;
  font-weight: 700;
  color: #1976d2;
}

/* Checkout Section */
.checkout-section {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 20px;
  flex-shrink: 0;
}

.total-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 12px;
}

.total-label {
  font-size: 20px;
  font-weight: 600;
}

.total-amount {
  font-size: 28px;
  font-weight: 700;
  color: #1976d2;
}

.checkout-btn {
  height: 64px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 16px;
}

/* Processing Screen */
.processing-screen {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.processing-content {
  text-align: center;
  padding: 40px;
}

.payment-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin-top: 30px;
  max-width: 400px;
}

.amount-display {
  font-size: 32px;
  font-weight: 700;
  color: #1976d2;
  margin-top: 16px;
}

/* Touch-friendly improvements */
@media (max-width: 768px) {
  .item-content {
    padding: 12px;
    gap: 12px;
  }

  .item-name {
    font-size: 16px;
  }

  .quantity-btn {
    min-width: 44px;
    height: 44px;
  }
}

/* Prevent text selection for kiosk */
* {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Smooth transitions */
.cart-item {
  transition: transform 0.2s ease;
}

.cart-item:active {
  transform: scale(0.98);
}
</style>