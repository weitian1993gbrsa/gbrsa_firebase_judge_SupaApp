<template>
  <div class="page scoreboard">
    <div v-if="!isAuthenticated" class="auth-container">
        <div class="auth-box">
            <h2>LIVESCORE ACCESS</h2>
            <input type="password" v-model="inputKey" placeholder="Enter Key" @keydown.enter="handleAuth" autofocus>
            <button @click="handleAuth">GO</button>
            <p v-if="authError" class="error">{{ authError }}</p>
        </div>
    </div>

    <div v-if="isAuthenticated" class="zoom-wrapper" :class="{ 'cursor-hidden': cursorHidden }" :style="containerStyle" @dblclick="toggleFullScreen">
        
        <button class="btn-settings-trigger" @click="showSettings = true" title="Open Settings">
            ⚙️
        </button>

        <header class="sb-header">
             <div class="brand">
                <img class="logo" :src="COMPETITION_LOGO" alt="Logo">
                <h1>UNOFFICIAL SCORE</h1>
             </div>
        </header>

        <main class="grid-container" :class="gridClass">
            <div 
                v-for="s in visibleStations" 
                :key="s" 
                class="score-card"
                @click="openModal(s)"
                style="cursor: pointer"
            >
            <div class="card-header">
                <span class="st-num">{{ s }}</span>
            </div>
            
            <div class="card-body">
                <div class="score-val">
                    {{ getScore(s) }}
                </div>
            </div>

            <div class="card-footer">
                <div class="heat-info" v-if="getHeat(s)">
                    HEAT {{ getHeat(s) }}
                </div>
                 <div class="entry-code" v-if="getEntryCode(s)">
                    {{ getEntryCode(s) }}
                </div>
            </div>

            <div v-if="getStatus(s)" class="card-stamp" :class="getStatusClass(s)">
                {{ getStatus(s) }}
            </div>
        </div>

    </main>
    </div> <div v-if="selectedStation" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-card">
            <h3>STATION {{ selectedStation }}</h3>
            <div class="status-actions">
                <button class="btn-action btn-scratch" @click="updateStatus('scratch')">SCRATCH</button>
                <button class="btn-action btn-dq" @click="updateStatus('dq')">DQ</button>
                <button class="btn-action btn-reset" @click="updateStatus('reset')">RESET</button>
            </div>
        </div>
    </div>
    
    <div v-if="showSettings" class="settings-overlay">
        <div class="settings-card">
            <h3>Display Settings</h3>
            
            <div class="setting-group">
                <label class="group-label">Station Filter (Multi-TV)</label>
                <div class="range-row">
                    <div class="input-col">
                        <label>From</label>
                        <input type="number" v-model="configStart" min="1" class="small-input">
                    </div>
                    <div class="input-col">
                        <label>To</label>
                        <input type="number" v-model="configEnd" min="1" class="small-input">
                    </div>
                </div>
                <button class="btn-mini" @click="resetRange">Show All</button>
            </div>

            <hr class="divider">

            <div class="setting-row">
                <label>Safe Area Guide</label>
                <button class="toggle-btn" :class="{on: showSafeArea}" @click="showSafeArea = !showSafeArea">
                    {{ showSafeArea ? 'ON' : 'OFF' }}
                </button>
            </div>

            <div class="setting-row">
                <label>Zoom Level ({{ zoomLevel }}%)</label>
                <input type="range" min="80" max="100" step="1" v-model="zoomLevel">
            </div>

            <button class="btn-close-settings" @click="saveAndCloseSettings">Save & Close</button>
        </div>
    </div>

    <div v-if="showSafeArea && isAuthenticated" class="safe-area-border"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../firebase'
import { collection, onSnapshot, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { COMPETITION_LOGO } from '../constants'

const route = useRoute()

// CONFIG FROM URL
const urlStationCount = computed(() => {
    const q = route.query.stations
    if (q) return Number(q)
    return 12 // Default Global Limit
})

// --- MULTI-TV DISPLAY RANGE ---
const configStart = ref(1)
const configEnd = ref(12)

const initRangeSettings = () => {
    const savedStart = localStorage.getItem('gbrsa_live_start')
    const savedEnd = localStorage.getItem('gbrsa_live_end')
    
    if (savedStart) configStart.value = Number(savedStart)
    else configStart.value = 1
    
    if (savedEnd) configEnd.value = Number(savedEnd)
    else configEnd.value = urlStationCount.value
}

// Compute the ACTUAL list of stations to show
const visibleStations = computed(() => {
    const stations = []
    const start = Math.max(1, configStart.value)
    const end = Math.min(100, configEnd.value) 
    
    for (let i = start; i <= end; i++) {
        stations.push(i)
    }
    return stations
})

const isFiltered = computed(() => {
    return visibleStations.value.length < urlStationCount.value || configStart.value > 1
})
const displayStart = computed(() => configStart.value)
const displayEnd = computed(() => configEnd.value)

// DYNAMIC GRID CLASS
const gridClass = computed(() => {
    const n = visibleStations.value.length
    if (n === 1) return 'grid-1'
    if (n === 2) return 'grid-2'
    if (n === 3) return 'grid-4' // Map 3 stations to the 2x2 grid (one empty)
    if (n === 4) return 'grid-4'
    if (n === 5 || n === 6) return 'grid-6'
    if (n > 6 && n <= 8) return 'grid-8'
    return 'grid-12'
})

// STATE
const liveData = reactive({})
const displayScores = reactive({}) 
const activeTweens = {} 

// AUTH STATE
const isAuthenticated = ref(false)
const inputKey = ref('')
const authError = ref('')

// LISTENERS
let unsub = null

// DISPLAY STATE
const isProjectorMode = computed(() => route.query.mode === 'projector')
const showSettings = ref(false)
const showSafeArea = ref(false)
const zoomLevel = ref(100)
const cursorHidden = ref(false)
let cursorTimer = null
let wakeLockSentinel = null

onMounted(async () => {
    console.log("Starting Live Scoreboard Listener...")
    
    initRangeSettings() 

    // AUTH CHECK
    const qKey = route.query.key
    const localKey = localStorage.getItem('gbrsa_live_key')

    if (localKey || qKey) {
         if (qKey) {
            const url = new URL(window.location)
            url.searchParams.delete('key')
            window.history.replaceState({}, '', url)
            localStorage.setItem('gbrsa_live_key', qKey)
        }
        isAuthenticated.value = true
    }
    
    if (isProjectorMode.value) {
        initProjectorFeatures()
    }
    
    window.addEventListener('keydown', handleKeydown)

    unsub = onSnapshot(collection(db, 'live_scores'), (snap) => {
        snap.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
                const data = change.doc.data() || {}
                const s = data.station
                if (s) {
                    liveData[s] = data
                    tweenScore(s, data.score || 0)
                }
            }
        })
    })
})

onUnmounted(() => {
    if (unsub) unsub()
    Object.values(activeTweens).forEach(cancelAnimationFrame)
})

const tweenScore = (station, targetVal) => {
    if (displayScores[station] === undefined) {
        displayScores[station] = targetVal
        return
    }
    const startVal = displayScores[station]
    if (startVal === targetVal) return
    if (activeTweens[station]) cancelAnimationFrame(activeTweens[station])

    const duration = 300 
    const startTime = performance.now()

    const animate = (now) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 4)
        const current = startVal + (targetVal - startVal) * ease
        displayScores[station] = current

        if (progress < 1) {
            activeTweens[station] = requestAnimationFrame(animate)
        } else {
            displayScores[station] = targetVal
            delete activeTweens[station]
        }
    }
    activeTweens[station] = requestAnimationFrame(animate)
}

const initProjectorFeatures = async () => {
    if ('wakeLock' in navigator) {
        try {
            wakeLockSentinel = await navigator.wakeLock.request('screen')
        } catch (err) {
            console.error(err)
        }
    }
    document.addEventListener('mousemove', resetCursor)
    resetCursor()
}

const resetCursor = () => {
    cursorHidden.value = false
    document.body.style.cursor = 'default'
    if (cursorTimer) clearTimeout(cursorTimer)
    cursorTimer = setTimeout(() => {
        if (!showSettings.value) { 
            cursorHidden.value = true
            document.body.style.cursor = 'none'
        }
    }, 1500) // Increased delay to 1.5s so you have time to click
}

const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log(e))
    } else {
        document.exitFullscreen()
    }
}

const handleKeydown = (e) => {
    if (e.shiftKey && e.key.toLowerCase() === 's') {
        showSettings.value = !showSettings.value
    }
}

// SAVE SETTINGS
const saveAndCloseSettings = () => {
    localStorage.setItem('gbrsa_live_start', configStart.value)
    localStorage.setItem('gbrsa_live_end', configEnd.value)
    showSettings.value = false
}

const resetRange = () => {
    configStart.value = 1
    configEnd.value = urlStationCount.value
}

const containerStyle = computed(() => ({
    cursor: cursorHidden.value ? 'none' : 'default',
    transform: `scale(${zoomLevel.value / 100})`,
    transformOrigin: 'center center',
    height: '100%',
    width: '100%'
}))

const getScore = (s) => Math.round(displayScores[s] || 0)
const getHeat = (s) => liveData[s]?.heat || ''
const getEntryCode = (s) => liveData[s]?.entry_code || ''

const getStatus = (s) => {
    const st = liveData[s]?.status || ''
    if (st === 'scratch' || st === 'dq' || st === 'rejump') return st.toUpperCase()
    return null
}

const getStatusClass = (s) => {
    const st = liveData[s]?.status || ''
    return `is-${st}`
}

const selectedStation = ref(null)

const openModal = (s) => {
    selectedStation.value = s
}
const closeModal = () => {
    selectedStation.value = null
}

const updateStatus = async (status) => {
    const s = selectedStation.value
    if (!s) return
    try {
        const entryCode = liveData[s]?.entry_code
        const newStatus = status === 'reset' ? 'waiting' : status
        await setDoc(doc(db, 'live_scores', String(s)), {
            station: Number(s),
            status: newStatus,
            updated_at: serverTimestamp(),
            ...(status === 'reset' ? { score: 0, heat: '-', entry_code: '' } : {}) 
        }, { merge: true })

        if (entryCode) {
            const dbStatus = status === 'reset' ? 'pending' : status
            const pRef = doc(db, "competition", String(s), "entries", entryCode)
            await updateDoc(pRef, { status: dbStatus })
        }
    } catch (e) {
        console.error("Error updating status:", e)
        alert("Failed to update status")
    }
    closeModal()
}

const handleAuth = async () => {
    const key = inputKey.value.trim()
    if (!key) return
    try {
        const docRef = doc(db, 'access_keys', key)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
            const data = snap.data()
            if (data.role === 'live_board' || data.role === 'admin') {
                isAuthenticated.value = true
                localStorage.setItem('gbrsa_live_key', key)
                authError.value = ''
                return
            }
        }
        authError.value = 'Invalid Key'
    } catch (e) {
        console.error(e)
        authError.value = 'Error checking key'
    }
}
</script>

<style scoped>
/* GLOBAL CURSOR OVERRIDE */
.cursor-hidden, .cursor-hidden * { cursor: none !important; }

/* NEW SETTINGS BUTTON STYLE */
.btn-settings-trigger {
    position: fixed; top: 1rem; right: 1rem;
    background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255,255,255,0.2);
    font-size: 1.5rem; padding: 0.5rem; width: 50px; height: 50px;
    border-radius: 50%; cursor: pointer; z-index: 50;
    transition: all 0.3s ease; display: flex; align-items: center; justify-content: center;
}
.btn-settings-trigger:hover {
    background: rgba(255, 255, 255, 0.3); transform: rotate(90deg);
}
/* Hide button when cursor is hidden (during competition) */
.cursor-hidden .btn-settings-trigger {
    opacity: 0; pointer-events: none;
}

.page.scoreboard {
    width: 100vw; height: 100vh; background: #0f172a; color: white;
    font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; overflow: hidden;
}

.sb-header {
    height: 120px; background: transparent; display: flex; align-items: center; justify-content: center; 
    padding: 0 2rem; flex-shrink: 0;
}
.brand { display: flex; align-items: center; gap: 1rem; }
.logo { height: 80px; width: auto; }
h1 { font-weight: 900; letter-spacing: 0.1em; color: white; font-size: 3rem; margin: 0; }
.range-tag { font-size: 1rem; color: #facc15; background: rgba(255,255,255,0.1); padding: 0.2rem 0.5rem; border-radius: 4px; vertical-align: middle; }

/* GRID SYSTEM */
.grid-container {
    flex: 1; padding: 0 1rem 1rem 1rem; display: grid; gap: 1rem; height: 100%;
}

/* CARDS */
.score-card {
    background: #1e293b; border: 1px solid #334155; border-radius: 16px;
    display: flex; flex-direction: column; overflow: hidden; position: relative;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); transition: transform 0.1s;
    container-type: size; /* KEY FOR RESIZING */
}

.card-header {
    padding: 0; display: flex; justify-content: space-between; align-items: center;
    position: absolute; width: 100%; top: 0; left: 0;
}
.st-num { 
    font-size: 15cqmin; font-weight: 800; color: #0f172a; background: #facc15;
    padding: 0.2em 0.6em; border-radius: 0 0 16px 0; border: none; line-height: 1;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.card-body {
    flex: 1; display: flex; align-items: center; justify-content: center;
}
.score-val {
    font-family: 'Outfit', sans-serif; font-weight: 800; line-height: 1;
    color: white; font-variant-numeric: tabular-nums; 
}

/* FOOTER HIDDEN */
.card-footer { display: none; }

/* STAMPS */
.card-stamp {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-15deg);
    font-size: 3rem; font-weight: 900; color: rgba(255,255,255,0.4);
    border: 6px solid rgba(255,255,255,0.4); padding: 0.5rem 2rem; border-radius: 12px;
    letter-spacing: 0.1em; pointer-events: none; z-index: 10; backdrop-filter: blur(2px);
}
.card-stamp.is-dq { color: #ef4444; border-color: #ef4444; background: rgba(0,0,0,0.6); }
.card-stamp.is-scratch { color: #94a3b8; border-color: #94a3b8; background: rgba(0,0,0,0.8); }
.card-stamp.is-rejump { color: #f97316; border-color: #f97316; background: rgba(0,0,0,0.6); }

/* --- DYNAMIC SIZES (USER TUNED) --- */

/* 1 STATION */
.grid-1 { grid-template-columns: 1fr; padding: 2rem; }
.grid-1 .score-val { font-size: 80cqmin; } /* Maximize for single view */

/* 2 STATIONS */
.grid-2 { grid-template-columns: 1fr 1fr; }
.grid-2 .score-val { font-size: 60cqmin; }

/* 4 STATIONS (2x2) */
.grid-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.grid-4 .score-val { font-size: 90cqmin; }

/* 6 STATIONS (3x2) */
.grid-6 { grid-template-columns: repeat(3, 1fr); grid-template-rows: 1fr 1fr; }
.grid-6 .score-val { font-size: 70cqmin; }

/* 8 STATIONS (4x2) */
.grid-8 { grid-template-columns: repeat(4, 1fr); grid-template-rows: 1fr 1fr; }
.grid-8 .score-val { font-size: 60cqmin; }

/* 12 STATIONS (4x3) */
.grid-12 { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(3, 1fr); }
.grid-12 .score-val { font-size: 70cqmin; }

/* MODAL & SETTINGS UI */
.modal-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(5px);
    display: flex; align-items: center; justify-content: center;
}
.modal-card, .settings-card {
    background: #1e293b; color: white; width: 90%; max-width: 400px;
    border-radius: 16px; padding: 2rem; box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    border: 1px solid #334155; text-align: center;
}
.modal-card h3 { font-size: 2rem; margin-bottom: 2rem; color: #facc15; }
.status-actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
.btn-action {
    padding: 1rem; border-radius: 12px; font-weight: 800; border: none; cursor: pointer;
    font-family: 'Outfit', sans-serif;
}
.btn-scratch { background: #475569; color: white; }
.btn-dq { background: #ef4444; color: white; }
.btn-reset { background: #3b82f6; color: white; }

/* SETTINGS OVERLAY */
.settings-overlay {
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
}
.settings-card h3 { margin-top: 0; color: white; }
.setting-group { margin-bottom: 1.5rem; text-align: left; }
.group-label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
.range-row { display: flex; gap: 1rem; margin-bottom: 0.5rem; }
.input-col { flex: 1; display: flex; flex-direction: column; }
.input-col label { font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.2rem; }
.small-input {
    background: #0f172a; border: 1px solid #475569; color: white; padding: 0.5rem;
    border-radius: 6px; text-align: center; font-weight: 700; width: 100%; box-sizing: border-box;
}
.btn-mini {
    width: 100%; padding: 0.4rem; background: #334155; border: none; border-radius: 6px;
    color: #cbd5e1; font-size: 0.8rem; cursor: pointer;
}
.btn-mini:hover { background: #475569; color: white; }
.divider { border: 0; border-top: 1px solid #334155; margin: 1.5rem 0; }
.setting-row { margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
.toggle-btn {
    background: #334155; color: #94a3b8; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; cursor: pointer;
}
.toggle-btn.on { background: #22c55e; color: white; }
.btn-close-settings { width: 100%; padding: 1rem; background: #3b82f6; border: none; border-radius: 8px; color: white; font-weight: 700; cursor: pointer; }

/* SAFE AREA */
.safe-area-border {
    position: fixed; inset: 5%; border: 2px dashed #ef4444; pointer-events: none; z-index: 9999;
}
.zoom-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; transition: transform 0.1s; }
.auth-container { display: flex; align-items: center; justify-content: center; height: 100%; }
.auth-box {
    background: #1e293b; padding: 2rem; border-radius: 16px; text-align: center;
    border: 1px solid #334155; display: flex; flex-direction: column; gap: 1rem;
}
.auth-box input { padding: 0.8rem; border-radius: 8px; border: none; text-align: center; font-size: 1.2rem; }
.auth-box button { padding: 0.8rem; background: #facc15; border: none; border-radius: 8px; font-weight: 800; cursor: pointer; color: #0f172a; }
.error { color: #ef4444; font-weight: bold; }
</style>