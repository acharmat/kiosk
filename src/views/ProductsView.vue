<template>
  <div class="products-view">
    <v-container fluid class="pa-6">
      <!-- Header Section -->
      <div class="header-section mb-6">
        <div class="d-flex align-center justify-between">
          <div class="header-info">
            <div class="d-flex align-center mb-2">
              <v-btn
                  icon
                  variant="text"
                  @click="goBackToCategories"
                  class="mr-3"
              >
                <v-icon size="24">mdi-arrow-left</v-icon>
              </v-btn>
              <div>
                <h1 class="text-h3 font-weight-bold">{{ selectedCategoryName }}</h1>
                <p class="text-h6 text-medium-emphasis">
                  {{ products.length }} {{ products.length === 1 ? 'product' : 'products' }} available
                </p>
              </div>
            </div>
          </div>

          <!-- Search and Filters -->
          <div class="controls-section">
            <div class="d-flex align-center gap-4">
              <!-- Search -->
              <v-text-field
                  v-model="searchQuery"
                  label="Search products"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  clearable
                  class="search-field"
                  @input="handleSearch"
              />

              <!-- Sort -->
              <v-select
                  v-model="sortBy"
                  :items="sortOptions"
                  label="Sort by"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  class="sort-select"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <v-row>
          <v-col
              v-for="i in 12"
              :key="i"
              cols="12"
              sm="6"
              md="4"
              lg="3"
              xl="2"
          >
            <v-skeleton-loader
                type="card"
                height="400"
                class="rounded-lg"
            />
          </v-col>
        </v-row>
      </div>

      <!-- Error State -->
      <v-alert
          v-else-if="error"
          type="error"
          variant="tonal"
          prominent
          class="mb-6"
      >
        <v-alert-title>Failed to Load Products</v-alert-title>
        <div>{{ error }}</div>
        <template v-slot:append>
          <v-btn
              color="error"
              variant="outlined"
              @click="loadProducts"
              class="mt-2"
          >
            <v-icon class="mr-2">mdi-refresh</v-icon>
            Retry
          </v-btn>
        </template>
      </v-alert>

      <!-- Products Grid -->
      <div v-else-if="displayProducts.length > 0">
        <!-- Filter Tags -->
        <div v-if="searchQuery" class="filter-tags mb-4">
          <v-chip
              color="primary"
              variant="outlined"
              closable
              @click:close="clearSearch"
          >
            <v-icon class="mr-2">mdi-magnify</v-icon>
            "{{ searchQuery }}"
          </v-chip>
        </div>

        <!-- Products Grid -->
        <v-row>
          <v-col
              v-for="product in displayProducts"
              :key="product.id"
              cols="12"
              sm="6"
              md="4"
              lg="3"
              xl="2"
          >
            <v-card
                class="product-card"
                :class="{ 'product-selected': selectedProduct?.id === product.id }"
                height="100%"
                elevation="4"
                @click="selectProduct(product)"
            >
              <!-- Product Image -->
              <div class="product-image-container">
                <v-img
                    :src="product.image || defaultProductImage"
                    :alt="product.name"
                    height="200"
                    cover
                    class="product-image"
                >
                  <!-- Price badge -->
                  <div class="price-badge">
                    <v-chip
                        color="success"
                        size="large"
                        variant="elevated"
                        class="font-weight-bold"
                    >
                      {{ formatPrice(product.price) }}
                    </v-chip>
                  </div>

                  <!-- Error fallback -->
                  <template v-slot:error>
                    <div class="d-flex align-center justify-center h-100 error-placeholder">
                      <v-icon size="64" color="grey-lighten-1">
                        mdi-image-off
                      </v-icon>
                    </div>
                  </template>
                </v-img>
              </div>

              <!-- Product Info -->
              <v-card-text class="product-info pa-4">
                <h3 class="text-h6 font-weight-bold mb-2 product-name">
                  {{ product.name }}
                </h3>

                <p
                    v-if="product.description"
                    class="text-body-2 text-medium-emphasis mb-3 product-description"
                >
                  {{ truncateDescription(product.description) }}
                </p>

                <!-- Actions -->
                <div class="d-flex align-center justify-between">
                  <div class="price-info">
                    <span class="text-h6 font-weight-bold text-success">
                      {{ formatPrice(product.price) }}
                    </span>
                  </div>

                  <v-btn
                      color="primary"
                      size="small"
                      variant="elevated"
                      @click.stop="addToCart(product)"
                      class="add-btn"
                  >
                    <v-icon size="18" class="mr-1">mdi-plus</v-icon>
                    Add
                  </v-btn>
                </div>
              </v-card-text>

              <!-- Hover overlay -->
              <div class="product-hover-overlay">
                <div class="hover-content">
                  <v-btn
                      color="white"
                      variant="elevated"
                      size="large"
                      @click.stop="quickAdd(product)"
                      class="quick-add-btn"
                  >
                    <v-icon class="mr-2">mdi-cart-plus</v-icon>
                    Quick Add
                  </v-btn>

                  <v-btn
                      color="white"
                      variant="outlined"
                      size="large"
                      @click.stop="showProductDetails(product)"
                      class="mt-2"
                  >
                    <v-icon class="mr-2">mdi-information</v-icon>
                    Details
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Load More Button -->
        <div v-if="hasMoreProducts" class="text-center mt-8">
          <v-btn
              :loading="loadingMore"
              color="primary"
              variant="outlined"
              size="large"
              @click="loadMoreProducts"
          >
            <v-icon class="mr-2">mdi-plus</v-icon>
            Load More Products
          </v-btn>
        </div>

        <!-- Pagination Info -->
        <div v-if="totalProducts > displayProducts.length" class="pagination-info text-center mt-4">
          <p class="text-body-2 text-medium-emphasis">
            Showing {{ displayProducts.length }} of {{ totalProducts }} products
          </p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="text-center">
          <v-icon size="120" color="grey-lighten-1" class="mb-4">
            mdi-package-variant-closed
          </v-icon>
          <h2 class="text-h4 font-weight-medium mb-3">
            {{ searchQuery ? 'No products found' : 'No products available' }}
          </h2>
          <p class="text-body-1 text-medium-emphasis mb-6">
            {{
              searchQuery
                  ? `No products match "${searchQuery}". Try a different search term.`
                  : 'There are no products available in this category.'
            }}
          </p>

          <div class="d-flex justify-center gap-4">
            <v-btn
                v-if="searchQuery"
                color="primary"
                variant="outlined"
                @click="clearSearch"
            >
              <v-icon class="mr-2">mdi-close</v-icon>
              Clear Search
            </v-btn>

            <v-btn
                color="primary"
                variant="outlined"
                @click="goBackToCategories"
            >
              <v-icon class="mr-2">mdi-arrow-left</v-icon>
              Back to Categories
            </v-btn>
          </div>
        </div>
      </div>
    </v-container>

    <!-- Product Details Dialog -->
    <v-dialog v-model="showDetailsDialog" max-width="600" persistent>
      <v-card v-if="selectedProduct">
        <v-card-title class="d-flex align-center justify-between">
          <span class="text-h5">{{ selectedProduct.name }}</span>
          <v-btn
              icon
              variant="text"
              @click="showDetailsDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <div class="d-flex gap-6">
            <v-img
                :src="selectedProduct.image || defaultProductImage"
                :alt="selectedProduct.name"
                width="200"
                height="200"
                cover
                class="rounded"
            >
              <template v-slot:error>
                <div class="d-flex align-center justify-center h-100 error-placeholder">
                  <v-icon size="48" color="grey-lighten-1">
                    mdi-image-off
                  </v-icon>
                </div>
              </template>
            </v-img>

            <div class="flex-grow-1">
              <div class="mb-4">
                <h4 class="text-h4 font-weight-bold text-success mb-2">
                  {{ formatPrice(selectedProduct.price) }}
                </h4>
              </div>

              <div v-if="selectedProduct.description" class="mb-4">
                <h5 class="text-h6 mb-2">Description</h5>
                <p class="text-body-1">{{ selectedProduct.description }}</p>
              </div>

              <!-- Quantity selector -->
              <div class="quantity-section mb-4">
                <h5 class="text-h6 mb-2">Quantity</h5>
                <div class="d-flex align-center gap-3">
                  <v-btn
                      :disabled="dialogQuantity <= 1"
                      icon
                      size="small"
                      variant="outlined"
                      @click="dialogQuantity--"
                  >
                    <v-icon>mdi-minus</v-icon>
                  </v-btn>

                  <v-text-field
                      v-model.number="dialogQuantity"
                      type="number"
                      min="1"
                      max="10"
                      hide-details
                      variant="outlined"
                      density="compact"
                      style="width: 80px"
                      class="text-center"
                  />

                  <v-btn
                      :disabled="dialogQuantity >= 10"
                      icon
                      size="small"
                      variant="outlined"
                      @click="dialogQuantity++"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </div>
              </div>

              <!-- Total price -->
              <div class="total-section">
                <div class="d-flex align-center justify-between">
                  <span class="text-h6">Total:</span>
                  <span class="text-h5 font-weight-bold text-success">
                    {{ formatPrice(selectedProduct.price * dialogQuantity) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn
              variant="outlined"
              @click="showDetailsDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
              color="primary"
              variant="elevated"
              @click="addToCartFromDialog"
          >
            <v-icon class="mr-2">mdi-cart-plus</v-icon>
            Add to Cart
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add to Cart Success Toast -->
    <v-snackbar
        v-model="showAddedToast"
        :timeout="3000"
        color="success"
        location="top"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-check-circle</v-icon>
        {{ toastMessage }}
      </div>
      <template v-slot:actions>
        <v-btn
            color="white"
            variant="text"
            @click="$router.push('/cart')"
        >
          View Cart
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { databaseService } from '@/services/databaseService'
import { apiService } from '@/services/apiService'
import type { Product } from '@/types'

const router = useRouter()
const cartStore = useCartStore()

// State
const products = ref<Product[]>([])
const selectedProduct = ref<Product | null>(null)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const searchQuery = ref('')
const sortBy = ref('name')
const currentPage = ref(1)
const totalProducts = ref(0)
const showDetailsDialog = ref(false)
const dialogQuantity = ref(1)
const showAddedToast = ref(false)
const toastMessage = ref('')

// Constants
const defaultProductImage = '/images/default-product.png'
const productsPerPage = 24

// Sort options
const sortOptions = [
  { title: 'Name (A-Z)', value: 'name' },
  { title: 'Name (Z-A)', value: 'name_desc' },
  { title: 'Price (Low to High)', value: 'price_asc' },
  { title: 'Price (High to Low)', value: 'price_desc' }
]

// Computed properties
const selectedCategoryId = computed(() => cartStore.selectedCategory)
const selectedChannelId = computed(() => cartStore.selectedChannel)

const selectedCategoryName = computed(() => {
  // Would need to get from database or store
  return 'Products' // Placeholder
})

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value

  const query = searchQuery.value.toLowerCase()
  return products.value.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query)
  )
})

const sortedProducts = computed(() => {
  const sorted = [...filteredProducts.value]

  switch (sortBy.value) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name))
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price)
    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price)
    default:
      return sorted
  }
})

const displayProducts = computed(() => {
  return sortedProducts.value.slice(0, currentPage.value * productsPerPage)
})

const hasMoreProducts = computed(() => {
  return sortedProducts.value.length > displayProducts.value.length
})

// Methods
const loadProducts = async () => {
  if (!selectedCategoryId.value || !selectedChannelId.value) {
    router.push('/categories')
    return
  }

  loading.value = true
  error.value = ''

  try {
    // First try to load from local database
    const localProducts = await databaseService.getProducts(selectedCategoryId.value)

    if (localProducts.length > 0) {
      products.value = localProducts
      totalProducts.value = localProducts.length
      loading.value = false

      // Load fresh data in background
      try {
        const response = await apiService.getProducts(
            selectedCategoryId.value,
            selectedChannelId.value,
            1000
        )
        if (response.success) {
          await databaseService.syncProducts(selectedCategoryId.value, response.data.data)
          products.value = response.data.data
          totalProducts.value = response.data.pagination.total
        }
      } catch (bgError) {
        console.warn('Background products sync failed:', bgError)
      }
    } else {
      // No local data, must fetch from API
      const response = await apiService.getProducts(
          selectedCategoryId.value,
          selectedChannelId.value,
          1000
      )

      if (response.success) {
        products.value = response.data.data
        totalProducts.value = response.data.pagination.total
        await databaseService.syncProducts(selectedCategoryId.value, response.data.data)
      } else {
        throw new Error(response.error || 'Failed to load products')
      }
    }

  } catch (err) {
    console.error('Failed to load products:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load products'
  } finally {
    loading.value = false
  }
}

const selectProduct = (product: Product) => {
  selectedProduct.value = product

  // Add visual feedback
  setTimeout(() => {
    selectedProduct.value = null
  }, 300)
}

const addToCart = (product: Product, quantity: number = 1) => {
  cartStore.addItem(product, quantity)

  toastMessage.value = `${product.name} added to cart`
  showAddedToast.value = true

  // Haptic feedback if available
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

const quickAdd = (product: Product) => {
  addToCart(product, 1)
}

const showProductDetails = (product: Product) => {
  selectedProduct.value = product
  dialogQuantity.value = 1
  showDetailsDialog.value = true
}

const addToCartFromDialog = () => {
  if (selectedProduct.value) {
    addToCart(selectedProduct.value, dialogQuantity.value)
    showDetailsDialog.value = false
  }
}

const loadMoreProducts = () => {
  loadingMore.value = true

  setTimeout(() => {
    currentPage.value++
    loadingMore.value = false
  }, 500)
}

const handleSearch = () => {
  // Reset pagination when searching
  currentPage.value = 1
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const goBackToCategories = () => {
  router.push('/categories')
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

const truncateDescription = (description: string, maxLength: number = 100): string => {
  if (description.length <= maxLength) return description
  return description.substring(0, maxLength).trim() + '...'
}

// Lifecycle
onMounted(async () => {
  if (!selectedCategoryId.value) {
    router.push('/categories')
    return
  }

  await loadProducts()
})
</script>

<style scoped>
.products-view {
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

.controls-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-field {
  min-width: 300px;
}

.sort-select {
  min-width: 200px;
}

.filter-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.product-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  border-radius: 16px !important;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15) !important;
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.product-card.product-selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 8px 32px rgba(var(--v-theme-primary), 0.3) !important;
}

.product-image-container {
  position: relative;
}

.product-image {
  border-radius: 16px 16px 0 0;
}

.price-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}

.error-placeholder {
  background: #f5f5f5;
}

.product-info {
  background: white;
  border-radius: 0 0 16px 16px;
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  line-height: 1.3;
  max-height: 2.6em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-description {
  line-height: 1.4;
  max-height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.add-btn {
  border-radius: 20px !important;
  font-weight: 600;
}

.product-hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--v-theme-primary), 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 16px;
}

.product-card:hover .product-hover-overlay {
  opacity: 1;
}

.hover-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  transform: translateY(20px);
  transition: transform 0.3s ease;
}

.product-card:hover .hover-content {
  transform: translateY(0);
}

.quick-add-btn {
  border-radius: 25px !important;
  font-weight: 600;
}

.empty-state {
  padding: 4rem 2rem;
}

.loading-container {
  margin-top: 2rem;
}

.pagination-info {
  margin-top: 1rem;
}

/* Product details dialog */
.quantity-section .v-text-field {
  text-align: center;
}

.total-section {
  padding: 1rem;
  background: rgba(var(--v-theme-success), 0.1);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-success), 0.3);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .header-section {
    padding: 1rem;
  }

  .header-section .d-flex {
    flex-direction: column;
    gap: 1rem;
  }

  .controls-section {
    width: 100%;
  }

  .controls-section .d-flex {
    flex-direction: column;
    width: 100%;
  }

  .search-field,
  .sort-select {
    min-width: 100%;
  }

  .product-card {
    height: 350px !important;
  }

  .product-info {
    height: 140px;
  }
}

/* Touch optimization */
@media (hover: none) and (pointer: coarse) {
  .product-card {
    transition: transform 0.2s ease;
  }

  .product-card:active {
    transform: scale(0.98);
  }

  .product-hover-overlay {
    display: none;
  }

  .add-btn {
    min-height: 44px;
    min-width: 44px;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .product-card {
    border: 2px solid #000;
  }

  .product-card:hover,
  .product-card.product-selected {
    border-color: #000;
    background: #fff;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .product-card,
  .hover-content {
    transition: none;
  }

  .product-card:hover {
    transform: none;
  }

  .product-hover-overlay {
    opacity: 0.8;
  }
}

/* Grid adjustments for different screen sizes */
@media (min-width: 1920px) {
  .products-view .v-col {
    max-width: 16.666667%; /* 6 columns on very large screens */
  }
}

@media (max-width: 600px) {
  .products-view .v-col {
    max-width: 50%; /* 2 columns on small screens */
  }
}

/* Loading skeleton animations */
.v-skeleton-loader {
  border-radius: 16px;
}

/* Success animation */
@keyframes addToCartSuccess {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.product-card.adding-to-cart {
  animation: addToCartSuccess 0.3s ease;
}
</style>