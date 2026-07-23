<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDiagramLoop } from '../composables/useDiagramLoop.js'
import PhaseStepper from './diagram/PhaseStepper.vue'
import EventLog from './diagram/EventLog.vue'

const { t } = useI18n()

/* ── The incident script ─────────────────────────────────────────────
   One scripted loop: steady → primary fault → standby failover →
   worst-case cloud backstop → recovery. Everything on screen derives
   from `phase` + node statuses so the story never drifts. */
const PHASES = [
  { key: 'steady', dur: 5000 },
  { key: 'fault', dur: 2400 },
  { key: 'failover', dur: 5000 },
  { key: 'cloud', dur: 5200 },
  { key: 'recovery', dur: 4400 },
]

// Node health: serving | standby | sync | warn | down | restoring
const st = reactive({ primary: 'serving', standby: 'standby', cloud: 'sync' })

/* ── Event log ── */
const log = ref([])
let logId = 0
function pushLog(tone, text, typed = false) {
  log.value = [
    ...log.value.slice(-6),
    { id: logId++, time: new Date().toTimeString().slice(0, 8), tone, text, typed },
  ]
}

let serial = 2026072301

function onEnter(key, later) {
  if (key === 'steady') {
    st.primary = 'serving'
    st.standby = 'standby'
    st.cloud = 'sync'
    pushLog('ok', t('enterprise.dia_log_hc_ok', { ms: 6 }))
    later(() => pushLog('info', t('enterprise.dia_log_sync', { serial: ++serial })), 1900)
    later(() => pushLog('ok', t('enterprise.dia_log_hc_ok', { ms: 7 })), 3700)
  } else if (key === 'fault') {
    st.primary = 'warn'
    pushLog('alert', t('enterprise.dia_log_hc_fail'), true)
    later(() => {
      st.primary = 'down'
      pushLog('warn', t('enterprise.dia_log_marked'))
    }, 1100)
  } else if (key === 'failover') {
    st.primary = 'down'
    st.standby = 'serving'
    st.cloud = 'sync'
    pushLog('action', t('enterprise.dia_log_promoted'), true)
    later(() => pushLog('ok', t('enterprise.dia_log_zero')), 1500)
    later(() => pushLog('info', t('enterprise.dia_log_sync_standby', { serial: ++serial })), 3200)
  } else if (key === 'cloud') {
    st.standby = 'warn'
    pushLog('alert', t('enterprise.dia_log_standby_fail'), true)
    later(() => {
      st.standby = 'down'
      st.cloud = 'serving'
      pushLog('cloud', t('enterprise.dia_log_cloud'), true)
    }, 900)
    later(() => pushLog('ok', t('enterprise.dia_log_zero')), 3000)
  } else if (key === 'recovery') {
    st.primary = 'restoring'
    st.standby = 'restoring'
    pushLog('ok', t('enterprise.dia_log_restored'))
    later(() => {
      st.primary = 'serving'
      st.cloud = 'sync'
      pushLog('action', t('enterprise.dia_log_failback'))
    }, 1200)
    later(() => {
      st.standby = 'standby'
      pushLog('ok', t('enterprise.dia_log_resynced'))
    }, 2400)
  }
}

const { phaseIdx, phase, visible, reduced, setPhase, observe } = useDiagramLoop(PHASES, onEnter)

const stepperPhases = computed(() =>
  PHASES.map((p) => ({ key: p.key, label: t(`enterprise.dia_step_${p.key}`) })),
)

/* ── Stage geometry: HTML node cards measured into SVG beam anchors ── */
const rootRef = ref(null)
const stageRef = ref(null)
const cardEls = reactive({})
const box = reactive({ w: 0, h: 0 })
const pts = reactive({})
const ready = ref(false)
let ro = null

function measure() {
  const stage = stageRef.value
  if (!stage) return
  const sb = stage.getBoundingClientRect()
  if (!sb.width) return
  box.w = sb.width
  box.h = sb.height
  const edge = (key, side, dy = 0) => {
    const el = cardEls[key]
    if (!el) return { x: 0, y: 0 }
    const b = el.getBoundingClientRect()
    const cy = b.top - sb.top + b.height / 2 + dy
    if (side === 'left') return { x: b.left - sb.left - 5, y: cy }
    if (side === 'right') return { x: b.right - sb.left + 5, y: cy }
    const cx = b.left - sb.left + b.width / 2
    if (side === 'top') return { x: cx, y: b.top - sb.top - 5 }
    return { x: cx, y: b.bottom - sb.top + 5 }
  }
  pts.officeR = edge('office', 'right')
  pts.primaryL = edge('primary', 'left')
  pts.primaryR = edge('primary', 'right')
  pts.primaryB = edge('primary', 'bottom')
  pts.standbyL = edge('standby', 'left')
  pts.standbyR = edge('standby', 'right')
  pts.standbyT = edge('standby', 'top')
  pts.cloudL = edge('cloud', 'left')
  pts.cloudLu = edge('cloud', 'left', -12)
  pts.cloudLd = edge('cloud', 'left', 12)
  ready.value = true
}

const line = (a, b) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`
function curve(a, b, k) {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  return `M ${a.x} ${a.y} Q ${mx + (b.y - a.y) * k} ${my - (b.x - a.x) * k} ${b.x} ${b.y}`
}

/* ── Beams ── */
const BEAM_COLORS = {
  orange: { static: 'rgba(232,97,26,0.35)', glow: '#E8611A', mid: '#F97316', core: '#FFD9B0' },
  cyan: { static: 'rgba(0,240,255,0.3)', glow: '#00B8C4', mid: '#00F0FF', core: '#D8FDFF' },
  sync: { static: 'rgba(0,240,255,0.06)', glow: 'transparent', mid: 'rgba(0,240,255,0.3)', core: 'rgba(216,253,255,0.55)' },
}
const LINK_OFF = 'rgba(148,163,184,0.08)'
const LINK_BROKEN = 'rgba(239,68,68,0.3)'

function linkState(nodeStatus) {
  if (nodeStatus === 'serving') return 'flow'
  if (nodeStatus === 'warn' || nodeStatus === 'down') return 'broken'
  return 'off'
}

const beams = computed(() => {
  if (!ready.value) return []
  return [
    { id: 'o-p', d: curve(pts.officeR, pts.primaryL, 0.12), state: linkState(st.primary), c: BEAM_COLORS.orange, dur: '2.4s', delay: '-0.4s', echo: true },
    { id: 'o-s', d: curve(pts.officeR, pts.standbyL, -0.12), state: linkState(st.standby) === 'flow' ? 'flow' : st.standby === 'warn' || st.standby === 'down' ? 'broken' : 'off', c: BEAM_COLORS.orange, dur: '2.2s', delay: '0.15s', echo: true },
    { id: 'o-c', d: line(pts.officeR, pts.cloudL), state: st.cloud === 'serving' ? 'flow' : 'off', c: BEAM_COLORS.cyan, dur: '2.6s', delay: '0.15s', echo: true },
    { id: 'p-c', d: curve(pts.primaryR, pts.cloudLu, 0.16), state: st.primary === 'serving' && st.cloud === 'sync' ? 'sync' : 'off', c: BEAM_COLORS.sync, dur: '4s', delay: '-1.2s', echo: false },
    { id: 's-c', d: curve(pts.standbyR, pts.cloudLd, -0.16), state: st.standby === 'serving' ? 'sync' : 'off', c: BEAM_COLORS.sync, dur: '4s', delay: '-2s', echo: false },
  ]
})

/* Heartbeat link between the HA pair */
const heartbeat = computed(() => {
  const dead = (s) => s === 'warn' || s === 'down'
  if (dead(st.primary) && dead(st.standby)) return 'hidden'
  if (dead(st.primary) || dead(st.standby)) return 'broken'
  if (st.primary === 'restoring' || st.standby === 'restoring') return 'broken'
  return 'alive'
})
const hbPath = computed(() => (ready.value ? line(pts.primaryB, pts.standbyT) : ''))

/* ── Node cards ── */
const ICONS = {
  office: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
  server: 'M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z',
  cloud: 'M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z',
}

const nodes = computed(() => [
  { key: 'office', title: t('enterprise.dia_office'), sub: t('enterprise.dia_users'), icon: ICONS.office, pos: { left: 'max(13%, 68px)', top: '50%' } },
  { key: 'primary', title: t('enterprise.dia_primary'), sub: `${t('enterprise.dia_appliance')} A`, icon: ICONS.server, pos: { left: '50%', top: '21%' } },
  { key: 'standby', title: t('enterprise.dia_standby'), sub: `${t('enterprise.dia_appliance')} B`, icon: ICONS.server, pos: { left: '50%', top: '79%' } },
  { key: 'cloud', title: t('enterprise.dia_cloud'), sub: '1.1.8.8 · anycast', icon: ICONS.cloud, pos: { left: 'min(87%, calc(100% - 68px))', top: '50%' } },
])

function badge(key) {
  if (key === 'office') return { dot: 'bg-cyan/60', text: 'text-cyan/50', label: '10.0.0.0/24' }
  const s = st[key]
  const map = {
    serving: { dot: 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]', text: 'text-green-400/90' },
    standby: { dot: 'bg-white/25', text: 'text-white/35' },
    sync: { dot: 'bg-cyan/70', text: 'text-cyan/60' },
    warn: { dot: 'bg-yellow-400 animate-pulse', text: 'text-yellow-400/90' },
    down: { dot: 'bg-red-500', text: 'text-red-400/90' },
    restoring: { dot: 'bg-yellow-400 animate-pulse', text: 'text-yellow-300/80' },
  }
  return { ...map[s], label: t(`enterprise.dia_badge_${s}`) }
}

function cardCls(key) {
  if (key === 'office') return 'border-border-glow/60'
  const s = st[key]
  if (s === 'serving')
    return key === 'cloud'
      ? 'border-cyan/50 shadow-[0_0_28px_-4px_rgba(0,240,255,0.35)]'
      : 'border-primary/50 shadow-[0_0_28px_-4px_rgba(232,97,26,0.4)]'
  if (s === 'warn') return 'border-yellow-500/40'
  if (s === 'down') return 'border-red-500/40 card-down'
  if (s === 'restoring') return 'border-yellow-500/30'
  return 'border-border-glow/60'
}

function iconCls(key) {
  if (key === 'office') return 'border-border-glow/60 text-white/45 bg-white/[0.03]'
  const s = st[key]
  if (s === 'serving')
    return key === 'cloud'
      ? 'border-cyan/50 text-cyan bg-cyan/10'
      : 'border-primary/50 text-primary bg-primary/10'
  if (s === 'down') return 'border-red-500/30 text-red-400/70 bg-red-500/5'
  if (s === 'warn' || s === 'restoring') return 'border-yellow-500/30 text-yellow-400/70 bg-yellow-500/5'
  return 'border-border-glow/60 text-white/40 bg-white/[0.03]'
}

/* ── Header ── */
const HEADER = {
  steady: { dot: 'bg-green-500', text: 'text-green-400/70' },
  fault: { dot: 'bg-red-500', text: 'text-red-400/80' },
  failover: { dot: 'bg-primary', text: 'text-primary/90' },
  cloud: { dot: 'bg-cyan', text: 'text-cyan/90' },
  recovery: { dot: 'bg-green-500', text: 'text-green-400/70' },
}

/* ── The flat-line proof: metrics that never flinch ── */
const samples = ref(Array.from({ length: 48 }, () => 6.8 + Math.random() * 1.6))
const latency = ref(7.1)
const answered = ref(1284506)
let metricsTimer = null

function tickMetrics() {
  const base =
    st.cloud === 'serving' ? 11 : st.standby === 'serving' ? 8.5 : phase.value === 'fault' ? 8.2 : 6.8
  latency.value = Math.max(4.2, base + (Math.random() - 0.5) * 2.6)
  samples.value = [...samples.value.slice(1), latency.value]
  answered.value += 26 + Math.floor(Math.random() * 22)
}

watch(visible, (v) => {
  clearInterval(metricsTimer)
  if (v && !reduced) metricsTimer = setInterval(tickMetrics, 260)
})

const sparkPoints = computed(() =>
  samples.value
    .map((v, i) => `${(i * (120 / 47)).toFixed(1)},${(30 - (Math.min(v, 15) / 15) * 26).toFixed(1)}`)
    .join(' '),
)

onMounted(() => {
  measure()
  ro = new ResizeObserver(measure)
  if (stageRef.value) ro.observe(stageRef.value)
  Object.values(cardEls).forEach((el) => el && ro.observe(el))
  observe(rootRef.value)
})

onBeforeUnmount(() => {
  clearInterval(metricsTimer)
  ro?.disconnect()
})
</script>

<template>
  <div ref="rootRef" class="hud-panel hud-corners relative overflow-hidden">
    <!-- Header: current phase + the promise -->
    <div class="flex items-center justify-between gap-3 px-5 sm:px-7 py-3.5 border-b border-border-glow/30">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="w-2 h-2 rounded-full animate-pulse shrink-0 transition-colors duration-300" :class="HEADER[phase].dot"></span>
        <span class="text-xs font-mono uppercase tracking-wider truncate transition-colors duration-300" :class="HEADER[phase].text">
          {{ t(`enterprise.dia_phase_${phase}`) }}
        </span>
      </div>
      <span class="hidden sm:inline shrink-0 text-[10px] font-mono text-green-400/70 border border-green-500/20 bg-green-500/5 px-2 py-1">
        {{ t('enterprise.dia_zero_downtime') }}
      </span>
    </div>

    <!-- Scenario stepper: auto-plays, click to scrub -->
    <div class="px-5 sm:px-7 py-3 border-b border-border-glow/30">
      <PhaseStepper :phases="stepperPhases" :current="phaseIdx" @select="setPhase" />
    </div>

    <!-- Stage + event log -->
    <div class="grid lg:grid-cols-[1fr_300px]">
      <div
        ref="stageRef"
        class="relative h-[320px] sm:h-[380px] dot-grid overflow-hidden border-b lg:border-b-0 lg:border-r border-border-glow/30"
      >
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.04),transparent_65%)]"></div>

        <!-- Beam layer -->
        <svg
          v-if="ready && box.w"
          class="absolute inset-0 w-full h-full pointer-events-none"
          :viewBox="`0 0 ${box.w} ${box.h}`"
          fill="none"
        >
          <g v-for="b in beams" :key="b.id">
            <path
              v-if="b.state === 'off'"
              :d="b.d"
              :stroke="LINK_OFF"
              stroke-width="1"
              stroke-dasharray="3 5"
              style="transition: stroke 0.4s"
            />
            <path
              v-else-if="b.state === 'broken'"
              :d="b.d"
              :stroke="LINK_BROKEN"
              stroke-width="1"
              stroke-dasharray="3 5"
              style="transition: stroke 0.4s"
            />
            <template v-else>
              <path
                :key="`static-${b.id}-${b.state}`"
                :d="b.d"
                :stroke="b.state === 'sync' ? LINK_OFF : b.c.static"
                stroke-width="1.2"
                pathLength="100"
                :class="b.state === 'flow' ? 'path-draw' : ''"
              />
              <g :style="{ '--dur': b.dur, '--delay': b.delay }">
                <path v-if="b.state === 'flow'" :d="b.d" pathLength="100" class="beam-comet layer-glow" :stroke="b.c.glow" />
                <path :d="b.d" pathLength="100" class="beam-comet layer-mid" :stroke="b.c.mid" />
                <path :d="b.d" pathLength="100" class="beam-comet layer-core" :stroke="b.c.core" />
                <template v-if="b.echo">
                  <path :d="b.d" pathLength="100" class="beam-comet echo layer-mid" :stroke="b.c.mid" />
                  <path :d="b.d" pathLength="100" class="beam-comet echo layer-core" :stroke="b.c.core" />
                </template>
              </g>
            </template>
          </g>

          <!-- HA heartbeat -->
          <template v-if="heartbeat !== 'hidden' && hbPath">
            <path
              :d="hbPath"
              :stroke="heartbeat === 'alive' ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.35)'"
              stroke-width="1"
              stroke-dasharray="2 4"
              style="transition: stroke 0.4s"
            />
            <path
              v-if="heartbeat === 'alive'"
              :d="hbPath"
              pathLength="100"
              class="beam-comet layer-core"
              stroke="#4ADE80"
              style="--dur: 1.8s"
            />
          </template>
        </svg>

        <!-- HA pair tag -->
        <div
          class="absolute left-1/2 top-1/2 -translate-y-1/2 ml-4 transition-opacity duration-500"
          :class="heartbeat === 'alive' ? 'opacity-100' : 'opacity-0'"
        >
          <span class="text-[8px] font-mono uppercase tracking-[0.2em] text-green-400/40">{{ t('enterprise.dia_ha_pair') }}</span>
        </div>

        <!-- Node cards -->
        <div
          v-for="n in nodes"
          :key="n.key"
          :ref="(el) => (cardEls[n.key] = el)"
          class="absolute -translate-x-1/2 -translate-y-1/2 w-[7.5rem] sm:w-40 border bg-[#0A1424]/95 backdrop-blur-sm px-2.5 sm:px-3 py-2 sm:py-2.5 transition-all duration-500"
          :style="n.pos"
          :class="cardCls(n.key)"
        >
          <div class="flex items-center gap-2">
            <div
              class="w-6 h-6 sm:w-7 sm:h-7 shrink-0 border flex items-center justify-center transition-colors duration-500"
              :class="iconCls(n.key)"
            >
              <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" :d="n.icon" />
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[9px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-white/80 truncate">{{ n.title }}</div>
              <div class="text-[8px] sm:text-[9px] font-mono text-white/25 truncate">{{ n.sub }}</div>
            </div>
          </div>
          <div class="mt-1.5 sm:mt-2 pt-1.5 border-t border-white/5 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300" :class="badge(n.key).dot"></span>
            <span class="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider truncate transition-colors duration-300" :class="badge(n.key).text">
              {{ badge(n.key).label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Terminal event log -->
      <div class="p-3 h-52 lg:h-auto flex">
        <EventLog :entries="log" :title="t('enterprise.dia_log_title')" class="flex-1" />
      </div>
    </div>

    <!-- The proof strip: numbers that never flinch -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border-glow/30 border-t border-border-glow/30">
      <div class="bg-[#070F1F] px-4 py-3">
        <div class="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-1.5">{{ t('enterprise.dia_m_latency') }}</div>
        <div class="flex items-end gap-2">
          <svg viewBox="0 0 120 32" preserveAspectRatio="none" class="flex-1 h-8 min-w-0">
            <polyline :points="sparkPoints" fill="none" stroke="#00F0FF" stroke-width="1.3" stroke-opacity="0.8" />
          </svg>
          <span class="text-sm font-mono font-bold text-cyan tabular-nums shrink-0">
            {{ latency.toFixed(1) }}<span class="text-[9px] text-cyan/50">ms</span>
          </span>
        </div>
      </div>
      <div class="bg-[#070F1F] px-4 py-3">
        <div class="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-1.5">{{ t('enterprise.dia_m_answered') }}</div>
        <div class="text-lg font-mono font-bold text-white/85 tabular-nums leading-8">{{ answered.toLocaleString() }}</div>
      </div>
      <div class="bg-[#070F1F] px-4 py-3">
        <div class="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-1.5">{{ t('enterprise.dia_m_dropped') }}</div>
        <div class="text-lg font-mono font-bold text-green-400 tabular-nums leading-8">0</div>
      </div>
      <div class="bg-[#070F1F] px-4 py-3">
        <div class="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-1.5">{{ t('enterprise.dia_m_uptime') }}</div>
        <div class="text-lg font-mono font-bold text-green-400 tabular-nums leading-8">100.000%</div>
      </div>
    </div>
  </div>
</template>
