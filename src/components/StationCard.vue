<template>
  <button 
    class="station-card" 
    :class="statusClass"
    @click="handleClick"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointerleave="handlePointerCancel"
    @contextmenu.prevent
  >
    <div class="long-press-bar" :style="{ width: pressProgress + '%' }"></div>

    <div class="card-sidebar">
        <span class="label-heat">HEAT</span>
        <span class="val-heat">{{ entry.heat }}</span>
    </div>

    <div class="card-main">
        
        <div class="card-top">
            <span class="badge-event">{{ entry.event }}</span>

            <div v-if="showStamp" class="status-alert-badge">
                {{ stampText }}
             </div>
             <span v-else class="meta-id">#{{ entry.entry_code }}</span>
        </div>

        <div class="name-container" :class="{ 'is-dense': nameList.length > 2 }">
            <div v-for="(name, index) in nameList" :key="index" class="name-row">
               <svg class="icon-user" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
               </svg>
               <span class="name-text" :class="{ 'is-long': name.length > 16 }">
                   {{ name }}
               </span>
            </div>
        </div>

        <div class="card-bottom">
            <div class="team-name">
                <svg class="icon-team" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd" />
                </svg>
                {{ entry.team || 'Independent' }}
            </div>
            
            <div class="status-icon">
                <svg v-if="isDone" class="icon-check" viewBox="0 0 24 24" fill="currentColor"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg>
                
                <svg v-else-if="isLocked" class="icon-lock" viewBox="0 0 24 24" fill="currentColor"><path d="M18 10v-4c0-3.313-2.687-6-6-6s-6 2.687-6 6v4h-3v14h18v-14h-3zm-10-4c0-2.206 1.794-4 4-4s4 1.794 4 4v4h-8v-4z"/></svg>
                
                <svg v-else class="icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
        </div>
    </div>
  </button>
</template>

<script setup>
import { computed, ref, onUnmounted } from 'vue'

const props = defineProps({
  entry: { type: Object, required: true },
  judgeType: { type: String, default: '' }
})

const emit = defineEmits(['select'])

// --- Status Logic ---
const isDone = computed(() => {
  if (props.entry.status === 'done' || props.entry.status === 'completed') return true
  if (props.judgeType) {
      const field = `status_${props.judgeType}`
      if (props.entry[field] === 'done' || props.entry[field] === true) return true
  }
  return false
})

const isScratch = computed(() => props.entry.status === 'scratch')
const isRejump = computed(() => props.entry.status === 'rejump')
const isDq = computed(() => props.entry.status === 'dq')
const isLocked = computed(() => isScratch.value || isDq.value || isDone.value)

const statusClass = computed(() => {
  if (isScratch.value) return 'is-scratch'
  if (isDq.value) return 'is-dq'
  if (isRejump.value) return 'is-rejump'
  if (isDone.value) return 'is-done'
  return 'is-pending'
})

const showStamp = computed(() => isScratch.value || isDq.value || isRejump.value || isDone.value)

const stampText = computed(() => {
  if (isDq.value) return 'DQ' 
  if (isScratch.value) return 'SCRATCH'
  if (isRejump.value) return 'RE-JUMP'
  if (isDone.value) return 'COMPLETED'
  return ''
})

const nameList = computed(() => {
  return [props.entry.name1, props.entry.name2, props.entry.name3, props.entry.name4]
    .filter(n => n && String(n).trim() !== "")
})

// --- Interaction & Long Press Logic ---
let startX = 0, startY = 0, startTime = 0, isDrag = false
let longPressTimer = null
let animationFrame = null
const pressProgress = ref(0)
const LONG_PRESS_DURATION = 2000 // 2 seconds

const resetPress = () => {
    if (longPressTimer) clearTimeout(longPressTimer)
    if (animationFrame) cancelAnimationFrame(animationFrame)
    longPressTimer = null
    pressProgress.value = 0
}

const handlePointerDown = (e) => {
  if (e.button !== 0) return // Left click only

  startX = e.clientX || (e.touches ? e.touches[0].clientX : 0)
  startY = e.clientY || (e.touches ? e.touches[0].clientY : 0)
  startTime = Date.now()
  isDrag = false
  
  // If card is locked, start long press detection
  if (isLocked.value) {
      const startPressTime = Date.now()
      
      // Animation loop for progress bar
      const animate = () => {
          const elapsed = Date.now() - startPressTime
          const p = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100)
          pressProgress.value = p
          
          if (p < 100) {
              animationFrame = requestAnimationFrame(animate)
          }
      }
      animationFrame = requestAnimationFrame(animate)

      // Actual Trigger Timer
      longPressTimer = setTimeout(() => {
          // Time's up! Force unlock and enter
          emit('select', props.entry)
          resetPress()
          // Prevent the subsequent 'click' from firing its shake logic
          isDrag = true // Hack: treating it as a drag prevents click handler
      }, LONG_PRESS_DURATION)
  }
}

const handlePointerMove = (e) => {
  const currentX = e.clientX || (e.touches ? e.touches[0].clientX : 0)
  const currentY = e.clientY || (e.touches ? e.touches[0].clientY : 0)
  if (Math.abs(currentX - startX) > 15 || Math.abs(currentY - startY) > 15) {
      isDrag = true
      resetPress() // Cancel long press if moved
  }
}

const handlePointerUp = () => resetPress()
const handlePointerCancel = () => resetPress()

const handleClick = () => {
  if (isDrag) return
  
  // Normal Click Logic
  if (isLocked.value) {
     // If we got here, it wasn't a long press (timer cancelled)
     // So we shake to indicate "Locked"
     const el = document.activeElement
     if(el) {
         el.animate([
            { transform: 'translateX(0)' }, { transform: 'translateX(4px)' },
            { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }
         ], { duration: 300 })
     }
     return
  }
  
  // Not locked? Enter immediately
  emit('select', props.entry)
}

onUnmounted(() => resetPress())
</script>

<style scoped>
/* ================= DEFAULT (DESKTOP) ================= */
.station-card {
  display: flex;
  width: 100%;
  height: 124px;
  margin: 10px 0;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: white;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  transition: transform 0.1s;
  text-align: left;
  color: white; 
  box-sizing: border-box; 
  /* Disable standard text selection */
  user-select: none; 
  -webkit-user-select: none;
}
.station-card:active { transform: scale(0.98); }

/* --- Long Press Progress Bar --- */
.long-press-bar {
    position: absolute;
    bottom: 0; left: 0;
    height: 4px;
    background: rgba(255, 255, 255, 0.7);
    z-index: 10;
    transition: width 0.1s linear;
}

/* Sidebar */
.card-sidebar {
  width: 55px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.25);
}
.label-heat { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; opacity: 0.8; }
.val-heat { font-size: 26px; font-weight: 800; line-height: 1; }

/* Main Content */
.card-main {
  flex: 1;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

/* Top Row */
.card-top { display: flex; justify-content: space-between; align-items: center; }
.badge-event {
  background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 6px;
  font-size: 10px; font-weight: 700;
  max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.meta-id { font-family: monospace; font-size: 11px; opacity: 0.7; font-weight: 600; }
.status-alert-badge {
    font-size: 13px; font-weight: 900; text-transform: uppercase;
    padding: 4px 10px; border-radius: 6px; letter-spacing: 0.05em;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    background: white; color: #333; 
}

/* Names */
.name-container {
  display: flex; flex-direction: column; justify-content: center;
  flex: 1; margin: 4px 0; gap: 2px;
}
.name-row { display: flex; align-items: center; width: 100%; }
.icon-user { width: 14px; height: 14px; margin-right: 6px; opacity: 0.8; flex-shrink: 0; }
.name-text {
  font-size: 18px; 
  font-weight: 700; line-height: 1.2;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
}
.name-text.is-long { font-size: 14px; }
.name-container.is-dense .name-text { font-size: 14px; }

/* Bottom */
.card-bottom { display: flex; justify-content: space-between; align-items: center; height: 18px; }
.team-name { 
    font-size: 11px; opacity: 0.8; font-weight: 500; 
    display: flex; align-items: center; gap: 4px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 85%;
}
.icon-team { width: 12px; height: 12px; opacity: 0.7; flex-shrink: 0; }
.status-icon svg { width: 18px; height: 18px; opacity: 0.9; }

/* Colors */
.station-card.is-done .status-alert-badge { color: #2563eb; } 
.station-card.is-dq .status-alert-badge { color: #dc2626; }
.station-card.is-rejump .status-alert-badge { color: #ea580c; }
.station-card.is-scratch .status-alert-badge { background: #334155; color: #cbd5e1; }

.station-card.is-pending { background: linear-gradient(135deg, #10b981, #047857); }
.station-card.is-done { background: linear-gradient(135deg, #3b82f6, #1d4ed8); opacity: 0.9; }
.station-card.is-rejump { background: linear-gradient(135deg, #f97316, #c2410c); }
.station-card.is-dq { background: linear-gradient(135deg, #ef4444, #b91c1c); }
.station-card.is-scratch { background: #64748b; cursor: not-allowed; }


/* ================= MOBILE OPTIMIZATION ================= */
@media (max-width: 600px) {
  /* 1. Shrink Height & Sidebar */
  .station-card { height: 116px; margin: 8px 0; }
  .card-sidebar { width: 44px; } 
  .val-heat { font-size: 22px; }
  .label-heat { font-size: 8px; letter-spacing: 0px; }

  /* 2. Tighter Main Content */
  .card-main { padding: 6px 10px; }

  /* 3. Smaller Fonts for Mobile */
  .name-text { font-size: 16px; }
  .name-text.is-long { font-size: 13px; }
  .icon-user { width: 12px; height: 12px; margin-right: 4px; }
  
  /* 4. Prevent Overlap */
  .badge-event { max-width: 100px; font-size: 9px; }
  
  /* 5. Dense Mode adjustments */
  .name-container.is-dense .name-text { font-size: 13px; }
  .name-container.is-dense .name-text.is-long { font-size: 11px; }
}
</style>