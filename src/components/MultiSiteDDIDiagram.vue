<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDiagramLoop } from '../composables/useDiagramLoop.js'
import { useFullscreen } from '../composables/useFullscreen.js'
import PhaseStepper from './diagram/PhaseStepper.vue'
import EventLog from './diagram/EventLog.vue'

const { t } = useI18n()

const IP = '10.1.5.42'
const DEV_ID = 'dev-a8:2e'

/* ── The journey script ──────────────────────────────────────────────
   One device, one identity, five stops. The orange tether to the
   control plane never breaks — only the local transport changes. */
const PHASES = [
  { key: 'hq', dur: 4200 },
  { key: 'branch', dur: 4600 },
  { key: 'home', dur: 4600 },
  { key: 'offsite', dur: 5800 },
  { key: 'return', dur: 4600 },
]
const STATION_OF = { hq: 'hq', branch: 'branch', home: 'home', offsite: 'wifi', return: 'hq' }

/* ── Event log ── */
const log = ref([])
let logId = 0
function pushLog(tone, text, typed = false) {
  log.value = [
    ...log.value.slice(-6),
    { id: logId++, time: new Date().toTimeString().slice(0, 8), tone, text, typed },
  ]
}

/* ── Device spring physics ── */
const dev = reactive({ x: 0, y: 0 })
let vx = 0
let vy = 0
let target = { x: 0, y: 0 }
const moving = ref(false)
const sag = ref(0)
let rafId = null
let lastT = 0
let initialized = false

const docked = ref(false)
let dockedPhase = ''
const pingKey = ref(0)
const popActive = ref(false)
const verifyKey = ref(0)
const dohState = ref('none') // none | handshake | secured
let laterFn = () => {}

function tick(now) {
  rafId = requestAnimationFrame(tick)
  const dt = Math.min(48, now - (lastT || now)) / 1000
  lastT = now
  const K = 130
  const D = 17
  vx += (K * (target.x - dev.x) - D * vx) * dt
  vy += (K * (target.y - dev.y) - D * vy) * dt
  dev.x += vx * dt
  dev.y += vy * dt
  const speed = Math.hypot(vx, vy)
  // Tether sags while the device is in flight, straightens as it settles
  sag.value += (Math.min(38, speed * 0.055) - sag.value) * Math.min(1, dt * 8)
  if (moving.value && Math.hypot(target.x - dev.x, target.y - dev.y) < 1.5 && speed < 9) {
    moving.value = false
    handleDock()
  }
}

function startRaf() {
  if (rafId == null) {
    lastT = 0
    rafId = requestAnimationFrame(tick)
  }
}
function stopRaf() {
  if (rafId != null) cancelAnimationFrame(rafId)
  rafId = null
}

function handleDock() {
  if (dockedPhase === phase.value) return
  dockedPhase = phase.value
  docked.value = true
  pingKey.value++
  verifyKey.value++
  popActive.value = true
  laterFn(() => (popActive.value = false), 500)

  const key = phase.value
  if (key === 'hq') {
    pushLog('ok', t('enterprise.msite_log_ack', { ip: IP }))
    laterFn(() => pushLog('info', t('enterprise.msite_log_policy')), 1000)
  } else if (key === 'branch') {
    pushLog('ok', t('enterprise.msite_log_same', { ip: IP }))
    laterFn(() => pushLog('info', t('enterprise.msite_log_dns_unchanged')), 1100)
  } else if (key === 'home') {
    pushLog('ok', t('enterprise.msite_log_same', { ip: IP }))
    laterFn(() => pushLog('info', t('enterprise.msite_log_split')), 1100)
  } else if (key === 'offsite') {
    pushLog('warn', t('enterprise.msite_log_untrusted'))
    laterFn(() => {
      dohState.value = 'handshake'
      pushLog('cloud', t('enterprise.msite_log_handshake'), true)
    }, 600)
    laterFn(() => {
      dohState.value = 'secured'
      pushLog('ok', t('enterprise.msite_log_encrypted'))
    }, 2100)
  } else if (key === 'return') {
    pushLog('ok', t('enterprise.msite_log_zero_enroll', { ip: IP }))
    laterFn(() => pushLog('info', t('enterprise.msite_log_audit')), 1200)
  }
}

/* ── Phase machine ── */
const ROAM_LOG = {
  branch: 'msite_log_roam_branch',
  home: 'msite_log_roam_home',
  offsite: 'msite_log_roam_offsite',
  return: 'msite_log_roam_return',
}

function onEnter(key, later) {
  laterFn = later
  docked.value = false
  dohState.value = 'none'
  if (ROAM_LOG[key]) pushLog('action', t(`enterprise.${ROAM_LOG[key]}`), key === 'offsite')
  retarget()
}

const { phaseIdx, phase, visible, reduced, setPhase, observe } = useDiagramLoop(PHASES, onEnter)

function retarget() {
  const dock = dockPts[STATION_OF[phase.value]]
  if (!dock) return
  target = { x: dock.x, y: dock.y }
  if (!initialized || reduced) {
    dev.x = target.x
    dev.y = target.y
    vx = 0
    vy = 0
    if (initialized) laterFn(handleDock, 300)
  } else if (Math.hypot(target.x - dev.x, target.y - dev.y) < 4) {
    laterFn(handleDock, 350)
  } else {
    moving.value = true
  }
}

watch(visible, (v) => (v && !reduced ? startRaf() : stopRaf()))

const stepperPhases = computed(() =>
  PHASES.map((p) => ({ key: p.key, label: t(`enterprise.msite_step_${p.key}`) })),
)

const HEADER = {
  hq: { dot: 'bg-green-500', text: 'text-green-400/70' },
  branch: { dot: 'bg-green-500', text: 'text-green-400/70' },
  home: { dot: 'bg-green-500', text: 'text-green-400/70' },
  offsite: { dot: 'bg-cyan', text: 'text-cyan/90' },
  return: { dot: 'bg-green-500', text: 'text-green-400/70' },
}

/* ── Stage geometry ── */
const rootRef = ref(null)
const stageRef = ref(null)
const cardEls = reactive({})
const box = reactive({ w: 0, h: 0 })
const rects = reactive({})
const dockPts = reactive({})
const ready = ref(false)
let ro = null

function measure() {
  const stage = stageRef.value
  if (!stage) return
  const sb = stage.getBoundingClientRect()
  if (!sb.width) return
  box.w = sb.width
  box.h = sb.height
  for (const key of ['portal', 'doh', 'hq', 'branch', 'home', 'wifi']) {
    const el = cardEls[key]
    if (!el) return
    const b = el.getBoundingClientRect()
    rects[key] = {
      l: b.left - sb.left,
      r: b.right - sb.left,
      t: b.top - sb.top,
      b: b.bottom - sb.top,
      cx: b.left - sb.left + b.width / 2,
      cy: b.top - sb.top + b.height / 2,
    }
  }
  for (const s of ['hq', 'branch', 'home', 'wifi']) {
    dockPts[s] = { x: rects[s].cx, y: rects[s].t - 56 }
  }
  ready.value = true
  const wasInit = initialized
  retarget()
  if (!wasInit) initialized = true
}

/* ── Beams (device edges computed live from spring position) ── */
const DEVICE_HALF_H = 30

function q(a, c, b) {
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${c.x.toFixed(1)} ${c.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
}

// Identity tether: device top → portal bottom, sagging while in flight
const tetherPath = computed(() => {
  if (!ready.value) return ''
  const a = { x: dev.x, y: dev.y - DEVICE_HALF_H }
  const b = { x: rects.portal.cx, y: rects.portal.b + 5 }
  const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + sag.value }
  return q(a, c, b)
})

// Local corporate link: device bottom → current station top
const localPath = computed(() => {
  if (!ready.value || phase.value === 'offsite' || !docked.value) return ''
  const st = rects[STATION_OF[phase.value]]
  const a = { x: dev.x, y: dev.y + DEVICE_HALF_H }
  const b = { x: st.cx, y: st.t - 5 }
  return q(a, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, b)
})

// DoH tunnel: device top-right → gateway bottom
const dohPath = computed(() => {
  if (!ready.value) return ''
  const a = { x: dev.x + 14, y: dev.y - DEVICE_HALF_H }
  const b = { x: rects.doh.cx, y: rects.doh.b + 5 }
  const c = { x: (a.x + b.x) / 2 + 10, y: (a.y + b.y) / 2 }
  return q(a, c, b)
})
const dohMid = computed(() => {
  if (!ready.value) return { x: 0, y: 0 }
  const a = { x: dev.x + 14, y: dev.y - DEVICE_HALF_H }
  const b = { x: rects.doh.cx, y: rects.doh.b + 5 }
  return { x: (a.x + b.x) / 2 + 5, y: (a.y + b.y) / 2 }
})

// Static topology: stations ↔ portal, portal ↔ gateway
const topologyPaths = computed(() => {
  if (!ready.value) return []
  const pb = { x: rects.portal.cx, y: rects.portal.b + 5 }
  const paths = ['hq', 'branch', 'home'].map((s) => {
    const a = { x: rects[s].cx, y: rects[s].t - 5 }
    return { key: s, d: q(a, { x: (a.x + pb.x) / 2 - (pb.y - a.y) * 0.06, y: (a.y + pb.y) / 2 }, pb), cyan: false }
  })
  const pr = { x: rects.portal.r + 5, y: rects.portal.cy }
  const gl = { x: rects.doh.l - 5, y: rects.doh.cy }
  paths.push({ key: 'p-g', d: q(pr, { x: (pr.x + gl.x) / 2, y: (pr.y + gl.y) / 2 - 8 }, gl), cyan: true })
  return paths
})

// Corporate perimeter: everything except the Wi-Fi station + DoH gateway
const perimeter = computed(() => {
  if (!ready.value) return null
  return {
    x: Math.max(6, rects.hq.l - 16),
    y: Math.max(6, rects.portal.t - 16),
    w: (rects.home.r + rects.wifi.l) / 2 - Math.max(6, rects.hq.l - 16),
    h: rects.hq.b + 16 - Math.max(6, rects.portal.t - 16),
  }
})

/* ── Cards ── */
const ICONS = {
  portal: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75',
  cloud: 'M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z',
  office: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
  home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  wifi: 'M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z',
  laptop: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25',
  lock: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
}

const topCards = computed(() => [
  { key: 'portal', title: t('enterprise.msite_portal'), sub: t('enterprise.msite_unified'), icon: ICONS.portal, pos: { left: '36%', top: '15%' }, accent: 'orange' },
  { key: 'doh', title: t('enterprise.msite_doh_cloud'), sub: '1.1.8.8 · DoH', icon: ICONS.cloud, pos: { left: 'min(85%, calc(100% - 62px))', top: '15%' }, accent: 'cyan' },
])

const stations = computed(() => [
  { key: 'hq', title: t('enterprise.msite_hq'), sub: '10.1.0.0/16', icon: ICONS.office, pos: { left: 'max(12%, 60px)', top: '82%' } },
  { key: 'branch', title: t('enterprise.msite_branch'), sub: '10.2.0.0/16', icon: ICONS.office, pos: { left: '36%', top: '82%' } },
  { key: 'home', title: t('enterprise.msite_remote'), sub: '10.3.0.0/16', icon: ICONS.home, pos: { left: '60%', top: '82%' } },
  { key: 'wifi', title: t('enterprise.msite_wifi'), sub: t('enterprise.msite_wifi_sub'), icon: ICONS.wifi, pos: { left: 'min(85%, calc(100% - 62px))', top: '82%' }, untrusted: true },
])

const activeStation = computed(() => (docked.value ? STATION_OF[phase.value] : ''))

const deviceState = computed(() => {
  if (moving.value || !docked.value) return 'roaming'
  // Off-site the device stays "roaming — lease held" until the DoH
  // handshake actually secures, then flips to encrypted
  if (phase.value === 'offsite') return dohState.value === 'secured' ? 'doh' : 'roaming'
  return 'onsite'
})
const DEVICE_CLS = {
  onsite: 'border-green-500/50 shadow-[0_0_24px_-4px_rgba(34,197,94,0.4)]',
  roaming: 'border-primary/50 shadow-[0_0_24px_-4px_rgba(232,97,26,0.35)]',
  doh: 'border-cyan/50 shadow-[0_0_24px_-4px_rgba(0,240,255,0.4)]',
}
const DEVICE_SUB = {
  onsite: { key: 'msite_onsite', cls: 'text-green-400/80' },
  roaming: { key: 'msite_roaming', cls: 'text-primary/90' },
  doh: { key: 'msite_doh_enc', cls: 'text-cyan/90' },
}

const profileRows = computed(() => [
  { label: t('enterprise.msite_profile_identity'), value: DEV_ID },
  { label: t('enterprise.msite_profile_ip'), value: IP },
  { label: t('enterprise.msite_profile_policy'), value: 'corporate-v12' },
  { label: t('enterprise.msite_profile_dns'), value: t('enterprise.msite_profile_dns_val') },
])

const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef)

onMounted(() => {
  measure()
  ro = new ResizeObserver(measure)
  if (stageRef.value) ro.observe(stageRef.value)
  Object.values(cardEls).forEach((el) => el && ro.observe(el))
  observe(rootRef.value)
})

onBeforeUnmount(() => {
  stopRaf()
  ro?.disconnect()
})
</script>

<template>
  <div ref="rootRef" class="fs-root hud-panel hud-corners relative overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 px-5 sm:px-7 py-3.5 border-b border-border-glow/30">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="w-2 h-2 rounded-full animate-pulse shrink-0 transition-colors duration-300" :class="HEADER[phase].dot"></span>
        <span class="text-xs font-mono uppercase tracking-wider truncate transition-colors duration-300" :class="HEADER[phase].text">
          {{ t(`enterprise.msite_phase_${phase}`) }}
        </span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="hidden sm:inline text-[10px] font-mono text-green-400/70 border border-green-500/20 bg-green-500/5 px-2 py-1">
          {{ t('enterprise.msite_badge') }}
        </span>
        <button
          class="w-7 h-7 border border-border-glow/50 bg-white/[0.02] text-white/40 hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center cursor-pointer"
          :aria-label="isFullscreen ? t('ui.exit_fullscreen') : t('ui.fullscreen')"
          :title="isFullscreen ? t('ui.exit_fullscreen') : t('ui.fullscreen')"
          @click="toggleFullscreen"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              :d="isFullscreen
                ? 'M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25'
                : 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15'"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Journey stepper -->
    <div class="px-5 sm:px-7 py-3 border-b border-border-glow/30">
      <PhaseStepper :phases="stepperPhases" :current="phaseIdx" @select="setPhase" />
    </div>

    <!-- Stage + identity rail -->
    <div class="fs-grow grid lg:grid-cols-[1fr_300px]">
      <div
        ref="stageRef"
        class="fs-stage relative h-[340px] sm:h-[400px] dot-grid overflow-hidden border-b lg:border-b-0 lg:border-r border-border-glow/30"
      >
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,97,26,0.03),transparent_65%)]"></div>

        <!-- Beam layer -->
        <svg
          v-if="ready && box.w"
          class="absolute inset-0 w-full h-full pointer-events-none"
          :viewBox="`0 0 ${box.w} ${box.h}`"
          fill="none"
        >
          <!-- Corporate perimeter -->
          <template v-if="perimeter">
            <rect
              :x="perimeter.x" :y="perimeter.y" :width="perimeter.w" :height="perimeter.h"
              rx="10" stroke="rgba(26,58,92,0.55)" stroke-width="1" stroke-dasharray="5 5"
            />
            <text
              :x="perimeter.x + 10" :y="perimeter.y + 15"
              font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="0.15em"
              fill="rgba(148,163,184,0.3)"
            >{{ t('enterprise.msite_perimeter').toUpperCase() }}</text>
          </template>

          <!-- Static topology -->
          <path
            v-for="p in topologyPaths"
            :key="p.key"
            :d="p.d"
            :stroke="p.cyan ? 'rgba(0,240,255,0.08)' : 'rgba(148,163,184,0.08)'"
            stroke-width="1"
            stroke-dasharray="3 5"
          />

          <!-- Dock slots -->
          <circle
            v-for="s in stations.filter((s) => !s.untrusted)"
            :key="'slot' + s.key"
            :cx="dockPts[s.key]?.x"
            :cy="dockPts[s.key]?.y"
            r="42"
            :stroke="activeStation === s.key ? 'rgba(34,197,94,0.3)' : 'rgba(148,163,184,0.1)'"
            stroke-width="1"
            stroke-dasharray="2 5"
            style="transition: stroke 0.4s"
          />

          <!-- Identity tether: never breaks -->
          <path :d="tetherPath" :stroke="moving ? 'rgba(232,97,26,0.5)' : 'rgba(232,97,26,0.3)'" stroke-width="1.1" style="transition: stroke 0.3s" />
          <g style="--dur: 3s; --delay: -1s">
            <path :d="tetherPath" pathLength="100" class="beam-comet layer-mid" stroke="#F97316" />
            <path :d="tetherPath" pathLength="100" class="beam-comet layer-core" stroke="#FFD9B0" />
          </g>

          <!-- Local corporate link -->
          <template v-if="localPath">
            <path :key="'local-' + phase" :d="localPath" stroke="rgba(34,197,94,0.35)" stroke-width="1.2" pathLength="100" class="path-draw" />
            <g style="--dur: 2.2s">
              <path :d="localPath" pathLength="100" class="beam-comet layer-glow" stroke="#22C55E" />
              <path :d="localPath" pathLength="100" class="beam-comet layer-mid" stroke="#4ADE80" />
              <path :d="localPath" pathLength="100" class="beam-comet layer-core" stroke="#C8F9D8" />
              <path :d="localPath" pathLength="100" class="beam-comet echo layer-mid" stroke="#4ADE80" />
              <path :d="localPath" pathLength="100" class="beam-comet echo layer-core" stroke="#C8F9D8" />
            </g>
          </template>

          <!-- DoH tunnel: dashed handshake → solid encrypted sleeve -->
          <template v-if="dohState !== 'none'">
            <path v-if="dohState === 'handshake'" :d="dohPath" stroke="rgba(0,240,255,0.4)" stroke-width="1" class="dash-march" />
            <template v-else>
              <path :d="dohPath" stroke="rgba(0,240,255,0.09)" stroke-width="8" stroke-linecap="round" />
              <path :key="'doh-secured'" :d="dohPath" stroke="rgba(0,240,255,0.45)" stroke-width="1.2" pathLength="100" class="path-draw" />
              <g style="--dur: 2.4s">
                <path :d="dohPath" pathLength="100" class="beam-comet layer-glow" stroke="#00B8C4" />
                <path :d="dohPath" pathLength="100" class="beam-comet layer-mid" stroke="#00F0FF" />
                <path :d="dohPath" pathLength="100" class="beam-comet layer-core" stroke="#D8FDFF" />
                <path :d="dohPath" pathLength="100" class="beam-comet echo layer-mid" stroke="#00F0FF" />
                <path :d="dohPath" pathLength="100" class="beam-comet echo layer-core" stroke="#D8FDFF" />
              </g>
              <g class="fade-rise" :transform="`translate(${dohMid.x}, ${dohMid.y})`">
                <circle r="9" fill="#050A18" stroke="rgba(0,240,255,0.5)" stroke-width="1" />
                <path
                  :d="ICONS.lock"
                  transform="translate(-5.5, -5.5) scale(0.46)"
                  stroke="#00F0FF"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="none"
                />
              </g>
            </template>
          </template>
        </svg>

        <!-- Top cards: control plane + DoH gateway -->
        <div
          v-for="n in topCards"
          :key="n.key"
          :ref="(el) => (cardEls[n.key] = el)"
          class="absolute -translate-x-1/2 -translate-y-1/2 w-[6.75rem] sm:w-[10.5rem] border bg-[#0A1424]/95 backdrop-blur-sm px-2 sm:px-2.5 py-1.5 sm:py-2 transition-all duration-500"
          :style="n.pos"
          :class="n.accent === 'orange'
            ? 'border-primary/40'
            : dohState === 'secured' ? 'border-cyan/60 shadow-[0_0_24px_-4px_rgba(0,240,255,0.4)]' : 'border-cyan/25'"
        >
          <div class="flex items-center gap-2">
            <div
              class="w-6 h-6 shrink-0 border flex items-center justify-center"
              :class="n.accent === 'orange' ? 'border-primary/40 text-primary bg-primary/10' : 'border-cyan/30 text-cyan bg-cyan/5'"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" :d="n.icon" />
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-white/80 truncate">{{ n.title }}</div>
              <div class="text-[8px] sm:text-[9px] font-mono text-white/25 truncate">{{ n.sub }}</div>
            </div>
          </div>
        </div>

        <!-- Stations -->
        <div
          v-for="s in stations"
          :key="s.key"
          :ref="(el) => (cardEls[s.key] = el)"
          class="absolute -translate-x-1/2 -translate-y-1/2 w-[6.75rem] sm:w-[10.5rem] border bg-[#0A1424]/95 backdrop-blur-sm px-2 sm:px-2.5 py-1.5 sm:py-2 transition-all duration-500"
          :style="s.pos"
          :class="activeStation === s.key
            ? s.untrusted
              ? 'border-cyan/50 border-dashed shadow-[0_0_24px_-4px_rgba(0,240,255,0.3)]'
              : 'border-green-500/50 shadow-[0_0_24px_-4px_rgba(34,197,94,0.35)]'
            : s.untrusted ? 'border-yellow-500/25 border-dashed' : 'border-border-glow/60'"
        >
          <div class="flex items-center gap-2">
            <div
              class="w-6 h-6 shrink-0 border flex items-center justify-center transition-colors duration-500"
              :class="activeStation === s.key
                ? s.untrusted
                  ? 'border-cyan/40 text-cyan bg-cyan/10'
                  : 'border-green-500/50 text-green-400 bg-green-500/10'
                : s.untrusted ? 'border-yellow-500/30 text-yellow-400/60 bg-yellow-500/5' : 'border-border-glow/60 text-white/40 bg-white/[0.03]'"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" :d="s.icon" />
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-white/80 truncate">{{ s.title }}</div>
              <div class="text-[8px] sm:text-[9px] font-mono text-white/25 truncate">{{ s.sub }}</div>
            </div>
          </div>
        </div>

        <!-- Dock sonar ring -->
        <div
          v-if="pingKey"
          :key="pingKey"
          class="dock-ping absolute w-24 h-24 rounded-full border pointer-events-none"
          :class="phase === 'offsite' ? 'border-cyan/60' : 'border-green-400/60'"
          :style="{ left: dev.x + 'px', top: dev.y + 'px' }"
        ></div>

        <!-- The hero: Employee A's device with its persistent identity chip -->
        <div
          v-if="ready"
          class="absolute -translate-x-1/2 -translate-y-1/2 z-10 w-[6.5rem] sm:w-[9.5rem] border bg-[#0A1424] px-2 sm:px-2.5 py-1.5 sm:py-2 transition-colors duration-300"
          :class="[DEVICE_CLS[deviceState], popActive ? 'dock-pop' : '']"
          :style="{ left: dev.x + 'px', top: dev.y + 'px' }"
        >
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 shrink-0 transition-colors duration-300" :class="deviceState === 'doh' ? 'text-cyan' : deviceState === 'roaming' ? 'text-primary' : 'text-green-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" :d="ICONS.laptop" />
            </svg>
            <span class="text-[9px] sm:text-[10px] font-mono font-bold text-white/85 truncate">{{ t('enterprise.msite_employee') }}</span>
          </div>
          <div class="mt-0.5 text-[8px] sm:text-[9px] font-mono truncate transition-colors duration-300" :class="DEVICE_SUB[deviceState].cls">
            {{ t(`enterprise.${DEVICE_SUB[deviceState].key}`) }}
          </div>
          <div class="mt-1.5 pt-1 border-t border-white/10 flex items-center justify-between gap-1">
            <span class="text-[8px] sm:text-[9px] font-mono font-bold text-green-400/90 tabular-nums">{{ IP }}</span>
            <span class="text-[7px] sm:text-[8px] font-mono text-white/30 truncate">{{ DEV_ID }}</span>
          </div>
        </div>
      </div>

      <!-- Identity rail: device profile (never changes) + event feed.
           Absolutely positioned on lg so its content never drives the
           row height — the stage alone defines it -->
      <div class="relative h-72 lg:h-auto">
        <div class="p-3 flex flex-col gap-3 h-full lg:h-auto lg:absolute lg:inset-0">
        <div class="border border-border-glow/40 bg-black/30 shrink-0">
          <div class="flex items-center gap-2 px-3 py-2 border-b border-border-glow/30">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500/60"></span>
            <span class="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25">{{ t('enterprise.msite_profile_title') }}</span>
          </div>
          <div class="px-3 py-2 space-y-1">
            <div v-for="row in profileRows" :key="row.label" class="flex items-center justify-between gap-2 font-mono text-[10px]">
              <span class="text-white/25">{{ row.label }}</span>
              <span class="flex items-center gap-1.5 min-w-0">
                <span class="text-white/60 truncate tabular-nums">{{ row.value }}</span>
                <span :key="verifyKey" class="fade-rise text-green-400/80 shrink-0">✓</span>
              </span>
            </div>
          </div>
        </div>
        <EventLog :entries="log" :title="t('enterprise.msite_log_title')" class="flex-1 min-h-0" />
        </div>
      </div>
    </div>

    <!-- The proof strip: constants that never change -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border-glow/30 border-t border-border-glow/30">
      <div class="bg-[#070F1F] px-4 py-3">
        <div class="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-1.5">{{ t('enterprise.msite_m_ip') }}</div>
        <div class="text-lg font-mono font-bold text-green-400 tabular-nums leading-8">{{ IP }}</div>
      </div>
      <div class="bg-[#070F1F] px-4 py-3">
        <div class="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-1.5">{{ t('enterprise.msite_m_reconnects') }}</div>
        <div class="text-lg font-mono font-bold text-green-400 tabular-nums leading-8">0</div>
      </div>
      <div class="bg-[#070F1F] px-4 py-3">
        <div class="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-1.5">{{ t('enterprise.msite_m_reconfig') }}</div>
        <div class="text-lg font-mono font-bold text-green-400 tabular-nums leading-8">0</div>
      </div>
      <div class="bg-[#070F1F] px-4 py-3">
        <div class="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-1.5">{{ t('enterprise.msite_m_policies') }}</div>
        <div class="text-lg font-mono font-bold text-white/85 tabular-nums leading-8">12/12</div>
      </div>
    </div>
  </div>
</template>
