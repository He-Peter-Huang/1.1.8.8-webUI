<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()

const protocols = [
  { key: 'udp', port: '53', badge: 'UDP', color: 'primary' },
  { key: 'tcp', port: '53', badge: 'TCP', color: 'primary' },
  { key: 'dot', port: '853', badge: 'DoT', color: 'cyan' },
  { key: 'doh', port: '443', badge: 'DoH', color: 'cyan' },
  { key: 'doq', port: '853', badge: 'DoQ', color: 'cyan' },
]

const platforms = ['windows', 'macos', 'linux', 'ios', 'android', 'router']
const activePlatform = ref('windows')

const platformIcons = {
  windows: 'M3 12V6.75l6-1.32v6.48L3 12zm0 .09l6 .09v6.81l-6-1.32V12.09zM10 5.34L21 3v9h-11V5.34zM10 12.09L21 12v9l-11-1.68v-7.23z',
  macos: 'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.81-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z',
  linux: 'M12.5 2C10 2 9 4.5 9 7c0 1.5.5 2.5 1 3.5-1.5 1-3 2.5-3 4.5 0 1 .5 2 1 2.5-.5.5-1 1.5-1 2.5 0 1 1 2 3 2s3-1 4.5-1 2.5 1 4.5 1 3-1 3-2c0-1-.5-2-1-2.5.5-.5 1-1.5 1-2.5 0-2-1.5-3.5-3-4.5.5-1 1-2 1-3.5 0-2.5-1-5-3.5-5z',
  ios: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 3c.6 0 1.1.2 1.5.5s.5.8.5 1.5c0 .7-.2 1.2-.6 1.6-.4.4-.9.6-1.4.6-.6 0-1.1-.2-1.5-.5-.4-.4-.5-.9-.5-1.5s.2-1.1.6-1.5c.4-.5.9-.7 1.4-.7zm-2 5h4v8h-4v-8z',
  android: 'M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.86-.31-.16-.69-.04-.86.27l-1.87 3.24C15.06 8.33 13.58 8 12 8s-3.06.33-4.44.95L5.69 5.71c-.16-.31-.54-.43-.86-.27-.31.16-.43.54-.27.86L6.4 9.48C3.92 10.92 2.25 13.27 2 16h20c-.25-2.73-1.92-5.08-4.4-6.52zM10 13H8v-2h2v2zm6 0h-2v-2h2v2z',
  router: 'M4.93 4.93a10 10 0 0114.14 0M7.76 7.76a6 6 0 018.48 0M12 12v.01M12 16v4',
}

const copied = ref({ primary: false, secondary: false, dot: false, doh: false, doq: false })

async function copyText(text, key) {
  await navigator.clipboard.writeText(text)
  copied.value[key] = true
  setTimeout(() => (copied.value[key] = false), 2000)
}

const faqOpen = ref({})
function toggleFaq(i) {
  faqOpen.value[i] = !faqOpen.value[i]
}
</script>

<template>
  <!-- Hero -->
  <section class="pt-16 relative">
    <div class="dot-grid absolute inset-0 opacity-30"></div>
    <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <h2 class="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('clients.section_config') }}</h2>
      <h1 class="text-4xl sm:text-5xl font-bold text-white font-mono">{{ t('clients.hero_title') }}</h1>
      <p class="mt-4 text-base text-white/40 max-w-2xl mx-auto">{{ t('clients.hero_desc') }}</p>
    </div>
    <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>
  </section>

  <!-- DNS Addresses -->
  <section class="py-16 relative">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-6 text-center">{{ t('clients.section_endpoints') }}</h2>

      <div class="hud-panel hud-corners p-6">
        <!-- Header -->
        <div class="flex items-center gap-2 mb-4 pb-3 border-b border-border-glow/30">
          <span class="status-dot"></span>
          <span class="text-[10px] font-mono text-green-400/60 uppercase tracking-wider">{{ t('clients.dns_addresses') }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="{ label, value, key } in [
              { label: t('clients.primary'), value: '1.1.8.8', key: 'primary' },
              { label: t('clients.dot_hostname'), value: '1.1.8.8', key: 'dot' },
              { label: t('clients.doh_url'), value: 'https://1.1.8.8/dns-query', key: 'doh' },
              { label: t('clients.doq_url'), value: 'quic://1.1.8.8', key: 'doq' },
            ]"
            :key="key"
            class="flex items-center justify-between bg-navy-light/50 border border-border-glow/30 px-4 py-3 group hover:border-primary/30 transition-colors"
          >
            <div class="min-w-0">
              <div class="text-[10px] font-mono uppercase tracking-[0.15em] text-cyan/30">{{ label }}</div>
              <div class="text-sm font-semibold text-white/80 font-mono mt-0.5 truncate">{{ value }}</div>
            </div>
            <button
              @click="copyText(value, key)"
              class="text-[10px] font-mono px-2 py-1 border transition-all cursor-pointer shrink-0 ml-3"
              :class="copied[key]
                ? 'border-green-500/40 text-green-400 bg-green-500/10'
                : 'border-border-glow/50 text-white/30 hover:text-primary hover:border-primary/40'"
            >
              {{ copied[key] ? 'OK' : 'COPY' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- Protocols -->
  <section class="py-16 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-10 text-center">{{ t('clients.section_protocols') }}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div
          v-for="p in protocols"
          :key="p.key"
          class="hud-panel p-5 group"
        >
          <div class="flex items-center gap-2 mb-3">
            <span
              class="text-[10px] font-mono font-bold px-2 py-0.5 border"
              :class="p.color === 'cyan'
                ? 'border-cyan/30 text-cyan bg-cyan/5'
                : 'border-primary/30 text-primary bg-primary/5'"
            >{{ p.badge }}</span>
            <span class="text-[10px] font-mono text-white/20">:{{ p.port }}</span>
          </div>
          <h3 class="text-xs font-mono font-semibold text-white/70 uppercase tracking-wide mb-2">{{ t(`clients.proto_${p.key}`) }}</h3>
          <p class="text-xs text-white/30 leading-relaxed">{{ t(`clients.proto_${p.key}_desc`) }}</p>
        </div>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- Setup Guides -->
  <section class="py-16 relative">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-8">
        <h2 class="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-4">{{ t('clients.section_setup') }}</h2>
        <h3 class="text-2xl font-bold text-white">{{ t('clients.setup_title') }}</h3>
        <p class="mt-2 text-white/35 text-sm">{{ t('clients.setup_desc') }}</p>
      </div>

      <!-- Platform tabs -->
      <div class="flex flex-wrap justify-center gap-1 mb-6">
        <button
          v-for="p in platforms"
          :key="p"
          @click="activePlatform = p"
          class="px-4 py-2 text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-2"
          :class="activePlatform === p
            ? 'bg-primary/10 text-primary border-primary/40'
            : 'text-white/30 border-border-glow/30 hover:border-border-glow hover:text-white/50'"
        >
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path :d="platformIcons[p]" />
          </svg>
          {{ t(`clients.${p}`) }}
        </button>
      </div>

      <!-- Steps as terminal -->
      <div class="hud-panel hud-corners p-6">
        <!-- Terminal header -->
        <div class="flex items-center gap-2 mb-4 pb-3 border-b border-border-glow/30">
          <div class="flex gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-red-500/60"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-green-500/60"></span>
          </div>
          <span class="text-[10px] font-mono text-white/20 ml-2">setup_{{ activePlatform }}.sh</span>
        </div>

        <ol class="space-y-3">
          <li
            v-for="(step, i) in tm(`clients.${activePlatform}_steps`)"
            :key="i"
            class="flex gap-3 group"
          >
            <span class="flex-none w-6 h-6 border border-primary/30 bg-primary/5 text-primary text-[10px] font-mono font-bold flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              {{ String(i + 1).padStart(2, '0') }}
            </span>
            <span class="text-sm text-white/50 font-mono pt-0.5 group-hover:text-white/70 transition-colors">{{ step }}</span>
          </li>
        </ol>
      </div>
    </div>
  </section>

  <div class="h-px bg-gradient-to-r from-transparent via-border-glow to-transparent"></div>

  <!-- FAQ -->
  <section class="py-16 relative">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan/40 mb-10 text-center">{{ t('clients.section_faq') }}</h2>
      <div class="space-y-2">
        <div
          v-for="(item, i) in tm('clients.faq')"
          :key="i"
          class="hud-panel overflow-hidden"
        >
          <button
            @click="toggleFaq(i)"
            class="w-full text-left px-5 py-4 flex items-center justify-between cursor-pointer group"
          >
            <span class="text-sm font-mono text-white/60 pr-4 group-hover:text-white/80 transition-colors">
              <span class="text-primary/50 mr-2">Q{{ String(i + 1).padStart(2, '0') }}</span>
              {{ item.q }}
            </span>
            <svg
              class="w-4 h-4 text-white/20 shrink-0 transition-transform"
              :class="{ 'rotate-180 !text-primary/50': faqOpen[i] }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="faqOpen[i]" class="px-5 pb-4 text-sm text-white/35 leading-relaxed border-t border-border-glow/20 pt-3 ml-10">
            {{ item.a }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
