<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'

const { locale, t } = useI18n()
const route = useRoute()
const mobileOpen = ref(false)
const langMenuOpen = ref(false)

const langs = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
]

const currentLangLabel = computed(() =>
  langs.find(l => l.code === locale.value)?.label || 'EN'
)

function setLang(code) {
  locale.value = code
  localStorage.setItem('locale', code)
  langMenuOpen.value = false
}

function closeLangMenu(e) {
  if (langMenuOpen.value && !e.target.closest('.relative')) {
    langMenuOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', closeLangMenu))
onUnmounted(() => document.removeEventListener('click', closeLangMenu))

const navItems = [
  { to: '/', label: 'nav.home' },
  { to: '/clients', label: 'nav.clients' },
  { to: '/isps', label: 'nav.isps' },
]
</script>

<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-navy/80 backdrop-blur-xl border-b border-border-glow/50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-3 group">
          <div class="flex items-center gap-2">
            <div class="status-dot"></div>
            <span class="text-xl font-bold text-white font-mono tracking-wider">1.1.8.8</span>
          </div>
          <span class="hidden sm:inline text-[10px] text-cyan/60 font-mono uppercase tracking-[0.2em] border-l border-border-glow pl-3">{{ t('nav.public_dns') }}</span>
        </RouterLink>

        <!-- Desktop nav -->
        <div class="hidden md:flex items-center gap-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="relative px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all"
            :class="route.path === item.to
              ? 'text-primary bg-primary/10 border border-primary/30'
              : 'text-white/50 hover:text-white/80 border border-transparent hover:border-border-glow'"
          >
            <span v-if="route.path === item.to" class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-px bg-primary shadow-[0_0_8px_rgba(232,97,26,0.5)]"></span>
            {{ $t(item.label) }}
          </RouterLink>

          <div class="w-px h-6 bg-border-glow mx-3"></div>

          <div class="relative">
            <button
              @click="langMenuOpen = !langMenuOpen"
              class="text-[10px] font-mono uppercase tracking-wider text-cyan/60 hover:text-cyan border border-border-glow/50 hover:border-cyan/30 px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {{ currentLangLabel }}
              <svg class="w-2.5 h-2.5 transition-transform" :class="{ 'rotate-180': langMenuOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div
              v-if="langMenuOpen"
              class="absolute right-0 top-full mt-1 border border-border-glow/50 bg-navy/95 backdrop-blur-xl min-w-[80px] z-50"
            >
              <button
                v-for="l in langs"
                :key="l.code"
                @click="setLang(l.code)"
                class="block w-full text-left text-[10px] font-mono uppercase tracking-wider px-3 py-2 transition-colors cursor-pointer"
                :class="locale === l.code ? 'text-primary bg-primary/10' : 'text-white/50 hover:text-cyan hover:bg-white/5'"
              >
                {{ l.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile hamburger -->
        <button @click="mobileOpen = !mobileOpen" class="md:hidden text-white/60 hover:text-primary cursor-pointer transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileOpen" class="md:hidden pb-4 border-t border-border-glow/30 mt-2 pt-4 space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="block text-xs font-mono uppercase tracking-wider py-2 px-3 transition-colors"
          :class="route.path === item.to ? 'text-primary bg-primary/10 border-l-2 border-primary' : 'text-white/50 hover:text-white/80'"
          @click="mobileOpen = false"
        >
          {{ $t(item.label) }}
        </RouterLink>
        <div class="flex gap-1 mt-2">
          <button
            v-for="l in langs"
            :key="l.code"
            @click="setLang(l.code)"
            class="text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 border transition-colors cursor-pointer"
            :class="locale === l.code
              ? 'text-primary border-primary/40 bg-primary/10'
              : 'text-cyan/60 hover:text-cyan border-border-glow/50'"
          >
            {{ l.label }}
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>
