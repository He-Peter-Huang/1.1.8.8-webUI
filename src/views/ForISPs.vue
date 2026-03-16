<script setup>
import { useI18n } from 'vue-i18n'
import { useReveal } from '../composables/useReveal.js'

const { t, tm } = useI18n()
useReveal()

const vsMetrics = ['latency', 'control', 'accuracy', 'resilience', 'cost']

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
  <!-- 1. Hero -->
  <section class="pt-16 relative overflow-hidden">
    <div class="absolute inset-0">
      <div class="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-primary/6 rounded-full blur-[120px]"></div>
      <div class="dot-grid absolute inset-0 opacity-30"></div>
    </div>

    <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('isps.section_program') }}</h2>
      <h1 class="reveal stagger-1 text-4xl sm:text-5xl font-bold text-white">{{ t('isps.hero_title') }}</h1>
      <p class="reveal stagger-2 mt-4 text-xl font-semibold text-primary font-mono">{{ t('isps.hero_subtitle') }}</p>
      <p class="reveal stagger-3 mt-4 text-base text-white/40 max-w-2xl mx-auto">{{ t('isps.hero_desc') }}</p>
      <a
        href="mailto:1.1.8.8@yamu.com"
        class="reveal stagger-4 inline-flex items-center gap-2 mt-8 px-8 py-3 bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 font-mono text-sm uppercase tracking-wider transition-all shimmer-hover relative overflow-hidden"
      >
        <span class="text-primary/50">&gt;</span>
        {{ t('isps.contact_us') }}
      </a>
    </div>
    <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>
  </section>

  <!-- 2. Case Studies — establish the PROBLEM -->
  <section class="py-20 relative">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-red-400/60 mb-4">{{ t('isps.cases_section') }}</h2>
        <h3 class="reveal stagger-1 text-3xl sm:text-4xl font-bold text-white">{{ t('isps.cases_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-3xl mx-auto">{{ t('isps.cases_desc') }}</p>
      </div>

      <!-- Incident Timeline — center-aligned alternating -->
      <div class="relative mb-12">
        <!-- Center vertical line (hidden on mobile) -->
        <div class="hidden md:block absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500/50 via-red-500/20 to-transparent"></div>
        <!-- Mobile left line -->
        <div class="md:hidden absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500/50 via-red-500/20 to-transparent"></div>

        <div class="space-y-6 md:space-y-10">
          <div
            v-for="i in 5"
            :key="i"
            class="relative group"
          >
            <!-- Desktop: alternating layout -->
            <div class="hidden md:grid md:grid-cols-[1fr_40px_1fr] md:gap-0 items-start">
              <!-- Left side (content on odd, date on even) -->
              <div :class="i % 2 === 1 ? 'pr-6' : 'pr-6 flex flex-col items-end'">
                <template v-if="i % 2 === 1">
                  <div :class="['reveal-left', `stagger-${i}`]" class="hud-panel p-5 border-red-500/10 group-hover:border-red-500/40 transition-all group-hover:shadow-[0_0_20px_rgba(239,68,68,0.06)] shimmer-hover relative overflow-hidden">
                    <div class="flex items-center gap-3 mb-3">
                      <span class="text-[10px] font-mono font-bold text-red-400/80 tracking-widest">{{ t(`isps.case_${i}_date`) }}</span>
                      <span class="h-px flex-1 bg-red-500/10"></span>
                      <span class="text-[9px] font-mono text-red-400/50 px-1.5 py-0.5 border border-red-500/20 bg-red-500/5">{{ t(`isps.case_${i}_cause`) }}</span>
                    </div>
                    <h4 class="text-sm font-mono font-bold text-white/85 mb-2 glitch-hover">{{ t(`isps.case_${i}_name`) }}</h4>
                    <p class="text-xs text-white/35 leading-relaxed mb-3">{{ t(`isps.case_${i}_detail`) }}</p>
                    <div class="flex gap-3 pt-2 border-t border-white/5">
                      <div class="flex items-center gap-1.5">
                        <svg class="w-3 h-3 text-red-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span class="text-[10px] font-mono text-red-400/60">{{ t(`isps.case_${i}_duration`) }}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <svg class="w-3 h-3 text-red-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span class="text-[10px] font-mono text-red-400/60">{{ t(`isps.case_${i}_impact`) }}</span>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <span :class="['reveal-left', `stagger-${i}`]" class="text-[10px] font-mono text-red-400/50 tracking-widest mt-2">{{ t(`isps.case_${i}_date`) }}</span>
                </template>
              </div>

              <!-- Center dot -->
              <div class="flex justify-center">
                <div class="relative w-4 h-4 mt-2">
                  <span class="absolute inset-0 rounded-full border-2 border-red-500/50 bg-[#050A18] group-hover:border-red-400 group-hover:bg-red-500/20 transition-all"></span>
                  <span class="absolute inset-0 rounded-full bg-red-500/15 group-hover:animate-ping"></span>
                </div>
              </div>

              <!-- Right side (date on odd, content on even) -->
              <div class="pl-6">
                <template v-if="i % 2 === 1">
                  <span :class="['reveal-right', `stagger-${i}`]" class="text-[10px] font-mono text-red-400/50 tracking-widest mt-2 block">{{ t(`isps.case_${i}_date`) }}</span>
                </template>
                <template v-else>
                  <div :class="['reveal-right', `stagger-${i}`]" class="hud-panel p-5 border-red-500/10 group-hover:border-red-500/40 transition-all group-hover:shadow-[0_0_20px_rgba(239,68,68,0.06)] shimmer-hover relative overflow-hidden">
                    <div class="flex items-center gap-3 mb-3">
                      <span class="text-[10px] font-mono font-bold text-red-400/80 tracking-widest">{{ t(`isps.case_${i}_date`) }}</span>
                      <span class="h-px flex-1 bg-red-500/10"></span>
                      <span class="text-[9px] font-mono text-red-400/50 px-1.5 py-0.5 border border-red-500/20 bg-red-500/5">{{ t(`isps.case_${i}_cause`) }}</span>
                    </div>
                    <h4 class="text-sm font-mono font-bold text-white/85 mb-2 glitch-hover">{{ t(`isps.case_${i}_name`) }}</h4>
                    <p class="text-xs text-white/35 leading-relaxed mb-3">{{ t(`isps.case_${i}_detail`) }}</p>
                    <div class="flex gap-3 pt-2 border-t border-white/5">
                      <div class="flex items-center gap-1.5">
                        <svg class="w-3 h-3 text-red-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span class="text-[10px] font-mono text-red-400/60">{{ t(`isps.case_${i}_duration`) }}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <svg class="w-3 h-3 text-red-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span class="text-[10px] font-mono text-red-400/60">{{ t(`isps.case_${i}_impact`) }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Mobile: left-aligned layout -->
            <div class="md:hidden relative flex gap-4">
              <div class="relative shrink-0 w-7 flex justify-center">
                <div class="relative w-3.5 h-3.5 mt-1.5">
                  <span class="absolute inset-0 rounded-full border-2 border-red-500/50 bg-[#050A18]"></span>
                </div>
              </div>
              <div :class="['reveal', `stagger-${i}`]" class="hud-panel p-4 flex-1 border-red-500/10">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-[10px] font-mono font-bold text-red-400/80 tracking-widest">{{ t(`isps.case_${i}_date`) }}</span>
                  <span class="text-[9px] font-mono text-red-400/50 px-1.5 py-0.5 border border-red-500/20 bg-red-500/5">{{ t(`isps.case_${i}_cause`) }}</span>
                </div>
                <h4 class="text-sm font-mono font-bold text-white/85 mb-1.5">{{ t(`isps.case_${i}_name`) }}</h4>
                <p class="text-xs text-white/35 leading-relaxed mb-2">{{ t(`isps.case_${i}_detail`) }}</p>
                <div class="flex gap-3 pt-2 border-t border-white/5">
                  <div class="flex items-center gap-1.5">
                    <svg class="w-3 h-3 text-red-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span class="text-[10px] font-mono text-red-400/60">{{ t(`isps.case_${i}_duration`) }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <svg class="w-3 h-3 text-red-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span class="text-[10px] font-mono text-red-400/60">{{ t(`isps.case_${i}_impact`) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- How Hybrid DNS Prevents This -->
      <div class="reveal-scale hud-panel p-8 border-green-500/20">
        <div class="flex items-center gap-2 mb-5">
          <span class="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse"></span>
          <h4 class="text-sm font-mono font-semibold text-green-400/80 uppercase tracking-wider">{{ t('isps.cases_hybrid_title') }}</h4>
        </div>
        <ul class="space-y-3">
          <li
            v-for="(point, idx) in tm('isps.cases_hybrid_points')"
            :key="idx"
            class="reveal flex items-start gap-3"
            :class="`stagger-${idx + 1}`"
          >
            <span class="text-green-500/60 font-mono shrink-0 mt-px text-xs">[+]</span>
            <span class="text-sm text-white/45 leading-relaxed">{{ point }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- 3. Why Partner — now they feel the pain -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4 text-center">{{ t('isps.section_value') }}</h2>
      <h3 class="reveal stagger-1 text-3xl sm:text-4xl font-bold text-white text-center mb-14">{{ t('isps.why_title') }}</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(r, ri) in reasons"
          :key="r.key"
          :class="['reveal-scale', `stagger-${ri + 1}`]"
          class="hud-panel p-6 group shimmer-hover relative overflow-hidden"
        >
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 border border-primary/30 bg-primary/5 flex items-center justify-center shrink-0 group-hover:border-primary/60 group-hover:shadow-[0_0_12px_rgba(232,97,26,0.2)] transition-all">
              <svg class="w-5 h-5 text-primary group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
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

  <!-- 4. Hybrid DNS Model — the solution -->
  <section class="py-20 relative overflow-hidden">
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('isps.collab_section') }}</h2>
        <h3 class="reveal stagger-1 text-3xl sm:text-4xl font-bold text-white">{{ t('isps.collab_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-3xl mx-auto">{{ t('isps.collab_desc') }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <!-- We bring -->
        <div class="reveal-left stagger-1 hud-panel hud-corners p-6">
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-border-glow/30">
            <span class="w-2 h-2 rounded-full bg-primary shadow-[0_0_4px_rgba(232,97,26,0.5)] animate-pulse-glow"></span>
            <span class="text-[10px] font-mono text-primary/70 uppercase tracking-wider">{{ t('isps.collab_we_title') }}</span>
          </div>
          <ul class="space-y-2.5">
            <li
              v-for="(item, i) in tm('isps.collab_we')"
              :key="i"
              class="flex gap-3 text-xs"
            >
              <span class="text-primary/60 font-mono shrink-0 mt-px">[+]</span>
              <span class="text-white/40">{{ item }}</span>
            </li>
          </ul>
        </div>

        <!-- You bring -->
        <div class="reveal-right stagger-2 hud-panel hud-corners p-6">
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-border-glow/30">
            <span class="w-2 h-2 rounded-full bg-cyan shadow-[0_0_4px_rgba(0,240,255,0.5)] animate-pulse-glow"></span>
            <span class="text-[10px] font-mono text-cyan/70 uppercase tracking-wider">{{ t('isps.collab_you_title') }}</span>
          </div>
          <ul class="space-y-2.5">
            <li
              v-for="(item, i) in tm('isps.collab_you')"
              :key="i"
              class="flex gap-3 text-xs"
            >
              <span class="text-cyan/60 font-mono shrink-0 mt-px">[+]</span>
              <span class="text-white/40">{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Result + Failover -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        <div class="reveal-left stagger-3 hud-panel p-6 border-green-500/20">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]"></span>
            <span class="text-[10px] font-mono text-green-400/70 uppercase tracking-wider">{{ t('isps.collab_result_title') }}</span>
          </div>
          <p class="text-sm text-white/45 leading-relaxed">{{ t('isps.collab_result') }}</p>
        </div>
        <div class="reveal-right stagger-4 hud-panel p-6 border-cyan/20">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-4 h-4 text-cyan/70 animate-[spin_8s_linear_infinite]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992" />
            </svg>
            <span class="text-[10px] font-mono text-cyan/70 uppercase tracking-wider">{{ t('isps.collab_failover_title') }}</span>
          </div>
          <p class="text-sm text-white/45 leading-relaxed">{{ t('isps.collab_failover') }}</p>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- 5. vs Remote DNS — prove it's better -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('isps.vs_section') }}</h2>
        <h3 class="reveal stagger-1 text-3xl sm:text-4xl font-bold text-white">{{ t('isps.vs_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-3xl mx-auto">{{ t('isps.vs_desc') }}</p>
      </div>

      <!-- Comparison table -->
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="reveal grid grid-cols-[1fr_1fr_1fr] gap-px mb-px">
          <div></div>
          <div class="bg-red-500/5 border border-red-500/15 px-4 py-3 text-center">
            <span class="text-[10px] font-mono text-red-400/60 uppercase tracking-wider">{{ t('isps.vs_them_label') }}</span>
          </div>
          <div class="bg-green-500/5 border border-green-500/20 px-4 py-3 text-center">
            <span class="text-[10px] font-mono text-green-400/70 uppercase tracking-wider">{{ t('isps.vs_us_label') }}</span>
          </div>
        </div>

        <!-- Rows -->
        <div
          v-for="(m, mi) in vsMetrics"
          :key="m"
          :class="['reveal', `stagger-${mi + 1}`]"
          class="grid grid-cols-[1fr_1fr_1fr] gap-px mb-px"
        >
          <div class="hud-panel px-4 py-4 flex items-center">
            <span class="text-xs font-mono font-semibold text-white/60 uppercase tracking-wide">{{ t(`isps.vs_metric_${m}`) }}</span>
          </div>
          <div class="bg-panel/50 border border-border-glow/20 px-4 py-4 flex items-center">
            <div class="flex gap-2 items-start">
              <span class="text-red-400/50 text-xs mt-0.5 shrink-0">&#x2717;</span>
              <span class="text-xs text-white/30 leading-relaxed">{{ t(`isps.vs_metric_${m}_them`) }}</span>
            </div>
          </div>
          <div class="bg-green-500/[0.03] border border-green-500/10 px-4 py-4 flex items-center">
            <div class="flex gap-2 items-start">
              <span class="text-green-400/70 text-xs mt-0.5 shrink-0">&#x2713;</span>
              <span class="text-xs text-white/45 leading-relaxed">{{ t(`isps.vs_metric_${m}_us`) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- 6. Architecture — technical deep-dive -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('isps.section_arch') }}</h2>
        <h3 class="reveal stagger-1 text-3xl sm:text-4xl font-bold text-white">{{ t('isps.arch_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-3xl mx-auto">{{ t('isps.arch_desc') }}</p>
      </div>

      <!-- Comparison -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <!-- Old architecture -->
        <div class="reveal-left stagger-1 hud-panel p-6 border-red-500/10">
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-border-glow/20">
            <span class="w-2 h-2 rounded-full bg-red-500/60"></span>
            <span class="text-[10px] font-mono text-red-400/60 uppercase tracking-wider">{{ t('isps.arch_legacy_label') }}</span>
            <span class="text-[10px] font-mono text-white/15 ml-auto">{{ t('isps.arch_old') }}</span>
          </div>
          <p class="text-xs text-white/30 mb-5">{{ t('isps.arch_old_desc') }}</p>

          <div class="flex justify-center">
            <div class="grid grid-cols-6 gap-1.5">
              <div v-for="i in 12" :key="i" class="w-8 h-8 border border-red-500/15 bg-red-500/5 flex items-center justify-center animate-[pulse-glow_3s_ease-in-out_infinite]" :style="`animation-delay: ${i * 0.15}s`">
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
        <div class="reveal-right stagger-2 hud-panel p-6 border-primary/20 glow-orange">
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-border-glow/20">
            <span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)] animate-pulse"></span>
            <span class="text-[10px] font-mono text-green-400/60 uppercase tracking-wider">{{ t('isps.arch_hyperdns_label') }}</span>
            <span class="text-[10px] font-mono text-white/15 ml-auto">{{ t('isps.arch_new') }}</span>
          </div>
          <p class="text-xs text-white/30 mb-5">{{ t('isps.arch_new_desc') }}</p>

          <div class="flex justify-center gap-4">
            <div class="text-center">
              <div class="flex gap-1.5 mb-2">
                <div v-for="i in 2" :key="'h'+i" class="w-8 h-8 border border-primary/30 bg-primary/10 flex items-center justify-center animate-float" :style="`animation-delay: ${i * 0.3}s`">
                  <span class="w-2 h-2 bg-primary/60 rounded-full"></span>
                </div>
              </div>
              <span class="text-[9px] font-mono text-primary/60 uppercase">{{ t('isps.arch_hot') }}</span>
            </div>
            <div class="text-center">
              <div class="grid grid-cols-2 gap-1.5 mb-2">
                <div v-for="i in 4" :key="'n'+i" class="w-8 h-8 border border-cyan/20 bg-cyan/5 flex items-center justify-center animate-float" :style="`animation-delay: ${i * 0.2}s`">
                  <span class="w-2 h-2 bg-cyan/40 rounded-full"></span>
                </div>
              </div>
              <span class="text-[9px] font-mono text-cyan/60 uppercase">{{ t('isps.arch_normal') }}</span>
            </div>
            <div class="text-center">
              <div class="flex gap-1.5 mb-2">
                <div class="w-8 h-8 border border-green-500/20 bg-green-500/5 flex items-center justify-center animate-float" style="animation-delay: 0.5s">
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
      <div class="reveal-scale max-w-3xl mx-auto hud-panel hud-corners p-6">
        <div class="flex items-center gap-2 mb-4 pb-3 border-b border-border-glow/30">
          <span class="text-[10px] font-mono text-cyan/40 uppercase tracking-wider">{{ t('isps.arch_advantages') }}</span>
        </div>
        <ul class="space-y-2.5">
          <li
            v-for="(b, i) in tm('isps.arch_benefits')"
            :key="i"
            class="reveal flex gap-3 text-sm"
            :class="`stagger-${i + 1}`"
          >
            <span class="text-primary/60 font-mono shrink-0">[+]</span>
            <span class="text-white/45">{{ b }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- 7. Deployment Tiers — practical sizing -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('isps.section_deploy') }}</h2>
        <h3 class="reveal stagger-1 text-3xl sm:text-4xl font-bold text-white">{{ t('isps.deploy_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-2xl mx-auto">{{ t('isps.deploy_desc') }}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          v-for="(tier, ti) in tiers"
          :key="tier.key"
          :class="['reveal-scale', `stagger-${ti + 1}`, tier.accent]"
          class="hud-panel border-2 flex flex-col transition-all shimmer-hover relative overflow-hidden"
        >
          <div class="flex flex-col h-full">
            <div class="p-6 pb-4">
              <div class="flex items-center justify-between mb-4">
                <span class="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border" :class="tier.tagColor">
                  {{ t(tier.labelKey) }}
                </span>
                <span class="text-[10px] font-mono text-white/15">{{ t(`isps.${tier.key}_subtitle`) }}</span>
              </div>
              <h3 class="text-xl font-bold text-white font-mono">{{ t(`isps.${tier.key}_title`) }}</h3>
              <p class="text-xs font-mono text-white/30 mt-2">{{ t(`isps.${tier.key}_for`) }}</p>
              <div class="mt-3 h-px bg-gradient-to-r from-border-glow/50 to-transparent animate-data-flow"></div>
            </div>

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
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- 8. 4 Steps — how to get started -->
  <section class="py-20 relative">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-14">
        <h2 class="reveal text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('isps.steps_section') }}</h2>
        <h3 class="reveal stagger-1 text-3xl sm:text-4xl font-bold text-white">{{ t('isps.steps_title') }}</h3>
        <p class="reveal stagger-2 mt-4 text-white/35 max-w-2xl mx-auto">{{ t('isps.steps_desc') }}</p>
      </div>

      <div class="relative space-y-4">
        <!-- Vertical line -->
        <div class="absolute left-[23px] top-6 bottom-6 w-px bg-gradient-to-b from-primary/40 via-cyan/30 to-green-500/40 hidden sm:block"></div>

        <div
          v-for="(step, i) in 4"
          :key="i"
          :class="['reveal', `stagger-${i + 1}`]"
          class="relative flex gap-5 group"
        >
          <div class="relative z-10 w-[47px] h-[47px] border-2 flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
            :class="[
              i === 0 ? 'border-primary/50 bg-[#1a0f08] text-primary group-hover:shadow-[0_0_16px_rgba(232,97,26,0.3)]' : '',
              i === 1 ? 'border-cyan/40 bg-[#081415] text-cyan group-hover:shadow-[0_0_16px_rgba(0,240,255,0.3)]' : '',
              i === 2 ? 'border-primary/50 bg-[#1a0f08] text-primary group-hover:shadow-[0_0_16px_rgba(232,97,26,0.3)]' : '',
              i === 3 ? 'border-green-500/40 bg-[#0a1510] text-green-400 group-hover:shadow-[0_0_16px_rgba(34,197,94,0.3)]' : '',
            ]"
          >
            <span class="text-lg font-mono font-bold">{{ String(i + 1).padStart(2, '0') }}</span>
          </div>

          <div class="hud-panel p-5 flex-1 group-hover:border-border-glow/60 transition-colors shimmer-hover relative overflow-hidden">
            <h4 class="text-sm font-mono font-semibold text-white/80 uppercase tracking-wide mb-2">{{ t(`isps.step_${i + 1}_title`) }}</h4>
            <p class="text-xs text-white/35 leading-relaxed">{{ t(`isps.step_${i + 1}_desc`) }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- 9. CTA — close -->
  <section class="py-20 relative overflow-hidden">
    <div class="absolute inset-0">
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px] animate-pulse-glow"></div>
    </div>
    <div class="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="reveal text-3xl sm:text-4xl font-bold text-white">{{ t('isps.cta_title') }}</h2>
      <p class="reveal stagger-1 mt-4 text-white/35 text-lg">{{ t('isps.cta_desc') }}</p>
      <a
        href="mailto:1.1.8.8@yamu.com"
        class="reveal stagger-2 inline-flex items-center gap-3 mt-8 px-8 py-4 bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 hover:shadow-[0_0_30px_rgba(232,97,26,0.2)] font-mono text-sm uppercase tracking-wider transition-all glow-orange shimmer-hover relative overflow-hidden"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {{ t('isps.cta_email') }} — 1.1.8.8@yamu.com
      </a>
    </div>
  </section>
</template>
