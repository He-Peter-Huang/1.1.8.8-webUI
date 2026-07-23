<script setup>
import { reactive, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  entries: { type: Array, required: true }, // [{ id, time, text, tone, typed }]
  title: { type: String, default: 'event log' },
})

const TONES = {
  ok: { glyph: '✓', cls: 'text-green-400/80' },
  info: { glyph: '·', cls: 'text-white/35' },
  warn: { glyph: '!', cls: 'text-yellow-400/85' },
  alert: { glyph: '✗', cls: 'text-red-400/90' },
  action: { glyph: '→', cls: 'text-primary' },
  cloud: { glyph: '→', cls: 'text-cyan' },
}

// Per-entry typewriter: id -> visible character count
const shown = reactive({})
const timers = {}

watch(
  () => props.entries,
  (list) => {
    const ids = new Set(list.map((e) => e.id))
    for (const key of Object.keys(shown)) {
      if (!ids.has(Number(key))) {
        clearTimeout(timers[key])
        delete shown[key]
        delete timers[key]
      }
    }
    for (const e of list) {
      if (shown[e.id] !== undefined) continue
      if (e.typed) {
        shown[e.id] = 0
        const tick = () => {
          shown[e.id] = Math.min(e.text.length, shown[e.id] + 1)
          if (shown[e.id] < e.text.length) timers[e.id] = setTimeout(tick, 16)
        }
        tick()
      } else {
        shown[e.id] = e.text.length
      }
    }
  },
  { immediate: true, deep: true },
)

onBeforeUnmount(() => Object.values(timers).forEach(clearTimeout))
</script>

<template>
  <div class="flex flex-col min-h-0 border border-border-glow/40 bg-black/30">
    <div class="flex items-center gap-2 px-3 py-2 border-b border-border-glow/30 shrink-0">
      <span class="w-1.5 h-1.5 rounded-full bg-red-500/30"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-yellow-500/30"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-green-500/30"></span>
      <span class="ml-1 text-[9px] font-mono uppercase tracking-[0.2em] text-white/25">{{ title }}</span>
    </div>
    <div
      class="flex-1 min-h-0 overflow-hidden px-3 py-2.5 flex flex-col justify-end gap-1.5 font-mono text-[10px] leading-relaxed [mask-image:linear-gradient(to_bottom,transparent,black_28%)]"
    >
      <div v-for="e in entries" :key="e.id" class="flex gap-2 log-line items-baseline">
        <span class="text-white/20 tabular-nums shrink-0">{{ e.time }}</span>
        <span class="shrink-0" :class="TONES[e.tone].cls">{{ TONES[e.tone].glyph }}</span>
        <span :class="TONES[e.tone].cls">
          {{ e.text.slice(0, shown[e.id] ?? e.text.length) }}<span
            v-if="(shown[e.id] ?? e.text.length) < e.text.length"
            class="log-caret"
          ></span>
        </span>
      </div>
    </div>
  </div>
</template>
