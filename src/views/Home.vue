<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import WorldMap from '../components/WorldMap.vue'
import { useQueryStats } from '../composables/useQueryStats.js'

const { t, locale } = useI18n()
const { counters, totalQps, loading } = useQueryStats()

function formatNumber(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toLocaleString()
}

function formatRaw(n) {
  return n.toLocaleString()
}

const counterItems = computed(() => [
  { key: '24h', value: counters.value.h24 },
  { key: '7d', value: counters.value.d7 },
  { key: '30d', value: counters.value.d30 },
  { key: '1y', value: counters.value.y1 },
])

const copied = ref({ primary: false, secondary: false })

async function copyDns(addr, key) {
  await navigator.clipboard.writeText(addr)
  copied.value[key] = true
  setTimeout(() => (copied.value[key] = false), 2000)
}

const features = [
  { key: 'performance', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { key: 'security', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { key: 'global', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { key: 'smart', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { key: 'protocols', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { key: 'privacy', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
]

const stats = ['cache', 'recursion', 'latency', 'hitrate']

// Typewriter for hero subtitle
const displayText = ref('')
const cursorVisible = ref(true)
let typewriterTimer = null

function runTypewriter() {
  if (typewriterTimer) clearInterval(typewriterTimer)
  let idx = 0
  const full = t('home.typewriter_text')
  displayText.value = ''
  typewriterTimer = setInterval(() => {
    if (idx <= full.length) {
      displayText.value = full.slice(0, idx)
      idx++
    } else {
      clearInterval(typewriterTimer)
    }
  }, 60)
}

onMounted(() => {
  runTypewriter()
  setInterval(() => { cursorVisible.value = !cursorVisible.value }, 530)
})

watch(locale, () => runTypewriter())
</script>

<template>
  <!-- Hero -->
  <section class="relative pt-16 overflow-hidden scanlines">
    <!-- Animated background -->
    <div class="absolute inset-0">
      <div class="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px] animate-float"></div>
      <div class="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan/5 rounded-full blur-[100px]" style="animation: float 5s ease-in-out infinite 1s;"></div>
      <div class="dot-grid absolute inset-0 opacity-40"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-40">
      <div class="text-center max-w-4xl mx-auto">
        <!-- System status line -->
        <div class="inline-flex items-center gap-2 px-4 py-1.5 border border-border-glow/50 bg-panel/50 mb-8 font-mono text-xs">
          <span class="status-dot"></span>
          <span class="text-green-400/70">{{ t('home.system_online') }}</span>
          <span class="text-white/20 mx-1">|</span>
          <span class="text-white/30">{{ t('home.nodes_active') }}</span>
          <span class="text-white/20 mx-1">|</span>
          <span class="text-cyan/50">{{ displayText }}<span :class="cursorVisible ? 'opacity-100' : 'opacity-0'" class="text-primary transition-opacity">_</span></span>
        </div>

        <h1 class="text-8xl sm:text-9xl lg:text-[12rem] font-black text-white tracking-tighter font-mono leading-none glow-text-orange">
          {{ t('home.hero_title') }}
        </h1>

        <p class="mt-8 text-xl sm:text-2xl font-semibold text-primary font-mono tracking-wide">
          {{ t('home.hero_subtitle') }}
        </p>
        <p class="mt-4 text-base text-white/40 max-w-2xl mx-auto leading-relaxed">
          {{ t('home.hero_desc') }}
        </p>

        <!-- DNS addresses as terminal cards -->
        <div class="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div class="hud-panel hud-corners flex items-center gap-4 px-6 py-4 min-w-[280px]">
            <div class="text-left flex-1">
              <div class="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan/40">{{ t('home.dns_primary') }}</div>
              <div class="text-2xl font-bold text-white font-mono mt-1">1.1.8.8</div>
            </div>
            <button
              @click="copyDns('1.1.8.8', 'primary')"
              class="text-xs font-mono px-3 py-1.5 border transition-all cursor-pointer"
              :class="copied.primary
                ? 'border-green-500/50 text-green-400 bg-green-500/10'
                : 'border-border-glow text-white/50 hover:border-primary/50 hover:text-primary bg-transparent'"
            >
              {{ copied.primary ? '[ OK ]' : '[ COPY ]' }}
            </button>
          </div>
        </div>

        <!-- CTA -->
        <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <RouterLink
            to="/clients"
            class="group px-8 py-3 bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 font-mono text-sm uppercase tracking-wider transition-all"
          >
            <span class="mr-2 text-primary/50 group-hover:text-primary">&gt;</span>{{ t('home.get_started') }}
          </RouterLink>
          <RouterLink
            to="/isps"
            class="group px-8 py-3 border border-border-glow text-white/50 hover:text-cyan hover:border-cyan/30 font-mono text-sm uppercase tracking-wider transition-all"
          >
            <span class="mr-2 text-white/20 group-hover:text-cyan/50">&gt;</span>{{ t('home.learn_isp') }}
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Section divider -->
    <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>
  </section>

  <!-- What is 1.1.8.8 -->
  <section class="py-20 relative">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('home.section_about') }}</h2>
      <h3 class="text-3xl sm:text-4xl font-bold text-white">{{ t('home.what_title') }}</h3>
      <p class="mt-6 text-base text-white/40 leading-relaxed">{{ t('home.what_desc') }}</p>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- Query Counter -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('home.section_metrics') }}</h2>
        <h3 class="text-3xl sm:text-4xl font-bold text-white">{{ t('home.counter_title') }}</h3>
      </div>

      <!-- Total QPS headline -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-3 px-6 py-3 border border-border-glow/50 bg-panel/50">
          <span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)] animate-pulse-glow"></span>
          <span class="text-[10px] font-mono uppercase tracking-wider text-white/30">{{ t('home.counter_total_qps') }}</span>
          <span class="text-2xl font-black font-mono text-cyan glow-text-cyan">{{ totalQps.toLocaleString() }}</span>
        </div>
      </div>

      <!-- 4 counter cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="c in counterItems"
          :key="c.key"
          class="hud-panel hud-corners p-6 text-center group"
        >
          <!-- Big formatted number -->
          <div class="text-3xl sm:text-4xl font-black font-mono text-primary glow-text-orange transition-all">
            {{ formatNumber(c.value) }}
          </div>
          <!-- Raw number underneath -->
          <div class="text-[10px] font-mono text-white/20 mt-1 tabular-nums">
            {{ formatRaw(c.value) }}
          </div>
          <!-- Label -->
          <div class="text-xs font-mono font-semibold text-white/50 mt-3 uppercase tracking-wider">
            {{ t(`home.counter_${c.key}`) }}
          </div>
          <div class="mt-4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- Features -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-12 text-center">{{ t('home.section_capabilities') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="f in features"
          :key="f.key"
          class="hud-panel p-6 transition-all group"
        >
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 border border-primary/30 bg-primary/5 flex items-center justify-center shrink-0 group-hover:border-primary/60 transition-colors">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" :d="f.icon" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-semibold text-white mb-2 font-mono uppercase tracking-wide">{{ t(`home.feature_${f.key}`) }}</h3>
              <p class="text-xs text-white/35 leading-relaxed">{{ t(`home.feature_${f.key}_desc`) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- Global Network -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('home.section_network') }}</h2>
        <h3 class="text-3xl sm:text-4xl font-bold text-white">{{ t('home.network_title') }}</h3>
        <p class="mt-4 text-white/35 max-w-2xl mx-auto">{{ t('home.network_desc') }}</p>
      </div>

      <WorldMap />

      <p class="text-center text-primary/50 text-xs font-mono mt-6 uppercase tracking-wider">
        &gt; {{ t('home.expanding') }}
      </p>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- HyperDNS Tech -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('home.section_engine') }}</h2>
        <h3 class="text-3xl sm:text-4xl font-bold text-white">{{ t('home.tech_title') }}</h3>
        <p class="mt-4 text-white/35 max-w-3xl mx-auto leading-relaxed">{{ t('home.tech_desc') }}</p>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="s in stats"
          :key="s"
          class="hud-panel hud-corners p-6 text-center"
        >
          <div class="text-3xl sm:text-4xl font-black text-primary font-mono glow-text-orange">{{ t(`home.tech_${s}_val`) }}</div>
          <div class="text-xs font-mono font-semibold text-white/60 mt-3 uppercase tracking-wider">{{ t(`home.tech_${s}`) }}</div>
          <div class="text-[10px] font-mono text-white/25 mt-1">{{ t(`home.tech_${s}_desc`) }}</div>
          <!-- Bottom bar decoration -->
          <div class="mt-4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        </div>
      </div>
    </div>
  </section>
</template>
