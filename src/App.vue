<script setup>
import { RouterView } from 'vue-router'
import GlobalToast from './components/GlobalToast.vue'
import GlobalBroadcast from './components/GlobalBroadcast.vue'
import ReloadPrompt from './components/ReloadPrompt.vue'
import { onMounted, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from './firebase'
import { doc, onSnapshot } from 'firebase/firestore'

// REFRESH LISTENER
const MOUNT_TIME = Date.now()
let broadcastUnsub = null

onMounted(() => {
  // 1. Listen for Global Reloads (Admin -> Refresh Devices)
  broadcastUnsub = onSnapshot(doc(db, 'broadcasts', 'latest'), (snap) => {
      if(snap.exists()) {
          const data = snap.data()
          if(data.type === 'reload' && data.timestamp) {
              const ts = data.timestamp.seconds * 1000
              // Only reload if the command was sent AFTER this page loaded
              if (ts > MOUNT_TIME) {
                  // EXEMPTION: Do not reload Admin, Host, or Scoreboard
                  const p = route.path
                  if (p.includes('/admin') || p.includes('/host') || p.includes('/live/board')) {
                      console.log("Global Reload Skipped for Admin/Host/Scoreboard")
                      return
                  }

                  console.log("Force Reload Triggered")
                  window.location.reload()
              }
          }
      }
  })

  // ==========================================
  // GLOBAL AUDIO & HAPTICS (Legacy app.js)
  // ==========================================
  let audioCtx = null;
  let lastPlayTime = 0;

  // Unlock Audio interaction
  const unlock = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    // Remove listeners once unlocked
    document.removeEventListener("touchstart", unlock);
    document.removeEventListener("mousedown", unlock);
  };
  document.addEventListener("touchstart", unlock, { passive: true });
  document.addEventListener("mousedown", unlock, { passive: true });

  // Global playClick function (exposed for components)
  window.playClick = (freq = 1100, duration = 0.06) => {
    // 1. Haptics
    if (navigator.vibrate) try { navigator.vibrate(75); } catch (e) { }

    // 2. Audio (Debounced)
    const nowTime = Date.now();
    if (nowTime - lastPlayTime < 50) return; // 50ms simple debounce
    lastPlayTime = nowTime;

    // Legacy audio logic (disabled per user preference in Step 564 of legacy log, but keeping hook)
    // if (audioCtx && audioCtx.state === 'running') { ... }
  };

  // GLOBAL CLICK LISTENER (Delegation)
  // Replicates legacy behavior of providing feedback for ALL interactive elements automatically
  document.addEventListener('pointerdown', (e) => {
    const target = e.target.closest('button, a, .btn, .btn-primary, .btn-outline, .action-select, input[type="button"], input[type="submit"], .clickable');

    if (target) {
      // 🚫 EXEMPTION: Station Cards (Scrollable List)
      if (target.classList.contains('station-card') || target.closest('.station-card')) return;

      window.playClick();
      
      // Visual Feedback (Legacy is-pressed class)
      target.classList.add('is-pressed');
      const cleanup = () => {
        target.classList.remove('is-pressed');
        target.removeEventListener('pointerup', cleanup);
        target.removeEventListener('pointercancel', cleanup);
        target.removeEventListener('pointerleave', cleanup);
      };
      target.addEventListener('pointerup', cleanup);
      target.addEventListener('pointercancel', cleanup);
      target.addEventListener('pointerleave', cleanup);
    }
  }, false);
})

onUnmounted(() => {
    if(broadcastUnsub) broadcastUnsub()
})

const route = useRoute()
const showBroadcast = computed(() => {
  const path = route.path
  if (!path || path === '/') return false
  
  // Show only on judge-related routes
  return path.startsWith('/station') || 
         path.startsWith('/tester') ||
         path.startsWith('/judge/') ||
         path.includes('freestyle-') || 
         path.includes('speed-')
})
</script>

<template>
  <header style="display:none;"> <!-- Hidden header legacy style override if needed, but keeping clean -->
  </header>

  <ReloadPrompt />
  <RouterView />
  <GlobalToast />
  <GlobalBroadcast v-if="showBroadcast" />
</template>

<style>
/* ================= THEME (LIGHT - REVERTED) ================= */
:root {
  --bg: #f8fafc;
  --border: #e2e8f0;
  --text: #0f172a;
  --muted: #64748b;

  --blue: #2563eb;
  --orange: #f97316;
  --green: #22c55e;
  
  --primary-grad: #facc15;
  --card-bg: rgba(255, 255, 255, 0.9);
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* ================= GLOBAL ================= */
html,
body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  font-family: 'Outfit', system-ui, -apple-system, sans-serif;
  color: var(--text);
  -webkit-tap-highlight-color: transparent;
  width: 100%;
  height: 100dvh; /* Strict Lock */
  overflow: hidden; /* Prevent Global Scroll */
  overscroll-behavior: none; /* No Bounce */
  
  /* Original Light Subtle Background */
  background-image: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  background-attachment: fixed;
  background-size: cover;
}

#app {
  width: 100%;
  height: 100%;
  overflow-y: auto; /* Default Scroll for most pages */
  -webkit-overflow-scrolling: touch;
}

* {
  box-sizing: border-box;
}

button {
  font-family: inherit;
}

/* Legacy .is-pressed style for feedback */
.is-pressed {
    transform: scale(0.96);
    filter: brightness(0.9);
}
</style>
