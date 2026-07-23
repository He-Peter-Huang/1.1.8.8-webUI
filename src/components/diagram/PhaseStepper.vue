<script setup>
defineProps({
  phases: { type: Array, required: true }, // [{ key, label }]
  current: { type: Number, required: true },
})
defineEmits(['select'])
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5" role="tablist">
    <template v-for="(p, i) in phases" :key="p.key">
      <span v-if="i > 0" class="hidden md:block w-3 h-px" :class="i <= current ? 'bg-primary/40' : 'bg-border-glow/50'"></span>
      <button
        role="tab"
        :aria-selected="i === current"
        class="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 border font-mono text-[10px] uppercase tracking-wider transition-all duration-300 cursor-pointer"
        :class="i === current
          ? 'border-primary/60 bg-primary/10 text-primary'
          : 'border-border-glow/40 bg-white/[0.02] text-white/30 hover:text-white/60 hover:border-border-glow'"
        @click="$emit('select', i)"
      >
        <span :class="i === current ? 'text-primary/60' : 'text-white/20'">{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="hidden sm:inline">{{ p.label }}</span>
      </button>
    </template>
  </div>
</template>
