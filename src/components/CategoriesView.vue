<template>
  <v-container fluid class="categories-container fill-height">
    <v-app-bar dense color="white" elevation="2">
      <v-btn icon @click="router.push('/')">
        <v-icon>mdi-home</v-icon>
      </v-btn>
      <v-toolbar-title class="text-h6 font-weight-bold text-primary">
        <v-icon start size="small">mdi-octagon</v-icon>
        Catégories
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- Cart Button -->
      <CartButton />
    </v-app-bar>

    <v-container class="categories-grid-wrapper pa-6">
      <div v-if="loading" class="loading-state">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-4">Chargement des catégories...</p>
      </div>
      <div v-else-if="error" class="error-state">
        <v-icon color="error" size="48">mdi-alert-circle</v-icon>
        <p class="text-error mt-2">{{ error }}</p>
      </div>

      <v-row justify="center" align="start" class="gy-8" v-else>
        <v-col
            v-for="category in categories"
            :key="category.id"
            cols="6"
            sm="4"
            md="3"
            lg="2"
            class="d-flex flex-column align-center"
        >
          <div class="category-item" @click="goToCategory(category)">
            <!-- Octagon shape with image -->
            <div class="octagon-shape">
              <v-img
                  :src="category.image"
                  :alt="category.name"
                  cover
                  class="octagon-image"
              >
                <template v-slot:placeholder>
                  <div class="image-placeholder">
                    <v-icon size="40" color="grey-lighten-2">mdi-image</v-icon>
                  </div>
                </template>
              </v-img>
              <!-- Hover overlay -->
              <div class="octagon-overlay">
                <v-icon color="white" size="24">mdi-arrow-right</v-icon>
              </div>
            </div>

            <!-- Title and count outside -->
            <div class="category-info">
              <h3 class="category-name">{{ category.name }}</h3>
              <p class="category-count">
                <v-icon size="14" color="grey">mdi-package-variant</v-icon>
                {{ category.count }} produits
              </p>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Cart Component -->
    <CartComponent />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { syncCategoriesIfOnline } from '@/services/categories'

const router = useRouter()

const categories = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    categories.value = await syncCategoriesIfOnline()
  } catch (e) {
    console.error(e)
    error.value = 'Impossible de charger les catégories.'
  } finally {
    loading.value = false
  }
})

const goToCategory = (category) => {
  router.push({ path: '/products', query: { category: category.id } })
}
</script>

<style scoped>
.categories-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.categories-grid-wrapper {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  max-height: calc(100vh - 64px);
}

.categories-grid-wrapper::-webkit-scrollbar {
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

.category-item {
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  max-width: 160px;
}

.category-item:hover {
  transform: translateY(-8px);
}

.category-item:active {
  transform: translateY(-4px) scale(0.98);
}

.octagon-shape {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
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

.category-item:hover .octagon-shape {
  box-shadow:
      0 8px 30px rgba(0, 0, 0, 0.15),
      0 16px 48px rgba(0, 0, 0, 0.1);
  transform: scale(1.05);
}

.octagon-image {
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.category-item:hover .octagon-image {
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

.octagon-overlay {
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

.category-item:hover .octagon-overlay {
  opacity: 1;
}

.category-info {
  text-align: center;
  padding: 0 8px;
}

.category-name {
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.3;
  margin: 0 0 6px 0;
  color: #2c3e50;
  text-transform: capitalize;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-count {
  margin: 0;
  font-size: 0.75rem;
  color: #7f8c8d;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .octagon-shape {
    width: 100px;
    height: 100px;
  }

  .category-name {
    font-size: 0.9rem;
  }

  .category-count {
    font-size: 0.7rem;
  }
}

/* Add subtle animations */
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

.category-item {
  animation: fadeInUp 0.6s ease-out;
}

.category-item:nth-child(even) {
  animation-delay: 0.1s;
}

.category-item:nth-child(3n) {
  animation-delay: 0.2s;
}
</style>