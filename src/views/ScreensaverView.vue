<template>
  <div class="screensaver-container" @click="handleUserInteraction" @touchstart="handleUserInteraction">
    <!-- Background video or animation -->
    <div class="screensaver-background">
      <div class="animated-gradient"></div>

      <!-- Floating elements -->
      <div
          v-for="(element, index) in floatingElements"
          :key="index"
          class="floating-element"
          :style="element.style"
      >
        <v-icon :size="element.size" :color="element.color">
          {{ element.icon }}
        </v-icon>
      </div>
    </div>

    <!-- Main content -->
    <div class="screensaver-content">
      <!-- Logo and branding -->
      <div class="brand-section">
        <div class="logo-container">
          <v-img
              v-if="kioskConfig?.logo"
              :src="kioskConfig.logo"
              max-height="120"
              max-width="200"
              contain
              class="mb-4"
          />
          <v-icon v-else size="120" color="primary" class="mb-4">
            mdi-storefront
          </v-icon>
        </div>

        <h1 class="display-1 font-weight-bold text-center mb-2">
          {{ kioskConfig?.name || 'Welcome to Our Kiosk' }}
        </h1>

        <p class="text-h6 text-center text-medium-emphasis mb-8">
          Touch anywhere to start shopping
        </p>
      </div>

      <!-- Touch to start prompt -->
      <div class="interaction-prompt">
        <v-btn
            size="x-large"
            color="primary"
            variant="elevated"
            class="touch-button"
            @click="startShopping"
        >
          <v-icon size="32" class="mr-4">mdi-hand-pointing-up</v-icon>
          Touch to Start
          <v-icon size="32" class="ml-4">mdi-cart</v-icon>
        </v-btn>

        <!-- Pulsing animation for attention -->
        <div class="pulse-rings">
          <div class="pulse-ring ring-1"></div>
          <div class="pulse-ring ring-2"></div>
          <div class="pulse-ring ring-3"></div>
        </div>
      </div>

      <!-- Features showcase -->
      <div class="features-section">
        <v-row justify="center" class="mx-0">
          <v-col
              v-for="feature in features"
              :key="feature.title"
              cols="12"
              sm="6"
              md="3"
              class="text-center"
          >
            <div class="feature-card">
              <v-icon :color="feature.color" size="48" class="mb-3">
                {{ feature.icon }}
              </v-icon>
              <h3 class="text-h6 font-weight-medium mb-2">
                {{ feature.title }}
              </h3>
              <p class="text-body-2 text-medium-emphasis">
                {{ feature.description }}
              </p>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Operating hours -->
      <div v-if="operatingHours" class="operating-hours">
        <v-chip
            :color="isOpen ? 'success' : 'warning'"
            :prepend-icon="isOpen ? 'mdi-clock-check' : 'mdi-clock-alert'"
            size="large"
            variant="elevated"
        >
          {{ isOpen ? 'Open Now' : 'Closed' }} | {{ operatingHours }}
        </v-chip>
      </div>

      <!-- Promotional banners -->
      <div v-if="promotions.length > 0" class="promotions-section">
        <v-carousel
            v-model="currentPromotion"
            height="120"
            hide-delimiter-background
            show-arrows="hover"
            cycle
            interval="5000"
            class="promotion-carousel"
        >
          <v-carousel-item
              v-for="(promo, index) in promotions"
              :key="index"
              class="d-flex align-center justify-center"
          >
            <div class="text-center">
              <h3 class="text-h6 font-weight-bold mb-2">{{ promo.title }}</h3>
              <p class="text-body-1">{{ promo.description }}</p>
            </div>
          </v-carousel-item>
        </v-carousel>
      </div>
    </div>

    <!-- Status indicators -->
    <div class="status-indicators">
      <!-- Network status -->
      <v-chip
          :color="networkStatusColor"
          :prepend-icon="networkStatusIcon"
          size="small"
          variant="elevated"
          class="status-chip"
      >
        {{ networkStatusText }}
      </v-chip>

      <!-- Last update -->
      <v-chip
          color="surface-variant"
          prepend-icon="mdi-update"
          size="small"
          variant="elevated"
          class="status-chip"
      >
        Last sync: {{ lastSyncFormatted }}
      </v-chip>
    </div>

    <!-- Time and date -->
    <div class="time-display">
      <div class="current-time">{{ currentTime }}</div>
      <div class="current-date">{{ currentDate }}</div>
    </div>

    <!-- Emergency access -->
    <div class="emergency-access">
      <v-btn
          v-long-press="showEmergencyOptions"
          icon
          size="small"
          variant="text"
          class="emergency-btn"
      >
        <v-icon size="16">mdi-cog</v-icon>
      </v-btn>
    </div>

    <!-- Emergency options dialog -->
    <v-dialog v-model="showEmergencyDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="mr-2">mdi-shield-alert</v-icon>
          Emergency Access
        </v-card-title>

        <v-card-text>
          <v-text-field
              v-model="emergencyCode"
              label="Emergency Code"
              type="password"
              variant="outlined"
              hide-details
              @keyup.enter="validateEmergencyCode"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showEmergencyDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="validateEmergencyCode">Access</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { format } from 'date-fns'

const router = useRouter()
const authStore = useAuthStore()

// Reactive data
const currentTime = ref('')
const currentDate = ref('')
const currentPromotion = ref(0)
const floatingElements = ref<any[]>([])
const showEmergencyDialog = ref(false)
const emergencyCode = ref('')

// Timer references
let timeInterval: NodeJS.Timeout | null = null
let animationInterval: NodeJS.Timeout | null = null

// Computed properties
const kioskConfig = computed(() => authStore.kioskConfig)

const networkStatusColor = computed(() => {
  if (authStore.isOffline) return 'error'
  if (!authStore.isAuthenticated) return 'warning'
  return 'success'
})

const networkStatusIcon = computed(() => {
  if (authStore.isOffline) return 'mdi-wifi-off'
  if (!authStore.isAuthenticated) return 'mdi-wifi-strength-2'
  return 'mdi-wifi'
})

const networkStatusText = computed(() => {
  if (authStore.isOffline) return 'Offline'
  if (!authStore.isAuthenticated) return 'Connecting'
  return 'Online'
})

const lastSyncFormatted = computed(() => {
  if (!authStore.lastHeartbeat) return 'Never'
  return format(authStore.lastHeartbeat, 'HH:mm')
})

const isOpen = computed(() => {
  // TODO: Implement operating hours logic
  return true
})

const operatingHours = computed(() => {
  // TODO: Get from kiosk configuration
  return '24/7'
})

// Static data
const features = [
  {
    icon: 'mdi-lightning-bolt',
    title: 'Quick Service',
    description: 'Fast and easy shopping experience',
    color: 'primary'
  },
  {
    icon: 'mdi-credit-card',
    title: 'Multiple Payments',
    description: 'Card, contactless, and mobile payments',
    color: 'success'
  },
  {
    icon: 'mdi-clock-fast',
    title: '24/7 Available',
    description: 'Shop anytime, day or night',
    color: 'info'
  },
  {
    icon: 'mdi-shield-check',
    title: 'Secure',
    description: 'Safe and secure transactions',
    color: 'warning'
  }
]

const promotions = [
  {
    title: 'Special Offers',
    description: 'Check out our latest deals and discounts!'
  },
  {
    title: 'New Products',
    description: 'Discover fresh items added to our selection'
  },
  {
    title: 'Quick Checkout',
    description: 'Contactless payments for faster service'
  }
]

// Methods
const updateTime = () => {
  const now = new Date()
  currentTime.value = format(now, 'HH:mm:ss')
  currentDate.value = format(now, 'EEEE, MMMM do, yyyy')
}

const generateFloatingElements = () => {
  const icons = ['mdi-circle', 'mdi-square', 'mdi-triangle', 'mdi-hexagon']
  const colors = ['primary', 'secondary', 'accent', 'info']

  floatingElements.value = Array.from({ length: 8 }, (_, index) => ({
    icon: icons[Math.floor(Math.random() * icons.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 20 + Math.random() * 40,
    style: {
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      animationDelay: Math.random() * 10 + 's',
      animationDuration: (10 + Math.random() * 10) + 's'
    }
  }))
}

const handleUserInteraction = () => {
  startShopping()
}

const startShopping = async () => {
  try {
    // Check if device is authenticated
    if (!authStore.isAuthenticated && authStore.isDeviceSetup) {
      // Try to authenticate
      await authStore.authenticate()
    }

    // Navigate based on channel count
    if (authStore.kioskConfig?.channels.length === 1) {
      // Single channel - go directly to categories
      router.push('/categories')
    } else if (authStore.kioskConfig?.channels.length > 1) {
      // Multiple channels - show channel selection
      router.push('/channels')
    } else {
      // No channels or not authenticated - go to setup
      router.push('/setup')
    }
  } catch (error) {
    console.error('Failed to start shopping:', error)
    router.push('/setup')
  }
}

const showEmergencyOptions = () => {
  showEmergencyDialog.value = true
}

const validateEmergencyCode = () => {
  // Emergency code validation
  const validCodes = ['ADMIN123', 'EMERGENCY', 'MAINTENANCE']

  if (validCodes.includes(emergencyCode.value.toUpperCase())) {
    showEmergencyDialog.value = false
    emergencyCode.value = ''
    router.push('/maintenance')
  } else {
    // Invalid code - could show error message
    emergencyCode.value = ''
  }
}

// Lifecycle hooks
onMounted(() => {
  // Start time updates
  updateTime()
  timeInterval = setInterval(updateTime, 1000)

  // Generate floating elements
  generateFloatingElements()

  // Regenerate floating elements periodically
  animationInterval = setInterval(generateFloatingElements, 30000)

  // Auto-authenticate if not authenticated
  if (!authStore.isAuthenticated && authStore.isDeviceSetup) {
    authStore.authenticate().catch(console.error)
  }
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (animationInterval) {
    clearInterval(animationInterval)
  }
})

// Custom directive for long press
const vLongPress = {
  mounted(el: HTMLElement, binding: any) {
    let pressTimer: NodeJS.Timeout | null = null

    const start = () => {
      pressTimer = setTimeout(() => {
        binding.value()
      }, 3000) // 3 seconds long press
    }

    const cancel = () => {
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
    }

    el.addEventListener('mousedown', start)
    el.addEventListener('touchstart', start)
    el.addEventListener('mouseup', cancel)
    el.addEventListener('mouseleave', cancel)
    el.addEventListener('touchend', cancel)
    el.addEventListener('touchcancel', cancel)
  }
}
</script>

<style scoped>
.screensaver-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.screensaver-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.animated-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
      45deg,
      rgba(103, 126, 234, 0.8),
      rgba(118, 75, 162, 0.8),
      rgba(255, 154, 158, 0.8),
      rgba(250, 208, 196, 0.8)
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.floating-element {
  position: absolute;
  animation: float 20s infinite linear;
  opacity: 0.3;
}

@keyframes float {
  from {
    transform: translateY(100vh) rotate(0deg);
  }
  to {
    transform: translateY(-100vh) rotate(360deg);
  }
}

.screensaver-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
  max-width: 1200px;
  padding: 2rem;
}

.brand-section {
  margin-bottom: 3rem;
}

.logo-container {
  margin-bottom: 2rem;
}

.interaction-prompt {
  position: relative;
  margin: 4rem 0;
}

.touch-button {
  font-size: 1.5rem !important;
  height: 80px !important;
  padding: 0 3rem !important;
  border-radius: 40px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
  transition: all 0.3s ease !important;
}

.touch-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3) !important;
}

.pulse-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -1;
}

.pulse-ring {
  position: absolute;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.ring-1 {
  width: 120px;
  height: 120px;
  margin: -60px;
  animation-delay: 0s;
}

.ring-2 {
  width: 160px;
  height: 160px;
  margin: -80px;
  animation-delay: 0.5s;
}

.ring-3 {
  width: 200px;
  height: 200px;
  margin: -100px;
  animation-delay: 1s;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

.features-section {
  margin: 4rem 0;
}

.feature-card {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
}

.operating-hours {
  margin: 2rem 0;
}

.promotions-section {
  margin: 3rem 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.promotion-carousel {
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.status-indicators {
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-chip {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9) !important;
}

.time-display {
  position: absolute;
  top: 2rem;
  right: 2rem;
  z-index: 3;
  text-align: right;
  color: white;
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.current-time {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
}

.current-date {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 0.25rem;
}

.emergency-access {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  z-index: 3;
}

.emergency-btn {
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.emergency-btn:hover {
  opacity: 1;
}

/* Responsive design */
@media (max-width: 768px) {
  .screensaver-content {
    padding: 1rem;
  }

  .features-section .v-col {
    margin-bottom: 1rem;
  }

  .touch-button {
    font-size: 1.2rem !important;
    height: 70px !important;
  }

  .time-display {
    position: relative;
    top: auto;
    right: auto;
    margin-top: 2rem;
    text-align: center;
  }

  .status-indicators {
    position: relative;
    top: auto;
    left: auto;
    margin-bottom: 2rem;
    align-items: center;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .screensaver-container {
    background: #000;
    color: #fff;
  }

  .feature-card {
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.5);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .floating-element,
  .animated-gradient,
  .pulse-ring {
    animation: none;
  }

  .touch-button:hover {
    transform: none;
  }
}
</style>