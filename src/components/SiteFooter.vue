<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="relative border-t border-border-glow/50 bg-navy/80 backdrop-blur-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand -->
        <div class="md:col-span-2">
          <div class="flex items-center gap-2 mb-4">
            <div class="status-dot"></div>
            <span class="text-xl font-bold text-white font-mono">1.1.8.8</span>
          </div>
          <p class="text-xs font-mono text-white/30 mb-1">
            {{ $t('footer.powered') }}
            <span class="text-primary">{{ $t('footer.yamu') }}</span>
          </p>
          <p class="text-xs font-mono text-white/20">{{ $t('footer.tagline') }}</p>
        </div>

        <!-- Product links -->
        <div>
          <h4 class="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan/40 mb-4">{{ $t('footer.product') }}</h4>
          <ul class="space-y-2">
            <li>
              <RouterLink to="/clients" class="text-xs font-mono text-white/40 hover:text-primary transition-colors flex items-center gap-2">
                <span class="text-primary/40">&gt;</span> {{ $t('nav.clients') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/isps" class="text-xs font-mono text-white/40 hover:text-primary transition-colors flex items-center gap-2">
                <span class="text-primary/40">&gt;</span> {{ $t('nav.isps') }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Company links -->
        <div>
          <h4 class="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan/40 mb-4">{{ $t('footer.company') }}</h4>
          <ul class="space-y-2">
            <li>
              <a href="mailto:1.1.8.8@yamu.com" class="text-xs font-mono text-white/40 hover:text-primary transition-colors flex items-center gap-2">
                <span class="text-primary/40">&gt;</span> {{ $t('footer.contact') }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-12 pt-6 border-t border-border-glow/30 flex items-center justify-between">
        <p class="text-[10px] font-mono text-white/20">
          &copy; {{ new Date().getFullYear() }} Yamu Networks. {{ $t('footer.rights') }}
        </p>
        <div class="text-[10px] font-mono text-white/15">
          {{ $t('footer.sys_online') }}
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-green-500 ml-1 animate-pulse-glow"></span>
        </div>
      </div>
    </div>
  </footer>
</template>
