<template>
  <button 
    class="station-card" 
    :class="statusClass"
    @click="handleClick"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
  >
    <div class="card-inner">
      <div class="card-header">
        <span class="badge badge-heat">Heat {{ entry.heat }}</span>
        <span class="badge badge-event">{{ entry.event }}</span>
      </div>

      <div class="card-body">
         <div class="name-list" :class="{ 'is-dense': nameList.length > 1 }">
            <div v-for="(name, index) in nameList" :key="index" class="name-row">
               <svg class="icon-user" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
               </svg>
               <span class="name-text">{{ name }}</span>
            </div>
         </div>
      </div>

      <div class="card-footer">
        <div class="team">
          <svg style="width:14px;height:14px;margin-right:6px;opacity:0.75;vertical-align:text-bottom;" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd" />
          </svg>
          {{ entry.team || 'Independent' }}
        </div>
        <div class="meta-right">
          <span class="meta-id">#{{ entry.entry_code }}</span>
          <span class="meta-status" v-html="statusHtml"></span>
        </div>
      </div>

      <div v-if="showStamp" class="card-stamp" :class="{ 'is-dq': isDq, 'is-rejump': isRejump }">
          {{ stampText }}
       </div>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue'

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

const statusClass = computed(() => {
  if (isScratch.value) return 'is-scratch'
  if (isDq.value) return 'is-dq'
  if (isRejump.value) return 'is-rejump'
  if (isDone.value) return 'is-done'
  return 'is-pending'
})

const showStamp = computed(() => isDone.value || isScratch.value || isDq.value || isRejump.value)
const stampText = computed(() => {
  if (isDq.value) return 'DISQUALIFIED'
  if (isScratch.value) return 'SCRATCH'
  if (isRejump.value) return 'RE-JUMP'
  return 'COMPLETED'
})

// --- Name Logic ---
const nameList = computed(() => {
  return [props.entry.name1, props.entry.name2, props.entry.name3, props.entry.name4]
    .filter(n => n && String(n).trim() !== "")
})

// --- Legacy Status Labels ---
const statusHtml = computed(() => {
  if (isDone.value) {
      return `<span>Done</span> <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`
  }
  if (isScratch.value) {
      return `<span>Locked</span> <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M13.477 12.89L17 16.414V6a2 2 0 00-2-2h-3.414l-3.29-3.293a1 1 0 00-1.414 0l-3.293 3.293H6a2 2 0 00-2 2v12.414l3.523-3.523L13.477 12.89zm-1.063-1.063L8 7.414 5.414 10l7.001 1.828zM4 4l16 16" clip-rule="evenodd"/></svg>`
  }
  if (isRejump.value) {
      return `<span>Re-Jump</span> <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/></svg>`
  }
  if (isDq.value) {
      return `<span>DQ</span> <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`
  }
  return `<span>Judge</span> <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>`
})

// --- Interaction Logic ---
let startX = 0, startY = 0, startTime = 0, isDrag = false

const handlePointerDown = (e) => {
  startX = e.clientX || (e.touches ? e.touches[0].clientX : 0)
  startY = e.clientY || (e.touches ? e.touches[0].clientY : 0)
  startTime = Date.now()
  isDrag = false
}
const handlePointerMove = (e) => {
  const currentX = e.clientX || (e.touches ? e.touches[0].clientX : 0)
  const currentY = e.clientY || (e.touches ? e.touches[0].clientY : 0)
  if (Math.abs(currentX - startX) > 15 || Math.abs(currentY - startY) > 15) {
      isDrag = true
  }
}
const handlePointerUp = () => {}
const handleClick = () => {
  if (isDrag) return
  if (Date.now() - startTime > 600) return 
  
  if (isScratch.value || isDq.value) {
     const el = document.activeElement
     if(el) {
         el.animate([
            { transform: 'translateX(0)', offset: 0 },
            { transform: 'translateX(4px)', offset: 0.25 },
            { transform: 'translateX(-4px)', offset: 0.75 },
            { transform: 'translateX(0)', offset: 1 }
         ], { duration: 300 })
     }
     return
  }
  emit('select', props.entry)
}
</script>

<style scoped>
    /* ================= ENTRY CARDS ================= */
    .station-card {
      display: block;
      width: 100%;
      margin: 10px 0;
      padding: 0;
      border: none;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      text-align: left;
      position: relative;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    .station-card:active {
      transform: scale(0.99); 
      box-shadow: 0 2px 10px -2px rgba(0, 0, 0, 0.05);
    }

    /* REJUMP = ORANGE */
    .station-card.is-rejump {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      border: 2px solid #fdba74;
    }
    .station-card.is-rejump .badge { background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.1); color: white; }

    /* SCRATCH = GREY */
    .station-card.is-scratch {
      background: rgba(100, 116, 139, 0.4);
      color: white;
      cursor: not-allowed;
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    .station-card.is-scratch .name-text, 
    .station-card.is-scratch .team, 
    .station-card.is-scratch .meta-id,
    .station-card.is-scratch .meta-status { color: #e2e8f0; }
    .station-card.is-scratch .badge { background: rgba(0, 0, 0, 0.2); color: #cbd5e1; }

    /* DQ = RED */
    .station-card.is-dq {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      border: 2px solid #f87171;
      cursor: not-allowed;
    }
    .station-card.is-dq .badge { background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.1); color: white; }

    /* PENDING = GREEN */
    .station-card.is-pending {
      background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
      color: white;
    }
    .station-card.is-pending .badge { background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.1); color: white; }

    /* DONE = BLUE */
    .station-card.is-done {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
    }
    .station-card.is-done .badge { background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.1); color: white; }

    /* Universal Text Color Overrides for Colored Cards */
    .station-card:not(.is-scratch) .name-text,
    .station-card:not(.is-scratch) .team,
    .station-card:not(.is-scratch) .meta-id,
    .station-card:not(.is-scratch) .meta-status {
        color: white;
    }

    .card-inner {
      padding: 16px 18px;
      position: relative;
      z-index: 20;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .badge-heat {
      background: #1e293b;
      color: white;
      font-size: 13px;
      padding: 8px 14px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .badge-event {
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.1);
      color: #334155;
    }

    /* === NAME STYLES === */
    .card-body { margin-bottom: 16px; }
    
    .name-list { display: flex; flex-direction: column; gap: 2px; }
    
    .name-row { display: flex; align-items: center; }

    /* Default (1 name) */
    .name-text {
      font-size: 18px;
      font-weight: 850;
      letter-spacing: -0.015em;
      line-height: 1.2;
    }

    /* ⚡ DENSE MODE (2+ names) ⚡ */
    /* Updated Logic: If more than 1 name, use smaller font */
    .name-list.is-dense .name-text {
      font-size: 15px; 
    }
    
    .name-list.is-dense .icon-user {
       width: 11px;
       height: 11px;
    }

    .icon-user {
        width: 12px; 
        height: 12px; 
        margin-right: 4px; 
        opacity: 0.7;
    }

    /* Footer */
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
    }

    .station-card .team {
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
    }

    .meta-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .meta-id {
      font-family: ui-monospace, SFMono-Regular, monospace;
      opacity: 0.5;
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 0.05em;
    }

    .meta-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.02em;
    }
    
    /* STAMP */
    .card-stamp {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-12deg);
      border: 4px solid rgba(255, 255, 255, 0.5);
      color: rgba(255, 255, 255, 0.75);
      font-size: 2.5rem;
      font-weight: 900;
      padding: 0.25rem 1rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      pointer-events: none;
      z-index: 0;
      border-radius: 8px;
      backdrop-filter: blur(2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      mix-blend-mode: overlay;
      opacity: 0.5;
    }
</style>