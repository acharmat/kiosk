<template>
  <v-container fluid class="products-container d-flex flex-column">
    <v-app-bar
        color="white"
        elevation="2"
        class="app-header"
    >
      <v-btn
          icon
          :to="'/categories'"
          size="large"
          variant="text"
          color="grey-darken-1"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <v-toolbar-title class="text-h5 font-weight-bold text-primary">
        <v-icon start>mdi-food</v-icon>
        Nos Produits
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn
          color="primary"
          variant="flat"
          size="large"
          rounded="xl"
          class="d-sm-none"
          @click="showCartDrawer = !showCartDrawer"
      >
        <v-icon start>mdi-cart</v-icon>
        Panier
        <v-badge
            v-if="cartItems.length > 0"
            :content="cartItems.length"
            color="error"
            offset-x="10"
            offset-y="10"
            overlap
        ></v-badge>
      </v-btn>
    </v-app-bar>

    <v-row class="flex-grow-1 product-main-content">
      <v-col cols="12" md="8" class="products-grid-wrapper pa-6">
        <v-row>
          <v-col
              v-for="product in products"
              :key="product.id"
              cols="12"
              sm="6"
              lg="4"
          >
            <v-card
                class="product-card"
                elevation="4"
                rounded="xl"
                hover
            >
              <v-img
                  :src="product.image"
                  height="180"
                  cover
                  class="product-image"
              >
                <v-chip
                    v-if="product.discount"
                    color="error"
                    size="small"
                    class="ma-2 font-weight-bold"
                >
                  -{{ product.discount }}%
                </v-chip>
              </v-img>

              <v-card-title class="text-h6 font-weight-bold">
                {{ product.name }}
              </v-card-title>

              <v-card-text>
                <p class="text-body-2 text-medium-emphasis mb-2">
                  {{ product.description }}
                </p>

                <div class="d-flex align-center justify-space-between">
                  <div>
                    <span
                        v-if="product.originalPrice"
                        class="text-decoration-line-through text-medium-emphasis me-2"
                    >
                      {{ product.originalPrice }}€
                    </span>
                    <span class="text-h6 font-weight-bold text-primary">
                      {{ product.price }}€
                    </span>
                  </div>

                  <v-rating
                      :model-value="product.rating"
                      readonly
                      size="small"
                      density="compact"
                      color="amber"
                  ></v-rating>
                </div>
              </v-card-text>

              <v-card-actions class="px-4 pb-4">
                <v-btn
                    color="primary"
                    variant="elevated"
                    block
                    size="large"
                    rounded="xl"
                    @click="addToCart(product)"
                >
                  <v-icon start>mdi-cart-plus</v-icon>
                  Ajouter
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <v-col cols="12" md="4" class="cart-panel d-none d-md-block">
        <v-card class="fill-height elevation-6 rounded-xl pa-4">
          <v-card-title class="text-h5 font-weight-bold pa-4">
            <v-icon start>mdi-cart</v-icon>
            Votre Panier
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text class="cart-items-list py-4">
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
                  {{ parseFloat(item.price.replace('€', '')).toFixed(2) }}€ / unité
                </v-list-item-subtitle>

                <template v-slot:append>
                  <div class="d-flex align-center">
                    <v-btn
                        icon
                        size="small"
                        variant="text"
                        @click="updateQuantity(item.id, item.quantity - 1)"
                    >
                      <v-icon>mdi-minus</v-icon>
                    </v-btn>

                    <span class="mx-2 font-weight-bold text-h6">{{ item.quantity }}</span>

                    <v-btn
                        icon
                        size="small"
                        variant="text"
                        @click="updateQuantity(item.id, item.quantity + 1)"
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
                @click="checkout"
                class="checkout-btn"
            >
              <v-icon start>mdi-credit-card</v-icon>
              Payer {{ cartTotal.toFixed(2) }}€
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-navigation-drawer
        v-model="showCartDrawer"
        location="right"
        temporary
        width="400"
        class="pa-4"
    >
      <v-list-item>
        <v-list-item-title class="text-h5 font-weight-bold">
          <v-icon start>mdi-cart</v-icon> Votre Panier
        </v-list-item-title>
        <template v-slot:append>
          <v-btn
              icon
              variant="text"
              @click="showCartDrawer = false"
              color="grey-darken-1"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-list-item>
      <v-divider></v-divider>

      <v-card-text class="cart-items-list py-4">
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
              {{ parseFloat(item.price.replace('€', '')).toFixed(2) }}€ / unité
            </v-list-item-subtitle>

            <template v-slot:append>
              <div class="d-flex align-center">
                <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="updateQuantity(item.id, item.quantity - 1)"
                >
                  <v-icon>mdi-minus</v-icon>
                </v-btn>

                <span class="mx-2 font-weight-bold text-h6">{{ item.quantity }}</span>

                <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="updateQuantity(item.id, item.quantity + 1)"
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
            @click="checkout"
            class="checkout-btn"
        >
          <v-icon start>mdi-credit-card</v-icon>
          Payer {{ cartTotal.toFixed(2) }}€
        </v-btn>
      </v-card-text>
    </v-navigation-drawer>


    <v-snackbar
        v-model="showSuccess"
        color="success"
        timeout="2000"
        location="top"
        class="snackbar-custom"
    >
      <v-icon start>mdi-check-circle</v-icon>
      Produit ajouté au panier !
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'

const showCartDrawer = ref(false) // Changed from showCart to showCartDrawer for side panel
const showSuccess = ref(false)
const cartItems = ref([])

const products = ref([
  {
    id: 1,
    name: 'Crispy Chicken',
    price: '6.24',
    originalPrice: null,
    description: 'Poulet frit croustillant et juteux.',
    image: 'https://images.unsplash.com/photo-1626074900593-be349e598711?auto=format&fit=crop&q=80&w=300&h=200',
    rating: 4.5,
    discount: null
  },
  {
    id: 2,
    name: 'Geprek Chicken',
    price: '7.99',
    originalPrice: null,
    description: 'Poulet frit épicé avec sauce sambal.',
    image: 'https://images.unsplash.com/photo-1596700755776-63e8d98d2875?auto=format&fit=crop&q=80&w=300&h=200',
    rating: 4.8,
    discount: null
  },
  {
    id: 3,
    name: 'French Fries',
    price: '2.50',
    originalPrice: null,
    description: 'Frites croustillantes et dorées.',
    image: 'https://images.unsplash.com/photo-1579737130635-c3f2d250c18d?auto=format&fit=crop&q=80&w=300&h=200',
    rating: 4.2,
    discount: null
  },
  {
    id: 4,
    name: 'Pure Rice',
    price: '1.05',
    originalPrice: null,
    description: 'Portion de riz nature.',
    image: 'https://images.unsplash.com/photo-1546069901-dcd66f86c221?auto=format&fit=crop&q=80&w=300&h=200',
    rating: 4.0,
    discount: null
  },
  {
    id: 5,
    name: 'Extra Sambal',
    price: '0.50',
    originalPrice: null,
    description: 'Portion supplémentaire de sauce sambal.',
    image: 'https://images.unsplash.com/photo-1632789397945-814d4554b79b?auto=format&fit=crop&q=80&w=300&h=200',
    rating: 3.5,
    discount: null
  },
  {
    id: 6,
    name: 'Iced Tea',
    price: '1.05',
    originalPrice: null,
    description: 'Thé glacé rafraîchissant.',
    image: 'https://images.unsplash.com/photo-1598463581781-a8e1e7e7a83d?auto=format&fit=crop&q=80&w=300&h=200',
    rating: 4.6,
    discount: null
  },
  {
    id: 7,
    name: 'Crispy Combo',
    price: '10.95',
    originalPrice: null,
    description: 'Combo poulet croustillant, frites et boisson.',
    image: 'https://images.unsplash.com/photo-1599974558277-2c9d8c973a0e?auto=format&fit=crop&q=80&w=300&h=200',
    rating: 4.9,
    discount: null
  },
  {
    id: 8,
    name: 'Geprek Combo',
    price: '12.25',
    originalPrice: null,
    description: 'Combo poulet geprek, riz et boisson.',
    image: 'https://images.unsplash.com/photo-1546069901-c88f1199a6c7?auto=format&fit=crop&q=80&w=300&h=200',
    rating: 4.7,
    discount: null
  },
])

const cartTotal = computed(() => {
  return cartItems.value.reduce((total, item) => {
    const price = parseFloat(item.price) // Already a string number
    return total + (price * item.quantity)
  }, 0)
})

const addToCart = (product) => {
  const existingItem = cartItems.value.find(item => item.id === product.id)

  if (existingItem) {
    existingItem.quantity++
  } else {
    cartItems.value.push({
      ...product,
      quantity: 1
    })
  }

  showSuccess.value = true
}

const updateQuantity = (productId, newQuantity) => {
  if (newQuantity <= 0) {
    cartItems.value = cartItems.value.filter(item => item.id !== productId)
  } else {
    const item = cartItems.value.find(item => item.id === productId)
    if (item) {
      item.quantity = newQuantity
    }
  }
}

const checkout = () => {
  if (cartItems.value.length === 0) {
    alert("Votre panier est vide. Veuillez ajouter des articles avant de payer.");
    return;
  }
  // Simulate checkout process (e.g., navigate to payment screen)
  alert(`Passer à la page de paiement pour un total de ${cartTotal.value.toFixed(2)}€!`);
  // In a real application, you would navigate to a /payment route here
  // router.push('/payment');
  cartItems.value = [] // Clear cart after "checkout"
  showCartDrawer.value = false
}
</script>

<style scoped>
.products-container {
  background: #f5f7fa; /* Light background */
}

.app-header {
  border-bottom: 1px solid #e0e0e0;
}

.product-main-content {
  flex-grow: 1; /* Allows content to take available height */
  overflow-y: auto; /* Enable scrolling for product list if it overflows */
}

.products-grid-wrapper {
  max-width: 100%; /* Take full width on small screens */
}

.product-card {
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.12) !important;
}

.product-image {
  background-color: #f0f0f0; /* Placeholder background */
}

.cart-panel {
  background-color: #ffffff;
  border-left: 1px solid #e0e0e0;
  max-height: calc(100vh - 64px); /* Account for app bar height */
  overflow-y: auto; /* Scroll for cart content */
}

.cart-items-list {
  flex-grow: 1;
  overflow-y: auto;
}

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

.snackbar-custom .v-snackbar__content {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>