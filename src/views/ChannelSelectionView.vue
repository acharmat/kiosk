<template>
  <div class="channel-selection">
    <v-container fluid class="pa-6">
      <!-- Header Section -->
      <div class="text-center mb-8">
        <h1 class="text-h3 font-weight-bold mb-4">Choose Your Shop</h1>
        <p class="text-h6 text-medium-emphasis">
          Select a channel to start shopping
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center">
        <v-progress-circular
            size="80"
            width="8"
            color="primary"
            indeterminate
        />
        <p class="text-h6 mt-4">Loading channels...</p>
      </div>

      <!-- Error State -->
      <v-alert
          v-else-if="error"
          type="error"
          variant="tonal"
          prominent
          class="mb-6"
      >
        <v-alert-title>Failed to Load Channels</v-alert-title>
        <div>{{ error }}</div>
        <template v-slot:append>
          <v-btn
              color="error"
              variant="outlined"
              @click="loadChannels"
              class="mt-2"
          >
            Retry
          </v-btn>
        </template>
      </v-alert>

      <!-- Channels Grid -->
      <div v-else-if="channels.length > 0">
        <!-- Featured Channel (if there's a default) -->
        <div v-if="featuredChannel" class="featured-section mb-8">
          <h2 class="text-h5 font-weight-medium mb-4">Featured</h2>
          <v-card
              class="featured-channel"
              :class="{ 'channel-selected': selectedChannel?.id === featuredChannel.id }"
              elevation="8"
              @click="selectChannel(featuredChannel)"
          >
            <div class="channel-content featured">
              <div class="channel-image">
                <v-img
                    :src="featuredChannel.logo_url || defaultChannelImage"
                    :alt="featuredChannel.name"
                    height="120"
                    contain
                    class="rounded"
                >
                  <template v-slot:error>
                    <div class="d-flex align-center justify-center h-100">
                      <v-icon size="64" color="grey-lighten-1">
                        mdi-storefront
                      </v-icon>
                    </div>
                  </template>
                </v-img>
              </div>

              <div class="channel-info">
                <h3 class="text-h4 font-weight-bold mb-2">
                  {{ featuredChannel.name }}
                </h3>
                <p class="text-h6 text-medium-emphasis">
                  {{ featuredChannel.description || 'Featured channel' }}
                </p>
                <v-chip color="primary" size="small" class="mt-2">
                  <v-icon size="16" class="mr-1">mdi-star</v-icon>
                  Featured
                </v-chip>
              </div>
            </div>
          </v-card>
        </div>

        <!-- All Channels -->
        <div class="channels-section">
          <h2 class="text-h5 font-weight-medium mb-4">
            {{ featuredChannel ? 'All Channels' : 'Available Channels' }}
          </h2>

          <v-row>
            <v-col
                v-for="channel in displayChannels"
                :key="channel.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
            >
              <v-card
                  class="channel-card"
                  :class="{ 'channel-selected': selectedChannel?.id === channel.id }"
                  height="100%"
                  elevation="4"
                  @click="selectChannel(channel)"
              >
                <div class="channel-content">
                  <!-- Channel Image/Logo -->
                  <div class="channel-image-container">
                    <v-img
                        :src="channel.logo_url || defaultChannelImage"
                        :alt="channel.name"
                        height="100"
                        contain
                        class="rounded"
                    >
                      <template v-slot:error>
                        <div class="d-flex align-center justify-center h-100">
                          <v-icon size="48" color="grey-lighten-1">
                            mdi-storefront
                          </v-icon>
                        </div>
                      </template>
                    </v-img>
                  </div>

                  <!-- Channel Information -->
                  <div class="channel-info pa-4">
                    <h3 class="text-h6 font-weight-bold mb-2">
                      {{ channel.name }}
                    </h3>

                    <p
                        v-if="channel.description"
                        class="text-body-2 text-medium-emphasis mb-3"
                    >
                      {{ truncateDescription(channel.description) }}
                    </p>

                    <!-- Status indicator -->
                    <div class="d-flex align-center justify-between">
                      <v-chip
                          :color="channel.is_active ? 'success' : 'warning'"
                          size="small"
                          variant="flat"
                      >
                        <v-icon size="14" class="mr-1">
                          {{ channel.is_active ? 'mdi-check-circle' : 'mdi-clock' }}
                        </v-icon>
                        {{ channel.is_active ? 'Available' : 'Coming Soon' }}
                      </v-chip>

                      <v-icon
                          v-if="selectedChannel?.id === channel.id"
                          color="primary"
                          size="24"
                      >
                        mdi-check-circle
                      </v-icon>
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Continue Button -->
        <div class="text-center mt-8">
          <v-btn
              :disabled="!selectedChannel"
              color="primary"
              size="x-large"
              elevation="4"
              @click="continueToCategories"
              class="continue-btn"
          >
            <v-icon size="28" class="mr-3">mdi-arrow-right</v-icon>
            Continue to {{ selectedChannel?.name || 'Categories' }}
            <v-icon size="28" class="ml-3">mdi-view-grid</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center">
        <v-icon size="120" color="grey-lighten-1" class="mb-4">
          mdi-storefront-outline
        </v-icon>
        <h2 class="text-h4 font-weight-medium mb-3">No Channels Available</h2>
        <p class="text-body-1 text-medium-emphasis mb-6">
          There are no active channels configured for this kiosk.
        </p>
        <v-btn
            color="primary"
            variant="outlined"
            @click="loadChannels"
        >
          <v-icon class="mr-2">mdi-refresh</v-icon>
          Refresh
        </v-btn>
      </div>
    </v-container>

    <!-- Selection Animation Overlay -->
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
        <div class="mt-4 text-h6">Loading {{ selectedChannel?.name }}...</div>
      </div>
    </v-overlay>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { databaseService } from '@/services/databaseService'
import { apiService } from '@/services/apiService'
import type { Channel } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

// State
const channels = ref<Channel[]>([])
const selectedChannel = ref<Channel | null>(null)
const loading = ref(true)
const error = ref('')
const navigating = ref(false)

// Constants
const defaultChannelImage = '/images/default-channel.png'

// Computed properties
const featuredChannel = computed(() => {
  return channels.value.find(channel =>
      channel.id === authStore.kioskConfig?.defaultChannelId
  ) || null
})

const displayChannels = computed(() => {
  if (featuredChannel.value) {
    return channels.value.filter(channel => channel.id !== featuredChannel.value?.id)
  }
  return channels.value
})

// Methods
const loadChannels = async () => {
  loading.value = true
  error.value = ''

  try {
    // First try to load from local database
    const localChannels = await databaseService.getChannels()

    if (localChannels.length > 0) {
      channels.value = localChannels.filter(channel => channel.is_active)
      loading.value = false

      // Load fresh data in background
      try {
        const response = await apiService.getChannels()
        if (response.success) {
          await databaseService.syncChannels(response.data)
          channels.value = response.data.filter(channel => channel.is_active)
        }
      } catch (bgError) {
        console.warn('Background channel sync failed:', bgError)
      }
    } else {
      // No local data, must fetch from API
      const response = await apiService.getChannels()

      if (response.success) {
        channels.value = response.data.filter(channel => channel.is_active)
        await databaseService.syncChannels(response.data)
      } else {
        throw new Error(response.error || 'Failed to load channels')
      }
    }

    // Auto-select if there's only one channel
    if (channels.value.length === 1) {
      selectedChannel.value = channels.value[0]
      // Auto-continue after a short delay
      setTimeout(continueToCategories, 1000)
    } else if (featuredChannel.value) {
      // Auto-select featured channel
      selectedChannel.value = featuredChannel.value
    }

  } catch (err) {
    console.error('Failed to load channels:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load channels'
  } finally {
    loading.value = false
  }
}

const selectChannel = (channel: Channel) => {
  if (!channel.is_active) return

  selectedChannel.value = channel

  // Add visual feedback
  const card = document.querySelector(`[data-channel-id="${channel.id}"]`)
  if (card) {
    card.classList.add('channel-selected')
  }

  // Haptic feedback if available
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

const continueToCategories = async () => {
  if (!selectedChannel.value) return

  navigating.value = true

  try {
    // Store selected channel
    cartStore.setSelectedChannel(selectedChannel.value.id)

    // Pre-load categories for better UX
    try {
      const categoriesResponse = await apiService.getCategories(selectedChannel.value.id)
      if (categoriesResponse.success) {
        await databaseService.syncCategories(selectedChannel.value.id, categoriesResponse.data)
      }
    } catch (preloadError) {
      console.warn('Failed to preload categories:', preloadError)
    }

    // Navigate to categories
    await router.push('/categories')

  } catch (err) {
    console.error('Failed to continue to categories:', err)
    error.value = 'Failed to load categories. Please try again.'
  } finally {
    navigating.value = false
  }
}

const truncateDescription = (description: string, maxLength: number = 80): string => {
  if (description.length <= maxLength) return description
  return description.substring(0, maxLength).trim() + '...'
}

// Lifecycle
onMounted(async () => {
  await loadChannels()
})
</script>

<style scoped>
.channel-selection {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.featured-section {
  margin-bottom: 2rem;
}

.featured-channel {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 3px solid transparent;
  position: relative;
  overflow: hidden;
}

.featured-channel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(103, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.featured-channel:hover::before {
  opacity: 1;
}

.featured-channel:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
}

.featured-channel.channel-selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 8px 32px rgba(103, 126, 234, 0.3) !important;
}

.channel-content.featured {
  display: flex;
  align-items: center;
  padding: 2rem;
  gap: 2rem;
}

.channel-content.featured .channel-image {
  flex-shrink: 0;
  width: 200px;
}

.channel-content.featured .channel-info {
  flex: 1;
}

.channel-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.channel-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05), rgba(var(--v-theme-secondary), 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.channel-card:hover::before {
  opacity: 1;
}

.channel-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15) !important;
}

.channel-card.channel-selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 8px 32px rgba(var(--v-theme-primary), 0.3) !important;
}

.channel-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.channel-image-container {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
}

.channel-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.continue-btn {
  min-width: 300px;
  height: 72px !important;
  font-size: 1.2rem !important;
  border-radius: 36px !important;
  text-transform: none !important;
  letter-spacing: 0.5px;
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.4) !important;
}

/* Selection animation */
@keyframes selectPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.channel-selected {
  animation: selectPulse 0.3s ease;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .channel-content.featured {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }

  .channel-content.featured .channel-image {
    width: 150px;
  }

  .continue-btn {
    min-width: 250px;
    height: 60px !important;
    font-size: 1.1rem !important;
  }
}

/* Touch optimization */
@media (hover: none) and (pointer: coarse) {
  .channel-card,
  .featured-channel {
    transition: transform 0.2s ease;
  }

  .channel-card:active,
  .featured-channel:active {
    transform: scale(0.98);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .channel-card,
  .featured-channel {
    border: 2px solid #000;
  }

  .channel-card.channel-selected,
  .featured-channel.channel-selected {
    border-color: #000;
    background: #fff;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .channel-card,
  .featured-channel,
  .continue-btn {
    transition: none;
  }

  .channel-card:hover,
  .featured-channel:hover {
    transform: none;
  }

  .channel-selected {
    animation: none;
  }
}

/* Loading skeleton */
.channel-loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>