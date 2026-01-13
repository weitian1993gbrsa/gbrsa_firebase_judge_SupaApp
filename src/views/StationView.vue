<template>
  <div class="station-interface-header">
    <header class="topbar">
      <div class="header-left">
        <img src="/logo.svg" alt="Logo" style="height: 32px; width: auto; object-fit: contain;">
        <div class="titles">
          <h1>
            <span style="display:flex; align-items:center; gap:6px;">
              {{ eventMode === 'speed' ? 'Speed' : 'Freestyle' }} Station {{ stationId }}
            </span>
          </h1>
          <div v-if="judgeType" style="font-size: 0.75rem; font-weight: 800; color: #64748b; letter-spacing: 0.1em; text-transform: uppercase;">
             {{ judgeType }}
          </div>
        </div>
      </div>

      <div class="live-indicator">
        <span class="status-dot"></span>
        <span>LIVE</span>
      </div>
    </header>
    <div class="station-actions">
      <button @click="goHome" class="btn" id="btnHome">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Home
      </button>
      <button @click="fetchData" class="btn" id="btnRefresh">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>
  </div>

  <!-- Main List -->
  <main class="container">
    <div v-if="loading" class="loading-state">
      <div class="skeleton-card" v-for="n in 3" :key="n"></div>
    </div>
    
    <div v-else-if="filteredParticipants.length === 0" class="empty-state">
      No participants found.
    </div>

    <div v-else class="entry-list">
      <transition-group name="list">
        <StationCard 
          v-for="p in filteredParticipants" 
          :key="p.entry_code" 
          :entry="p" 
          :judge-type="judgeType"
          @select="onCardSelect"
        />
      </transition-group>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import StationCard from '../components/StationCard.vue'

// import { SPEED_EVENTS, FREESTYLE_EVENTS } from '../constants'
import { useConfig } from '../composables/useConfig'

const { config } = useConfig()

const route = useRoute()
const router = useRouter()

const stationId = ref(localStorage.getItem('gbrsa_allowed_station') || route.query.station || '1')
const participants = ref([])
const loading = ref(true)
let unsubscribe = null

const judgeType = computed(() => route.query.judgeType)
const eventMode = computed(() => {
    // Priority 1: Specific judge type implies freestyle
    if (judgeType.value) return 'freestyle'
    
    // Priority 2: Explicit event mode in query
    const qEvent = route.query.event
    if (qEvent === 'freestyle') return 'freestyle'
    if (qEvent === 'speed') return 'speed'
    
    // Priority 3: Detect from event name in query
    if (qEvent && config.value.freestyleEvents.includes(qEvent)) return 'freestyle'
    if (qEvent && config.value.speedEvents.includes(qEvent)) return 'speed'
    
    return 'speed' // Default
})

const goHome = () => router.push('/')

// Realtime Listener
const subscribe = () => {
  if (unsubscribe) unsubscribe()
  loading.value = true
  
  // MIGRATE: competition/{stationId}/entries
  const qSafe = query(collection(db, "competition", String(stationId.value), "entries")) 

  unsubscribe = onSnapshot(qSafe, (snapshot) => {
    const list = []
    snapshot.forEach(doc => {
      const d = doc.data()
      // Filter by Event Mode (Speed vs Freestyle)
      const pEvent = String(d.event || '').trim()
      
      let matchesMode = false
      if (eventMode.value === 'speed') {
          matchesMode = config.value.speedEvents.includes(pEvent)
      } else {
          matchesMode = config.value.freestyleEvents.includes(pEvent)
      }
      
      if (matchesMode) {
          list.push({ ...d, id: doc.id })
      }
    })
    
    // Sort logic: Heat (asc) -> ID (asc)
    participants.value = list.sort((a,b) => {
        const heatDiff = Number(a.heat) - Number(b.heat)
        if (heatDiff !== 0) return heatDiff
        return String(a.entry_code).localeCompare(String(b.entry_code))
    })
      
    loading.value = false
  }, (err) => {
    console.error("Firestore Error:", err)
    loading.value = false
  })
}

const onCardSelect = (entry) => {
  console.log("Card Clicked:", entry.entry_code, entry.status) // DEBUG
  if (entry.status === 'scratch' || entry.status === 'dq') {
      console.log("Blocked: Scratch/DQ")
      return
  }

  const currentEvent = route.query.event || eventMode.value // Fallback to computed mode
  const currentJudgeType = route.query.judgeType 
  
  console.log("Nav Logic:", { currentEvent, currentJudgeType }) // DEBUG

  const q = { ...route.query, entry: entry.entry_code }

  const isFreestyle = eventMode.value === 'freestyle' || 
                      (currentEvent && config.value.freestyleEvents.includes(currentEvent)) ||
                      currentJudgeType
  
  if (isFreestyle) {
      if (currentJudgeType === 'difficulty') {
          router.push({ path: '/judge/freestyle/difficulty', query: q })
      } else if (currentJudgeType === 'technical') {
          router.push({ path: '/judge/freestyle/technical', query: q })
      } else if (currentJudgeType === 'presentation') {
          router.push({ path: '/judge/freestyle/presentation', query: q })
      } else if (currentJudgeType === 're') {
          router.push({ path: '/judge/freestyle/re', query: q })
      } else {
           console.log("[Station] Freestyle default -> difficulty")
           router.push({ path: '/judge/freestyle/difficulty', query: q })
      }
  } else {
      router.push({ 
        path: '/judge/speed', 
        query: q
      })
  }
}

onMounted(() => {
  subscribe()
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

const filteredParticipants = computed(() => participants.value)
const fetchData = () => subscribe() // Manual refresh

</script>

<style scoped>
    /* ================= THEME ================= */
    :root {
      --bg: #f8fafc;
      --border: #e2e8f0;
      --text: #0f172a;
      --muted: #64748b;

      --blue: #2563eb;
      --orange: #f97316;
      --green: #22c55e;
      --glass: rgba(255, 255, 255, 0.9);
    }

    /* ================= HEADER WRAPPER ================= */
    .station-interface-header {
      position: relative;
      flex: 0 0 auto;
      z-index: 9999;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(25px) saturate(180%);
      -webkit-backdrop-filter: blur(25px) saturate(180%);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 20px -5px rgba(0, 0, 0, 0.04);
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      padding: env(safe-area-inset-top, 0) 0 4px 0;
    }

    .live-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 100px;
      color: #15803d;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      background: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.8);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: .7; transform: scale(0.9); }
    }

    /* ================= TOPBAR ================= */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .75rem;
      padding: .75rem 1rem;
      background: transparent;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .titles h1 {
      margin: 0;
      font-size: 1rem;
      font-weight: 800;
      line-height: 1.1;
      color: #111827;
      letter-spacing: -0.01em;
      display: flex;
      flex-direction: column;
    }

    /* ================= ACTION BAR ================= */
    .station-actions {
      display: flex;
      gap: 8px;
      padding: 4px 1rem 8px 1rem;
      background: transparent;
    }

    /* ================= BUTTONS (Sleeker) ================= */
    .btn {
      flex: 1;
      border: 1px solid rgba(0, 0, 0, 0.05);
      padding: 8px 12px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      color: #fff;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .btn svg {
      width: 16px;
      height: 16px;
      opacity: 0.9;
    }

    .btn:active {
      transform: translateY(1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    #btnHome {
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
    }

    #btnRefresh {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    }

    /* ================= CONTENT (SCROLLABLE AREA) ================= */
    .container {
      flex: 1;
      overflow-y: auto;
      touch-action: pan-y;
      -webkit-overflow-scrolling: touch;
      padding: 1rem;
      padding-bottom: calc(80px + env(safe-area-inset-bottom));
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
      background: transparent; /* inherited from body */
    }
    
    .container::-webkit-scrollbar { display: none; }

    /* Skeleton / Ghost Loading */
    .skeleton-card {
      height: 110px;
      background: #e2e8f0;
      position: relative;
      overflow: hidden;
      border-radius: 16px;
      margin-bottom: 1rem;
    }

    .skeleton-card::after {
      content: "";
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      100% { transform: translateX(100%); }
    }
    
    .empty-state { text-align: center; margin-top: 4rem; color: #64748b; font-size: 1rem; font-weight: 600; }
</style>
