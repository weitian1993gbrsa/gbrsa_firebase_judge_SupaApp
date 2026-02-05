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
                <div class="modal-names-stack">
                    <div v-for="(name, idx) in getNamesList(getParticipantAtStation(selectedStation))" :key="idx" class="modal-name-row" :style="{ fontSize: getDynamicFontSize(name) }">
                        {{ name }}
                    </div>
                </div>
                
                <div class="modal-team">{{ getParticipantAtStation(selectedStation).team }}</div>
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
const liveScoresMap = ref({})
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

// Dynamic naming calculation
const getDynamicFontSize = (name) => {
    if (!name) return '1.2rem'
    const len = name.length
    if (len > 30) return '0.8rem'
    if (len > 20) return '0.95rem'
    if (len > 15) return '1.1rem'
    return '1.3rem'
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
        if (lst === 'dq') return 'DISQUALIFIED'
        if (lst === 'scratch') return 'SCRATCH'
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
.monitor-panel { padding: 1.5rem 2.5rem; flex: 1; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; }

/* FLOATING CONTROLS */
.floating-controls { 
    display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 2rem;
    background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); padding: 0.75rem 2.5rem; 
    border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); width: fit-content; margin-left: auto; margin-right: auto;
    flex-shrink: 0; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.3);
}
.heat-info-group { display: flex; align-items: center; gap: 2rem; }
.ctrl-btn { background: rgba(255,255,255,0.08); color: white; border: none; padding: 0.5rem 1.25rem; border-radius: 999px; cursor: pointer; font-weight: 700; transition: 0.2s; }
.ctrl-btn:hover { background: white; color: black; transform: translateY(-1px); }
.heat-selector, .heat-schedule { display: flex; flex-direction: column; align-items: center; }
.lbl { font-size: 0.6rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 1px; }
.heat-select { background: transparent; color: #facc15; border: none; font-size: 1.8rem; font-weight: 800; text-align: center; cursor: pointer; outline: none; }
.time-val { font-size: 1.8rem; font-weight: 800; color: #38bdf8; font-family: 'JetBrains Mono', monospace; text-shadow: 0 0 20px rgba(56, 189, 248, 0.4); }

/* GRID LAYOUT */
.stations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
    padding-bottom: 2rem;
}

/* PREMIUM CARDS */
.dash-card { 
    background: linear-gradient(145deg, #1e293b, #0f172a); 
    border-radius: 12px; /* Slightly reduced radius */
    border: 1px solid rgba(255,255,255,0.05); 
    position: relative; 
    display: flex; 
    flex-direction: column; 
    padding: 1rem; /* Tighter padding */
    cursor: pointer; 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); 
    overflow: hidden; 
    min-height: 150px; /* Reduced from 180px for less whitespace */
}
/* ... hover ... */
.dash-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.2); box-shadow: 0 15px 20px -5px rgba(0,0,0,0.3); }

/* ... (Variants omitted, they are unchanged or use ... ) ... */

/* CARD INTERIOR */
.card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; /* Reduced margin */ }
.st-num { font-size: 2.5rem; font-weight: 900; color: rgba(255,255,255,0.05); line-height: 0.8; position: absolute; right: 8px; top: 8px; pointer-events: none; }
.st-status { 
    font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 4px; 
    letter-spacing: 0.5px; text-transform: uppercase; z-index: 2;
    background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8;
}

/* ... Status Colors ... */

.card-content { flex: 1; display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 1; }
.card-content.empty { align-items: center; opacity: 0.3; justify-content: center; }
.empty-icon { font-weight: 800; color: #94a3b8; letter-spacing: 4px; font-size: 1.2rem; }

.entry-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.entry-pill { background: rgba(255,255,255,0.1); font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; padding: 2px 8px; border-radius: 4px; color: #cbd5e1; }

.div-pill { 
    background: #facc15; color: #0f172a; 
    font-size: 0.8rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; 
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

/* HUGE NAME */
.p-name { font-size: 1.6rem; font-weight: 800; color: white; line-height: 1.1; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.p-name.is-long { font-size: 1.3rem; }
.p-name.is-multi { 
    font-size: 1.1rem; 
    white-space: normal; 
    line-height: 1.2; 
    display: -webkit-box; 
    -webkit-line-clamp: 2; 
    line-clamp: 2; /* Fix standard property lint */
    -webkit-box-orient: vertical; 
    overflow: hidden; 
}
.p-team { font-size: 0.95rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }

.judge-tracker { margin-top: auto; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); }
.tracker-lbl { font-size: 0.6rem; color: #64748b; font-weight: 700; margin-bottom: 6px; letter-spacing: 1px; text-transform: uppercase; }
.dots-row { display: flex; gap: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #334155; box-shadow: inset 0 1px 2px rgba(0,0,0,0.3); transition: 0.3s; }
.dot.done { background: #10b981; box-shadow: 0 0 8px #10b981; transform: scale(1.2); }

/* MODAL & FOOTER */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 50; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
.modal-content { background: #1e293b; width: 400px; padding: 2rem; border-radius: 16px; border: 1px solid #475569; text-align: center; }
.modal-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; color: #94a3b8; }
/* MODAL HERO NEW STYLES */
.modal-names-stack { display: flex; flex-direction: column; gap: 6px; margin: 0 0 1rem 0; align-items: flex-start; width: 100%; overflow: hidden; }
.modal-name-row { font-size: 1.1rem; font-weight: 700; color: white; line-height: 1.2; letter-spacing: 0.5px; white-space: nowrap; max-width: 100%; text-overflow: ellipsis; overflow: hidden; text-align: left; }
.modal-team { color: #94a3b8; font-size: 0.9rem; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; text-align: left; width: 100%; }
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