<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Layout: 900x500 viewBox
const W = 900, H = 500

// Sites
const sites = [
  { id: 'hq',     x: 160, y: 130, label: 'enterprise.msite_hq',     subnet: '10.1.0.0/16' },
  { id: 'branch', x: 160, y: 370, label: 'enterprise.msite_branch', subnet: '10.2.0.0/16' },
  { id: 'remote', x: 500, y: 370, label: 'enterprise.msite_remote', subnet: 'VPN 10.3.0.0/16' },
]

// Central portal
const portal = { x: 500, y: 130, label: 'enterprise.msite_portal' }

// Cloud / DoH endpoint for off-site
const cloudDoh = { x: 780, y: 250, label: 'enterprise.msite_doh_cloud' }

// Employee device
const device = { x: 0, y: 0 } // animated position
let deviceX = 160, deviceY = 250
let deviceTargetX = 160, deviceTargetY = 250

const canvasRef = ref(null)
const phase = ref('at_hq')
// Phases: at_hq -> roam_to_branch -> at_branch -> roam_to_remote -> at_remote -> offsite -> at_hq

let rafId = null
let lastTime = 0
let stopped = false
let phaseTimer = null

// Particles
let pool = []
let nextId = 0
let lastSpawn = 0

const SPAWN_MS = 200
const SPEED = 0.0005

function bezX(ox, cx, tx, t) { const u=1-t; return u*u*ox+2*u*t*cx+t*t*tx }
function bezY(oy, cy, ty, t) { const u=1-t; return u*u*oy+2*u*t*cy+t*t*ty }

function createP(from, to, color, speed) {
  const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2 + (Math.random()-0.5) * 20
  return { id: nextId++, ox: from.x+(Math.random()-0.5)*4, oy: from.y+(Math.random()-0.5)*4, cx: mx, cy: my, tx: to.x, ty: to.y, progress: 0, speed: speed*(0.85+Math.random()*0.3), color }
}

function currentSite() {
  const p = phase.value
  if (p === 'at_hq') return sites[0]
  if (p === 'at_branch' || p === 'roam_to_branch') return sites[1]
  if (p === 'at_remote' || p === 'roam_to_remote') return sites[2]
  return null // offsite
}

function spawnBatch() {
  if (pool.length > 60) return

  // Sync lines: all sites ↔ portal
  for (const site of sites) {
    if (Math.random() > 0.6) {
      pool.push(createP(site, portal, 'dim', SPEED * 0.4))
    }
    if (Math.random() > 0.8) {
      pool.push(createP(portal, site, 'dim', SPEED * 0.4))
    }
  }

  const cs = currentSite()
  const dPos = { x: deviceX, y: deviceY }

  if (cs) {
    // Device DNS queries → current site appliance (green)
    if (Math.random() > 0.3) {
      pool.push(createP(dPos, cs, 'green', SPEED))
    }
    // Response back
    if (Math.random() > 0.5) {
      pool.push(createP(cs, dPos, 'green', SPEED * 0.8))
    }
  } else {
    // Offsite: device → cloud via DoH (cyan, with shield icon implied)
    if (Math.random() > 0.2) {
      pool.push(createP(dPos, cloudDoh, 'cyan', SPEED))
    }
    if (Math.random() > 0.5) {
      pool.push(createP(cloudDoh, dPos, 'cyan', SPEED * 0.8))
    }
  }
}

const colorMap = {
  green: 'rgba(34,197,94,',
  cyan: 'rgba(0,240,255,',
  orange: 'rgba(232,97,26,',
  dim: 'rgba(255,255,255,',
}

function drawFrame(now) {
  rafId = requestAnimationFrame(drawFrame)
  const dt = lastTime ? now - lastTime : 16
  lastTime = now

  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  const cw = rect.width * dpr, ch = rect.height * dpr
  if (canvas.width !== Math.round(cw) || canvas.height !== Math.round(ch)) {
    canvas.width = Math.round(cw); canvas.height = Math.round(ch)
  }
  const sx = cw / W, sy = ch / H
  ctx.clearRect(0, 0, cw, ch)

  // Animate device movement
  const moveSpeed = 0.003
  deviceX += (deviceTargetX - deviceX) * moveSpeed * dt
  deviceY += (deviceTargetY - deviceY) * moveSpeed * dt

  // Spawn
  if (now - lastSpawn > SPAWN_MS) { spawnBatch(); lastSpawn = now }

  // Draw connection lines (sites ↔ portal)
  ctx.lineWidth = 0.8 * sx
  ctx.setLineDash([3 * sx, 4 * sx])
  ctx.strokeStyle = 'rgba(26,58,92,0.25)'
  for (const site of sites) {
    ctx.beginPath()
    ctx.moveTo(site.x * sx, site.y * sy)
    ctx.lineTo(portal.x * sx, portal.y * sy)
    ctx.stroke()
  }
  // Portal ↔ cloud
  ctx.strokeStyle = 'rgba(0,240,255,0.15)'
  ctx.beginPath()
  ctx.moveTo(portal.x * sx, portal.y * sy)
  ctx.lineTo(cloudDoh.x * sx, cloudDoh.y * sy)
  ctx.stroke()
  ctx.setLineDash([])

  // Active connection from device
  const cs = currentSite()
  if (cs) {
    ctx.strokeStyle = 'rgba(34,197,94,0.2)'
    ctx.lineWidth = 1.5 * sx
    ctx.beginPath()
    ctx.moveTo(deviceX * sx, deviceY * sy)
    ctx.lineTo(cs.x * sx, cs.y * sy)
    ctx.stroke()
  } else {
    // Offsite → cloud DoH
    ctx.strokeStyle = 'rgba(0,240,255,0.2)'
    ctx.lineWidth = 1.5 * sx
    ctx.beginPath()
    ctx.moveTo(deviceX * sx, deviceY * sy)
    ctx.lineTo(cloudDoh.x * sx, cloudDoh.y * sy)
    ctx.stroke()
  }

  // Particles — fade out near device to avoid overlap
  const devSx = deviceX * sx, devSy = deviceY * sy
  const fadeRadius = 35 * sx // exclusion zone around device
  let alive = 0
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i]
    p.progress += p.speed * dt
    if (p.progress >= 1) continue
    const px = bezX(p.ox, p.cx, p.tx, p.progress) * sx
    const py = bezY(p.oy, p.cy, p.ty, p.progress) * sy

    // Fade near device
    const ddx = px - devSx, ddy = py - devSy
    const distDev = Math.sqrt(ddx * ddx + ddy * ddy)
    const devFade = distDev < fadeRadius ? distDev / fadeRadius : 1

    const baseAlpha = p.color === 'dim' ? 0.1 - p.progress * 0.06 : 0.75 - p.progress * 0.4
    const alpha = baseAlpha * devFade
    if (alpha < 0.01) { pool[alive++] = p; continue }

    const r = p.color === 'dim' ? 1.5 * sx : 2.5 * sx
    ctx.fillStyle = colorMap[p.color] + alpha + ')'
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill()
    if (p.color !== 'dim') {
      ctx.fillStyle = colorMap[p.color] + (alpha * 0.25) + ')'
      ctx.beginPath(); ctx.arc(px, py, r * 2.5, 0, Math.PI * 2); ctx.fill()
    }
    pool[alive++] = p
  }
  pool.length = alive

  // Draw site nodes
  for (const site of sites) {
    const nx = site.x * sx, ny = site.y * sy
    const isActive = cs && cs.id === site.id

    // Pulse
    const pulsePhase = ((now / 2500 + sites.indexOf(site) * 0.3) % 1)
    const pulseR = (12 + pulsePhase * 14) * sx
    const pulseAlpha = (isActive ? 0.5 : 0.2) * (1 - pulsePhase)
    ctx.strokeStyle = isActive ? `rgba(34,197,94,${pulseAlpha})` : `rgba(26,58,92,${pulseAlpha})`
    ctx.lineWidth = 1 * sx
    ctx.beginPath(); ctx.arc(nx, ny, pulseR, 0, Math.PI * 2); ctx.stroke()

    // Outer
    ctx.fillStyle = isActive ? 'rgba(34,197,94,0.08)' : 'rgba(26,58,92,0.08)'
    ctx.strokeStyle = isActive ? 'rgba(34,197,94,0.4)' : 'rgba(26,58,92,0.3)'
    ctx.lineWidth = 1 * sx
    ctx.beginPath(); ctx.arc(nx, ny, 14 * sx, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

    // Inner
    ctx.fillStyle = isActive ? '#22C55E' : 'rgba(26,58,92,0.5)'
    ctx.beginPath(); ctx.arc(nx, ny, 6 * sx, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.beginPath(); ctx.arc(nx, ny, 2.5 * sx, 0, Math.PI * 2); ctx.fill()
  }

  // Portal node
  {
    const nx = portal.x * sx, ny = portal.y * sy
    ctx.fillStyle = 'rgba(232,97,26,0.08)'
    ctx.strokeStyle = 'rgba(232,97,26,0.35)'
    ctx.lineWidth = 1 * sx
    ctx.beginPath(); ctx.arc(nx, ny, 14 * sx, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#E8611A'
    ctx.beginPath(); ctx.arc(nx, ny, 6 * sx, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.beginPath(); ctx.arc(nx, ny, 2.5 * sx, 0, Math.PI * 2); ctx.fill()
  }

  // Cloud DoH node
  {
    const nx = cloudDoh.x * sx, ny = cloudDoh.y * sy
    const isActive = phase.value === 'offsite'
    const pulsePhase = ((now / 2500) % 1)
    if (isActive) {
      const pulseR = (12 + pulsePhase * 16) * sx
      ctx.strokeStyle = `rgba(0,240,255,${0.5 * (1 - pulsePhase)})`
      ctx.lineWidth = 1 * sx
      ctx.beginPath(); ctx.arc(nx, ny, pulseR, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.fillStyle = isActive ? 'rgba(0,240,255,0.1)' : 'rgba(0,240,255,0.05)'
    ctx.strokeStyle = isActive ? 'rgba(0,240,255,0.5)' : 'rgba(0,240,255,0.2)'
    ctx.lineWidth = 1 * sx
    ctx.beginPath(); ctx.arc(nx, ny, 14 * sx, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = isActive ? '#00F0FF' : 'rgba(0,240,255,0.4)'
    ctx.beginPath(); ctx.arc(nx, ny, 6 * sx, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.beginPath(); ctx.arc(nx, ny, 2.5 * sx, 0, Math.PI * 2); ctx.fill()
  }

  // Device (laptop icon) — drawn last so it sits on top of particles
  {
    const dx = deviceX * sx, dy = deviceY * sy
    const w = 20 * sx, h = 14 * sy

    // Clear zone behind device + labels so particles don't show through
    // Covers: "Employee A" label above, device body, IP/DoH label below
    const clearW = 70 * sx, clearH = 55 * sy
    const grad = ctx.createRadialGradient(dx, dy, 0, dx, dy, clearW * 0.6)
    grad.addColorStop(0, 'rgba(5,10,24,0.95)')
    grad.addColorStop(0.6, 'rgba(5,10,24,0.7)')
    grad.addColorStop(1, 'rgba(5,10,24,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(dx, dy, clearW * 0.55, clearH * 0.55, 0, 0, Math.PI * 2)
    ctx.fill()

    // "Employee A" label above device
    ctx.font = `bold ${8 * sx}px 'JetBrains Mono', monospace`
    ctx.fillStyle = phase.value === 'offsite' ? 'rgba(0,240,255,0.7)' : 'rgba(255,255,255,0.6)'
    ctx.textAlign = 'center'
    ctx.fillText(t('enterprise.msite_employee'), dx, dy - h/2 - 8*sy)

    // Body
    ctx.fillStyle = 'rgba(5,10,24,0.9)'
    ctx.strokeStyle = phase.value === 'offsite' ? 'rgba(0,240,255,0.5)' : 'rgba(34,197,94,0.5)'
    ctx.lineWidth = 1.2 * sx
    ctx.beginPath()
    ctx.roundRect(dx - w/2, dy - h/2, w, h, 2 * sx)
    ctx.fill(); ctx.stroke()

    // Screen
    ctx.fillStyle = phase.value === 'offsite' ? 'rgba(0,240,255,0.15)' : 'rgba(34,197,94,0.15)'
    ctx.beginPath()
    ctx.roundRect(dx - w/2 + 2*sx, dy - h/2 + 2*sy, w - 4*sx, h - 5*sy, 1*sx)
    ctx.fill()

    // Base
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 0.8 * sx
    ctx.beginPath()
    ctx.moveTo(dx - 6*sx, dy + h/2 + 2*sy)
    ctx.lineTo(dx + 6*sx, dy + h/2 + 2*sy)
    ctx.stroke()

    // IP badge
    const ip = phase.value === 'offsite' ? 'DoH' : '10.1.5.42'
    ctx.font = `${7 * sx}px 'JetBrains Mono', monospace`
    ctx.fillStyle = phase.value === 'offsite' ? 'rgba(0,240,255,0.8)' : 'rgba(34,197,94,0.8)'
    ctx.textAlign = 'center'
    ctx.fillText(ip, dx, dy + h/2 + 13*sy)

    // Lock icon when offsite
    if (phase.value === 'offsite') {
      const lx = dx + w/2 + 6*sx, ly = dy - 4*sy
      ctx.strokeStyle = 'rgba(0,240,255,0.6)'
      ctx.lineWidth = 1.2 * sx
      ctx.beginPath()
      ctx.roundRect(lx - 4*sx, ly, 8*sx, 6*sy, 1*sx)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(lx, ly, 3*sx, Math.PI, 0)
      ctx.stroke()
    }
  }
}

async function delay(ms) {
  return new Promise(resolve => { phaseTimer = setTimeout(resolve, ms) })
}

async function runCycle() {
  if (stopped) return

  // At HQ
  phase.value = 'at_hq'
  deviceTargetX = 160; deviceTargetY = 250
  await delay(4000)
  if (stopped) return

  // Roam to branch — same IP
  phase.value = 'roam_to_branch'
  deviceTargetX = 160; deviceTargetY = 310
  await delay(2000)
  if (stopped) return

  phase.value = 'at_branch'
  deviceTargetX = 160; deviceTargetY = 310
  await delay(3500)
  if (stopped) return

  // Roam to remote office
  phase.value = 'roam_to_remote'
  deviceTargetX = 500; deviceTargetY = 310
  await delay(2000)
  if (stopped) return

  phase.value = 'at_remote'
  deviceTargetX = 500; deviceTargetY = 310
  await delay(3500)
  if (stopped) return

  // Go offsite — DoH with cert
  phase.value = 'offsite'
  deviceTargetX = 700; deviceTargetY = 400
  await delay(5000)
  if (stopped) return

  // Return to HQ
  deviceTargetX = 160; deviceTargetY = 250
  await delay(2000)
  if (stopped) return

  runCycle()
}

onMounted(() => {
  deviceX = 160; deviceY = 250
  rafId = requestAnimationFrame(drawFrame)
  delay(2000).then(() => { if (!stopped) runCycle() })
})

onUnmounted(() => {
  stopped = true
  if (rafId) cancelAnimationFrame(rafId)
  if (phaseTimer) clearTimeout(phaseTimer)
  pool.length = 0
})
</script>

<template>
  <div class="hud-panel hud-corners p-5 sm:p-8 relative overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-border-glow/30">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full animate-pulse" :class="{
          'bg-green-500': phase === 'at_hq' || phase === 'at_branch' || phase === 'at_remote',
          'bg-primary': phase === 'roam_to_branch' || phase === 'roam_to_remote',
          'bg-cyan': phase === 'offsite',
        }"></span>
        <span class="text-xs font-mono uppercase tracking-wider" :class="{
          'text-green-400/60': phase === 'at_hq' || phase === 'at_branch' || phase === 'at_remote',
          'text-primary/60': phase === 'roam_to_branch' || phase === 'roam_to_remote',
          'text-cyan/60': phase === 'offsite',
        }">
          {{ phase === 'at_hq' ? t('enterprise.msite_phase_hq')
           : phase === 'at_branch' ? t('enterprise.msite_phase_branch')
           : phase === 'at_remote' ? t('enterprise.msite_phase_remote')
           : phase === 'offsite' ? t('enterprise.msite_phase_offsite')
           : t('enterprise.msite_phase_roaming') }}
        </span>
      </div>
      <span class="text-xs font-mono" :class="phase === 'offsite' ? 'text-cyan/60' : 'text-green-400/60'">
        {{ phase === 'offsite' ? t('enterprise.msite_doh_active') : t('enterprise.msite_same_ip') }}
      </span>
    </div>

    <!-- Canvas -->
    <div class="relative w-full" style="aspect-ratio: 900/500;">
      <canvas ref="canvasRef" class="absolute inset-0 w-full h-full" />

      <!-- Site labels -->
      <div class="absolute text-center" style="left: 17.8%; top: 16%; transform: translate(-50%, -50%);">
        <div class="text-[10px] font-mono text-white/50 uppercase tracking-wider">{{ t('enterprise.msite_hq') }}</div>
        <div class="text-[9px] font-mono text-white/20 mt-0.5">10.1.0.0/16</div>
      </div>
      <div class="absolute text-center" style="left: 17.8%; top: 82%; transform: translate(-50%, -50%);">
        <div class="text-[10px] font-mono text-white/50 uppercase tracking-wider">{{ t('enterprise.msite_branch') }}</div>
        <div class="text-[9px] font-mono text-white/20 mt-0.5">10.2.0.0/16</div>
      </div>
      <div class="absolute text-center" style="left: 55.6%; top: 82%; transform: translate(-50%, -50%);">
        <div class="text-[10px] font-mono text-white/50 uppercase tracking-wider">{{ t('enterprise.msite_remote') }}</div>
        <div class="text-[9px] font-mono text-white/20 mt-0.5">VPN 10.3.0.0/16</div>
      </div>
      <div class="absolute text-center" style="left: 55.6%; top: 16%; transform: translate(-50%, -50%);">
        <div class="text-[10px] font-mono text-primary/60 uppercase tracking-wider">{{ t('enterprise.msite_portal') }}</div>
        <div class="text-[9px] font-mono text-white/20 mt-0.5">{{ t('enterprise.msite_unified') }}</div>
      </div>
      <div class="absolute text-center" style="left: 86.7%; top: 40%; transform: translate(-50%, -50%);">
        <div class="text-[10px] font-mono text-cyan/50 uppercase tracking-wider">{{ t('enterprise.msite_doh_cloud') }}</div>
        <div class="text-[9px] font-mono text-white/20 mt-0.5">1.1.8.8 DoH</div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border-glow/30 text-[10px] font-mono">
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        <span class="text-white/30">{{ t('enterprise.msite_leg_onsite') }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
        <span class="text-white/30">{{ t('enterprise.msite_leg_roaming') }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-cyan"></span>
        <span class="text-white/30">{{ t('enterprise.msite_leg_offsite') }}</span>
      </div>
      <div class="flex items-center gap-1.5 ml-2">
        <svg class="w-3 h-3 text-cyan/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        <span class="text-white/30">{{ t('enterprise.msite_leg_doh_cert') }}</span>
      </div>
    </div>
  </div>
</template>
