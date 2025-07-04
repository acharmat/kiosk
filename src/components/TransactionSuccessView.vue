<template>
  <v-btn
      :color="cartComputed.isEmpty.value ? 'grey-lighten-1' : 'primary'"
      :variant="cartComputed.isEmpty.value ? 'outlined' : 'elevated'"
      size="large"
      class="cart-button"
      @click="cartService.openCart()"
      :class="{ 'cart-button-bounce': shouldBounce }"
  >
    <v-badge
        :content="cartComputed.itemCount.value"
        :model-value="!cartComputed.isEmpty.value"
        color="error"
        offset-x="5"
        offset-y="5"
    >
      <v-icon start size="24">mdi-cart</v-icon>
    </v-badge>

    <span class="ml-2">
      <span v-if="cartComputed.isEmpty.value">Panier</span>
      <span v-else>
        {{ cartComputed.totalPrice.value.toFixed(2) }}€
      </span>
    </span>
  </v-btn>
</template>

<script setup>
import { ref, watch } from 'vue'
import { cartService, cartComputed } from '@/services/cart'

const shouldBounce = ref(false)

// Watch for cart changes to trigger bounce animation
watch(
    () => cartComputed.itemCount.value,
    (newCount, oldCount) => {
      if (newCount > oldCount) {
        shouldBounce.value = true
        setTimeout(() => {
          shouldBounce.value = false
        }, 600)
      }
    }
)
</script>

<style scoped>
.cart-button {
  min-width: 120px;
  font-weight: 600;
  border-radius: 25px;
  text-transform: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cart-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.cart-button-bounce {
  animation: cartBounce 0.6s ease-in-out;
}

@keyframes cartBounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
  60% {
    transform: translateY(-4px);
  }
}

/* Pulse effect for the badge */
.v-badge__badge {
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}
</style>