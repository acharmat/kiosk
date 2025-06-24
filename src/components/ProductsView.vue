<template>
  <v-container fluid class="kiosk-products" style="height: 100vh;">
    <!-- Header - Consistent with Cart -->
    <v-app-bar color="primary" dark height="80" elevation="0">
      <v-btn icon size="large" :to="'/categories'" variant="text">
        <v-icon size="32">mdi-arrow-left</v-icon>
      </v-btn>

      <v-toolbar-title class="text-h5 font-weight-bold ml-4">
        <v-icon start size="28">mdi-food</v-icon>
        Nos Produits
      </v-toolbar-title>

      <v-spacer></v-spacer>
      <CartButton />
    </v-app-bar>

    <!-- Main Content -->
    <v-container class="products-grid pa-4 flex-grow-1">
      <!-- Loading State -->
      <div v-if="loading" class="center-content">
        <v-progress-circular indeterminate color="primary" size="80" width="8"></v-progress-circular>
        <h2 class="text-h5 font-weight-bold mt-6">Chargement...</h2>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="center-content">
        <v-icon color="error" size="80">mdi-alert-circle</v-icon>
        <h2 class="text-h5 font-weight-bold text-error mt-4 mb-4">{{ error }}</h2>
        <v-btn color="primary" size="x-large" class="px-8 py-4" @click="loadProducts">
          <v-icon start>mdi-refresh</v-icon>
          Réessayer
        </v-btn>
      </div>

      <!-- Products Grid -->
      <v-row v-else class="products-row" no-gutters>
        <v-col
            v-for="product in products"
            :key="product.id"
            cols="3"
            class="product-col pa-2"
        >
          <v-card class="product-card" elevation="2" @click="showProductDetails(product)">
            <!-- Octagon Product Image - Brand Identity -->
            <div class="octagon-container">
              <div class="product-octagon">
                <v-img
                    :src="product.image"
                    :alt="product.name"
                    cover
                    class="octagon-product-image"
                >
                  <template v-slot:placeholder>
                    <div class="image-placeholder">
                      <v-icon size="32" color="grey-lighten-2">mdi-food</v-icon>
                    </div>
                  </template>
                </v-img>

                <!-- Touch Overlay -->
                <div class="touch-overlay">
                  <v-icon color="white" size="32">mdi-plus</v-icon>
                </div>
              </div>
            </div>

            <!-- Product Info -->
            <div class="product-info pa-4">
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-price">
                <v-icon size="16" color="primary">mdi-currency-eur</v-icon>
                {{ product.price }}
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Product Details Modal - Consistent with Cart Modal -->
    <v-dialog v-model="showDetailsDialog" fullscreen transition="dialog-bottom-transition">
      <v-card class="product-modal">
        <!-- Modal Header - Same style as Cart -->
        <v-toolbar color="primary" dark height="80" elevation="0">
          <v-btn icon size="large" @click="showDetailsDialog = false">
            <v-icon size="32">mdi-arrow-left</v-icon>
          </v-btn>
          <v-toolbar-title class="text-h5 font-weight-bold ml-4">Détails du produit</v-toolbar-title>
          <v-spacer></v-spacer>
          <CartButton />
        </v-toolbar>

        <!-- Modal Content -->
        <v-container class="modal-content pa-6" v-if="selectedProduct">
          <v-row align="center" class="fill-height">
            <!-- Large Octagon Image -->
            <v-col cols="5">
              <div class="modal-octagon-container">
                <div class="modal-octagon">
                  <v-img
                      :src="selectedProduct.image"
                      :alt="selectedProduct.name"
                      cover
                      class="modal-octagon-image"
                  ></v-img>
                </div>
              </div>
            </v-col>

            <!-- Product Details -->
            <v-col cols="7">
              <div class="product-details pl-8">
                <h1 class="text-h4 font-weight-bold mb-4">{{ selectedProduct.name }}</h1>

                <p class="text-h6 mb-6 text-medium-emphasis" v-if="selectedProduct.description">
                  {{ selectedProduct.description }}
                </p>

                <!-- Price Card - Consistent with Cart -->
                <v-card class="price-card mb-6" elevation="0">
                  <div class="price-content">
                    <span class="price-label">Prix unitaire</span>
                    <span class="price-amount">{{ selectedProduct.price }}€</span>
                  </div>
                </v-card>

                <!-- Quantity Section - Same style as Cart -->
                <div class="quantity-section mb-8">
                  <h3 class="text-h6 font-weight-bold mb-4">Quantité</h3>
                  <div class="quantity-controls">
                    <v-btn
                        icon
                        size="large"
                        variant="outlined"
                        @click="decreaseQuantity"
                        :disabled="selectedQuantity <= 1"
                        class="quantity-btn"
                    >
                      <v-icon size="24">mdi-minus</v-icon>
                    </v-btn>

                    <span class="quantity-display">{{ selectedQuantity }}</span>

                    <v-btn
                        icon
                        size="large"
                        variant="outlined"
                        color="primary"
                        @click="increaseQuantity"
                        class="quantity-btn"
                    >
                      <v-icon size="24">mdi-plus</v-icon>
                    </v-btn>
                  </div>

                  <!-- Total Price Card -->
                  <v-card v-if="selectedQuantity > 1" class="total-card mt-4" elevation="0">
                    <div class="total-content">
                      <span class="total-label">Total</span>
                      <span class="total-amount">{{ (selectedProduct.price * selectedQuantity).toFixed(2) }}€</span>
                    </div>
                  </v-card>
                </div>

                <!-- Add to Cart Button - Same style as Cart Checkout -->
                <v-btn
                    color="primary"
                    size="x-large"
                    block
                    elevation="0"
                    class="add-to-cart-btn"
                    @click="addToCart"
                >
                  <v-icon start size="28">mdi-cart-plus</v-icon>
                  <span class="text-h6 font-weight-bold">Ajouter au panier</span>
                  <span v-if="selectedQuantity > 1" class="ml-2">
                    ({{ selectedQuantity }})
                  </span>
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>

    <!-- Cart Component -->
    <CartComponent />

    <!-- Success Notification - Consistent style -->
    <v-snackbar
        v-model="showAddSuccess"
        timeout="2000"
        color="success"
        location="top"
    >
      <v-icon start>mdi-check-circle</v-icon>
      {{ successMessage }}
    </v-snackbar>

    <!-- Error Notification - Consistent style -->
    <v-snackbar
        v-model="showErrorSnackbar"
        timeout="3000"
        color="error"
        location="top"
    >
      <v-icon start>mdi-alert-circle</v-icon>
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { syncProductsIfOnline } from '@/services/products'
import { cartService } from '@/services/cart'
import CartComponent from '@/components/CartComponent.vue'
import CartButton from '@/components/CartButton.vue'

const router = useRouter()
const route = useRoute()

const products = ref([])
const loading = ref(true)
const error = ref(null)
const showAddSuccess = ref(false)
const showErrorSnackbar = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showDetailsDialog = ref(false)
const selectedProduct = ref(null)
const selectedQuantity = ref(1)

const loadProducts = async () => {
  try {
    loading.value = true
    error.value = null

    const categoryId = route.query.category || route.params.category

    if (!categoryId) {
      error.value = 'Aucune catégorie sélectionnée.'
      return
    }

    products.value = await syncProductsIfOnline(categoryId)
  } catch (e) {
    console.error('Error loading products:', e)
    error.value = 'Impossible de charger les produits.'
    errorMessage.value = 'Erreur lors du chargement'
    showErrorSnackbar.value = true
  } finally {
    loading.value = false
  }
}

const showProductDetails = (product) => {
  selectedProduct.value = product
  selectedQuantity.value = 1
  showDetailsDialog.value = true
}

const increaseQuantity = () => {
  selectedQuantity.value++
}

const decreaseQuantity = () => {
  if (selectedQuantity.value > 1) {
    selectedQuantity.value--
  }
}

const addToCart = () => {
  if (!selectedProduct.value) return

  cartService.addItem(selectedProduct.value, selectedQuantity.value)

  successMessage.value = `${selectedQuantity.value}x ${selectedProduct.value.name} ajouté`
  showAddSuccess.value = true

  // Reset and close
  selectedQuantity.value = 1
  showDetailsDialog.value = false
}

// Load on mount
onMounted(() => {
  loadProducts()
})

// Reload products on category change
watch(() => route.query.category, (newCategory, oldCategory) => {
  if (newCategory !== oldCategory) {
    loadProducts()
  }
})
</script>

<style scoped>
/* Consistent with Cart Component Design */
.kiosk-products {
  background: #f8f9fa;
  overflow: hidden;
}

.products-grid {
  overflow-y: auto;
  height: calc(100vh - 80px);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.products-grid::-webkit-scrollbar {
  display: none;
}

.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
}

.products-row {
  gap: 12px;
  padding: 4px;
}

.product-col {
  display: flex;
}

.product-card {
  background: white;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  min-height: 220px;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.product-card:active {
  transform: translateY(-2px) scale(0.98);
}

/* Octagon Brand Identity */
.octagon-container {
  padding: 16px 16px 0 16px;
  display: flex;
  justify-content: center;
}

.product-octagon {
  position: relative;
  width: 120px;
  height: 120px;
  clip-path: polygon(
      25% 0%, 75% 0%,
      100% 25%, 100% 75%,
      75% 100%, 25% 100%,
      0% 75%, 0% 25%
  );
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  overflow: hidden;
}

.product-card:hover .product-octagon {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  transform: scale(1.05);
}

.octagon-product-image {
  width: 100%;
  height: 100%;
  transition: transform 0.2s ease;
}

.product-card:hover .octagon-product-image {
  transform: scale(1.1);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.touch-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(25, 118, 210, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.product-card:hover .touch-overlay {
  opacity: 1;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.product-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #2c3e50;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-price {
  font-size: 20px;
  font-weight: 700;
  color: #1976d2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* Modal Styles - Consistent with Cart */
.product-modal {
  background: #f8f9fa;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.modal-content {
  height: calc(100vh - 80px);
  background: white;
  border-radius: 20px 20px 0 0;
  margin-top: 8px;
}

/* Large Modal Octagon */
.modal-octagon-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-octagon {
  width: 300px;
  height: 300px;
  clip-path: polygon(
      25% 0%, 75% 0%,
      100% 25%, 100% 75%,
      75% 100%, 25% 100%,
      0% 75%, 0% 25%
  );
  background: white;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-octagon-image {
  width: 100%;
  height: 100%;
}

/* Price and Total Cards - Same as Cart */
.price-card, .total-card {
  background: #f5f5f5;
  border-radius: 12px;
}

.price-content, .total-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.price-label, .total-label {
  font-size: 18px;
  font-weight: 600;
}

.price-amount {
  font-size: 24px;
  font-weight: 700;
  color: #1976d2;
}

.total-amount {
  font-size: 20px;
  font-weight: 700;
  color: #1976d2;
}

/* Quantity Controls - Same as Cart */
.quantity-section {
  text-align: center;
}

.quantity-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.quantity-btn {
  min-width: 48px;
  height: 48px;
}

.quantity-display {
  font-size: 24px;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 12px;
  color: #1976d2;
}

/* Add to Cart Button - Same as Cart Checkout */
.add-to-cart-btn {
  height: 64px;
  border-radius: 16px;
  font-weight: 700;
}

/* Touch-friendly sizing for 7-inch screens */
@media (max-width: 1024px) {
  .product-card {
    min-height: 200px;
  }

  .product-octagon {
    width: 100px;
    height: 100px;
  }

  .modal-octagon {
    width: 240px;
    height: 240px;
  }

  .product-name {
    font-size: 16px;
  }

  .product-price {
    font-size: 18px;
  }

  .modal-content {
    padding: 16px !important;
  }

  .product-details {
    padding-left: 16px !important;
  }
}

/* Landscape optimization for kiosk */
@media (orientation: landscape) {
  .products-row {
    justify-content: flex-start;
  }

  .product-col {
    flex: 0 0 auto;
    width: calc(25% - 12px);
    max-width: 200px;
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
* {
  transition-duration: 0.2s !important;
}
</style>