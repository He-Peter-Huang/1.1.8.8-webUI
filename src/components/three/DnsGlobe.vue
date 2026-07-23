<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import landData from 'world-atlas/land-110m.json'

/**
 * Interactive particle Earth with live DNS query arcs.
 * Land dots are sampled from real world-atlas geometry; arcs launch from
 * random land points to the nearest of the 6 HyperDNS PoPs.
 */

const container = ref(null)
const booted = ref(false)

// PoP locations (must match useNodeStats order)
const POPS = [
  { key: 'los_angeles', lat: 34.05, lon: -118.24 },
  { key: 'new_jersey', lat: 40.73, lon: -74.17 },
  { key: 'frankfurt', lat: 50.11, lon: 8.68 },
  { key: 'singapore', lat: 1.29, lon: 103.85 },
  { key: 'tokyo', lat: 35.69, lon: 139.69 },
  { key: 'shanghai', lat: 31.23, lon: 121.47 },
]

const R = 1
const ARC_SEGS = 64
const NUM_ARCS = 18
const ORANGE = new THREE.Color('#FF8A3D')
const CYAN = new THREE.Color('#4DF6FF')

let renderer, scene, camera, globeGroup
let raf = 0
let clock = null
let visible = true
let reducedMotion = false
let resizeObserver = null
let intersectionObserver = null
let disposables = []
let arcs = []
let rings = []
let landDots = []
let popVecs = []

// drag state
let dragging = false
let lastX = 0
let lastY = 0
let velY = 0
let tiltX = 0.18
let pointerTarget = { x: 0, y: 0 }

function latLonToVec3(lat, lon, r) {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lon + 180) * Math.PI) / 180
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

/* Rasterize world-atlas land onto an offscreen canvas so we can test
   lat/lon points for land in O(1). */
function buildLandMask() {
  const W = 1024
  const H = 512
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#fff'

  const land = feature(landData, landData.objects.land)
  const geoms =
    land.type === 'FeatureCollection'
      ? land.features.map((f) => f.geometry)
      : [land.geometry]

  for (const g of geoms) {
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
    for (const poly of polys) {
      ctx.beginPath()
      for (const ring of poly) {
        for (let i = 0; i < ring.length; i++) {
          const x = ((ring[i][0] + 180) / 360) * W
          const y = ((90 - ring[i][1]) / 180) * H
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
      }
      ctx.fill()
    }
  }

  const data = ctx.getImageData(0, 0, W, H).data
  return (lon, lat) => {
    const x = Math.min(W - 1, Math.max(0, Math.floor(((lon + 180) / 360) * W)))
    const y = Math.min(H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * H)))
    return data[(y * W + x) * 4] > 128
  }
}

function makeCircleTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, inner)
  grad.addColorStop(0.4, inner)
  grad.addColorStop(1, outer)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  disposables.push(tex)
  return tex
}

function makeGlowTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.25, 'rgba(255,255,255,0.5)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  disposables.push(tex)
  return tex
}

function track(obj) {
  if (obj.geometry) disposables.push(obj.geometry)
  if (obj.material) disposables.push(obj.material)
  return obj
}

function buildGlobe() {
  const isLand = buildLandMask()
  const dotTexture = makeCircleTexture()

  // --- land particles, uniform density across latitudes ---
  const positions = []
  const colors = []
  const base = new THREE.Color('#5FA8CE')
  const bright = new THREE.Color('#9FE8FF')
  const step = 1.35
  for (let lat = -80; lat <= 85; lat += step) {
    const cosLat = Math.cos((lat * Math.PI) / 180)
    const n = Math.max(1, Math.floor((360 / step) * cosLat * 0.8))
    const jitter = Math.random() * 360
    for (let i = 0; i < n; i++) {
      const lon = ((i / n) * 360 + jitter) % 360 - 180
      if (!isLand(lon, lat)) continue
      const v = latLonToVec3(lat, lon, R)
      positions.push(v.x, v.y, v.z)
      landDots.push(v)
      const c = Math.random() < 0.12 ? bright : base
      colors.push(c.r, c.g, c.b)
    }
  }

  const dotGeo = new THREE.BufferGeometry()
  dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  dotGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  const dotMat = new THREE.PointsMaterial({
    size: 0.021,
    map: dotTexture,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  globeGroup.add(track(new THREE.Points(dotGeo, dotMat)))

  // --- planet body: hides far-side dots, subtle fresnel rim gives it depth ---
  const occluder = track(
    new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.985, 48, 48),
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec3 vNormal;
          void main() {
            float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.2);
            vec3 body = mix(vec3(0.027, 0.055, 0.115), vec3(0.0, 0.32, 0.42), rim * 0.85);
            gl_FragColor = vec4(body, 1.0);
          }`,
      }),
    ),
  )
  globeGroup.add(occluder)

  // --- atmosphere (fresnel back-side shell) ---
  const atmosphere = track(
    new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.16, 48, 48),
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.5);
            vec3 glow = mix(vec3(0.0, 0.55, 0.75), vec3(0.0, 0.94, 1.0), intensity);
            gl_FragColor = vec4(glow, 1.0) * intensity * 0.85;
          }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    ),
  )
  scene.add(atmosphere)

  // --- PoP markers: glow sprite + pulsing tangent ring ---
  const glowTex = makeGlowTexture()
  popVecs = POPS.map((p) => latLonToVec3(p.lat, p.lon, R))
  popVecs.forEach((v, i) => {
    const sprite = track(
      new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color: ORANGE,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    )
    sprite.scale.setScalar(0.07)
    sprite.position.copy(v).multiplyScalar(1.005)
    globeGroup.add(sprite)

    const ring = track(
      new THREE.Mesh(
        new THREE.RingGeometry(0.02, 0.0235, 32),
        new THREE.MeshBasicMaterial({
          color: ORANGE,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    )
    ring.position.copy(v).multiplyScalar(1.002)
    ring.lookAt(v.clone().multiplyScalar(2))
    ring.userData.phase = (i / POPS.length) * 2.4
    globeGroup.add(ring)
    rings.push(ring)
  })

  // --- star field ---
  const starPos = []
  for (let i = 0; i < 350; i++) {
    const v = new THREE.Vector3()
      .randomDirection()
      .multiplyScalar(5 + Math.random() * 4)
    starPos.push(v.x, v.y, v.z)
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3))
  const stars = track(
    new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        size: 0.012,
        map: dotTexture,
        color: 0x9fd8e8,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ),
  )
  scene.add(stars)

  // --- query arc pool (fixed buffers, reused across launches) ---
  const headTex = makeGlowTexture()
  for (let i = 0; i < NUM_ARCS; i++) {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array((ARC_SEGS + 1) * 3), 3),
    )
    geo.setDrawRange(0, 0)
    const mat = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const line = new THREE.Line(geo, mat)
    line.frustumCulled = false
    track(line)
    globeGroup.add(line)

    const head = track(
      new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: headTex,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    )
    head.scale.setScalar(0.05)
    globeGroup.add(head)

    arcs.push({
      line,
      head,
      curve: null,
      t: -(Math.random() * 4),
      speed: 0.55 + Math.random() * 0.5,
      target: 0,
    })
  }
}

function respawnArc(arc, delay) {
  const src = landDots[Math.floor(Math.random() * landDots.length)]
  // route to nearest PoP most of the time; occasionally hop cross-region
  let best = 0
  let bestD = Infinity
  popVecs.forEach((p, i) => {
    const d = src.distanceTo(p)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  const target =
    Math.random() < 0.75 ? best : Math.floor(Math.random() * popVecs.length)
  const dst = popVecs[target]
  const dist = src.distanceTo(dst)
  const lift = 1 + dist * 0.38
  const c1 = src.clone().lerp(dst, 0.25).normalize().multiplyScalar(lift)
  const c2 = src.clone().lerp(dst, 0.75).normalize().multiplyScalar(lift)
  arc.curve = new THREE.CubicBezierCurve3(src.clone(), c1, c2, dst.clone())

  const pts = arc.curve.getPoints(ARC_SEGS)
  const attr = arc.line.geometry.getAttribute('position')
  for (let i = 0; i <= ARC_SEGS; i++) {
    attr.setXYZ(i, pts[i].x, pts[i].y, pts[i].z)
  }
  attr.needsUpdate = true

  const color = Math.random() < 0.3 ? CYAN : ORANGE
  arc.line.material.color.copy(color)
  arc.head.material.color.copy(color)
  arc.line.geometry.setDrawRange(0, 0)
  arc.t = -delay
  arc.speed = 0.55 + Math.random() * 0.5
  arc.target = target
}

function tickArcs(dt) {
  for (const arc of arcs) {
    arc.t += dt * arc.speed
    if (arc.t < 0) continue
    if (!arc.curve) {
      respawnArc(arc, 0)
      continue
    }
    if (arc.t <= 1) {
      // grow toward the PoP
      const n = Math.max(1, Math.floor(arc.t * ARC_SEGS))
      arc.line.geometry.setDrawRange(0, n + 1)
      const p = arc.curve.getPoint(Math.min(arc.t, 1))
      arc.head.position.copy(p)
      arc.head.material.opacity = 1
      arc.line.material.opacity = 1
    } else if (arc.t <= 2) {
      // retreat from the source; impact glow fades at the PoP
      const k = arc.t - 1
      const start = Math.floor(k * ARC_SEGS)
      arc.line.geometry.setDrawRange(start, ARC_SEGS + 1 - start)
      arc.head.position.copy(arc.curve.getPoint(1))
      arc.head.material.opacity = Math.max(0, 1 - k * 2)
      arc.line.material.opacity = 1 - k * 0.6
    } else {
      respawnArc(arc, Math.random() * 2.5)
      arc.head.material.opacity = 0
    }
  }
}

function tickRings(elapsed) {
  for (const ring of rings) {
    const p = ((elapsed + ring.userData.phase) % 2.4) / 2.4
    ring.scale.setScalar(1 + p * 1.9)
    ring.material.opacity = 0.55 * (1 - p)
  }
}

function onPointerDown(e) {
  dragging = true
  lastX = e.clientX
  lastY = e.clientY
  container.value.style.cursor = 'grabbing'
}

function onPointerMove(e) {
  const rect = container.value?.getBoundingClientRect()
  if (rect) {
    pointerTarget.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    pointerTarget.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
  }
  if (!dragging) return
  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  lastX = e.clientX
  lastY = e.clientY
  velY = dx * 0.0035
  tiltX = Math.max(-0.6, Math.min(0.6, tiltX + dy * 0.003))
}

function onPointerUp() {
  dragging = false
  if (container.value) container.value.style.cursor = 'grab'
}

function animate() {
  raf = requestAnimationFrame(animate)
  if (!visible) return
  const dt = Math.min(clock.getDelta(), 0.05)
  const elapsed = clock.elapsedTime

  // rotation: gentle auto-spin + drag inertia
  if (!reducedMotion) {
    globeGroup.rotation.y += dt * 0.055
  }
  globeGroup.rotation.y += velY
  velY *= 0.94
  globeGroup.rotation.x += (tiltX - globeGroup.rotation.x) * 0.08

  // subtle camera parallax toward pointer
  camera.position.x += (pointerTarget.x * 0.1 - camera.position.x) * 0.03
  camera.position.y += (-pointerTarget.y * 0.08 - camera.position.y) * 0.03
  camera.lookAt(0, 0, 0)

  if (!reducedMotion) {
    tickArcs(dt)
    tickRings(elapsed)
  }

  renderer.render(scene, camera)
  if (!booted.value) booted.value = true
}

onMounted(() => {
  const el = container.value
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50)
  camera.position.set(0, 0, 3.4)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  el.appendChild(renderer.domElement)
  renderer.domElement.style.touchAction = 'pan-y'
  el.style.cursor = 'grab'

  globeGroup = new THREE.Group()
  globeGroup.rotation.x = tiltX
  // start facing the Americas (LA + NJ PoPs up front, Europe on the rim)
  globeGroup.rotation.y = -0.35
  scene.add(globeGroup)

  buildGlobe()

  // static arcs look broken — with reduced motion just show the globe
  if (reducedMotion) {
    arcs.forEach((a) => (a.t = -Infinity))
  }

  const resize = () => {
    const w = el.clientWidth
    const h = el.clientHeight
    if (!w || !h) return
    camera.aspect = w / h
    camera.fov = w < 480 ? 48 : 40
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  resize()
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(el)

  intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting
      if (visible) clock.getDelta() // discard hidden time
    },
    { threshold: 0.02 },
  )
  intersectionObserver.observe(el)

  el.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)

  clock = new THREE.Clock()
  animate()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  const el = container.value
  el?.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  disposables.forEach((d) => d.dispose?.())
  disposables = []
  arcs = []
  rings = []
  landDots = []
  renderer?.dispose()
  renderer?.domElement?.remove()
  renderer = null
  scene = null
})
</script>

<template>
  <div
    ref="container"
    class="w-full h-full transition-opacity duration-1000"
    :class="booted ? 'opacity-100' : 'opacity-0'"
    aria-hidden="true"
  ></div>
</template>
