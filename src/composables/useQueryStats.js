import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Provides live DNS query counters and per-node stats.
 * TODO: Replace fetchStats() with real API call.
 */

function fetchStats() {
  // TODO: Replace with actual API endpoint
  // e.g. const res = await fetch('https://api.1188.pub/stats')
  // return res.json()
  return null
}

function jitter(base, pct = 0.05) {
  return base * (1 + (Math.random() - 0.5) * 2 * pct)
}

export function useQueryStats() {
  const counters = ref({
    h24: 0,
    d7: 0,
    d30: 0,
    y1: 0,
  })

  // Per-second increment rates (queries/sec for each window)
  // These represent how fast each counter ticks up per second
  const rates = {
    h24: 48000,   // ~4.1B / 86400
    d7: 48000,
    d30: 48000,
    y1: 48000,
  }

  const totalQps = ref(0)
  const loading = ref(true)

  let timer = null

  onMounted(async () => {
    const live = await fetchStats()

    if (live) {
      // Real data path
      counters.value = {
        h24: live.queries_24h,
        d7: live.queries_7d,
        d30: live.queries_30d,
        y1: live.queries_1y,
      }
      totalQps.value = live.total_qps
      loading.value = false
    } else {
      // Mock base values — will be replaced by API
      counters.value = {
        h24: 4_152_384_000,
        d7: 29_066_688_000,
        d30: 124_571_520_000,
        y1: 1_515_620_160_000,
      }
      totalQps.value = 48072
      loading.value = false
    }

    // Tick counters up every second
    timer = setInterval(() => {
      counters.value = {
        h24: counters.value.h24 + Math.round(jitter(rates.h24)),
        d7: counters.value.d7 + Math.round(jitter(rates.d7)),
        d30: counters.value.d30 + Math.round(jitter(rates.d30)),
        y1: counters.value.y1 + Math.round(jitter(rates.y1)),
      }
      totalQps.value = Math.round(jitter(48072, 0.08))
    }, 1000)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { counters, totalQps, loading }
}

export function useNodeStats() {
  const nodes = ref([
    { key: 'los_angeles', qps: 0, latency: 0, uptime: 0 },
    { key: 'new_jersey', qps: 0, latency: 0, uptime: 0 },
    { key: 'frankfurt', qps: 0, latency: 0, uptime: 0 },
    { key: 'singapore', qps: 0, latency: 0, uptime: 0 },
    { key: 'tokyo', qps: 0, latency: 0, uptime: 0 },
    { key: 'shanghai', qps: 0, latency: 0, uptime: 0 },
  ])

  const lastSync = ref('')
  let timer = null

  function updateNodes() {
    // TODO: Replace with real API data
    const baselines = [
      { qps: 12400, latency: 1.2, uptime: 99.98 },
      { qps: 9800, latency: 0.8, uptime: 99.99 },
      { qps: 7200, latency: 1.5, uptime: 99.97 },
      { qps: 6100, latency: 2.1, uptime: 99.95 },
      { qps: 8300, latency: 1.1, uptime: 99.99 },
      { qps: 4200, latency: 0.9, uptime: 99.96 },
    ]
    nodes.value = nodes.value.map((n, i) => ({
      ...n,
      qps: Math.round(jitter(baselines[i].qps, 0.1)),
      latency: +(jitter(baselines[i].latency, 0.15)).toFixed(1),
      uptime: baselines[i].uptime,
    }))
    lastSync.value = new Date().toLocaleTimeString('en-US', { hour12: false })
  }

  onMounted(() => {
    updateNodes()
    timer = setInterval(updateNodes, 3000)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { nodes, lastSync }
}
