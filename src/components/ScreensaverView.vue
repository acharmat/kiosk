<template>
  <v-container fluid class="screensaver-container" @click="goToCategories">
    <div class="screensaver-overlay"></div> <v-row justify="center" align="center" class="fill-height">
    <v-col cols="12" class="text-center">
      <v-img
          src="https://blup.com/assets/dashboard/media/logos/default-dark.svg"
          alt="Blup Logo"
          max-width="300"
          class="mx-auto mb-8 animate-fade-in"
      ></v-img>
      <h1 class="text-h2 mb-4 font-weight-black text-white slogan animate-slide-up">
        Fast. Fresh. <span class="text-primary-lighten-1">Delicious.</span>
      </h1>
      <p class="text-h5 text-white animate-fade-in-slow">
        Touchez l'écran pour commencer votre commande.
      </p>
    </v-col>
  </v-row>
  </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToCategories = () => {
  router.push('/categories')
}

</script>
<style scoped>
.screensaver-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.9) 0%, #2196F3E5 100%);
  background-size: cover;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  animation: backgroundAnimate 15s ease-in-out infinite alternate; /* Example animation */
}

@keyframes backgroundAnimate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.screensaver-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3); /* Subtle dark overlay for text readability */
}

.slogan {
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.4);
}

.animate-fade-in {
  animation: fadeIn 1.5s ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 1s ease-out forwards;
  opacity: 0; /* Start invisible */
  animation-delay: 0.5s;
}

.animate-fade-in-slow {
  animation: fadeIn 2s ease-out forwards;
  animation-delay: 1s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>