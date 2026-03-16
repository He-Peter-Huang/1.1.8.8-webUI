<script setup>
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()

const reasons = [
  { key: 'control', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { key: 'performance', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { key: 'cost', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
  { key: 'security', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { key: 'alternative', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { key: 'support', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
]

const tiers = [
  { key: 'tier1', labelKey: 'isps.tier_label_1', accent: 'border-border-glow hover:border-cyan/30', tagColor: 'border-cyan/30 text-cyan bg-cyan/5' },
  { key: 'tier2', labelKey: 'isps.tier_label_2', accent: 'border-primary/40 hover:border-primary/60', tagColor: 'border-primary/30 text-primary bg-primary/5' },
  { key: 'tier3', labelKey: 'isps.tier_label_3', accent: 'border-primary hover:border-primary glow-orange', tagColor: 'border-primary text-white bg-primary/20' },
]
</script>

<template>
  <!-- Hero -->
  <section class="pt-16 relative overflow-hidden">
    <div class="absolute inset-0">
      <div class="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-primary/6 rounded-full blur-[120px]"></div>
      <div class="dot-grid absolute inset-0 opacity-30"></div>
    </div>

    <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <h2 class="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('isps.section_program') }}</h2>
      <h1 class="text-4xl sm:text-5xl font-bold text-white">{{ t('isps.hero_title') }}</h1>
      <p class="mt-4 text-xl font-semibold text-primary font-mono">{{ t('isps.hero_subtitle') }}</p>
      <p class="mt-4 text-base text-white/40 max-w-2xl mx-auto">{{ t('isps.hero_desc') }}</p>
      <a
        href="mailto:1.1.8.8@yamu.com"
        class="inline-flex items-center gap-2 mt-8 px-8 py-3 bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 font-mono text-sm uppercase tracking-wider transition-all"
      >
        <span class="text-primary/50">&gt;</span>
        {{ t('isps.contact_us') }}
      </a>
    </div>
    <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>
  </section>

  <!-- Why Partner -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4 text-center">{{ t('isps.section_value') }}</h2>
      <h3 class="text-3xl sm:text-4xl font-bold text-white text-center mb-14">{{ t('isps.why_title') }}</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="r in reasons"
          :key="r.key"
          class="hud-panel p-6 group"
        >
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 border border-primary/30 bg-primary/5 flex items-center justify-center shrink-0 group-hover:border-primary/60 transition-colors">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" :d="r.icon" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-mono font-semibold text-white/80 uppercase tracking-wide mb-2">{{ t(`isps.why_${r.key}`) }}</h3>
              <p class="text-xs text-white/30 leading-relaxed">{{ t(`isps.why_${r.key}_desc`) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- Deployment Tiers -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('isps.section_deploy') }}</h2>
        <h3 class="text-3xl sm:text-4xl font-bold text-white">{{ t('isps.deploy_title') }}</h3>
        <p class="mt-4 text-white/35 max-w-2xl mx-auto">{{ t('isps.deploy_desc') }}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          v-for="(tier, ti) in tiers"
          :key="tier.key"
          class="hud-panel border-2 flex flex-col transition-all"
          :class="tier.accent"
        >
          <!-- Header -->
          <div class="p-6 pb-4">
            <div class="flex items-center justify-between mb-4">
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border" :class="tier.tagColor">
                {{ t(tier.labelKey) }}
              </span>
              <span class="text-[10px] font-mono text-white/15">{{ t(`isps.${tier.key}_subtitle`) }}</span>
            </div>
            <h3 class="text-xl font-bold text-white font-mono">{{ t(`isps.${tier.key}_title`) }}</h3>
            <p class="text-xs font-mono text-white/30 mt-2">{{ t(`isps.${tier.key}_for`) }}</p>
            <div class="mt-3 h-px bg-gradient-to-r from-border-glow/50 to-transparent"></div>
          </div>

          <!-- Features -->
          <div class="px-6 pb-6 flex-1">
            <ul class="space-y-2.5">
              <li
                v-for="(feat, i) in tm(`isps.${tier.key}_features`)"
                :key="i"
                class="flex gap-3 text-xs"
              >
                <span class="text-primary/60 font-mono shrink-0 mt-px">[+]</span>
                <span class="text-white/40">{{ feat }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- Architecture -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('isps.section_arch') }}</h2>
        <h3 class="text-3xl sm:text-4xl font-bold text-white">{{ t('isps.arch_title') }}</h3>
        <p class="mt-4 text-white/35 max-w-3xl mx-auto">{{ t('isps.arch_desc') }}</p>
      </div>

      <!-- Comparison -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <!-- Old architecture -->
        <div class="hud-panel p-6 border-red-500/10">
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-border-glow/20">
            <span class="w-2 h-2 rounded-full bg-red-500/60"></span>
            <span class="text-[10px] font-mono text-red-400/60 uppercase tracking-wider">{{ t('isps.arch_legacy_label') }}</span>
            <span class="text-[10px] font-mono text-white/15 ml-auto">{{ t('isps.arch_old') }}</span>
          </div>
          <p class="text-xs text-white/30 mb-5">{{ t('isps.arch_old_desc') }}</p>

          <!-- Visual: uniform grid of identical devices -->
          <div class="flex justify-center">
            <div class="grid grid-cols-6 gap-1.5">
              <div v-for="i in 12" :key="i" class="w-8 h-8 border border-red-500/15 bg-red-500/5 flex items-center justify-center">
                <div class="grid grid-cols-2 gap-px">
                  <span class="w-1 h-1 bg-red-400/30"></span>
                  <span class="w-1 h-1 bg-yellow-400/30"></span>
                  <span class="w-1 h-1 bg-blue-400/30"></span>
                  <span class="w-1 h-1 bg-green-400/30"></span>
                </div>
              </div>
            </div>
          </div>
          <p class="text-[10px] font-mono text-white/20 text-center mt-3">{{ t('isps.arch_legacy_devices') }}</p>
        </div>

        <!-- New architecture -->
        <div class="hud-panel p-6 border-primary/20 glow-orange">
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-border-glow/20">
            <span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]"></span>
            <span class="text-[10px] font-mono text-green-400/60 uppercase tracking-wider">{{ t('isps.arch_hyperdns_label') }}</span>
            <span class="text-[10px] font-mono text-white/15 ml-auto">{{ t('isps.arch_new') }}</span>
          </div>
          <p class="text-xs text-white/30 mb-5">{{ t('isps.arch_new_desc') }}</p>

          <!-- Visual: specialized device groups -->
          <div class="flex justify-center gap-4">
            <div class="text-center">
              <div class="flex gap-1.5 mb-2">
                <div v-for="i in 2" :key="'h'+i" class="w-8 h-8 border border-primary/30 bg-primary/10 flex items-center justify-center">
                  <span class="w-2 h-2 bg-primary/60 rounded-full"></span>
                </div>
              </div>
              <span class="text-[9px] font-mono text-primary/60 uppercase">{{ t('isps.arch_hot') }}</span>
            </div>
            <div class="text-center">
              <div class="grid grid-cols-2 gap-1.5 mb-2">
                <div v-for="i in 4" :key="'n'+i" class="w-8 h-8 border border-cyan/20 bg-cyan/5 flex items-center justify-center">
                  <span class="w-2 h-2 bg-cyan/40 rounded-full"></span>
                </div>
              </div>
              <span class="text-[9px] font-mono text-cyan/60 uppercase">{{ t('isps.arch_normal') }}</span>
            </div>
            <div class="text-center">
              <div class="flex gap-1.5 mb-2">
                <div class="w-8 h-8 border border-green-500/20 bg-green-500/5 flex items-center justify-center">
                  <span class="w-2 h-2 bg-green-500/40 rounded-full"></span>
                </div>
              </div>
              <span class="text-[9px] font-mono text-green-500/60 uppercase">{{ t('isps.arch_backup') }}</span>
            </div>
          </div>
          <p class="text-[10px] font-mono text-primary/40 text-center mt-3">{{ t('isps.arch_hyper_devices') }}</p>
        </div>
      </div>

      <!-- Benefits -->
      <div class="max-w-3xl mx-auto hud-panel hud-corners p-6">
        <div class="flex items-center gap-2 mb-4 pb-3 border-b border-border-glow/30">
          <span class="text-[10px] font-mono text-cyan/40 uppercase tracking-wider">{{ t('isps.arch_advantages') }}</span>
        </div>
        <ul class="space-y-2.5">
          <li
            v-for="(b, i) in tm('isps.arch_benefits')"
            :key="i"
            class="flex gap-3 text-sm"
          >
            <span class="text-primary/60 font-mono shrink-0">[+]</span>
            <span class="text-white/45">{{ b }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- CTA -->
  <section class="py-20 relative">
    <div class="absolute inset-0">
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px]"></div>
    </div>
    <div class="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="text-3xl sm:text-4xl font-bold text-white">{{ t('isps.cta_title') }}</h2>
      <p class="mt-4 text-white/35 text-lg">{{ t('isps.cta_desc') }}</p>
      <a
        href="mailto:1.1.8.8@yamu.com"
        class="inline-flex items-center gap-3 mt-8 px-8 py-4 bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 font-mono text-sm uppercase tracking-wider transition-all glow-orange"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {{ t('isps.cta_email') }} — 1.1.8.8@yamu.com
      </a>
    </div>
  </section>
</template>
