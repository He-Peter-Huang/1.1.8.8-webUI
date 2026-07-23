import { ref, onMounted, onBeforeUnmount } from 'vue'

/** Element-level fullscreen toggle with Safari (webkit) fallback. */
export function useFullscreen(targetRef) {
  const isFullscreen = ref(false)

  function onChange() {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement
    isFullscreen.value = !!fsEl && fsEl === targetRef.value
  }

  function toggle() {
    const el = targetRef.value
    if (!el) return
    if (isFullscreen.value) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen
      exit?.call(document)
    } else {
      const request = el.requestFullscreen || el.webkitRequestFullscreen
      request?.call(el)
    }
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', onChange)
    document.removeEventListener('webkitfullscreenchange', onChange)
  })

  return { isFullscreen, toggle }
}
