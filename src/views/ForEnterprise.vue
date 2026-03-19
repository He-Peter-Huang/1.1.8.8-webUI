<script setup>
import { useI18n } from 'vue-i18n'
import { useReveal } from '../composables/useReveal.js'
import EnterpriseFailoverDiagram from '../components/EnterpriseFailoverDiagram.vue'
import MultiSiteDDIDiagram from '../components/MultiSiteDDIDiagram.vue'

const { t, tm } = useI18n()
useReveal()

const services = [
  { key: 'dns_public', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { key: 'ddi', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' },
  { key: 'dhcp', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
  { key: 'dns_mgmt', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'managed', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { key: 'support', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
]

const advantages = [
  { key: 'failover', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { key: 'hotspare', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'remote', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

const costMetrics = [
  { key: 'staff', value: '80', unit: '%' },
  { key: 'hardware', value: '60', unit: '%' },
  { key: 'downtime', value: '99.99', unit: '%', isUptime: true },
  { key: 'deploy', value: '<1', unit: 'hr' },
]
</script>

<template>
  <!-- 1. Hero -->
  <section class="pt-16 relative overflow-hidden">
    <div class="absolute inset-0">
      <div class="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-cyan/5 rounded-full blur-[120px]"></div>
      <div class="dot-grid absolute inset-0 opacity-30"></div>
    </div>

    <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('enterprise.section') }}</h2>
      <h1 class="reveal stagger-1 text-4xl sm:text-5xl font-bold text-white">{{ t('enterprise.hero_title') }}</h1>
      <p class="reveal stagger-2 mt-4 text-xl font-semibold text-primary font-mono">{{ t('enterprise.hero_subtitle') }}</p>
      <p class="reveal stagger-3 mt-4 text-base text-white/40 max-w-2xl mx-auto">{{ t('enterprise.hero_desc') }}</p>
      <a
        href="mailto:1.1.8.8@yamu.com"
        class="reveal stagger-4 inline-flex items-center gap-2 mt-8 px-8 py-3 bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 font-mono text-sm uppercase tracking-wider transition-all shimmer-hover relative overflow-hidden"
      >
        <span class="text-primary/50">&gt;</span>
        {{ t('enterprise.contact_us') }}
      </a>
    </div>
    <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>
  </section>

  <!-- 2. Services -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('enterprise.services_section') }}</h2>
        <h3 class="reveal stagger-1 text-3xl sm:text-4xl font-bold text-white">{{ t('enterprise.services_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-3xl mx-auto">{{ t('enterprise.services_desc') }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(s, si) in services"
          :key="s.key"
          :class="['reveal-scale', `stagger-${si + 1}`]"
          class="hud-panel p-6 group shimmer-hover relative overflow-hidden"
        >
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 border border-cyan/30 bg-cyan/5 flex items-center justify-center shrink-0 group-hover:border-cyan/60 group-hover:shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-all">
              <svg class="w-5 h-5 text-cyan group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" :d="s.icon" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-mono font-semibold text-white/80 uppercase tracking-wide mb-2">{{ t(`enterprise.svc_${s.key}`) }}</h3>
              <p class="text-xs text-white/30 leading-relaxed">{{ t(`enterprise.svc_${s.key}_desc`) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- 3. How it works -->
  <section class="py-20 relative overflow-hidden">
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('enterprise.how_section') }}</h2>
        <h3 class="reveal stagger-1 text-3xl sm:text-4xl font-bold text-white">{{ t('enterprise.how_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-3xl mx-auto">{{ t('enterprise.how_desc') }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div class="reveal-left stagger-1 hud-panel hud-corners p-6">
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-border-glow/30">
            <span class="w-2 h-2 rounded-full bg-primary shadow-[0_0_4px_rgba(232,97,26,0.5)] animate-pulse-glow"></span>
            <span class="text-[10px] font-mono text-primary/70 uppercase tracking-wider">{{ t('enterprise.we_provide_title') }}</span>
          </div>
          <ul class="space-y-2.5">
            <li v-for="(item, i) in tm('enterprise.we_provide')" :key="i" class="flex gap-3 text-xs">
              <span class="text-primary/60 font-mono shrink-0 mt-px">[+]</span>
              <span class="text-white/40">{{ item }}</span>
            </li>
          </ul>
        </div>

        <div class="reveal-right stagger-2 hud-panel hud-corners p-6">
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-border-glow/30">
            <span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)] animate-pulse-glow"></span>
            <span class="text-[10px] font-mono text-green-400/70 uppercase tracking-wider">{{ t('enterprise.you_get_title') }}</span>
          </div>
          <ul class="space-y-2.5">
            <li v-for="(item, i) in tm('enterprise.you_get')" :key="i" class="flex gap-3 text-xs">
              <span class="text-green-500/60 font-mono shrink-0 mt-px">[+]</span>
              <span class="text-white/40">{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- 4. Interactive Failover Diagram -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('enterprise.dia_section') }}</h2>
        <h3 class="reveal stagger-1 text-3xl sm:text-4xl font-bold text-white">{{ t('enterprise.dia_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-3xl mx-auto">{{ t('enterprise.dia_desc') }}</p>
      </div>
      <div class="reveal-scale stagger-3">
        <EnterpriseFailoverDiagram />
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- 5. Multi-Site DDI & Roaming -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('enterprise.msite_section') }}</h2>
        <h3 class="reveal stagger-1 text-3xl sm:text-4xl font-bold text-white">{{ t('enterprise.msite_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-3xl mx-auto">{{ t('enterprise.msite_desc') }}</p>
      </div>
      <div class="reveal-scale stagger-3 mb-10">
        <MultiSiteDDIDiagram />
      </div>

      <!-- Feature cards below diagram -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="reveal-scale stagger-4 hud-panel p-5 group">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-4 h-4 text-green-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            <h4 class="text-xs font-mono font-semibold text-white/70 uppercase tracking-wide">{{ t('enterprise.msite_feat_roam') }}</h4>
          </div>
          <p class="text-xs text-white/30 leading-relaxed">{{ t('enterprise.msite_feat_roam_desc') }}</p>
        </div>
        <div class="reveal-scale stagger-5 hud-panel p-5 group">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-4 h-4 text-cyan/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <h4 class="text-xs font-mono font-semibold text-white/70 uppercase tracking-wide">{{ t('enterprise.msite_feat_identity') }}</h4>
          </div>
          <p class="text-xs text-white/30 leading-relaxed">{{ t('enterprise.msite_feat_identity_desc') }}</p>
        </div>
        <div class="reveal-scale stagger-6 hud-panel p-5 group">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h4 class="text-xs font-mono font-semibold text-white/70 uppercase tracking-wide">{{ t('enterprise.msite_feat_offsite') }}</h4>
          </div>
          <p class="text-xs text-white/30 leading-relaxed">{{ t('enterprise.msite_feat_offsite_desc') }}</p>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- 6. Key Advantages -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('enterprise.adv_section') }}</h2>
        <h3 class="reveal stagger-1 text-3xl sm:text-4xl font-bold text-white">{{ t('enterprise.adv_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-3xl mx-auto">{{ t('enterprise.adv_desc') }}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          v-for="(a, ai) in advantages"
          :key="a.key"
          :class="['reveal-scale', `stagger-${ai + 1}`]"
          class="hud-panel hud-corners p-6 group"
        >
          <div class="flex items-center gap-3 mb-4 pb-3 border-b border-border-glow/30">
            <div class="w-9 h-9 border border-primary/30 bg-primary/5 flex items-center justify-center shrink-0 group-hover:border-primary/60 group-hover:shadow-[0_0_12px_rgba(232,97,26,0.2)] transition-all">
              <svg class="w-4.5 h-4.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" :d="a.icon" />
              </svg>
            </div>
            <h3 class="text-sm font-mono font-semibold text-white/80 uppercase tracking-wide">{{ t(`enterprise.adv_${a.key}`) }}</h3>
          </div>
          <p class="text-xs text-white/35 leading-relaxed mb-4">{{ t(`enterprise.adv_${a.key}_desc`) }}</p>
          <ul class="space-y-2">
            <li v-for="(point, pi) in tm(`enterprise.adv_${a.key}_points`)" :key="pi" class="flex gap-2.5 text-xs">
              <span class="text-cyan/50 font-mono shrink-0 mt-px">&gt;</span>
              <span class="text-white/40">{{ point }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- 6. Cost Savings -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('enterprise.cost_section') }}</h2>
        <h3 class="reveal stagger-1 text-3xl sm:text-4xl font-bold text-white">{{ t('enterprise.cost_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-3xl mx-auto">{{ t('enterprise.cost_desc') }}</p>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div
          v-for="(m, mi) in costMetrics"
          :key="m.key"
          :class="['reveal-scale', `stagger-${mi + 1}`]"
          class="hud-panel p-6 text-center group hover:border-primary/40 transition-all"
        >
          <div class="text-3xl sm:text-4xl font-mono font-bold text-primary mb-1">
            {{ m.value }}<span class="text-lg text-primary/60">{{ m.unit }}</span>
          </div>
          <div class="text-[10px] font-mono text-white/40 uppercase tracking-wider">{{ t(`enterprise.cost_${m.key}`) }}</div>
        </div>
      </div>

      <div class="reveal-scale max-w-4xl mx-auto hud-panel hud-corners p-6">
        <div class="flex items-center gap-2 mb-4 pb-3 border-b border-border-glow/30">
          <span class="text-[10px] font-mono text-cyan/40 uppercase tracking-wider">{{ t('enterprise.cost_how') }}</span>
        </div>
        <ul class="space-y-2.5">
          <li
            v-for="(point, i) in tm('enterprise.cost_points')"
            :key="i"
            class="reveal flex gap-3 text-sm"
            :class="`stagger-${i + 1}`"
          >
            <span class="text-primary/60 font-mono shrink-0">[+]</span>
            <span class="text-white/45">{{ point }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- 7. CTA -->
  <section class="py-20 relative overflow-hidden">
    <div class="absolute inset-0">
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px] animate-pulse-glow"></div>
    </div>
    <div class="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="reveal text-3xl sm:text-4xl font-bold text-white">{{ t('enterprise.cta_title') }}</h2>
      <p class="reveal stagger-1 mt-4 text-white/35 text-lg">{{ t('enterprise.cta_desc') }}</p>
      <a
        href="mailto:1.1.8.8@yamu.com"
        class="reveal stagger-2 inline-flex items-center gap-3 mt-8 px-8 py-4 bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 hover:shadow-[0_0_30px_rgba(232,97,26,0.2)] font-mono text-sm uppercase tracking-wider transition-all glow-orange shimmer-hover relative overflow-hidden"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {{ t('enterprise.cta_email') }} — 1.1.8.8@yamu.com
      </a>
    </div>
  </section>
</template>
