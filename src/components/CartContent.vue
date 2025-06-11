<template>
  <v-card class="fill-height elevation-6 rounded-xl pa-4 d-flex flex-column">
    <v-list-item>
      <v-list-item-title class="text-h5 font-weight-bold">
        <v-icon start>mdi-cart</v-icon> Votre Panier
      </v-list-item-title>
      <template v-slot:append>
        <v-btn
            icon
            variant="text"
            @click="$emit('close-drawer')"
            color="grey-darken-1"
            v-if="$attrs['v-model'] !== undefined"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-list-item>
    <v-divider></v-divider>

    <v-card-text class="cart-items-list py-4" style="flex-grow: 1; overflow-y: auto;">
      <div v-if="cartItems.length === 0" class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-cart-outline</v-icon>
        <p class="text-h6 mt-4 text-medium-emphasis">Votre panier est vide</p>
      </div>

      <v-list v-else dense class="cart-list">
        <v-list-item
            v-for="item in cartItems"
            :key="item.id"
            class="cart-list-item"
        >
          <template v-slot:prepend>
            <v-avatar size="60" rounded="lg">
              <v-img :src="item.image"></v-img>
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-bold text-body-1">
            {{ item.name }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-body-2">
            {{ parseFloat(item.price).toFixed(2) }}€ / unité
          </v-list-item-subtitle>

          <template v-slot:append>
            <div class="d-flex align-center">
              <v-btn
                  icon
                  size="small"
                  variant="text"
                  @click="$emit('update-quantity', item.id, item.quantity - 1)"
              >
                <v-icon>mdi-minus</v-icon>
              </v-btn>

              <span class="mx-2 font-weight-bold text-h6">{{ item.quantity }}</span>

              <v-btn
                  icon
                  size="small"
                  variant="text"
                  @click="$emit('update-quantity', item.id, item.quantity + 1)"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-divider v-if="cartItems.length > 0"></v-divider>

    <v-card-text v-if="cartItems.length > 0" class="py-4">
      <div class="d-flex justify-space-between align-center mb-4">
        <span class="text-h6 font-weight-bold">Total:</span>
        <span class="text-h5 font-weight-black text-primary">
          {{ cartTotal.toFixed(2) }}€
        </span>
      </div>

      <v-btn
          color="success"
          variant="elevated"
          block
          size="x-large"
          rounded="xl"
          @click="$emit('checkout')"
          class="checkout-btn"
      >
        <v-icon start>mdi-credit-card</v-icon>
        Payer {{ cartTotal.toFixed(2) }}€
      </v-btn>
    </v-card-text>
  </v-card>
</template>


<script setup>
defineProps({
  cartItems: Array,
  cartTotal: Number,
})
defineEmits(['update-quantity', 'checkout', 'close-drawer'])
</script>

<style scoped>
.cart-list-item {
  border-bottom: 1px solid #eee;
  padding: 8px 0;
}

.cart-list-item:last-child {
  border-bottom: none;
}

.checkout-btn {
  font-weight: bold;
}
</style>
