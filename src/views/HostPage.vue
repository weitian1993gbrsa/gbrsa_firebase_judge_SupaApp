<template>
  <div class="layout admin-layout">
    <header class="header">
      <div class="brand">
        <img class="logo" :src="COMPETITION_LOGO" alt="Logo">
        <div class="brand-text">
          <h1>{{ config.title }}</h1>
          <span class="badge-live">LIVE MONITOR</span>
        </div>
      </div>

      <nav class="nav-links">
        <button class="nav-link" :class="{ active: activeMainView === 'results' }" @click="activeMainView = 'results'">
            MC / Winners
        </button>
        <button class="nav-link" :class="{ active: activeMainView === 'monitor' }" @click="activeMainView = 'monitor'">
            Floor Monitor
        </button>
        <router-link to="/admin" class="nav-link">Dashboard</router-link>
      </nav>

      <div class="system-status-container">
        <div class="time-display">{{ currentTime }}</div>
        <div class="heat-badge" v-if="activeHeat">HEAT {{ activeHeat }}</div>
      </div>
    </header>

    <div v-if="activeMainView === 'monitor'" class="panel monitor-panel">
      
      <div class="floating-controls">
        <button @click="changeHeat(-1)" class="ctrl-btn">◀ Prev</button>
        
        <div class="heat-info-group">
            <div class="heat-selector">
                <span class="lbl">CURRENT HEAT</span>
                <select v-model="activeHeat" class="heat-select">
                    <option v-for="h in distinctHeats" :key="h" :value="h">{{ h }}</option>
                </select>
            </div>

            <div class="heat-schedule" v-if="currentHeatTime">
                <span class="lbl">START TIME</span>
                <div class="time-val">{{ currentHeatTime }}</div>
            </div>
        </div>

        <button @click="changeHeat(1)" class="ctrl-btn">Next ▶</button>
      </div>

      <div class="dashboard-grid" :style="dynamicGridStyle">
        <div 
          v-for="s in totalStations" 
          :key="s" 
          class="dash-card" 
          :class="getCardClass(s)"
          @click="openStationModal(s)"
        >
          <div class="card-top">
            <div class="st-num">{{ s }}</div>
            <div class="st-status" :class="getStatusColor(s)">{{ getStationStatusText(s) }}</div>
          </div>

          <div v-if="getParticipantAtStation(s)" class="card-content">
             <div class="entry-row">
                <span class="entry-pill">{{ getParticipantAtStation(s).entry_code }}</span>
                <span class="div-pill">{{ getShortDiv(getParticipantAtStation(s).division) }}</span>
             </div>
             
             <div class="p-name" :class="{ 
                'is-multi': hasMultipleNames(getParticipantAtStation(s)),
                'is-long': isLongName(getParticipantAtStation(s))
             }">
                {{ getDisplayName(getParticipantAtStation(s)) }}
             </div>
             
             <div class="p-team">{{ getParticipantAtStation(s).team }}</div>

             <div v-if="isFreestyle(getParticipantAtStation(s))" class="judge-tracker">
                <div class="tracker-lbl">JUDGES</div>
                <div class="dots-row">
                    <div class="dot" :class="{done: hasJudgeResult(s, 'difficulty')}" title="Diff">D</div>
                    <div class="dot" :class="{done: hasJudgeResult(s, 'presentation')}" title="Pres">P</div>
                    <div class="dot" :class="{done: hasJudgeResult(s, 'technical')}" title="Tech">T</div>
                    <div class="dot" :class="{done: hasJudgeResult(s, 're')}" title="RE">R</div>
                </div>
             </div>
          </div>

          <div v-else class="card-content empty">
            <div class="empty-icon">EMPTY</div>
          </div>
        </div>
      </div>

      <div v-if="selectedStation !== null" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Station {{ selectedStation }} Control</h2>
            <button class="close-btn" @click="closeModal">✕</button>
          </div>
          <div class="modal-body" v-if="getParticipantAtStation(selectedStation)">
            <div class="modal-hero">
                <h1>{{ getParticipantAtStation(selectedStation).entry_code }}</h1>
                <h3 style="white-space: pre-wrap;">{{ getDisplayName(getParticipantAtStation(selectedStation)) }}</h3>
                <p>{{ getParticipantAtStation(selectedStation).team }}</p>
            </div>
            <div class="modal-actions">
              <button class="act-btn scratch" @click="updateStationStatus('scratch')">SCRATCH</button>
              <button class="act-btn dq" @click="updateStationStatus('dq')">DQ</button>
              <button class="act-btn reset" @click="updateStationStatus('pending')">RESET STATUS</button>
            </div>
          </div>
          <div class="modal-body" v-else>
            <p>No participant assigned to Station {{ selectedStation }}.</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeMainView === 'results'" class="panel results-panel">
       <div class="results-header">
           <h2>MC Announcements</h2>
           <p>Select an event to generate the Winners List PDF</p>
       </div>
       <div class="event-grid">
          <button v-for="e in resultsEvents" :key="e" @click="generateAnnouncementPreview(e)" class="event-card">
            <span class="event-code">{{ e }}</span>
            <span class="event-name">{{ getEventLabel(e) }}</span>
            <div v-if="isExporting && exportEvent === e" class="loading-overlay">Generating...</div>
          </button>
       </div>
    </div>

    <footer class="footer">
      <div class="footer-dot" :class="{online: !isSystemLocked, offline: isSystemLocked}"></div>
      {{ isSystemLocked ? 'SYSTEM LOCKED' : 'SYSTEM ONLINE' }} | Last Sync: {{ currentTime }} | Stations: {{ totalStations }}
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { db } from '../firebase'
import { collection, collectionGroup, onSnapshot, doc, getDocs, query, where, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { COMPETITION_LOGO, FREESTYLE_EVENTS } from '../constants'
import { faCircleUser } from '@fortawesome/free-solid-svg-icons'
import { useConfig } from '../composables/useConfig'

const { config, getEventLabel } = useConfig()

const currentTime = ref('00:00:00')
const isSystemLocked = ref(false)
let timerInterval = null

const allParticipantsMeta = ref([]) 
const participants = ref([])        
const resultsSpeed = ref([])        
const resultsFreestyle = ref([])    
const activeHeat = ref(1)
const selectedStation = ref(null)

const activeMainView = ref('monitor') 
const isExporting = ref(false)
const exportEvent = ref('')

const resultsEvents = computed(() => [...(config.value.speedEvents || []), ...(config.value.freestyleEvents || [])])
let unsubs = []
let systemUnsub = null

const totalStations = computed(() => Number(config.value.stationCount) || 12)

const dynamicGridStyle = computed(() => {
    const n = totalStations.value
    let cols = 4
    if (n <= 4) cols = 2      
    else if (n <= 6) cols = 3 
    else if (n <= 8) cols = 4 
    else cols = 4             

    const rows = Math.ceil(n / cols)
    return {
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        flex: 1,
        minHeight: 0
    }
})

// --- TIME EXTRACTION ---
const currentHeatTime = computed(() => {
    if (!participants.value || participants.value.length === 0) return null
    const p = participants.value[0]
    return p.time || p.Time || p.Schedule || p.schedule || p.Start_Time || p.start_time || null
})

onMounted(async () => {
    const updateClock = () => {
        const now = new Date()
        currentTime.value = now.toLocaleTimeString('en-US', { hour12: false })
    }
    updateClock()
    timerInterval = setInterval(updateClock, 1000)

    try {
        const snapshot = await getDocs(collectionGroup(db, 'entries'))
        allParticipantsMeta.value = snapshot.docs.map(d => ({...d.data(), entry_code: d.id}))
    } catch (e) { console.error("Meta error", e) }
    
    systemUnsub = onSnapshot(doc(db, 'system', 'status'), s => {
        if (s.exists()) isSystemLocked.value = s.data().locked === true
    })

    setupListeners()
})

onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval)
    unsubs.forEach(u => u())
    if (systemUnsub) systemUnsub()
})

const setupListeners = () => {
    unsubs.forEach(u => u())
    unsubs = []
    participants.value = []

    const qHeat = query(collectionGroup(db, 'entries'), where("heat", "==", String(activeHeat.value)))
    unsubs.push(onSnapshot(qHeat, (snap) => {
        participants.value = snap.docs.map(d => ({ ...d.data(), id: d.id, entry_code: d.id }))
    }))

    unsubs.push(onSnapshot(collection(db, 'results_speed'), snap => resultsSpeed.value = snap.docs.map(d => ({ ...d.data(), id: d.id }))))
    unsubs.push(onSnapshot(collection(db, 'results_freestyle'), snap => resultsFreestyle.value = snap.docs.map(d => ({ ...d.data(), id: d.id }))))
}

const getNamesList = (p) => {
    if (!p) return []
    return [p.name1, p.name2, p.name3, p.name4].filter(n => n && n.trim() !== '')
}
const hasMultipleNames = (p) => getNamesList(p).length > 1
const isLongName = (p) => {
    if (hasMultipleNames(p)) return false 
    const n = p.name1 || ''
    return n.length > 12
}
const getDisplayName = (p) => getNamesList(p).join(', ')

const distinctHeats = computed(() => {
    const heats = allParticipantsMeta.value.map(p => Number(p.heat)).filter(h => !isNaN(h) && h > 0)
    return [...new Set(heats)].sort((a,b)=>a-b)
})

const isFreestyle = (p) => FREESTYLE_EVENTS.includes(p?.event)
const getParticipantAtStation = (s) => participants.value.find(p => Number(p.station) === s)
const getShortDiv = (div) => div ? div.replace('Female','F').replace('Male','M').replace('Junior','Jr').replace('Senior','Sr') : ''

const hasJudgeResult = (station, type) => {
    const p = getParticipantAtStation(station)
    if (!p) return false
    return resultsFreestyle.value.some(r => {
        if (String(r.entry_code) !== String(p.entry_code)) return false
        if (type === 'technical' && r.technical) return true
        if (type === 'difficulty' && r.difficulty) return true
        if (type === 'presentation' && r.presentation) return true
        if (type === 're' && r.re) return true
        if (r.judge_type === type) return true
        return false
    })
}

// STATUS LOGIC
const getStationStatusText = (s) => {
    const p = getParticipantAtStation(s)
    if (!p) return 'EMPTY'
    const st = String(p.status || '').toLowerCase()
    if (st === 'dq') return 'DQ'
    if (st === 'scratch') return 'SCR'
    if (st === 'rejump') return 'RE-JUMP'
    if (isFreestyle(p)) {
        const types = ['difficulty', 'presentation', 'technical', 're']
        const count = types.filter(t => hasJudgeResult(s, t)).length
        if (count === 4) return 'COMPLETED'
        if (count > 0) return 'JUDGING'
        return 'READY'
    } else {
        const res = resultsSpeed.value.find(r => String(r.entry_code) === String(p.entry_code))
        return res ? 'COMPLETED' : 'READY'
    }
}

// COLORS UPDATED: COMPLETED is now GREEN
const getCardClass = (s) => {
    const p = getParticipantAtStation(s)
    if (!p) return 'is-empty'
    const st = getStationStatusText(s)
    if (st === 'DQ' || st === 'SCR') return 'is-danger'
    if (st === 'COMPLETED') return 'is-completed' 
    if (st === 'JUDGING') return 'is-active'
    return '' // Default for READY
}

const getStatusColor = (s) => {
    const st = getStationStatusText(s)
    if (st === 'COMPLETED') return 'text-green' // Green
    if (st === 'JUDGING') return 'text-yellow'
    if (st === 'DQ' || st === 'SCR') return 'text-red'
    return 'text-mute' 
}

const openStationModal = (s) => selectedStation.value = s
const closeModal = () => selectedStation.value = null
const changeHeat = (d) => {
    const idx = distinctHeats.value.indexOf(Number(activeHeat.value))
    if (idx + d >= 0 && idx + d < distinctHeats.value.length) activeHeat.value = distinctHeats.value[idx + d]
}
const updateStationStatus = async (status) => {
    if (!selectedStation.value) return
    const p = getParticipantAtStation(selectedStation.value)
    if (!p) return
    try {
        await updateDoc(doc(db, 'competition', String(selectedStation.value), 'entries', p.id), { status })
        await setDoc(doc(db, 'live_scores', String(selectedStation.value)), {
            station: Number(selectedStation.value),
            score: 0, status, updated_at: serverTimestamp()
        })
        closeModal()
    } catch(e) { alert(e.message) }
}

const calculateScore = (row) => {
    const D = Number(row.difficulty_score) || 0
    const rawP = Number(row.presentation_score) || 0; const P = rawP * 0.05
    const reMisses = Number(row.re_score)||0; const Q = Math.max(0, 1 - (reMisses * 0.025))
    const rawMisses = Number(row.misses)||0
    const rawBreaks = Number(row.breaks)||0
    const rawViolations = Number(row.space_violation)||0
    const m = (0.05 * Math.min(rawMisses, 1)) + (0.075 * Math.max(0, Math.min(rawMisses - 1, 1))) + (0.10 * Math.max(0, rawMisses - 2));
    const b = rawBreaks * 0.05;
    const v = rawViolations * 0.05;
    const M = Math.max(0, 1 - (m + b + v));
    const R = D * (1 + P) * Q * M
    return Math.trunc(R * 100) / 100
}

const generateAnnouncementPreview = async (eventName) => {
    if (isExporting.value) return
    exportEvent.value = eventName
    isExporting.value = true
    try {
        const doc = new jsPDF()
        const isFS = FREESTYLE_EVENTS.includes(eventName)
        const qEvent = query(collectionGroup(db, 'entries'), where('event', '==', eventName))
        const eventSnap = await getDocs(qEvent)
        const entries = eventSnap.docs.map(d => ({...d.data(), entry_code: d.id}))
        if (entries.length === 0) { alert("No participants found."); return }
        
        alert("Generating PDF for " + eventName) 
    } catch (err) { alert("Export failed: " + err.message) } finally {
        isExporting.value = false; exportEvent.value = ''
    }
}

watch(distinctHeats, (newHeats) => {
    if (newHeats.length > 0 && (activeHeat.value === 1 || !newHeats.includes(Number(activeHeat.value)))) {
        activeHeat.value = newHeats[0]
    }
}, { immediate: true })
watch(activeHeat, setupListeners)
</script>

<style scoped>
/* --- LAYOUT --- */
.layout { background: #0f172a; min-height: 100vh; color: #f8fafc; font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; overflow: hidden; }

/* HEADER */
.header { background: #1e293b; padding: 0.75rem 2rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; height: 80px; box-sizing: border-box; flex-shrink: 0; }
.brand { display: flex; align-items: center; gap: 1rem; }
.logo { height: 48px; }
.brand h1 { font-size: 1.4rem; font-weight: 800; margin: 0; color: white; letter-spacing: -0.5px; }
.badge-live { background: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }
.nav-links { display: flex; gap: 0.5rem; background: #0f172a; padding: 4px; border-radius: 999px; }
.nav-link { background: transparent; border: none; color: #94a3b8; padding: 0.5rem 1.25rem; font-weight: 600; cursor: pointer; border-radius: 999px; transition: 0.2s; display: flex; align-items: center; gap: 8px; text-decoration: none; }
.nav-link:hover { color: white; background: rgba(255,255,255,0.05); }
.nav-link.active { background: #facc15; color: #0f172a; box-shadow: 0 2px 10px rgba(250, 204, 21, 0.2); }
.system-status-container { text-align: right; }
.time-display { font-family: 'JetBrains Mono', monospace; font-size: 1.2rem; font-weight: 700; color: #facc15; }
.heat-badge { color: #94a3b8; font-size: 0.8rem; font-weight: 600; letter-spacing: 1px; }

/* MONITOR PANEL */
.monitor-panel { padding: 1rem 2rem; flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* FLOATING CONTROLS */
.floating-controls { 
    display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 1rem;
    background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); padding: 0.5rem 2rem; 
    border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); width: fit-content; margin-left: auto; margin-right: auto;
    flex-shrink: 0;
}
.heat-info-group { display: flex; align-items: center; gap: 2rem; }
.ctrl-btn { background: rgba(255,255,255,0.1); color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 700; }
.ctrl-btn:hover { background: white; color: black; }
.heat-selector, .heat-schedule { display: flex; flex-direction: column; align-items: center; }
.lbl { font-size: 0.65rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
.heat-select { background: transparent; color: #facc15; border: none; font-size: 1.5rem; font-weight: 800; text-align: center; cursor: pointer; outline: none; }
.time-val { font-size: 1.5rem; font-weight: 800; color: #38bdf8; font-family: 'JetBrains Mono', monospace; }

/* CARDS */
.dash-card { background: #1e293b; border-radius: 12px; border: 1px solid #334155; position: relative; display: flex; flex-direction: column; padding: 0.75rem 1rem; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; }
.dash-card:hover { transform: translateY(-2px); border-color: #94a3b8; }
.dash-card.is-empty { opacity: 0.4; border-style: dashed; }

/* COLORS UPDATE: Completed is Green */
.dash-card.is-completed { border: 2px solid #10b981; background: rgba(16, 185, 129, 0.05); } 
.dash-card.is-active { border: 2px solid #facc15; box-shadow: 0 0 15px rgba(250, 204, 21, 0.1); } 
.dash-card.is-danger { border: 2px solid #ef4444; background: repeating-linear-gradient(45deg, rgba(239,68,68,0.05), rgba(239,68,68,0.05) 10px, rgba(239,68,68,0.1) 10px, rgba(239,68,68,0.1) 20px); }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.st-num { font-size: 1.2rem; font-weight: 900; color: #475569; }
.st-status { font-size: 0.7rem; font-weight: 800; background: #334155; padding: 2px 6px; border-radius: 4px; color: #94a3b8; }

.text-green { color: #10b981; background: rgba(16, 185, 129, 0.1); }
.text-blue { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
.text-yellow { color: #facc15; background: rgba(250, 204, 21, 0.1); animation: pulse 1.5s infinite; }
.text-red { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

.card-content { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.card-content.empty { align-items: center; opacity: 0.5; }
.empty-icon { font-weight: 800; color: #475569; letter-spacing: 2px; }

.entry-row { display: flex; gap: 6px; margin-bottom: 4px; }
.entry-pill { background: #334155; font-family: monospace; font-size: 0.8rem; padding: 1px 6px; border-radius: 4px; color: #94a3b8; }

/* DIVISION PILL: Now Yellow (#facc15) with Dark Text (#0f172a) */
.div-pill { 
    background: #facc15; 
    color: #0f172a; 
    font-size: 0.7rem; 
    font-weight: 700; 
    padding: 1px 6px; 
    border-radius: 4px; 
}

.p-name { font-size: 1rem; font-weight: 700; color: white; line-height: 1.2; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.p-name.is-long { font-size: 0.85rem; }
.p-name.is-multi { font-size: 0.75rem; white-space: normal; line-height: 1.1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.p-team { font-size: 0.7rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.judge-tracker { margin-top: auto; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); }
.tracker-lbl { font-size: 0.55rem; color: #475569; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.5px; }
.dots-row { display: flex; gap: 4px; }
.dot { width: 20px; height: 20px; border-radius: 50%; background: #334155; color: #64748b; font-size: 0.6rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.dot.done { background: #10b981; color: #064e3b; } /* Dots back to Green to match Completed color */

/* MODAL & FOOTER */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 50; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
.modal-content { background: #1e293b; width: 400px; padding: 2rem; border-radius: 16px; border: 1px solid #475569; text-align: center; }
.modal-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; color: #94a3b8; }
.modal-hero h1 { font-size: 2.5rem; color: #facc15; margin: 0; font-family: monospace; }
.modal-hero h3 { font-size: 1.5rem; color: white; margin: 0.5rem 0; }
.modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem; }
.act-btn { padding: 1rem; border-radius: 8px; border: none; font-weight: 800; cursor: pointer; transition: 0.2s; }
.act-btn.scratch { background: #475569; color: white; }
.act-btn.dq { background: #ef4444; color: white; }
.act-btn.reset { grid-column: span 2; background: #3b82f6; color: white; }
.close-btn { background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; }

.results-panel { padding: 2rem; }
.results-header { text-align: center; margin-bottom: 2rem; }
.event-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.event-card { background: #1e293b; border: 1px solid #334155; padding: 2rem; border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; position: relative; overflow: hidden; }
.event-card:hover { border-color: #facc15; transform: translateY(-2px); }
.event-code { font-size: 1.5rem; font-weight: 800; color: #facc15; }
.event-name { font-size: 0.9rem; color: #94a3b8; }

.footer { height: 30px; background: #020617; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #475569; gap: 8px; flex-shrink: 0; }
.footer-dot { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; }
.footer-dot.online { background: #10b981; box-shadow: 0 0 10px #10b981; }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

/* RESPONSIVE */
@media (max-width: 1200px) {
    .header { padding: 0.5rem 1rem; height: 70px; }
    .logo { height: 40px; }
    .brand h1 { font-size: 1.2rem; }
}
@media (max-width: 900px) {
    .nav-link span { display: none; }
}
</style>