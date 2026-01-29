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

    <div v-if="isAuthenticated" class="zoom-wrapper" :class="{ 'cursor-hidden': cursorHidden }" :style="containerStyle" @dblclick="isProjectorMode ? toggleFullScreen() : null">
        <header class="sb-header">
             <div class="brand">
                <img class="logo" :src="COMPETITION_LOGO" alt="Logo">
                <h1>UNOFFICIAL SCORE</h1>
             </div>
        </header>

        <main class="grid-container" :class="gridClass">
            <div 
                v-for="s in stationCount" 
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

            <button class="btn-close-settings" @click="showSettings = false">Close</button>
        </div>
    </div>

    <div v-if="showSafeArea && isAuthenticated" class="safe-area-border"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../firebase'
import { collection, onSnapshot, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { COMPETITION_LOGO } from '../constants'

const route = useRoute()

// CONFIG
const stationCount = computed(() => {
    const q = route.query.stations
    if (q) return Number(q)
    return 12 // Default
})

const gridClass = computed(() => {
    const n = stationCount.value
    if (n === 1) return 'grid-1'
    if (n === 2) return 'grid-2'
    if (n === 3) return 'grid-3' // Just in case
    if (n === 4) return 'grid-4'
    if (n === 5 || n === 6) return 'grid-6'
    if (n > 6 && n <= 8) return 'grid-8'
    return 'grid-12'
})

// STATE
const liveData = reactive({})
const displayScores = reactive({}) // Visual state (tweened)
const activeTweens = {} // Animation frames

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
    
// AUTH CHECK
    const qKey = route.query.key
    const localKey = localStorage.getItem('gbrsa_live_key')

    // If key exists in storage, we assume it's valid for now (Client-side fast check)
    // Ideally we would re-validate against DB, but for now we trust the LoginView's setter.
    if (localKey || qKey) {
         if (qKey) {
            // Remove key from URL
            const url = new URL(window.location)
            url.searchParams.delete('key')
            window.history.replaceState({}, '', url)
            localStorage.setItem('gbrsa_live_key', qKey)
        }
        isAuthenticated.value = true
    }

    
    // Projector Mode Logic
    if (isProjectorMode.value) {
        initProjectorFeatures()
    }
    
    // Keyboard Shortcut for Settings (Shift + S)
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
    // Cleanup animations
    Object.values(activeTweens).forEach(cancelAnimationFrame)
})

// ANIMATION LOGIC
const tweenScore = (station, targetVal) => {
    // If first load (undefined), snap instantly
    if (displayScores[station] === undefined) {
        displayScores[station] = targetVal
        return
    }

    const startVal = displayScores[station]
    if (startVal === targetVal) return

    // Cancel existing animation for this station
    if (activeTweens[station]) cancelAnimationFrame(activeTweens[station])

    const duration = 300 // ms
    const startTime = performance.now()

    const animate = (now) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Ease Out Quart (starts fast, slows down)
        const ease = 1 - Math.pow(1 - progress, 4)
        
        const current = startVal + (targetVal - startVal) * ease
        displayScores[station] = current

        if (progress < 1) {
            activeTweens[station] = requestAnimationFrame(animate)
        } else {
            displayScores[station] = targetVal // Snap to final
            delete activeTweens[station]
        }
    }
    
    activeTweens[station] = requestAnimationFrame(animate)
}

// PROJECTOR FEATURES
const initProjectorFeatures = async () => {
    // 1. Wake Lock
    if ('wakeLock' in navigator) {
        try {
            wakeLockSentinel = await navigator.wakeLock.request('screen')
            console.log("Wake Lock active")
        } catch (err) {
            console.error(err)
        }
    }

    // 2. Cursor Hiding
    document.addEventListener('mousemove', resetCursor)
    resetCursor()
}

const resetCursor = () => {
    cursorHidden.value = false
    document.body.style.cursor = 'default'
    if (cursorTimer) clearTimeout(cursorTimer)
    cursorTimer = setTimeout(() => {
        if (!showSettings.value) { // Don't hide if settings open
            cursorHidden.value = true
            document.body.style.cursor = 'none'
        }
    }, 500)
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

const containerStyle = computed(() => ({
    cursor: cursorHidden.value ? 'none' : 'default',
    transform: `scale(${zoomLevel.value / 100})`,
    transformOrigin: 'center center',
    height: '100%',
    width: '100%'
}))

// HELPERS
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
        
        // 1. Update Live Board (Immediate Visual Feedback)
        const newStatus = status === 'reset' ? 'waiting' : status
        
        await setDoc(doc(db, 'live_scores', String(s)), {
            station: Number(s),
            status: newStatus,
            updated_at: serverTimestamp(),
            ...(status === 'reset' ? { score: 0, heat: '-', entry_code: '' } : {}) 
        }, { merge: true })

        // 2. Update Main DB (Persist)
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
.cursor-hidden, .cursor-hidden * {
    cursor: none !important;
}

.page.scoreboard {
    width: 100vw;
    height: 100vh;
    background: #0f172a;
    color: white;
    font-family: 'Outfit', sans-serif;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.sb-header {
    height: 120px;
    background: transparent;
    /* border-bottom: 1px solid #334155; */
    display: flex;
    align-items: center;
    justify-content: center; /* CENTERED */
    padding: 0 2rem;
    flex-shrink: 0;
}
.brand { display: flex; align-items: center; gap: 1rem; }
.logo { height: 80px; width: auto; }
h1 { font-weight: 900; letter-spacing: 0.1em; color: white; font-size: 3rem; margin: 0; }

.status-indicator {
    display: flex; align-items: center; gap: 0.5rem;
    font-weight: 700; color: #ef4444; letter-spacing: 0.1em;
}
.pulse-dot {
    width: 12px; height: 12px; background: #ef4444; border-radius: 50%;
    animation: blink 1s infinite;
}
@keyframes blink { 50% { opacity: 0.5; } }

/* GRID SYSTEM */
.grid-container {
    flex: 1;
    padding: 0 1rem 1rem 1rem;
    display: grid;
    gap: 1rem;
    height: 100%;
}

/* CARDS */
.score-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
    transition: transform 0.1s;
    
    /* [CRITICAL FIX] Enable container queries for this card */
    container-type: size;
}

.card-header {
    /* REMOVED DARK BACKGROUND */
    /* background: #0f172a; */
    padding: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    /* border-bottom: 1px solid #334155; */
    position: absolute; width: 100%; top: 0; left: 0;
}
.st-lbl { font-size: 0.8rem; font-weight: 700; color: #64748b; letter-spacing: 0.1em; }
.st-num { 
    font-size: 2.2rem;
    font-weight: 800;
    color: #0f172a;
    background: #facc15;
    padding: 0.4rem 1.2rem;
    border-radius: 0 0 16px 0;
    letter-spacing: 0;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    border: none;
    line-height: 1;
}

.card-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    /* REMOVED GRADIENT */
    /* background: radial-gradient(circle at center, #334155 0%, #1e293b 100%); */
}
.score-val {
    font-family: 'Outfit', sans-serif; /* Explicit fallback */
    font-weight: 800; /* Reverted to Outfit 800 */
    line-height: 1;
    color: white;
    font-variant-numeric: tabular-nums; /* Prevent jitter */
}

/* FOOTER HIDDEN */
.card-footer {
    display: none;
}

/* STAMPS */
.card-stamp {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-15deg);
    font-size: 3rem;
    font-weight: 900;
    color: rgba(255,255,255,0.4);
    border: 6px solid rgba(255,255,255,0.4);
    padding: 0.5rem 2rem;
    border-radius: 12px;
    letter-spacing: 0.1em;
    pointer-events: none;
    z-index: 10;
    backdrop-filter: blur(2px);
    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.card-stamp.is-dq {
    color: #ef4444; border-color: #ef4444; background: rgba(0,0,0,0.6);
}
.card-stamp.is-scratch {
    color: #94a3b8; border-color: #94a3b8; background: rgba(0,0,0,0.8);
}
.card-stamp.is-rejump {
    color: #f97316; border-color: #f97316; background: rgba(0,0,0,0.6);
}

/* DYNAMIC SIZES - AUTOMATIC ADJUSTMENT (Responsive to Container Height) */
/* Uses cqh (Container Query Height) to scale text relative to the card size */

/* 1 STATION */
.grid-1 { grid-template-columns: 1fr; padding: 2rem; }
.grid-1 .score-val { font-size: 80cqmin; } /* Maximize for single view */

/* 2 STATIONS */
.grid-2 { grid-template-columns: 1fr 1fr; }
.grid-2 .score-val { font-size: 55cqmin; }

/* 4 STATIONS (2x2) */
.grid-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.grid-4 .score-val { font-size: 90cqmin; }

/* 6 STATIONS (3x2) */
.grid-6 { grid-template-columns: repeat(3, 1fr); grid-template-rows: 1fr 1fr; }
.grid-6 .score-val { font-size: 70cqmin; }

/* 8 STATIONS (4x2) */
.grid-8 { grid-template-columns: repeat(4, 1fr); grid-template-rows: 1fr 1fr; }
.grid-8 .score-val { font-size: 55cqmin; }

/* 12 STATIONS (4x3) */
.grid-12 { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(3, 1fr); }
.grid-12 .score-val { font-size: 70cqmin; }

/* MODAL STYLES */
.modal-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(5px);
    display: flex; align-items: center; justify-content: center;
}
.modal-card {
    background: #1e293b; color: white;
    width: 90%; max-width: 400px;
    border-radius: 16px; padding: 2rem;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    border: 1px solid #334155;
    text-align: center;
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
.btn-reset { background: #3b82f6; color: white; }

/* SETTINGS OVERLAY */
.settings-overlay {
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
}
.settings-card {
    background: #1e293b; padding: 2rem; border-radius: 16px; width: 300px;
    border: 1px solid #475569;
}
.settings-card h3 { margin-top: 0; color: white; }
.setting-row { margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
.toggle-btn {
    background: #334155; color: #94a3b8; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; cursor: pointer;
}
.toggle-btn.on { background: #22c55e; color: white; }
.btn-close-settings { width: 100%; padding: 1rem; background: #3b82f6; border: none; border-radius: 8px; color: white; font-weight: 700; cursor: pointer; }

/* SAFE AREA */
.safe-area-border {
    position: fixed; inset: 5%;
    border: 2px dashed #ef4444;
    pointer-events: none;
    z-index: 9999;
}

.zoom-wrapper {
    display: flex; flex-direction: column; height: 100%; width: 100%; transition: transform 0.1s;
}

.auth-container {
    display: flex; align-items: center; justify-content: center; height: 100%;
}
.auth-box {
    background: #1e293b; padding: 2rem; border-radius: 16px; text-align: center;
    border: 1px solid #334155;
    display: flex; flex-direction: column; gap: 1rem;
}
.auth-box input {
    padding: 0.8rem; border-radius: 8px; border: none; text-align: center;
    font-size: 1.2rem;
}
.auth-box button {
    padding: 0.8rem; background: #facc15; border: none; border-radius: 8px;
    font-weight: 800; cursor: pointer; color: #0f172a;
}
.error { color: #ef4444; font-weight: bold; }
</style>