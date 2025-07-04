<template>
  <div class="categories-view">
    <v-container fluid class="pa-6">
      <!-- Header Section -->
      <div class="header-section mb-6">
        <div class="d-flex align-center justify-between">
          <div>
            <h1 class="text-h3 font-weight-bold mb-2">Categories</h1>
            <p class="text-h6 text-medium-emphasis">
              {{ selectedChannelName ? `Browse ${selectedChannelName}` : 'Choose a category to start shopping' }}
            </p>
          </div>

          <!-- Search -->
          <div class="search-section">
            <v-text-field
                v-model="searchQuery"
                label="Search categories"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                class="search-field"
                @input="handleSearch"
            />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <v-row>
          <v-col
              v-for="i in 8"
              :key="i"
              cols="12"
              sm="6"
              md="4"
              lg="3"
          >
            <v-skeleton-loader
                type="card"
                height="280"
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
        <v-alert-title>Failed to Load Categories</v-alert-title>
        <div>{{ error }}</div>
        <template v-slot:append>
          <v-btn
              color="error"
              variant="outlined"
              @click="loadCategories"
              class="mt-2"
          >
            <v-icon class="mr-2">mdi-refresh</v-icon>
            Retry
          </v-btn>
        </template>
      </v-alert>

      <!-- Categories Grid -->
      <div v-else-if="displayCategories.length > 0">
        <!-- Filter Chips -->
        <div v-if="!loading && categories.length > 6" class="filter-section mb-6">
          <div class="d-flex align-center flex-wrap gap-2">
            <v-chip
                :color="sortBy === 'popular' ? 'primary' : 'default'"
                :variant="sortBy === 'popular' ? 'flat' : 'outlined'"
                @click="sortBy = 'popular'"
                size="large"
            >
              <v-icon class="mr-2">mdi-fire</v-icon>
              Popular
            </v-chip>

            <v-chip
                :color="sortBy === 'alphabetical' ? 'primary' : 'default'"
                :variant="sortBy === 'alphabetical' ? 'flat' : 'outlined'"
                @click="sortBy = 'alphabetical'"
                size="large"
            >
              <v-icon class="mr-2">mdi-sort-alphabetical-ascending</v-icon>
              A-Z
            </v-chip>

            <v-chip
                :color="sortBy === 'count' ? 'primary' : 'default'"
                :variant="sortBy === 'count' ? 'flat' : 'outlined'"
                @click="sortBy = 'count'"
                size="large"
            >
              <v-icon class="mr-2">mdi-pound</v-icon>
              Most Items
            </v-chip>
          </div>
        </div>

        <!-- Categories Grid -->
        <v-row>
          <v-col
              v-for="category in displayCategories"
              :key="category.id"
              cols="12"
              sm="6"
              md="4"
              lg="3"
              xl="2"
          >
            <v-card
                class="category-card"
                :class="{ 'category-selected': selectedCategory?.id === category.id }"
                height="280"
                elevation="4"
                @click="selectCategory(category)"
            >
              <!-- Category Image -->
              <div class="category-image-container">
                <v-img
                    :src="category.image || defaultCategoryImage"
                    :alt="category.name"
                    height="160"
                    cover
                    class="category-image"
                >
                  <!-- Gradient overlay -->
                  <div class="image-overlay"></div>

                  <!-- Product count badge -->
                  <div class="product-count-badge">
                    <v-chip
                        color="primary"
                        size="small"
                        variant="elevated"
                    >
                      {{ category.products_count || 0 }} items
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

              <!-- Category Info -->
              <v-card-text class="category-info pa-4">
                <h3 class="text-h6 font-weight-bold mb-1 category-name">
                  {{ category.name }}
                </h3>

                <div class="d-flex align-center justify-between">
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    {{ formatProductCount(category.products_count) }}
                  </p>

                  <!-- Popular indicator -->
                  <v-icon
                      v-if="isPopularCategory(category)"
                      color="warning"
                      size="20"
                  >
                    mdi-fire
                  </v-icon>
                </div>
              </v-card-text>

              <!-- Hover overlay -->
              <div class="category-hover-overlay">
                <v-btn
                    color="white"
                    variant="elevated"
                    size="large"
                    class="explore-btn"
                >
                  <v-icon class="mr-2">mdi-arrow-right</v-icon>
                  Explore
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Load More Button (if applicable) -->
        <div v-if="hasMoreCategories" class="text-center mt-8">
          <v-btn
              :loading="loadingMore"
              color="primary"
              variant="outlined"
              size="large"
              @click="loadMoreCategories"
          >
            <v-icon class="mr-2">mdi-plus</v-icon>
            Load More Categories
          </v-btn>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="text-center">
          <v-icon size="120" color="grey-lighten-1" class="mb-4">
            mdi-view-grid-outline
          </v-icon>
          <h2 class="text-h4 font-weight-medium mb-3">
            {{ searchQuery ? 'No categories found' : 'No categories available' }}
          </h2>
          <p class="text-body-1 text-medium-emphasis mb-6">
            {{
              searchQuery
                  ? `No categories match "${searchQuery}". Try a different search term.`
                  : 'There are no categories available for this channel.'
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
                @click="loadCategories"
            >
              <v-icon class="mr-2">mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </div>
        </div>
      </div>
    </v-container>

    <!-- Selection Loading Overlay -->
    <v-overlay
        v-model="navigating"
        class="align-center justify-center"
        persistent
    >
      <div class="text-center">
        <v-progress-circular
            size="80"
            width="8"
            color="primary"
            indeterminate
        />
        <div class="mt-4 text-h6">Loading {{ selectedCategory?.name }}...</div>
      </div>
    </v-overlay>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { databaseService } from '@/services/databaseService'
import { apiService } from '@/services/apiService'
import type { Category } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

// State
const categories = ref<Category[]>([])
const selectedCategory = ref<Category | null>(null)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const navigating = ref(false)
const searchQuery = ref('')
const sortBy = ref<'popular' | 'alphabetical' | 'count'>('popular')
const displayLimit = ref(12)

// Constants
const defaultCategoryImage = '/images/default-category.png'

// Computed properties
const selectedChannelId = computed(() => {
  return cartStore.selectedChannel || authStore.kioskConfig?.defaultChannelId
})

const selectedChannelName = computed(() => {
  if (!selectedChannelId.value) return ''
  return authStore.kioskConfig?.channels.find(c => c.id === selectedChannelId.value)?.name
})

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value

  const query = searchQuery.value.toLowerCase()
  return categories.value.filter(category =>
      category.name.toLowerCase().includes(query)
  )
})

const sortedCategories = computed(() => {
  const cats = [...filteredCategories.value]

  switch (sortBy.value) {
    case 'alphabetical':
      return cats.sort((a, b) => a.name.localeCompare(b.name))
    case 'count':
      return cats.sort((a, b) => (b.products_count || 0) - (a.products_count || 0))
    case 'popular':
    default:
      // Popular is default order (by products_count desc, then name)
      return cats.sort((a, b) => {
        const countDiff = (b.products_count || 0) - (a.products_count || 0)
        return countDiff !== 0 ? countDiff : a.name.localeCompare(b.name)
      })
  }
})

const displayCategories = computed(() => {
  return sortedCategories.value.slice(0, displayLimit.value)
})

const hasMoreCategories = computed(() => {
  return sortedCategories.value.length > displayLimit.value
})

// Methods
const loadCategories = async () => {
  if (!selectedChannelId.value) {
    router.push('/channels')
    return
  }

  loading.value = true
  error.value = ''

  try {
    // First try to load from local database
    const localCategories = await databaseService.getCategories(selectedChannelId.value)

    if (localCategories.length > 0) {
      categories.value = localCategories
      loading.value = false

      // Load fresh data in background
      try {
        const response = await apiService.getCategories(selectedChannelId.value)
        if (response.success) {
          await databaseService.syncCategories(selectedChannelId.value, response.data)
          categories.value = response.data
        }
      } catch (bgError) {
        console.warn('Background categories sync failed:', bgError)
      }
    } else {
      // No local data, must fetch from API
      const response = await apiService.getCategories(selectedChannelId.value)

      if (response.success) {
        categories.value = response.data
        await databaseService.syncCategories(selectedChannelId.value, response.data)
      } else {
        throw new Error(response.error || 'Failed to load categories')
      }
    }

  } catch (err) {
    console.error('Failed to load categories:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load categories'
  } finally {
    loading.value = false
  }
}

const selectCategory = async (category: Category) => {
  if ((category.products_count || 0) === 0) {
    // Show message for empty categories
    return
  }

  selectedCategory.value = category
  navigating.value = true

  try {
    // Store selected category
    cartStore.setSelectedCategory(category.id)

    // Pre-load products for better UX
    try {
      if (selectedChannelId.value) {
        const productsResponse = await apiService.getProducts(
            category.id,
            selectedChannelId.value,
            50
        )
        if (productsResponse.success) {
          await databaseService.syncProducts(category.id, productsResponse.data.data)
        }
      }
    } catch (preloadError) {
      console.warn('Failed to preload products:', preloadError)
    }

    // Navigate to products
    await router.push('/products')

  } catch (err) {
    console.error('Failed to navigate to products:', err)
    error.value = 'Failed to load products. Please try again.'
  } finally {
    navigating.value = false
  }
}

const loadMoreCategories = () => {
  loadingMore.value = true

  setTimeout(() => {
    displayLimit.value += 12
    loadingMore.value = false
  }, 500)
}

const handleSearch = () => {
  // Reset display limit when searching
  displayLimit.value = 12
}

const clearSearch = () => {
  searchQuery.value = ''
  displayLimit.value = 12
}

const formatProductCount = (count: number | undefined): string => {
  if (!count || count === 0) return 'No items'
  if (count === 1) return '1 item'
  return `${count} items`
}

const isPopularCategory = (category: Category): boolean => {
  const avgProductCount = categories.value.reduce((sum, cat) => sum + (cat.products_count || 0), 0) / categories.value.length
  return (category.products_count || 0) > avgProductCount * 1.5
}

// Watchers
watch(
    () => route.query.channel,
    (newChannelId) => {
      if (newChannelId && parseInt(newChannelId as string) !== selectedChannelId.value) {
        cartStore.setSelectedChannel(parseInt(newChannelId as string))
        loadCategories()
      }
    }
)

// Lifecycle
onMounted(async () => {
  // If no channel selected, redirect to channel selection
  if (!selectedChannelId.value) {
    if (authStore.kioskConfig?.channels.length === 1) {
      cartStore.setSelectedChannel(authStore.kioskConfig.channels[0].id)
    } else {
      router.push('/channels')
      return
    }
  }

  await loadCategories()
})
</script>

<style scoped>
.categories-view {
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

.search-field {
  min-width: 300px;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.category-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  border-radius: 16px !important;
}

.category-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15) !important;
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.category-card.category-selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 8px 32px rgba(var(--v-theme-primary), 0.3) !important;
}

.category-image-container {
  position: relative;
}

.category-image {
  border-radius: 16px 16px 0 0;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.3));
  pointer-events: none;
}

.product-count-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}

.error-placeholder {
  background: #f5f5f5;
}

.category-info {
  background: white;
  border-radius: 0 0 16px 16px;
}

.category-name {
  line-height: 1.3;
  max-height: 2.6em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.category-hover-overlay {
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

.category-card:hover .category-hover-overlay {
  opacity: 1;
}

.explore-btn {
  transform: translateY(20px);
  transition: transform 0.3s ease;
}

.category-card:hover .explore-btn {
  transform: translateY(0);
}

.empty-state {
  padding: 4rem 2rem;
}

.loading-container {
  margin-top: 2rem;
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

  .search-field {
    min-width: 100%;
  }

  .filter-section {
    justify-content: center;
  }

  .category-card {
    height: 240px !important;
  }
}

/* Touch optimization */
@media (hover: none) and (pointer: coarse) {
  .category-card {
    transition: transform 0.2s ease;
  }

  .category-card:active {
    transform: scale(0.98);
  }

  .category-hover-overlay {
    display: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .category-card {
    border: 2px solid #000;
  }

  .category-card:hover,
  .category-card.category-selected {
    border-color: #000;
    background: #fff;
  }

  .image-overlay {
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .category-card,
  .explore-btn {
    transition: none;
  }

  .category-card:hover {
    transform: none;
  }

  .category-hover-overlay {
    opacity: 0.8;
  }
}

/* Grid adjustments for different screen sizes */
@media (min-width: 1920px) {
  .categories-view .v-col {
    max-width: 16.666667%; /* 6 columns on very large screens */
  }
}

@media (max-width: 600px) {
  .categories-view .v-col {
    max-width: 50%; /* 2 columns on small screens */
  }
}

/* Loading skeleton animations */
.v-skeleton-loader {
  border-radius: 16px;
}

/* Search highlighting */
.search-highlight {
  background: rgba(var(--v-theme-primary), 0.2);
  padding: 0 4px;
  border-radius: 4px;
}
</style>