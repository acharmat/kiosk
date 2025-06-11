<template>
  <v-container fluid class="categories-container fill-height">
    <v-app-bar
        color="white"
        elevation="2"
        class="app-header"
    >
      <v-btn
          icon
          :to="'/'"
          size="large"
          variant="text"
          color="grey-darken-1"
      >
        <v-icon>mdi-home</v-icon>
      </v-btn>
      <v-toolbar-title class="text-h5 font-weight-bold text-primary">
        <v-icon start>mdi-folder-multiple</v-icon>
        Choisissez une catégorie
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-chip
          color="primary"
          variant="elevated"
          size="large"
          class="font-weight-medium"
      >
        {{ categories.length }} catégories
      </v-chip>
    </v-app-bar>

    <v-container class="categories-grid-wrapper pa-6">
      <v-row justify="center" align="center">
        <v-col
            v-for="category in categories"
            :key="category.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
        >
          <v-card
              :to="'/products'"
              class="category-card"
              height="200"
              elevation="6"
              rounded="xl"
              hover
          >
            <v-img
                :src="category.image"
                height="120"
                cover
                class="category-image"
            ></v-img>
            <v-card-title class="text-h6 font-weight-bold text-center py-2">
              {{ category.name }}
            </v-card-title>
            <v-card-subtitle class="text-center pb-2">
              {{ category.count }} produits
            </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

const categories = ref([
  {
    id: 1,
    name: 'Snacks',
    image: 'https://images.unsplash.com/photo-1543623351-460d3d5f8481?auto=format&fit=crop&q=80&w=400&h=200', // Example image
    count: 15
  },
  {
    id: 2,
    name: 'Boissons',
    image: 'https://images.unsplash.com/photo-1570710609383-7ee0b146401f?auto=format&fit=crop&q=80&w=400&h=200', // Example image
    count: 12
  },
  {
    id: 3,
    name: 'Plats chauds',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae3a?auto=format&fit=crop&q=80&w=400&h=200', // Example image
    count: 8
  },
  {
    id: 4,
    name: 'Desserts',
    image: 'https://images.unsplash.com/photo-1551024601-bec78fda58d1?auto=format&fit=crop&q=80&w=400&h=200', // Example image
    count: 10
  },
  {
    id: 5,
    name: 'Burgers',
    image: 'https://images.unsplash.com/photo-1571091718767-f84e03d7c144?auto=format&fit=crop&q=80&w=400&h=200',
    count: 7
  },
  {
    id: 6,
    name: 'Salades',
    image: 'https://images.unsplash.com/photo-1512621776951-a57398bc7250?auto=format&fit=crop&q=80&w=400&h=200',
    count: 9
  }
])
</script>

<style scoped>
.categories-container {
  background: #f5f7fa; /* Light background */
}

.app-header {
  border-bottom: 1px solid #e0e0e0;
}

.categories-grid-wrapper {
  max-width: 1200px; /* Constrain grid width */
  margin-top: 64px; /* Space for app bar */
}

.category-card {
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #e0e0e0;
}

.category-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15) !important;
}

.category-image {
  border-bottom: 1px solid #e0e0e0;
}
</style>