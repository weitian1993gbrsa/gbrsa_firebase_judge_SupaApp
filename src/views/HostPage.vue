<template>
  <div class="layout command-layout">
    <header class="hud-header">
      <div class="hud-left">
        <img class="hud-logo" :src="COMPETITION_LOGO" alt="Logo">
        <div class="hud-title">
           <h1>{{ config.title }}</h1>
        </div>
      </div>

      <div class="hud-center">
        <nav class="nav-switch">
          <button class="nav-toggle" :class="{ active: activeMainView === 'monitor' }" @click="activeMainView = 'monitor'">
             <font-awesome-icon :icon="faDesktop" /> MONITOR
          </button>
          <button class="nav-toggle" :class="{ active: activeMainView === 'results' }" @click="activeMainView = 'results'">
             <font-awesome-icon :icon="faMicrophone" /> ANNOUNCE
          </button>
        </nav>
      </div>

      <div class="hud-right">
        <div class="status-pill" :class="{locked: isSystemLocked}">
            <div class="status-dot"></div>
            {{ isSystemLocked ? 'LOCKED' : 'SYSTEM LIVE' }}
        </div>
        <div class="clock-display">
            <font-awesome-icon :icon="faClock" class="clock-icon"/>
            {{ currentTime }}
        </div>
      </div>
    </header>

    <div v-if="activeMainView === 'monitor'" class="panel monitor-panel">
      
      <div class="control-island hud-bar">
        <!-- HEAT BLOCK -->
        <div class="hud-block heat-block">
            <button @click="changeHeat(-1)" class="hud-btn mini">
                <font-awesome-icon :icon="faChevronLeft" />
            </button>
            <div class="hud-val-group">
                <span class="hud-label">HEAT</span>
                <select v-model="activeHeat" class="hud-select">
                    <option v-for="h in distinctHeats" :key="h" :value="h">{{ h }}</option>
                </select>
            </div>
            <button @click="changeHeat(1)" class="hud-btn mini">
                <font-awesome-icon :icon="faChevronRight" />
            </button>
        </div>

        <!-- EVENT BLOCK -->
        <div class="hud-block event-block" v-if="currentEventName">
             <span class="hud-label">EVENT</span>
             <div class="hud-value text-accent">{{ currentEventName }}</div>
        </div>

        <!-- TIME BLOCK -->
        <div class="hud-block time-block" v-if="currentHeatTime">
             <span class="hud-label">START</span>
             <div class="hud-value text-cyan">{{ currentHeatTime }}</div>
        </div>
      </div>

      <div class="dashboard-grid" :style="dynamicGridStyle">
        <div 
          v-for="s in totalStations" 
          :key="s" 
          class="glass-module" 
          :class="getCardClass(s)"
          @click="openStationModal(s)"
        >
          <div class="module-header">
            <div class="st-indicator">{{ s }}</div>
            <div class="st-badge" :class="getStatusColor(s)">{{ getStationStatusText(s) }}</div>
          </div>

          <div v-if="getParticipantAtStation(s)" class="module-content">
             <div class="meta-row">
                <span class="meta-tag">{{ getParticipantAtStation(s).entry_code }}</span>
                <span class="meta-div">{{ getShortDiv(getParticipantAtStation(s).division) }}</span>
             </div>
             
             <div class="p-name-display" :class="{ 
                'is-multi': hasMultipleNames(getParticipantAtStation(s)),
                'is-long': isLongName(getParticipantAtStation(s))
             }">
                {{ getDisplayName(getParticipantAtStation(s)) }}
             </div>
             
             <div class="p-team-display">{{ getParticipantAtStation(s).team }}</div>

             <div v-if="isFreestyle(getParticipantAtStation(s))" class="judge-matrix">
                <div class="matrix-label">JUDGES</div>
                <div class="matrix-dots">
                    <div class="matrix-dot" :class="{active: hasJudgeResult(s, 'difficulty')}" title="Diff">D</div>
                    <div class="matrix-dot" :class="{active: hasJudgeResult(s, 'presentation')}" title="Pres">P</div>
                    <div class="matrix-dot" :class="{active: hasJudgeResult(s, 'technical')}" title="Tech">T</div>
                    <div class="matrix-dot" :class="{active: hasJudgeResult(s, 're')}" title="RE">R</div>
                </div>
             </div>
          </div>

          <div v-else class="module-empty">
            <div class="empty-placeholder">OPEN</div>
          </div>
        </div>
      </div>

      <div v-if="selectedStation !== null" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Station {{ selectedStation }}</h2>
            <button class="close-btn" @click="closeModal">✕</button>
          </div>
          <div class="modal-body" v-if="getParticipantAtStation(selectedStation)">
            <div class="modal-info-section">
                <div class="modal-label">PARTICIPANT</div>
                <div class="modal-names-stack">
                    <div 
                        v-for="(name, idx) in getNamesList(getParticipantAtStation(selectedStation))" 
                        :key="idx" 
                        class="modal-name-row"
                        :style="getModalNameStyle(name, getNamesList(getParticipantAtStation(selectedStation)).length)"
                    >
                        {{ name }}
                    </div>
                </div>
            </div>
            
            <div class="modal-info-section">
                <div class="modal-label">TEAM</div>
                <div class="modal-team">{{ getParticipantAtStation(selectedStation).team }}</div>
            </div>
            
            <div class="modal-info-grid">
                <div class="modal-info-section">
                    <div class="modal-label">ENTRY CODE</div>
                    <div class="modal-value">{{ getParticipantAtStation(selectedStation).entry_code }}</div>
                </div>
                <div class="modal-info-section">
                    <div class="modal-label">DIVISION</div>
                    <div class="modal-value">{{ getParticipantAtStation(selectedStation).division }}</div>
                </div>
            </div>
          </div>
          <div class="modal-body" v-else>
            <div class="modal-empty">
                <div class="empty-icon">EMPTY</div>
                <p>No participant assigned to this station</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeMainView === 'results'" class="panel results-panel">
       <div class="results-header" v-if="!selectedResultsEvent">
           <h2>Broadcast Announcements</h2>
           <p>Select an event to generate the official Winners List</p>
       </div>
       <div v-if="!selectedResultsEvent" class="event-tile-grid">
          <button v-for="e in resultsEvents" :key="e" @click="openEventResults(e)" class="event-tile">
            <div class="tile-bg-icon">
                <font-awesome-icon :icon="getEventIcon(e)" />
            </div>
            <div class="tile-content">
                <div class="tile-icon-wrapper">
                    <font-awesome-icon :icon="getEventIcon(e)" />
                </div>
                <div class="tile-info">
                    <span class="event-code">{{ e }}</span>
                    <span class="event-name">{{ getEventLabel(e) }}</span>
                </div>
            </div>
          </button>
       </div>

       <!-- NEW: WINNERS DETAIL VIEW -->
       <div v-if="selectedResultsEvent && winnersData" class="winners-view">
            <div class="winners-toolbar">
                <button class="back-btn" @click="closeEventResults">
                    <font-awesome-icon :icon="faChevronLeft" /> BACK
                </button>
                <div class="winners-title">
                    <font-awesome-icon :icon="getEventIcon(selectedResultsEvent)" class="title-icon"/>
                    <h2>{{ getEventLabel(selectedResultsEvent) }}</h2>
                </div>
                <button class="export-btn" @click="generateAnnouncementPreview(selectedResultsEvent)" :disabled="isExporting">
                    {{ isExporting ? 'GENERATING...' : 'EXPORT PDF' }}
                </button>
            </div>

            <div class="winners-content-scroll">
                <div v-for="group in winnersData.groups" :key="group.name" class="winners-group">
                    <div class="group-header">{{ group.name }} DIVISIONS</div>
                    <div class="group-grid">
                        <div v-for="div in group.divs" :key="div.name" class="division-card">
                            <div class="div-header">{{ div.name }}</div>
                            <div class="rank-list">
                                <template v-if="div.winners.length > 0">
                                    <div v-for="w in div.winners" :key="w.entry_code" class="rank-row" :class="'rank-'+w.place">
                                        <div class="rank-badge">{{ w.place }}</div>
                                        <div class="rank-info">
                                            <div class="rank-names">
                                                <span v-for="(n,i) in w.namesList" :key="i">{{ n }}<span v-if="i < w.namesList.length-1">, </span></span>
                                            </div>
                                            <div class="rank-team">{{ w.team }}</div>
                                        </div>
                                        <div class="rank-score">
                                            {{ winnersData.isFreestyle ? w.finalScore.toFixed(2) : w.finalScore.toFixed(0) }}
                                        </div>
                                    </div>
                                </template>
                                <div v-else class="no-results">No Results Yet</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCircleUser, faStopwatch, faStar, faMicrophone, faDesktop, faClock, faChevronLeft, faChevronRight, faBolt, faLayerGroup } from '@fortawesome/free-solid-svg-icons'
import { useConfig } from '../composables/useConfig'

const { config, getEventLabel } = useConfig()

const currentTime = ref('00:00:00')
const isSystemLocked = ref(false)
let timerInterval = null

const allParticipantsMeta = ref([]) 
const participants = ref([])        
const resultsSpeed = ref([])        
const resultsFreestyle = ref([])    
const liveScoresMap = ref({})
const activeHeat = ref(1)
const selectedStation = ref(null)

const activeMainView = ref('monitor') 
const isExporting = ref(false)
const exportEvent = ref('')

// HELPER: Get Event Icon
const getEventIcon = (e) => {
    const s = String(e).toLowerCase()
    if (s.includes('freestyle')) return faStar
    if (s.includes('relay')) return faLayerGroup
    if (s.includes('double')) return faBolt
    return faStopwatch
}

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
        '--grid-cols': cols,
        '--grid-rows': rows
    }
})

// --- TIME EXTRACTION ---
const currentEventName = computed(() => {
    if (!participants.value || participants.value.length === 0) return null
    const p = participants.value[0]
    return p.event || p.Event
})

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
    window.addEventListener('keydown', handleKeyNav)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)
})

onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval)
    unsubs.forEach(u => u())
    if (systemUnsub) systemUnsub()
    window.removeEventListener('keydown', handleKeyNav)
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('touchend', handleTouchEnd)
})

const handleKeyNav = (e) => {
    if (activeMainView.value === 'monitor') {
        if (e.key === 'ArrowRight') changeHeat(1)
        if (e.key === 'ArrowLeft') changeHeat(-1)
    } else if (activeMainView.value === 'results' && selectedResultsEvent.value) {
        if (e.key === 'ArrowRight') changeResultsEvent(1)
        if (e.key === 'ArrowLeft') changeResultsEvent(-1)
    }
}

let touchStartX = 0
const handleTouchStart = (e) => {
    // Works for both views now
    touchStartX = e.changedTouches[0].screenX
}
const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].screenX - touchStartX
    if (Math.abs(diff) > 50) {
        if (activeMainView.value === 'monitor') {
            if (diff < 0) changeHeat(1) // Swipe Left -> Next
            else changeHeat(-1) // Swipe Right -> Prev
        } else if (activeMainView.value === 'results' && selectedResultsEvent.value) {
            if (diff < 0) changeResultsEvent(1) // Swipe Left -> Next Event
            else changeResultsEvent(-1) // Swipe Right -> Prev Event
        }
    }
}

const changeResultsEvent = (direction) => {
    const list = resultsEvents.value
    if (!list || list.length === 0) return
    const currentIndex = list.indexOf(selectedResultsEvent.value)
    if (currentIndex === -1) return

    let newIndex = currentIndex + direction
    // Bound check or wrap around? Let's stop at edges like heats
    if (newIndex >= 0 && newIndex < list.length) {
        openEventResults(list[newIndex])
    }
}

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
    
    // NEW: Listen to Live Scores for status sync
    unsubs.push(onSnapshot(collection(db, 'live_scores'), snap => {
        const map = {}
        snap.forEach(d => map[d.id] = d.data())
        liveScoresMap.value = map
    }))
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

const distinctDivisions = computed(() => {
    let list = [...new Set(allParticipantsMeta.value.map(p => p.division))].filter(d => d && d !== 'SYSTEM')
    const configDivs = config.value.divisions || []
    list = [...new Set([...configDivs, ...list])]
    return list.sort((a,b) => {
        const idxA = configDivs.indexOf(a)
        const idxB = configDivs.indexOf(b)
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        if (idxA !== -1) return -1
        if (idxB !== -1) return 1
        return String(a).localeCompare(String(b), undefined, { numeric: true })
    })
})

const isFreestyle = (p) => FREESTYLE_EVENTS.includes(p?.event)
const getParticipantAtStation = (s) => participants.value.find(p => Number(p.station) === s)
const getShortDiv = (div) => div ? div.replace('Female','F').replace('Male','M').replace('Junior','Jr').replace('Senior','Sr') : ''

// getDynamicFontSize removed (unused)

const getModalNameStyle = (name, count) => {
    let size = 1.8 // Base size for 1 person
    
    // 1. Adjust based on count
    if (count > 1) size = 1.1

    // 2. Adjust based on length
    const len = name ? name.length : 0
    
    if (count === 1) {
        // More aggressive scaling for single names
        if (len > 15) size = 1.5
        if (len > 25) size = 1.2
        if (len > 35) size = 1.0
        if (len > 45) size = 0.8
    } else {
        // Existing logic for multiple names
        if (len > 20) size *= 0.85
        if (len > 30) size *= 0.85
    }

    return { 
        fontSize: `${size}rem` 
    }
}

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
    // 1. Check Live Status First (Syncs with Admin/Scoreboard)
    const ls = liveScoresMap.value[String(s)]
    if (ls && ls.status) {
        const lst = String(ls.status).toLowerCase()
        // Only keep ephemeral statuses here if needed, or score updates.
        // DQ/SCRATCH should come from p.status (Entries) to ensure Heat scope.
        if (lst === 'rejump') return 'RE-JUMP'
    }

    const p = getParticipantAtStation(s)
    if (!p) return 'EMPTY'
    const st = String(p.status || '').toLowerCase()
    if (st === 'dq') return 'DISQUALIFIED'
    if (st === 'scratch') return 'SCRATCH'
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

// COLORS UPDATED: COMPLETED is now GREEN, REJUMP is ORANGE
const getCardClass = (s) => {
    const p = getParticipantAtStation(s)
    if (!p) return 'is-empty'
    const st = getStationStatusText(s)
    if (st === 'DISQUALIFIED' || st === 'SCRATCH') return 'is-danger'
    if (st === 'RE-JUMP') return 'is-rejump'
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
// updateStationStatus removed (unused)

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

const selectedResultsEvent = ref(null)
const winnersData = ref(null)

const getWinnersForEvent = (eventName) => {
    const isFS = FREESTYLE_EVENTS.includes(eventName)
    const entries = allParticipantsMeta.value.filter(p => p.event === eventName)
    
    if (entries.length === 0) return null

    // 1. Group by Division
    const divWinners = {}
    
    // Sort divisions logic (copied from distinctDivisions but local to this event's divs if needed, 
    // but better to use the global distinctDivisions to ensure order)
    // We'll iterate distinctDivisions and check if they exist in this event
    
    for (const divName of distinctDivisions.value) {
        const divData = entries.filter(p => p.division === divName)
        if (divData.length === 0) continue

        // 2. Aggregate Results
        const processed = divData.map(p => {
            const row = { 
                ...p, 
                // names: [p.name1, p.name2, p.name3, p.name4].filter(n=>n).join('\n'), // Keep array for UI
                namesList: [p.name1, p.name2, p.name3, p.name4].filter(n => n && n.trim()),
                finalScore: 0,
                hasResult: false,
                breakdown: {} // For detailed view
            }
            
            if (isFS) {
                const res = resultsFreestyle.value.filter(r => String(r.entry_code) === String(p.entry_code))
                if (res.length > 0) {
                    const merged = { diff: 0, pres: 0, re: 0, miss: 0, break: 0, space: 0 }
                    const admin = res.find(r => r.judge_type === 'admin')
                    if (admin) {
                        merged.diff = admin.difficulty_score || 0
                        merged.pres = admin.presentation_score || 0
                        merged.re = admin.re_score || 0
                        merged.miss = admin.misses || 0
                        merged.break = admin.breaks || 0
                        merged.space = admin.space_violation || 0
                    } else {
                        res.forEach(r => {
                            if (r.judge_type === 'difficulty') merged.diff = r.score || 0
                            if (r.judge_type === 'presentation') merged.pres = r.score || 0
                            if (r.judge_type === 're') merged.re = 12 - (r.score || 0)
                            if (r.judge_type === 'technical') {
                                merged.miss = r.misses || 0
                                merged.break = r.breaks || 0
                                merged.space = r.space_violation || 0
                            }
                        })
                    }
                    row.finalScore = calculateScore({
                        difficulty_score: merged.diff,
                        presentation_score: merged.pres,
                        re_score: merged.re,
                        misses: merged.miss,
                        breaks: merged.break,
                        space_violation: merged.space
                    })
                    row.hasResult = true
                    row.breakdown = merged
                }
            } else {
                const res = resultsSpeed.value.find(r => String(r.entry_code) === String(p.entry_code))
                if (res) {
                    row.finalScore = Number(res.score) || 0
                    if (res.false_start) row.finalScore -= 10
                    row.hasResult = true
                    row.breakdown = { score: res.score, deduction: res.false_start ? 10 : 0 }
                }
            }
            return row
        })

        const toRank = processed.filter(r => r.hasResult && !['dq', 'scratch'].includes(String(r.status || '').toLowerCase()))
        toRank.sort((a,b) => b.finalScore - a.finalScore)

        let lastScore = null
        let lastPlace = 0
        toRank.forEach((row, index) => {
            if (row.finalScore !== lastScore) lastPlace = index + 1
            row.place = lastPlace
            lastScore = row.finalScore
        })
        // Return TOP 5 for now
        divWinners[divName] = toRank.filter(r => r.place <= 5)
    }

    // Group Divisions by Gender/Category for display
    const groups = [
        { name: 'FEMALE', divs: [] },
        { name: 'MALE', divs: [] },
        { name: 'OPEN', divs: [] } // For mixed or open
    ]
    
    // We only want groups that have data
    const activeDivisions = Object.keys(divWinners)
    
    activeDivisions.forEach(d => {
        const u = d.toUpperCase()
        if (u.includes('FEMALE') || u.includes('GIRL')) groups[0].divs.push({ name: d, winners: divWinners[d] })
        else if (u.includes('MALE') || u.includes('BOY')) groups[1].divs.push({ name: d, winners: divWinners[d] })
        else groups[2].divs.push({ name: d, winners: divWinners[d] })
    })

    return { 
        eventName, 
        isFreestyle: isFS,
        groups: groups.filter(g => g.divs.length > 0)
    }
}

const openEventResults = (eventName) => {
    selectedResultsEvent.value = eventName
    winnersData.value = getWinnersForEvent(eventName)
}
const closeEventResults = () => {
    selectedResultsEvent.value = null
    winnersData.value = null
}

const generateAnnouncementPreview = async (eventName) => {
    if (isExporting.value) return
    
    exportEvent.value = eventName
    isExporting.value = true
    
    try {
        const doc = new jsPDF()
        const isFS = FREESTYLE_EVENTS.includes(eventName)
        const entries = allParticipantsMeta.value.filter(p => p.event === eventName)
        
        if (entries.length === 0) {
            alert("No participants found for this event.")
            isExporting.value = false
            return
        }

        // 1. Group by Division
        const divWinners = {}
        for (const divName of distinctDivisions.value) {
            const divData = entries.filter(p => p.division === divName)
            if (divData.length === 0) continue

            // 2. Aggregate Results
            const processed = divData.map(p => {
                const row = { 
                    ...p, 
                    names: [p.name1, p.name2, p.name3, p.name4].filter(n=>n).join('\n'),
                    finalScore: 0,
                    hasResult: false
                }
                
                if (isFS) {
                    const res = resultsFreestyle.value.filter(r => String(r.entry_code) === String(p.entry_code))
                    if (res.length > 0) {
                        const merged = { diff: 0, pres: 0, re: 0, miss: 0, break: 0, space: 0 }
                        const admin = res.find(r => r.judge_type === 'admin')
                        if (admin) {
                            merged.diff = admin.difficulty_score || 0
                            merged.pres = admin.presentation_score || 0
                            merged.re = admin.re_score || 0
                            merged.miss = admin.misses || 0
                            merged.break = admin.breaks || 0
                            merged.space = admin.space_violation || 0
                        } else {
                            res.forEach(r => {
                                if (r.judge_type === 'difficulty') merged.diff = r.score || 0
                                if (r.judge_type === 'presentation') merged.pres = r.score || 0
                                if (r.judge_type === 're') merged.re = 12 - (r.score || 0)
                                if (r.judge_type === 'technical') {
                                    merged.miss = r.misses || 0
                                    merged.break = r.breaks || 0
                                    merged.space = r.space_violation || 0
                                }
                            })
                        }
                        row.finalScore = calculateScore({
                            difficulty_score: merged.diff,
                            presentation_score: merged.pres,
                            re_score: merged.re,
                            misses: merged.miss,
                            breaks: merged.break,
                            space_violation: merged.space
                        })
                        row.hasResult = true
                    }
                } else {
                    const res = resultsSpeed.value.find(r => String(r.entry_code) === String(p.entry_code))
                    if (res) {
                        row.finalScore = Number(res.score) || 0
                        if (res.false_start) row.finalScore -= 10
                        row.hasResult = true
                    }
                }
                return row
            })

            const toRank = processed.filter(r => r.hasResult && !['dq', 'scratch'].includes(String(r.status || '').toLowerCase()))
            toRank.sort((a,b) => b.finalScore - a.finalScore)

            let lastScore = null
            let lastPlace = 0
            toRank.forEach((row, index) => {
                if (row.finalScore !== lastScore) lastPlace = index + 1
                row.place = lastPlace
                lastScore = row.finalScore
            })
            divWinners[divName] = toRank.filter(r => r.place <= 5)
        }

        let logoBase64 = null
        let logoRatio = 1
        try {
            const logoImg = await new Promise((resolve) => {
                const img = new Image()
                img.src = COMPETITION_LOGO
                img.crossOrigin = "Anonymous"
                img.onload = () => resolve(img)
                img.onerror = () => resolve(null)
            })
            if(logoImg) {
                const canvas = document.createElement("canvas")
                canvas.width = logoImg.width; canvas.height = logoImg.height
                const ctx = canvas.getContext("2d"); ctx.drawImage(logoImg,0,0)
                logoBase64 = canvas.toDataURL("image/png")
                if (logoImg.height > 0) logoRatio = logoImg.width / logoImg.height
            }
        } catch(e) { console.warn("Logo load failed", e) }

        // Generate Icon Data URL
        let iconDataUrl = null
        try {
            const icon = faCircleUser.icon
            const [ w, h, , , path ] = icon
            const canvas = document.createElement('canvas')
            canvas.width = 64; canvas.height = 64
            const ctx = canvas.getContext('2d')
            const scale = 64 / Math.max(w, h)
            ctx.scale(scale, scale)
            const p = new Path2D(path)
            ctx.fillStyle = "#1e293b"
            ctx.fill(p)
            iconDataUrl = canvas.toDataURL('image/png')
        } catch (e) { console.warn("Icon gen failed", e) }

        // Group Divisions by Gender
        const groups = [
            { name: 'FEMALE', divs: [] },
            { name: 'MALE', divs: [] },
            { name: 'OPEN', divs: [] }
        ]
        
        distinctDivisions.value.forEach(d => {
            const u = d.toUpperCase()
            if (u.includes('FEMALE') || u.includes('GIRL')) groups[0].divs.push(d)
            else if (u.includes('MALE') || u.includes('BOY')) groups[1].divs.push(d)
            else groups[2].divs.push(d)
        })

        const activeGroups = groups.filter(g => g.divs.some(d => divWinners[d] && divWinners[d].length > 0))

        let lastDrawnPage = 0
        const drawHeader = () => {
             const pg = doc.internal.getCurrentPageInfo().pageNumber
             if (pg === lastDrawnPage) return
             lastDrawnPage = pg

             if(logoBase64) {
                let w = 20; let h = 20;
                if (logoRatio > 1) { h = 20 / logoRatio }
                else { w = 20 * logoRatio }
                doc.addImage(logoBase64, 'PNG', 15, 10, w, h)
            }
            doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(config.value.title, 40, 18)
            doc.setFontSize(11); doc.setFont("helvetica", "normal"); doc.text(eventName, 195, 18, { align: 'right' })
            doc.setFontSize(10); doc.text("MC Announcement - Winners List", 40, 26)
            
            doc.rect(160, 21, 35, 6)
            doc.setFontSize(9); doc.setFont("helvetica", "bold")
            doc.text("MC ANNOUNCE", 177.5, 24.1, { align: "center", baseline: "middle" })
            
            doc.line(15, 33, 195, 33)

            doc.setFontSize(11); doc.setFont("helvetica", "bold")
            doc.text(`Event: ${getEventLabel(eventName)}`, 15, 40)
        }

        drawHeader()

        activeGroups.forEach((group, gIndex) => {
            if (gIndex > 0) {
                doc.addPage()
                drawHeader()
            }
            
            const groupWinners = group.divs.flatMap(d => divWinners[d] || [])
            const isTeamEvent = groupWinners.some(w => w.names.includes('\n'))
            const rowWeight = isTeamEvent ? 2.5 : 1
            const weightedRow = groupWinners.length * rowWeight
            const totalDivs = group.divs.length

            let baseFontSize = 15
            let headFontSize = 16
            let cellPadding = 2.5
            let spacing = 25

            if (weightedRow > 15 || totalDivs >= 3) {
                baseFontSize = 12; headFontSize = 13; cellPadding = 1.6; spacing = 20
            }
            if (weightedRow > 30 || totalDivs >= 4 || (isTeamEvent && totalDivs >= 3)) {
                baseFontSize = 10; headFontSize = 11; cellPadding = 1.0; spacing = 10
            }
            
            let currentY = 45
            for (const divName of group.divs) {
                const winners = divWinners[divName]
                if (!winners || winners.length === 0) continue

                if (currentY + 20 > 280) {
                    doc.addPage()
                    drawHeader()
                    currentY = 45
                }

                doc.setFontSize(baseFontSize + 1); doc.setFont("helvetica", "bold")
                doc.text(`Division: ${divName}`, 15, currentY)
                currentY += (baseFontSize / 2) + 2

                const body = winners.map(w => {
                    let placeStr = String(w.place)
                    const tieCount = winners.filter(x => x.place === w.place).length
                    if (tieCount > 1) placeStr += " T"
                    const scoreStr = isFS ? w.finalScore.toFixed(2) : w.finalScore.toFixed(0)
                    return [placeStr, w.names, w.team, scoreStr]
                })

                autoTable(doc, {
                    head: [['Place', 'Names', 'Team', 'Score']],
                    body: body,
                    startY: currentY,
                    theme: 'grid',
                    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: headFontSize, halign: 'center' },
                    styles: { fontSize: baseFontSize, cellPadding: cellPadding, halign: 'center', valign: 'middle', textColor: [0,0,0] },
                    pageBreak: 'auto',
                    margin: { top: 50, bottom: 15 },
                    columnStyles: { 
                        0: { cellWidth: 22, fontStyle: 'bold' }, 
                        1: { halign: 'left', cellWidth: 80, cellPadding: { top: 2.5, right: 2.5, bottom: 2.5, left: 6 } },
                        2: { halign: 'left' }, 
                        3: { cellWidth: 35, fontStyle: 'bold' } 
                    },
                    didDrawCell: (data) => {
                        if (data.section === 'body' && data.column.index === 1 && iconDataUrl) {
                            const cell = data.cell
                            const w = winners[data.row.index]
                            if (!w) return

                            const rawNames = [w.name1, w.name2, w.name3, w.name4].filter(n => n && n.trim())
                            if (rawNames.length === 0) return

                            const fontSizePt = cell.styles.fontSize
                            const lineHeightFactor = doc.getLineHeightFactor()
                            const lineHeightMm = fontSizePt * lineHeightFactor * 0.352778
                            const iconSize = 3

                            const totalRenderedLines = cell.text.length
                            const contentHeight = totalRenderedLines * lineHeightMm
                            const startY = cell.y + (cell.height - contentHeight) / 2

                            let currentNameIndex = 0

                            cell.text.forEach((line, i) => {
                                if (currentNameIndex >= rawNames.length) return
                                const cleanLine = String(line).trim()
                                if (!cleanLine) return
                                const targetName = String(rawNames[currentNameIndex]).trim()
                                
                                if (targetName.toLowerCase().startsWith(cleanLine.toLowerCase())) {
                                    const lineMidY = startY + (i * lineHeightMm) + (lineHeightMm / 2)
                                    const iconY = lineMidY - (iconSize / 2)
                                    doc.addImage(iconDataUrl, 'PNG', cell.x + 2, iconY, iconSize, iconSize)
                                    currentNameIndex++
                                }
                            })
                        }
                    },
                    didDrawPage: () => { drawHeader() },
                    didParseCell: (data) => {
                        if (data.section === 'body' && data.column.index === 0) {
                            const rowIdx = data.row.index
                            const place = winners[rowIdx].place
                            if (place === 1) data.cell.styles.fillColor = [255, 215, 0]
                            else if (place === 2) data.cell.styles.fillColor = [192, 192, 192]
                            else if (place >= 3 && place <= 5) data.cell.styles.fillColor = [205, 127, 50]
                            if (place <= 5) data.cell.styles.fontStyle = 'bold'
                        }
                    }
                })
                currentY = doc.lastAutoTable.finalY + spacing
            }
        })
        
        // Footer on Every Page
        const totalPages = doc.internal.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i)
            doc.setFontSize(8); doc.setTextColor(100); doc.setFont("helvetica", "normal")
            doc.text(`Generated: ${currentTime.value} | Page ${i} of ${totalPages}`, 15, doc.internal.pageSize.getHeight() - 10)
        }

        const blob = doc.output('blob')
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
        setTimeout(() => URL.revokeObjectURL(url), 10000)

    } catch (err) {
        console.error(err)
        alert("Export failed: " + err.message)
    } finally {
        isExporting.value = false
        exportEvent.value = ''
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
/* --- DEEP SPACE COMMAND THEME --- */
.command-layout { 
    background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
    height: 100vh; 
    color: #f8fafc; 
    font-family: 'Outfit', sans-serif; 
    display: flex; 
    flex-direction: column; 
    overflow: hidden; 
}

/* HUD HEADER */
.hud-header { 
    background: rgba(15, 23, 42, 0.6); 
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding: 0 2rem; 
    height: 80px; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    flex-shrink: 0;
    z-index: 20;
}

.hud-left { display: flex; align-items: center; gap: 1rem; }
.hud-logo { height: 48px; filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.3)); }
.hud-title { display: flex; flex-direction: column; }
.hud-sub { font-size: 0.7rem; font-weight: 700; color: #64748b; letter-spacing: 2px; }
.hud-title h1 { font-size: 1.2rem; font-weight: 800; color: white; margin: 0; line-height: 1; text-transform: uppercase; letter-spacing: 0.5px; }

/* NAV TOGGLE */
.nav-switch { 
    background: rgba(0,0,0,0.3); 
    padding: 4px; 
    border-radius: 99px; 
    display: flex; 
    border: 1px solid rgba(255,255,255,0.05);	
}
.nav-toggle {
    background: transparent;
    border: none;
    color: #94a3b8;
    padding: 0.6rem 1.5rem;
    border-radius: 99px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
}
.nav-toggle svg { font-size: 1rem; }
.nav-toggle:hover { color: white; }
.nav-toggle.active { 
    background: #facc15; 
    color: #0f172a; 
    box-shadow: 0 0 15px rgba(250, 204, 21, 0.3);
}

/* HUD RIGHT */
.hud-right { display: flex; align-items: center; gap: 1.5rem; }
.status-pill {
    display: flex; align-items: center; gap: 6px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 1px;
}
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; animation: pulse 2s infinite; }
.status-pill.locked { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #ef4444; }
.status-pill.locked .status-dot { background: #ef4444; box-shadow: 0 0 8px #ef4444; }

.clock-display { 
    font-family: 'JetBrains Mono', monospace; 
    font-size: 1.1rem; 
    font-weight: 700; 
    color: white; 
    display: flex; 
    align-items: center; 
    gap: 8px;
    opacity: 0.8;
}
.clock-icon { color: #facc15; }

/* CONTROL ISLAND */
/* MONITOR PANEL */
.monitor-panel { padding: 1.5rem 2rem; flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }

.dashboard-grid {
    display: grid;
    gap: 1rem;
    flex: 1;
    min-height: 0;
    grid-template-columns: 1fr; /* Mobile Default */
}
@media (min-width: 640px) {
    .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
    .dashboard-grid { 
        grid-template-columns: repeat(var(--grid-cols, 4), 1fr); 
        grid-template-rows: repeat(var(--grid-rows, 3), minmax(0, 1fr));
    }
}

/* HUD BAR (New Control Island) */
.hud-bar {
    position: sticky; top: 0; z-index: 10;
    margin: 0 auto 2rem auto;
    display: flex; align-items: stretch; justify-content: center;
    gap: 1rem;
    padding: 0 1rem;
    pointer-events: none; /* Let clicks pass through gaps */
}
.hud-bar > * { pointer-events: auto; } /* Re-enable clicks on blocks */

.hud-block {
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 0.5rem 1.2rem;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
    min-width: 100px;
    box-shadow: 0 4px 15px -2px rgba(0,0,0,0.3);
    transition: all 0.2s ease;
}
.hud-block:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-2px); }

/* Heat Block Specifics */
.heat-block { flex-direction: row; gap: 1rem; padding: 0.4rem 1rem; border-color: rgba(250, 204, 21, 0.15); }
.hud-btn {
    width: 32px; height: 32px; border-radius: 8px; border: none;
    background: rgba(255,255,255,0.05); color: #94a3b8;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
}
.hud-btn:hover { background: #facc15; color: #000; }
.hud-val-group { display: flex; flex-direction: column; align-items: center; }

/* Labels & Values */
.hud-label { 
    font-size: 0.75rem; 
    font-weight: 800; 
    color: #cbd5e1; 
    letter-spacing: 1.5px; 
    margin-bottom: 4px; 
    text-transform: uppercase; 
}

.hud-select { 
    background: transparent; border: none; outline: none; 
    font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; font-weight: 800; color: #fff; 
    cursor: pointer; text-align: center; 
}
.hud-value {
    font-family: 'JetBrains Mono', monospace; font-size: 1.4rem; font-weight: 800; color: white;
}
.text-accent { color: #facc15 !important; }
.text-cyan { color: #22d3ee !important; }

/* Event & Time Specifics */
.event-block { min-width: 140px; border-left: 3px solid rgba(250, 204, 21, 0.5); }
.time-block { min-width: 110px; border-left: 3px solid rgba(34, 211, 238, 0.5); }

/* GLASS MODULES (Grid) */
.glass-module {
    background: rgba(30, 41, 59, 0.4);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.03);
    border-radius: 16px;
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    min-height: 160px;
}
.glass-module:hover {
    background: rgba(30, 41, 59, 0.7);
    border-color: rgba(255,255,255,0.2);
    transform: translateY(-4px);
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
}
.glass-module::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.03), transparent);
    opacity: 0;
    transition: 0.3s;
}
.glass-module:hover::before { opacity: 1; }

/* STATUS ACCENTS */
.glass-module.is-active { border: 1px solid #facc15; box-shadow: 0 0 20px rgba(250, 204, 21, 0.1); }
.glass-module.is-completed { 
    border: 1px solid rgba(16, 185, 129, 0.5); 
    background: rgba(16, 185, 129, 0.15);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.1);
}
.glass-module.is-danger { border: 1px solid rgba(239, 68, 68, 0.5); background: rgba(239, 68, 68, 0.05); }

/* MODULE INTERIOR */
.module-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
.st-indicator { font-size: 3rem; font-weight: 900; color: rgba(255,255,255,0.03); line-height: 0.8; position: absolute; right: 10px; top: 10px; pointer-events: none; }
.st-badge { 
    font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; 
    letter-spacing: 0.5px; text-transform: uppercase; z-index: 2;
    background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
}
.st-badge.text-green { color: #34d399; border-color: rgba(52, 211, 153, 0.3); }
.st-badge.text-yellow { color: #facc15; border-color: rgba(250, 204, 21, 0.3); }
.st-badge.text-red { color: #f87171; border-color: rgba(248, 113, 113, 0.3); }

.module-content { flex: 1; display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 1; }
.module-empty { display: flex; align-items: center; justify-content: center; height: 100%; opacity: 0.2; }
.empty-placeholder { font-weight: 800; font-size: 1.5rem; letter-spacing: 4px; }

.meta-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.meta-tag { background: rgba(255,255,255,0.08); font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; padding: 2px 6px; border-radius: 4px; color: #94a3b8; }
.meta-div { color: #facc15; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }

.p-name-display { font-size: 1.6rem; font-weight: 800; color: white; line-height: 1.1; margin-bottom: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.p-name-display.is-multi { font-size: 1.1rem; white-space: normal; line-clamp: 2; -webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical; }

.p-team-display { font-size: 0.9rem; color: #94a3b8; font-weight: 600; }

.judge-matrix { 
    margin-top: auto; 
    padding-top: 10px; 
    border-top: 1px solid rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    align-items: flex-end; /* Align right */
}
.matrix-label { font-size: 0.55rem; color: #64748b; font-weight: 700; margin-bottom: 6px; letter-spacing: 1px; }
.matrix-dots { display: flex; gap: 6px; }
.matrix-dot { 
    width: 20px; height: 20px; 
    border-radius: 4px; 
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.2); 
    display: flex; align-items: center; justify-content: center;
    font-size: 0.6rem; font-weight: 700;
}
.matrix-dot.active { background: #10b981; color: #020617; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }

/* RESULTS PANEL (Tiles) */
/* RESULTS PANEL (Tiles) */
.results-panel { padding: 2rem; display: flex; flex-direction: column; align-items: center; }
.results-header { text-align: center; margin-bottom: 3rem; }
.results-header h2 { font-size: 2.5rem; font-weight: 800; background: linear-gradient(to right, #fff, #94a3b8); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 0.5rem 0; }
.results-header p { color: #64748b; font-size: 1.1rem; }

.event-tile-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
    gap: 1.5rem; 
    width: 100%; max-width: 1400px; 
}

.event-tile {
    background: rgba(30, 41, 59, 0.4);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 20px;
    padding: 2rem;
    display: flex;
    align-items: center;
    text-align: left;
    gap: 1.5rem;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    min-height: 120px;
}
.event-tile:hover {
    background: rgba(30, 41, 59, 0.8);
    border-color: #facc15;
    transform: translateY(-5px);
    box-shadow: 0 20px 50px -10px rgba(0,0,0,0.5);
}
.event-tile:hover .tile-icon-wrapper { background: #facc15; color: #0f172a; transform: scale(1.1) rotate(-5deg); }
.tile-bg-icon {
    position: absolute; right: -20px; bottom: -20px;
    font-size: 8rem; color: rgba(255,255,255,0.02);
    transform: rotate(15deg); pointer-events: none;
}
.tile-content { display: flex; align-items: center; gap: 1.5rem; position: relative; z-index: 2; width: 100%; }

.tile-icon-wrapper {
    width: 56px; height: 56px;
    border-radius: 16px;
    background: rgba(255,255,255,0.05);
    color: #facc15;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
    transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.tile-info { display: flex; flex-direction: column; }
.event-code { font-size: 1.4rem; font-weight: 800; color: white; line-height: 1; margin-bottom: 4px; }
.event-name { font-size: 0.85rem; color: #94a3b8; line-height: 1.3; font-weight: 500; }

.loading-overlay {
    position: absolute; inset: 0; background: rgba(15, 23, 42, 0.9);
    display: flex; align-items: center; justify-content: center; z-index: 10;
}
.spinner { width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #facc15; border-radius: 50%; animation: spin 0.8s linear infinite; }

/* MODAL & OVERLAY */
.modal-overlay { 
    position: fixed; 
    inset: 0; 
    background: rgba(0,0,0,0.85); 
    z-index: 100; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    backdrop-filter: blur(5px); 
}

.modal-content { 
    background: rgba(15, 23, 42, 0.95); 
    width: 500px; 
    padding: 2.5rem; 
    border-radius: 20px; 
    border: 1px solid rgba(250, 204, 21, 0.2); 
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    position: relative;
    backdrop-filter: blur(20px);
}

.modal-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center;
    margin-bottom: 1rem; 
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
    font-size: 1.5rem;
    font-weight: 800;
    color: #facc15;
    margin: 0;
    letter-spacing: 0.5px;
}

.close-btn { 
    background: rgba(255, 255, 255, 0.05); 
    border: 1px solid rgba(255, 255, 255, 0.1); 
    color: white; 
    font-size: 1.2rem; 
    cursor: pointer; 
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
}

.modal-body {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.modal-info-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
}

.modal-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1.5px;
}

.modal-names-stack { 
    display: flex; 
    flex-direction: column; 
    gap: 8px;
}

.modal-name-row { 
    font-weight: 800; 
    color: white; 
    line-height: 1.25; 
    letter-spacing: 0.5px;
    text-shadow: 0 2px 10px rgba(250, 204, 21, 0.2);
    white-space: nowrap; 
    overflow: hidden; 
    text-overflow: ellipsis; 
    max-width: 100%;
}

.modal-team { 
    font-size: 1.2rem; 
    font-weight: 600; 
    color: #cbd5e1;
    letter-spacing: 0.5px;
}

.modal-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
    font-family: 'JetBrains Mono', monospace;
}

.modal-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    text-align: left;
}

.modal-empty {
    text-align: center;
    padding: 3rem 0;
    opacity: 0.5;
}

.modal-content .empty-icon {
    font-size: 2rem; 
    font-weight: 800; 
    color: #94a3b8; 
    letter-spacing: 4px; 
    margin-bottom: 1rem;
}
 
.footer { display: none; /* Hide footer for cleaner look */ }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

/* RESPONSIVE */
@media (max-width: 1024px) {
    .hud-title { display: none; }
    .results-panel { padding: 2rem; }
}

/* WINNERS VIEW */
.winners-view {
    width: 100%;
    max-width: 1800px; /* Increased from 1400px */
    display: flex;
    flex-direction: column;
    height: calc(100vh - 120px); /* Subtract header/footer space */
    overflow: hidden;
    gap: 1.5rem;
}

.winners-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(12px);
    padding: 1rem 2rem;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.05);
}

.winners-title {
    display: flex;
    align-items: center;
    gap: 1rem;
}
.title-icon { font-size: 1.5rem; color: #facc15; }
.winners-title h2 {
    font-size: 1.8rem;
    font-weight: 800;
    margin: 0;
    color: white;
    letter-spacing: 1px;
}

.back-btn, .export-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: #94a3b8;
    padding: 0.8rem 1.5rem;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
}
.back-btn:hover { background: rgba(255,255,255,0.1); color: white; transform: translateX(-2px); }
.export-btn:hover { background: #facc15; color: #0f172a; border-color: #facc15; transform: translateY(-2px); }
.export-btn:disabled { opacity: 0.5; cursor: wait; }

.winners-content-scroll {
    flex: 1;
    min-height: 0; /* Crucial for nested flex scrolling */
    overflow-y: auto;
    padding-right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 3rem;
    padding-bottom: 2rem;
}

/* Custom Scrollbar */
.winners-content-scroll::-webkit-scrollbar { width: 8px; }
.winners-content-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 4px; }
.winners-content-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
.winners-content-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

.winners-group { display: flex; flex-direction: column; gap: 1.5rem; }

.group-header {
    font-size: 1.2rem;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 2px;
    border-bottom: 2px solid rgba(255,255,255,0.05);
    padding-bottom: 0.5rem;
}

.group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
}

.division-card {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(255,255,255,0.03);
    border-radius: 16px;
    overflow: hidden;
}

.div-header {
    background: rgba(0,0,0,0.2);
    padding: 1rem;
    font-weight: 700;
    color: #facc15;
    text-align: center;
    letter-spacing: 1px;
    font-size: 0.9rem;
}

.rank-list { padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }

.rank-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 8px;
    background: rgba(255,255,255,0.02);
    transition: 0.2s;
}
.rank-row:hover { background: rgba(255,255,255,0.05); }

/* RANK BADGES */
.rank-badge {
    width: 32px; height: 32px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800;
    font-size: 1rem;
    color: white;
    background: #334155;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

.rank-1 .rank-badge { background: linear-gradient(135deg, #facc15 0%, #ca8a04 100%); color: #422006; box-shadow: 0 0 15px rgba(250, 204, 21, 0.3); }
.rank-2 .rank-badge { background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%); color: #0f172a; }
.rank-3 .rank-badge { background: linear-gradient(135deg, #fb923c 0%, #c2410c 100%); color: #431407; }

.rank-info { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.rank-names { 
    font-weight: 700; 
    color: white; 
    white-space: normal; /* Allow wrapping */
    line-height: 1.2;
}
.rank-team { font-size: 0.8rem; color: #94a3b8; }

.rank-score {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800;
    font-size: 1.2rem;
    color: #facc15;
}

.no-results {
    text-align: center;
    padding: 2rem;
    color: #64748b;
    font-style: italic;
}
</style>