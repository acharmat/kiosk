<template>
  <v-container fluid class="products-container d-flex flex-column" style="height: 100vh;">
    <v-app-bar dense color="white" elevation="2" class="app-header">
      <v-btn icon :to="'/categories'" size="large" variant="text" color="grey-darken-1">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <v-toolbar-title class="text-h6 font-weight-bold text-primary">
        <v-icon start size="small">mdi-food</v-icon>
        Nos Produits
      </v-toolbar-title>
    </v-app-bar>

    <v-container class="products-grid-wrapper pa-6 flex-grow-1">
      <div v-if="loading" class="loading-state">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-4">Chargement des produits...</p>
      </div>
      <div v-else-if="error" class="error-state">
        <v-icon color="error" size="48">mdi-alert-circle</v-icon>
        <p class="text-error mt-2">{{ error }}</p>
        <v-btn
            color="primary"
            variant="outlined"
            class="mt-4"
            @click="loadProducts"
        >
          <v-icon start>mdi-refresh</v-icon>
          Réessayer
        </v-btn>
      </div>

      <v-row justify="center" align="start" class="gy-6" v-else>
        <v-col
            v-for="product in products"
            :key="product.id"
            cols="6"
            sm="4"
            md="3"
            lg="2"
            class="d-flex flex-column align-center"
        >
          <div class="product-item" @click="showProductDetails(product)">
            <!-- Octagon product image -->
            <div class="product-octagon-container">
              <div class="product-octagon">
                <v-img
                    :src="product.image"
                    :alt="product.name"
                    cover
                    class="octagon-product-image"
                >
                  <template v-slot:placeholder>
                    <div class="image-placeholder">
                      <v-icon size="40" color="grey-lighten-2">mdi-food</v-icon>
                    </div>
                  </template>
                </v-img>

                <!-- Hover overlay -->
                <div class="product-overlay">
                  <v-icon color="white" size="24">mdi-cart-plus</v-icon>
                </div>
              </div>
            </div>

            <!-- Product info outside -->
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-price">
                <v-icon size="14" color="primary">mdi-currency-eur</v-icon>
                {{ product.price }}
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Product Details Full Screen Modal -->
    <v-dialog v-model="showDetailsDialog" fullscreen transition="dialog-bottom-transition">
      <v-card class="product-details-card">
        <v-toolbar color="white">
          <v-btn icon @click="showDetailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title class="font-weight-bold">Détails du produit</v-toolbar-title>
        </v-toolbar>

        <v-container class="details-container pa-8" v-if="selectedProduct">
          <v-row justify="center" align="center" class="fill-height">
            <v-col cols="12" md="6" class="text-center">
              <!-- Large octagon image -->
              <div class="details-octagon-container">
                <div class="details-octagon">
                  <v-img
                      :src="selectedProduct.image"
                      :alt="selectedProduct.name"
                      cover
                      class="details-octagon-image"
                  ></v-img>
                </div>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="product-details-info">
                <h1 class="display-1 font-weight-bold mb-4">{{ selectedProduct.name }}</h1>

                <p class="text-h6 mb-6 text-medium-emphasis">{{ selectedProduct.description }}</p>

                <div class="price-section mb-6">
                  <div class="text-h4 font-weight-bold text-primary">
                    {{ selectedProduct.price }}€
                  </div>
                </div>

                <v-btn
                    color="primary"
                    size="x-large"
                    block
                    elevation="4"
                    class="font-weight-bold"
                    @click="processPurchase"
                    :disabled="processingPayment"
                >
                  <v-icon start>mdi-cart</v-icon>
                  {{ processingPayment ? 'Traitement...' : 'Acheter maintenant' }}
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>

    <!-- Payment Processing Full Screen -->
    <v-dialog v-model="showPaymentDialog" fullscreen persistent>
      <v-card class="payment-processing-card">
        <v-container class="payment-container fill-height">
          <v-row justify="center" align="center" class="fill-height">
            <v-col cols="12" class="text-center">
              <!-- Animated octagon loader -->
              <div class="payment-octagon-loader">
                <div class="payment-octagon rotating">
                  <v-icon size="64" color="white">mdi-credit-card</v-icon>
                </div>
              </div>

              <h2 class="display-1 font-weight-bold mb-6 text-white">
                Traitement du paiement...
              </h2>

              <div class="payment-instructions">
                <v-card rounded="xl" elevation="8" class="pa-6">
                  <v-icon size="48" color="primary" class="mb-4">mdi-monitor</v-icon>
                  <h3 class="text-h5 font-weight-bold mb-4">Instructions</h3>
                  <p class="text-h6 text-medium-emphasis">
                    Veuillez suivre les instructions affichées sur le terminal de paiement
                  </p>

                  <!-- Progress indicator -->
                  <v-progress-linear
                      indeterminate
                      color="primary"
                      class="mt-6"
                      height="6"
                      rounded
                  ></v-progress-linear>
                </v-card>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>

    <!-- Enhanced Success Snackbar -->
    <v-snackbar
        v-model="showSuccess"
        timeout="3000"
        color="success"
        location="top"
        elevation="6"
    >
      <div class="d-flex align-center">
        <v-icon start>mdi-check-circle</v-icon>
        <span class="font-weight-medium">Paiement réussi ! Merci pour votre achat !</span>
      </div>
      <template v-slot:actions>
        <v-btn
            variant="text"
            @click="showSuccess = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Error Snackbar -->
    <v-snackbar
        v-model="showErrorSnackbar"
        timeout="5000"
        color="error"
        location="top"
        elevation="6"
    >
      <div class="d-flex align-center">
        <v-icon start>mdi-alert-circle</v-icon>
        <span class="font-weight-medium">{{ errorMessage }}</span>
      </div>
      <template v-slot:actions>
        <v-btn
            variant="text"
            @click="showErrorSnackbar = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { syncProductsIfOnline } from '@/services/products'

const router = useRouter()
const route = useRoute()

const products = ref([])
const loading = ref(true)
const error = ref(null)
const showSuccess = ref(false)
const showErrorSnackbar = ref(false)
const errorMessage = ref('')
const showDetailsDialog = ref(false)
const showPaymentDialog = ref(false)
const selectedProduct = ref(null)
const processingPayment = ref(false)

const loadProducts = async () => {
  try {
    loading.value = true
    error.value = null

    const categoryId = route.query.category || route.params.category
    console.log('📦 Loading products for categoryId:', categoryId)
    console.log('📦 Route query:', route.query)
    console.log('📦 Route params:', route.params)

    if (!categoryId) {
      error.value = 'Aucune catégorie sélectionnée.'
      return
    }

    products.value = await syncProductsIfOnline(categoryId)
  } catch (e) {
    console.error('Error loading products:', e)
    error.value = 'Impossible de charger les produits. Vérifiez votre connexion internet.'
    errorMessage.value = 'Erreur lors du chargement des produits'
    showErrorSnackbar.value = true
  } finally {
    loading.value = false
  }
}

const showProductDetails = (product) => {
  selectedProduct.value = product
  showDetailsDialog.value = true
}

const processPurchase = async () => {
  if (!selectedProduct.value) return

  try {
    processingPayment.value = true
    showDetailsDialog.value = false
    showPaymentDialog.value = true

    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 5000))

    const paymentSuccess = Math.random() > 0.1 // 90% success rate

    if (paymentSuccess) {
      showPaymentDialog.value = false
      showSuccess.value = true

      setTimeout(() => {
        router.push('/categories')
      }, 3000)
    } else {
      throw new Error('Paiement échoué')
    }
  } catch (e) {
    console.error('Payment error:', e)
    showPaymentDialog.value = false
    errorMessage.value = e.message || 'Erreur lors du paiement. Veuillez réessayer.'
    showErrorSnackbar.value = true
  } finally {
    processingPayment.value = false
  }
}

// Load on mount
onMounted(() => {
  loadProducts()
})

// Reactively reload products if the category changes
watch(() => route.query.category, (newCategory, oldCategory) => {
  if (newCategory !== oldCategory) {
    loadProducts()
  }
})
</script>

<style scoped>
.products-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.products-grid-wrapper {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.products-grid-wrapper::-webkit-scrollbar {
  display: none;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.product-item {
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  max-width: 160px;
}

.product-item:hover {
  transform: translateY(-8px);
}

.product-item:active {
  transform: translateY(-4px) scale(0.98);
}

.product-octagon-container {
  margin-bottom: 16px;
}

.product-octagon {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
  clip-path: polygon(
      25% 0%, 75% 0%,
      100% 25%, 100% 75%,
      75% 100%, 25% 100%,
      0% 75%, 0% 25%
  );
  background: white;
  box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.1),
      0 8px 32px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.product-item:hover .product-octagon {
  box-shadow:
      0 8px 30px rgba(0, 0, 0, 0.15),
      0 16px 48px rgba(0, 0, 0, 0.1);
  transform: scale(1.05);
}

.octagon-product-image {
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.product-item:hover .octagon-product-image {
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

.product-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(33, 150, 243, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.product-item:hover .product-overlay {
  opacity: 1;
}

.product-info {
  text-align: center;
  padding: 0 8px;
}

.product-name {
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.3;
  margin: 0 0 8px 0;
  color: #2c3e50;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2196f3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* Product Details Modal */
.product-details-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.details-container {
  background: white;
  border-radius: 20px 20px 0 0;
  margin-top: 20px;
}

.details-octagon-container {
  margin-bottom: 32px;
}

.details-octagon {
  width: 300px;
  height: 300px;
  margin: 0 auto;
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

.details-octagon-image {
  width: 100%;
  height: 100%;
}

.product-details-info {
  padding: 0 24px;
}

.price-section {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 16px;
  text-align: center;
}

/* Payment Processing */
.payment-processing-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.payment-container {
  padding: 40px;
}

.payment-octagon-loader {
  margin-bottom: 40px;
}

.payment-octagon {
  width: 150px;
  height: 150px;
  margin: 0 auto;
  clip-path: polygon(
      25% 0%, 75% 0%,
      100% 25%, 100% 75%,
      75% 100%, 25% 100%,
      0% 75%, 0% 25%
  );
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.payment-instructions {
  max-width: 500px;
  margin: 0 auto;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .product-octagon {
    width: 100px;
    height: 100px;
  }

  .details-octagon {
    width: 200px;
    height: 200px;
  }

  .payment-octagon {
    width: 120px;
    height: 120px;
  }

  .product-name {
    font-size: 0.9rem;
  }
}

/* Animations */
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

.product-item {
  animation: fadeInUp 0.6s ease-out;
}

.product-item:nth-child(even) {
  animation-delay: 0.1s;
}

.product-item:nth-child(3n) {
  animation-delay: 0.2s;
}
</style>