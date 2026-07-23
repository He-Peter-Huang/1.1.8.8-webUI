<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

// three.js is heavy — split it into its own async chunk so first paint stays fast
const DnsGlobe = defineAsyncComponent(() => import('../components/three/DnsGlobe.vue'))
import WorldMap from '../components/WorldMap.vue'
import { useQueryStats } from '../composables/useQueryStats.js'
import { useReveal } from '../composables/useReveal.js'

const { t } = useI18n()
const { counters, totalQps } = useQueryStats()
useReveal()

function formatNumber(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toLocaleString()
}

const counterItems = computed(() => [
  { key: '24h', value: counters.value.h24 },
  { key: '7d', value: counters.value.d7 },
  { key: '30d', value: counters.value.d30 },
  { key: '1y', value: counters.value.y1 },
])

const heroChars = computed(() => t('home.hero_title').split(''))

const copied = ref({ hero: false, cta: false })
async function copyDns(addr, key) {
  await navigator.clipboard.writeText(addr)
  copied.value[key] = true
  setTimeout(() => (copied.value[key] = false), 2000)
}

const marqueeItems = [
  'DoH', 'DoT', 'DoQ', 'DNSSEC', 'ANYCAST', 'RFC 8767',
  '20M QPS', 'SUB-MS CACHE', '6 POPS', 'MINIMAL LOGS', 'HYPERDNS',
]

const journeySteps = [1, 2, 3, 4]

const features = [
  { key: 'performance', span: 'md:col-span-2 lg:col-span-4', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { key: 'security', span: 'lg:col-span-2', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { key: 'protocols', span: 'lg:col-span-2', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { key: 'smart', span: 'lg:col-span-2', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { key: 'global', span: 'lg:col-span-2', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { key: 'privacy', span: 'md:col-span-2 lg:col-span-6', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
]

const protocolChips = ['UDP', 'TCP', 'DoT', 'DoH', 'DoQ', 'DNSSEC']

const engineStats = [
  { key: 'cache', bar: 96 },
  { key: 'recursion', bar: 72 },
  { key: 'latency', bar: 88 },
  { key: 'hitrate', bar: 100 },
]

const eqBars = [0.55, 0.85, 0.4, 1, 0.7, 0.9, 0.5]
</script>

<template>
  <!-- ============ HERO ============ -->
  <section class="relative min-h-screen flex items-center overflow-hidden grain">
    <div class="absolute inset-0">
      <div class="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[130px] animate-float"></div>
      <div class="absolute -bottom-24 right-0 w-[500px] h-[500px] bg-cyan/5 rounded-full blur-[110px]" style="animation: float 6s ease-in-out infinite 1.2s;"></div>
      <div class="dot-grid absolute inset-0 opacity-40"></div>
    </div>

    <div class="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 lg:pt-24 lg:pb-16">
      <div class="grid lg:grid-cols-2 gap-12 lg:gap-4 items-center">
        <!-- Left: copy -->
        <div class="text-center lg:text-left">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 border border-border-glow/50 bg-panel/50 font-mono text-xs">
            <span class="status-dot"></span>
            <span class="text-green-400/70">{{ t('home.system_online') }}</span>
            <span class="text-white/20 mx-1">|</span>
            <span class="text-white/30">{{ t('home.nodes_active') }}</span>
          </div>

          <h1 class="mt-8 font-mono font-black leading-[0.9] tracking-tighter text-[clamp(3.8rem,13vw,8rem)] lg:text-[clamp(3.5rem,6.4vw,7.5rem)] whitespace-nowrap">
            <span
              v-for="(ch, i) in heroChars"
              :key="i"
              class="hero-char"
              :class="ch === '.' ? 'text-primary' : 'text-white glow-text-orange'"
              :style="{ animationDelay: `${0.1 + i * 0.07}s` }"
            >{{ ch }}</span>
          </h1>

          <p class="mt-6 text-lg sm:text-xl font-semibold text-primary font-mono tracking-wide">
            {{ t('home.hero_subtitle') }}
          </p>
          <p class="mt-4 text-base text-white/40 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {{ t('home.hero_desc') }}
          </p>

          <!-- DNS address chip -->
          <div class="mt-10 flex justify-center lg:justify-start">
            <div class="hud-panel hud-corners flex items-center gap-5 px-6 py-4">
              <div class="text-left">
                <div class="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan/40">{{ t('home.dns_primary') }}</div>
                <div class="text-3xl font-bold text-white font-mono mt-1">1.1.8.8</div>
              </div>
              <button
                @click="copyDns('1.1.8.8', 'hero')"
                class="text-xs font-mono px-3 py-1.5 border transition-all cursor-pointer"
                :class="copied.hero
                  ? 'border-green-500/50 text-green-400 bg-green-500/10'
                  : 'border-border-glow text-white/50 hover:border-primary/50 hover:text-primary bg-transparent'"
              >
                {{ copied.hero ? '[ OK ]' : '[ COPY ]' }}
              </button>
            </div>
          </div>

          <!-- CTAs -->
          <div class="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-center lg:items-start justify-center lg:justify-start gap-3">
            <RouterLink
              to="/clients"
              class="group whitespace-nowrap px-5 py-3 bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 font-mono text-xs uppercase tracking-wider transition-all"
            >
              <span class="mr-2 text-primary/50 group-hover:text-primary">&gt;</span>{{ t('home.get_started') }}
            </RouterLink>
            <RouterLink
              to="/enterprise"
              class="group whitespace-nowrap px-5 py-3 border border-border-glow text-white/50 hover:text-cyan hover:border-cyan/30 font-mono text-xs uppercase tracking-wider transition-all"
            >
              <span class="mr-2 text-white/20 group-hover:text-cyan/50">&gt;</span>{{ t('home.learn_enterprise') }}
            </RouterLink>
            <RouterLink
              to="/isps"
              class="group whitespace-nowrap px-5 py-3 border border-border-glow text-white/50 hover:text-cyan hover:border-cyan/30 font-mono text-xs uppercase tracking-wider transition-all"
            >
              <span class="mr-2 text-white/20 group-hover:text-cyan/50">&gt;</span>{{ t('home.learn_isp') }}
            </RouterLink>
          </div>
        </div>

        <!-- Right: interactive globe -->
        <div class="relative h-[400px] sm:h-[500px] lg:h-[640px]">
          <DnsGlobe />

          <!-- floating HUD chips -->
          <div class="absolute top-2 left-2 pointer-events-none flex items-center gap-2 px-3 py-1.5 border border-border-glow/50 bg-panel/60 backdrop-blur-sm font-mono text-[10px] uppercase tracking-[0.2em]">
            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow"></span>
            <span class="text-white/40">{{ t('home.globe_live') }}</span>
          </div>
          <div class="absolute bottom-2 right-2 pointer-events-none px-3 py-2 border border-border-glow/50 bg-panel/60 backdrop-blur-sm font-mono text-right">
            <div class="text-[9px] uppercase tracking-[0.2em] text-white/30">{{ t('home.counter_total_qps') }}</div>
            <div class="text-lg font-bold text-cyan glow-text-cyan tabular-nums">{{ totalQps.toLocaleString() }}</div>
          </div>
          <div class="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none hidden lg:block font-mono text-[9px] uppercase tracking-[0.3em] text-white/20">
            {{ t('home.globe_drag') }}
          </div>
        </div>
      </div>
    </div>

    <!-- scroll hint -->
    <div class="absolute bottom-5 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2">
      <span class="font-mono text-[9px] uppercase tracking-[0.4em] text-white/25">{{ t('home.scroll_hint') }}</span>
      <span class="w-px h-8 bg-gradient-to-b from-primary/60 to-transparent scroll-line"></span>
    </div>
  </section>

  <!-- ============ MARQUEE ============ -->
  <section class="border-y border-border-glow/40 bg-panel/30 py-4 overflow-hidden select-none">
    <div class="marquee-track flex w-max">
      <div v-for="n in 2" :key="n" class="flex items-center shrink-0" :aria-hidden="n === 2">
        <template v-for="item in marqueeItems" :key="item">
          <span class="px-8 font-mono text-xs uppercase tracking-[0.3em] text-white/30">{{ item }}</span>
          <span class="font-mono text-xs text-primary/40">//</span>
        </template>
      </div>
    </div>
  </section>

  <!-- ============ STATEMENT ============ -->
  <section class="py-28 lg:py-40 relative overflow-hidden">
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-[140px]"></div>
    <div class="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-10">{{ t('home.section_about') }}</h2>
      <p class="reveal text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.05]">
        {{ t('home.statement_1') }}
      </p>
      <p class="reveal stagger-2 mt-2 text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-gradient-orange">
        {{ t('home.statement_2') }}
      </p>
      <p class="reveal stagger-3 mt-12 max-w-2xl mx-auto text-base text-white/40 leading-relaxed">
        {{ t('home.what_desc') }}
      </p>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- ============ JOURNEY ============ -->
  <section class="py-24 lg:py-32 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('home.section_journey') }}</h2>
        <h3 class="reveal text-3xl sm:text-5xl font-black text-white tracking-tight">{{ t('home.journey_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-2xl mx-auto">{{ t('home.journey_desc') }}</p>
      </div>

      <div class="relative">
        <!-- connecting beam (desktop) -->
        <svg
          class="hidden lg:block absolute left-[12.5%] right-[12.5%] top-8 w-[75%] h-px overflow-visible"
          viewBox="0 0 100 1"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 0.5 H100" pathLength="100" stroke="rgba(26,58,92,0.8)" stroke-width="1.5" vector-effect="non-scaling-stroke" fill="none" stroke-dasharray="3 4" />
          <path class="beam-comet layer-glow" d="M0 0.5 H100" pathLength="100" stroke="#E8611A" vector-effect="non-scaling-stroke" style="--dur: 4.5s" />
          <path class="beam-comet layer-mid" d="M0 0.5 H100" pathLength="100" stroke="#F5934D" vector-effect="non-scaling-stroke" style="--dur: 4.5s" />
          <path class="beam-comet layer-core" d="M0 0.5 H100" pathLength="100" stroke="#FFE0C2" vector-effect="non-scaling-stroke" style="--dur: 4.5s" />
        </svg>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          <div
            v-for="(s, i) in journeySteps"
            :key="s"
            class="reveal flex flex-col items-center text-center"
            :class="`stagger-${i + 1}`"
          >
            <div class="relative z-10 w-16 h-16 rounded-full border border-primary/40 bg-navy flex items-center justify-center font-mono font-bold text-primary glow-orange">
              0{{ s }}
            </div>
            <h4 class="mt-6 text-base font-bold text-white font-mono uppercase tracking-widest">
              {{ t(`home.journey_s${s}`) }}
            </h4>
            <p class="mt-3 text-sm text-white/35 leading-relaxed max-w-[300px]">
              {{ t(`home.journey_s${s}_desc`) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- ============ LIVE METRICS ============ -->
  <section class="py-24 lg:py-32 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('home.section_metrics') }}</h2>
        <h3 class="reveal text-3xl sm:text-5xl font-black text-white tracking-tight">{{ t('home.counter_title') }}</h3>
      </div>

      <!-- QPS headline -->
      <div class="reveal text-center mb-14">
        <div class="text-6xl sm:text-8xl font-black font-mono text-cyan glow-text-cyan tabular-nums tracking-tight">
          {{ totalQps.toLocaleString() }}
        </div>
        <div class="mt-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
          <span class="status-dot"></span>
          {{ t('home.counter_total_qps') }}
        </div>
      </div>

      <!-- hairline counter grid -->
      <div class="reveal stagger-2 grid grid-cols-2 lg:grid-cols-4 gap-px bg-border-glow/40 border border-border-glow/40">
        <div
          v-for="c in counterItems"
          :key="c.key"
          class="bg-navy p-6 sm:p-8 text-center group hover:bg-panel transition-colors"
        >
          <div class="text-3xl sm:text-4xl font-black font-mono text-primary glow-text-orange">
            {{ formatNumber(c.value) }}
          </div>
          <div class="text-[10px] font-mono text-white/20 mt-2 tabular-nums">
            {{ c.value.toLocaleString() }}
          </div>
          <div class="text-xs font-mono font-semibold text-white/50 mt-4 uppercase tracking-wider">
            {{ t(`home.counter_${c.key}`) }}
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- ============ CAPABILITIES (bento) ============ -->
  <section class="py-24 lg:py-32 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-12 text-center">{{ t('home.section_capabilities') }}</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div
          v-for="(f, i) in features"
          :key="f.key"
          class="reveal bento-tile hud-panel relative overflow-hidden group p-6 lg:p-8"
          :class="[f.span, `stagger-${(i % 6) + 1}`]"
        >
          <div class="flex items-start gap-4" :class="f.key === 'privacy' ? 'lg:items-center' : ''">
            <div class="w-10 h-10 border border-primary/30 bg-primary/5 flex items-center justify-center shrink-0 group-hover:border-primary/60 transition-colors">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" :d="f.icon" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-semibold text-white mb-2 font-mono uppercase tracking-wide">{{ t(`home.feature_${f.key}`) }}</h3>
              <p class="text-xs text-white/35 leading-relaxed" :class="f.key === 'performance' ? 'max-w-md' : ''">{{ t(`home.feature_${f.key}_desc`) }}</p>

              <!-- protocol chips -->
              <div v-if="f.key === 'protocols'" class="mt-4 flex flex-wrap gap-1.5">
                <span
                  v-for="p in protocolChips"
                  :key="p"
                  class="px-2 py-0.5 border border-cyan/20 text-cyan/60 font-mono text-[10px] tracking-wider"
                >{{ p }}</span>
              </div>
            </div>

            <!-- privacy badge -->
            <div v-if="f.key === 'privacy'" class="hidden lg:block shrink-0 px-4 py-2 border border-primary/30 font-mono text-primary text-sm uppercase tracking-[0.25em]">
              MINIMAL LOGS
            </div>
          </div>

          <!-- performance tile: big figure + equalizer -->
          <div v-if="f.key === 'performance'" class="mt-6 flex items-end justify-between gap-6">
            <div>
              <div class="text-5xl lg:text-6xl font-black font-mono text-primary glow-text-orange leading-none">20M</div>
              <div class="mt-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">QPS / DEVICE</div>
            </div>
            <div class="flex items-end gap-1.5 h-16 pr-2" aria-hidden="true">
              <span
                v-for="(b, bi) in eqBars"
                :key="bi"
                class="eq-bar w-2 bg-gradient-to-t from-primary/70 to-cyan/60"
                :style="{ height: `${b * 100}%`, animationDelay: `${bi * 0.12}s` }"
              ></span>
            </div>
          </div>

          <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- ============ NETWORK ============ -->
  <section class="py-24 lg:py-32 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('home.section_network') }}</h2>
        <h3 class="reveal text-3xl sm:text-5xl font-black text-white tracking-tight">{{ t('home.network_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-2xl mx-auto">{{ t('home.network_desc') }}</p>
      </div>

      <div class="reveal-scale">
        <WorldMap />
      </div>

      <p class="reveal text-center text-primary/50 text-xs font-mono mt-6 uppercase tracking-wider">
        &gt; {{ t('home.expanding') }}
      </p>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- ============ ENGINE ============ -->
  <section class="py-24 lg:py-32 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('home.section_engine') }}</h2>
        <h3 class="reveal text-3xl sm:text-5xl font-black text-white tracking-tight">{{ t('home.tech_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-3xl mx-auto leading-relaxed">{{ t('home.tech_desc') }}</p>
      </div>

      <div class="reveal grid grid-cols-2 lg:grid-cols-4 gap-px bg-border-glow/40 border border-border-glow/40">
        <div
          v-for="s in engineStats"
          :key="s.key"
          class="bg-navy p-6 sm:p-8 text-center hover:bg-panel transition-colors"
        >
          <div class="text-3xl sm:text-4xl font-black text-primary font-mono glow-text-orange">{{ t(`home.tech_${s.key}_val`) }}</div>
          <div class="text-xs font-mono font-semibold text-white/60 mt-3 uppercase tracking-wider">{{ t(`home.tech_${s.key}`) }}</div>
          <div class="text-[10px] font-mono text-white/25 mt-1">{{ t(`home.tech_${s.key}_desc`) }}</div>
          <div class="mt-5 h-0.5 bg-border-glow/30 overflow-hidden">
            <div class="h-full bg-gradient-to-r from-primary to-cyan animate-fill" :style="{ width: `${s.bar}%` }"></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ FINAL CTA ============ -->
  <section class="py-28 lg:py-36 relative overflow-hidden">
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/6 rounded-full blur-[150px]"></div>
    <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="reveal-scale hud-panel hud-corners relative p-10 sm:p-16 text-center overflow-hidden">
        <div class="dot-grid absolute inset-0 opacity-20"></div>
        <div class="relative">
          <h3 class="text-3xl sm:text-5xl font-black text-white tracking-tight">{{ t('home.cta_title') }}</h3>
          <p class="mt-5 text-base text-white/40 max-w-xl mx-auto leading-relaxed">{{ t('home.cta_desc') }}</p>

          <div class="mt-10 flex justify-center">
            <button
              @click="copyDns('1.1.8.8', 'cta')"
              class="group flex items-center gap-4 px-8 py-4 border transition-all cursor-pointer font-mono"
              :class="copied.cta
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-primary/50 bg-primary/10 hover:bg-primary/20'"
            >
              <span class="text-3xl sm:text-4xl font-black" :class="copied.cta ? 'text-green-400' : 'text-primary glow-text-orange'">1.1.8.8</span>
              <span class="text-xs" :class="copied.cta ? 'text-green-400' : 'text-white/40 group-hover:text-primary'">
                {{ copied.cta ? '[ OK ]' : '[ COPY ]' }}
              </span>
            </button>
          </div>

          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <RouterLink
              to="/clients"
              class="group px-7 py-3 bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 font-mono text-sm uppercase tracking-wider transition-all"
            >
              <span class="mr-2 text-primary/50 group-hover:text-primary">&gt;</span>{{ t('home.get_started') }}
            </RouterLink>
            <RouterLink
              to="/enterprise"
              class="group px-7 py-3 border border-border-glow text-white/50 hover:text-cyan hover:border-cyan/30 font-mono text-sm uppercase tracking-wider transition-all"
            >
              <span class="mr-2 text-white/20 group-hover:text-cyan/50">&gt;</span>{{ t('home.learn_enterprise') }}
            </RouterLink>
          </div>

          <p class="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/25">{{ t('home.cta_hint') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
