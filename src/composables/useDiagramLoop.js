import { ref, computed, onBeforeUnmount } from 'vue'

/**
 * Scripted phase loop shared by the failover diagrams.
 *
 * One state machine is the single source of truth: every visual (beams,
 * badges, log lines, counters) derives from the current phase, so nothing
 * drifts out of sync. The loop pauses off-screen and never auto-advances
 * under prefers-reduced-motion (the stepper still works for manual reading).
 *
 * phases: [{ key, dur }]
 * onEnter(key, later): apply the phase; `later(fn, ms)` schedules
 * intra-phase events that are cleaned up on any phase change.
 */
export function useDiagramLoop(phases, onEnter) {
  const phaseIdx = ref(0)
  const phase = computed(() => phases[phaseIdx.value].key)
  const visible = ref(false)
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let nextTimer = null
  let subTimers = []
  let observer = null

  function later(fn, ms) {
    subTimers.push(setTimeout(fn, ms))
  }

  function clearAll() {
    clearTimeout(nextTimer)
    subTimers.forEach(clearTimeout)
    subTimers = []
  }

  function setPhase(i) {
    clearAll()
    phaseIdx.value = i
    onEnter(phases[i].key, later)
    if (!reduced && visible.value) {
      nextTimer = setTimeout(() => setPhase((i + 1) % phases.length), phases[i].dur)
    }
  }

  function observe(el) {
    if (!el || typeof IntersectionObserver === 'undefined') {
      setPhase(0)
      return
    }
    observer = new IntersectionObserver(
      ([entry]) => {
        const was = visible.value
        visible.value = entry.isIntersecting
        if (!was && entry.isIntersecting) {
          // (Re)start from steady state so the story always reads from the top
          setPhase(0)
        }
        if (was && !entry.isIntersecting) clearAll()
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
  }

  onBeforeUnmount(() => {
    clearAll()
    observer?.disconnect()
  })

  return { phaseIdx, phase, visible, reduced, setPhase, observe }
}
