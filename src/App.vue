<script setup>
import Navbar from './components/Navbar.vue'
import Footer from './components/SiteFooter.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-navy grid-bg relative">
    <!-- Ambient glow -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-cyan/3 rounded-full blur-3xl"></div>
    </div>

    <Navbar />
    <main class="flex-1 relative z-10">
      <router-view />
    </main>
    <Footer />
  </div>
</template>
