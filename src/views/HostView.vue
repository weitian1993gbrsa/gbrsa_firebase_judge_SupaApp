<template>
  <div class="layout admin-layout">
    <header class="header">
            <div class="brand">
                <img class="logo" :src="COMPETITION_LOGO" alt="Logo">
                <div class="brand-text">
                    <h1>{{ config.title }}</h1>
                </div>
            </div>

            <nav class="nav-links">
                <button class="nav-link" :class="{ active: activeMainView === 'results' }" @click="activeMainView = 'results'">MC</button>
                <button class="nav-link" :class="{ active: activeMainView === 'monitor' }" @click="activeMainView = 'monitor'">Live Monitor</button>

                <router-link to="/admin/certificates" class="nav-link">Print</router-link>
                <router-link to="/admin" class="nav-link">Admin Dashboard</router-link>
            </nav>

            <div class="system-status-container">
        <div class="system-status">
            <div class="pulse-dot"></div>
            <span>Admin Control Panel</span>
        </div>
        <div class="time-display">{{ currentTime }}</div>
      </div>
    </header>





    <!-- PANEL: LIVE MONITOR -->
    <div v-if="activeMainView === 'monitor'" class="panel">
        <div class="controls-row">
            <h2 class="text-xl font-bold" style="margin-right:auto;">
                Live Monitor <span v-if="activeHeat" class="text-muted ml-2">Heat {{ activeHeat }}</span>
            </h2>
            
             <button @click="changeHeat(-1)" class="btn-yellow">◀ Prev Heat</button>
             <select v-model="activeHeat" class="filter-select w-24">
                <option v-for="h in distinctHeats" :key="h" :value="h">Heat {{ h }}</option>
            </select>
            <button @click="changeHeat(1)" class="btn-yellow">Next Heat ▶</button>
        </div>

        <div class="stations-grid">
            <div 
                v-for="s in 12" 
                :key="s" 
                class="station-card" 
                :class="getStationStatusClass(s)"
                @click="openStationModal(s)"
            >
                <!-- STATUS TEXT OVERLAY (optional, or just color) -->
                <!-- STATUS MINI (Top) - Hide if Stamp is shown to avoid duplication -->
                <div class="mini-status">{{ getStationStatusText(s) }}</div>

                <!-- STATION NUMBER CENTRED -->
                <div class="station-lbl">STATION</div>
                <div class="giant-num">{{ s }}</div>

                <!-- STATUS STAMP (Mini Bottom) -->
                <div v-if="['DQ','SCRATCH','RE-JUMP','Done'].includes(getStationStatusText(s))" class="status-stamp-mini">
                    {{ getStationStatusText(s) === 'Done' ? 'COMPLETED' : getStationStatusText(s) }}
                </div>
                <!-- EMPTY STAMP -->
                <div v-if="!getParticipantAtStation(s)" class="status-stamp-mini stamp-empty">
                    EMPTY
                </div>
            </div>
        </div>

        <!-- MODAL -->
        <div v-if="selectedStation !== null" class="modal-overlay" @click.self="closeModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Station {{ selectedStation }} Details</h2>
                    <button class="close-btn" @click="closeModal">✕</button>
                </div>
                
                <div class="modal-body" v-if="getParticipantAtStation(selectedStation)">
                    <div class="modal-info">
                        <div class="m-entry">{{ getParticipantAtStation(selectedStation).entry_code }}</div>
                        <div class="m-name">
                            <div v-for="(n, i) in getNamesList(getParticipantAtStation(selectedStation))" :key="i" class="name-row">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-muted">
                                  <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                                </svg>
                                {{ n }}
                            </div>
                        </div>
                        <div class="m-team name-row">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-muted">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                            {{ getParticipantAtStation(selectedStation).team }}
                        </div>
                    </div>

                    <div class="modal-judges" v-if="isFreestyle(getParticipantAtStation(selectedStation))">
                        <h3>Judges Status</h3>
                        <div class="judges-flex">
                            <div class="j-pill" :class="{ 'ready': hasJudgeResult(selectedStation, 'difficulty') }">
                                <span class="lbl">Difficulty</span>
                                <span class="st">{{ hasJudgeResult(selectedStation, 'difficulty') ? '✓' : '...' }}</span>
                            </div>
                            <div class="j-pill" :class="{ 'ready': hasJudgeResult(selectedStation, 'presentation') }">
                                <span class="lbl">Presentation</span>
                                <span class="st">{{ hasJudgeResult(selectedStation, 'presentation') ? '✓' : '...' }}</span>
                            </div>
                            <div class="j-pill" :class="{ 'ready': hasJudgeResult(selectedStation, 'technical') }">
                                <span class="lbl">Technical</span>
                                <span class="st">{{ hasJudgeResult(selectedStation, 'technical') ? '✓' : '...' }}</span>
                            </div>
                            <!-- RE -->
                            <div class="j-pill" :class="{ 'ready': hasJudgeResult(selectedStation, 're') }">
                                <span class="lbl">Required Elements</span>
                                <span class="st">{{ hasJudgeResult(selectedStation, 're') ? '✓' : '...' }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- STATUS CONTROLS -->
                <div class="modal-footer" v-if="getParticipantAtStation(selectedStation)">
                    <div class="status-actions">
                        <button class="btn-action btn-scratch" @click="updateStationStatus('scratch')">SCRATCH</button>
                        <button class="btn-action btn-dq" @click="updateStationStatus('dq')">DQ</button>
                        <button class="btn-action btn-reset" @click="updateStationStatus('pending')">RESET</button>
                    </div>
                </div>
                
                <div class="modal-body empty" v-else>
                    <h3>Station Empty</h3>
                    <p>No participant assigned to this station.</p>
                </div>
            </div>
        </div>
    </div>
    <!-- PANEL: RESULTS -->
    <div v-if="activeMainView === 'results'" class="panel results-panel">
        <div class="controls-row">
            <h2 class="text-xl font-bold">MC</h2>
        </div>

        <!-- EVENT GRID -->
        <div class="menu-container">
            <div class="event-grid">
                <button v-for="e in resultsEvents" :key="e" @click="generateAnnouncementPreview(e)" class="event-card">
                    <div v-if="isExporting && exportEvent === e" class="export-spinner-overlay">
                        <div class="spinner-small"></div>
                    </div>
                    <span class="event-code">{{ e }}</span>
                    <span class="event-name">{{ getEventLabel(e) }}</span>
                </button>
            </div>
        </div>
    </div>




    <footer class="footer">
        © 2026 GBRSA
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { db } from '../firebase'
import { collection, collectionGroup, onSnapshot, doc, getDocs, query, where } from 'firebase/firestore'
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { COMPETITION_LOGO, FREESTYLE_EVENTS } from '../constants'
import { faCircleUser } from '@fortawesome/free-solid-svg-icons'
import { useConfig } from '../composables/useConfig'

const { config, getEventLabel } = useConfig()

// --- STATE ---
const currentTime = ref('00/00/0000 00:00:00')
const isSystemLocked = ref(false)

// Data
const allParticipantsMeta = ref([]) // One-time fetch for dropdowns
const participants = ref([])        // Global Participant List (Host View loads ALL usually, or we should optimize)
const resultsSpeed = ref([])        // Targeted listener
const resultsFreestyle = ref([])    // Targeted listener
const activeHeat = ref(1)
const selectedStation = ref(null)

// --- RESULTS VIEW STATE ---
const activeMainView = ref('results') // 'monitor' | 'results'
const isExporting = ref(false)
const exportEvent = ref('')


const resultsEvents = computed(() => {
    return [...(config.value.speedEvents || []), ...(config.value.freestyleEvents || [])]
})

// let unsubs = []
let unsubs = []
let systemUnsub = null



onMounted(async () => {
    // Clock
    const updateClock = () => {
        const now = new Date()
        const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const time = now.toLocaleTimeString('en-US', { hour12: false })
        currentTime.value = `${date} ${time}`
    }
    updateClock()
    setInterval(updateClock, 1000)

    // 1. One-time fetch of ALL participants for dropdown metadata (Distint Events/Divs/Heats)
    // We fetch from 'entries' collectionGroup to get the actual distributed competition data
    const snapshot = await getDocs(collectionGroup(db, 'entries'))
    allParticipantsMeta.value = snapshot.docs.map(d => ({...d.data(), entry_code: d.id}))
    
    // if (allParticipantsMeta.value.length > 0) {
    //     activeHeat.value = allParticipantsMeta.value[0].heat
    // }

    // 2. Global System Listener (Small Doc, fine for onSnapshot)
    systemUnsub = onSnapshot(doc(db, 'participants', '0'), s => {
        if (s.exists()) {
            isSystemLocked.value = s.data().station === 'LOCKED'
        }
    })

    // 3. LISTEN TO EVERYTHING (Start with Monitor active)
    setupListeners()
})

// Watch Heat Change to Swap Listeners
// For Host View, we might want to listen to ALL participants generally so Winners tab works?
// Or we filter. Winners tab filters by Event. Monitor filters by Heat.
// HEAT DATA TRACKER (Flattened)
const stationData = reactive({})

const setupListeners = () => {
    console.log("[Host] Setting up live listeners for Heat:", activeHeat.value)
    unsubs.forEach(u => u())
    unsubs = []
    
    // Clear old data
    participants.value = []
    Object.keys(stationData).forEach(k => delete stationData[k])

    // LISTENING TO EACH STATION (1-12) SEPARATELY 
    // This avoids the need for a COLLECTION_GROUP index in Firebase
    for (let s = 1; s <= 12; s++) {
        const qP = query(
            collection(db, 'competition', String(s), 'entries'), 
            where("heat", "==", String(activeHeat.value))
        )
        
        unsubs.push(onSnapshot(qP, snap => {
            console.log(`[Host] Station ${s} snap received (${snap.docs.length} docs)`)
            stationData[s] = snap.docs.map(d => ({ 
                ...d.data(), 
                id: d.id, 
                entry_code: d.id 
            }))
            // Re-flatten to participants.value
            participants.value = Object.values(stationData).flat()
        }, err => {
            console.error(`[Host] Station ${s} Listener Error:`, err)
        }))
    }

    // 2. Results Speed
    unsubs.push(onSnapshot(collection(db, 'results_speed'), snap => {
        resultsSpeed.value = snap.docs.map(d => ({ ...d.data(), id: d.id }))
    }))

    // 3. Results Freestyle
    unsubs.push(onSnapshot(collection(db, 'results_freestyle'), snap => {
        resultsFreestyle.value = snap.docs.map(d => ({ ...d.data(), id: d.id }))
    }))
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
            selectedResultEvent.value = ''
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
                
                // Calc Aspect Ratio
                if (logoImg.height > 0) logoRatio = logoImg.width / logoImg.height
            }
        } catch(e) { console.warn("Logo load failed", e) }

        // Generate Icon Data URL (Once)
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
            ctx.fillStyle = "#1e293b" // Match Header Color (Slate-800)
            ctx.fill(p)
            iconDataUrl = canvas.toDataURL('image/png')
        } catch (e) { console.warn("Icon gen failed", e) }

        // MAIN HEADER (Once per Event)
        if(logoBase64) {
            let w = 20; let h = 20;
            if (logoRatio > 1) { h = 20 / logoRatio }
            else { w = 20 * logoRatio }
            doc.addImage(logoBase64, 'PNG', 15, 10, w, h)
        }
        
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

        // Filter out empty groups
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
            
            // MC Badge
            doc.rect(160, 21, 35, 6)
            doc.setFontSize(9); doc.setFont("helvetica", "bold")
            doc.text("MC ANNOUNCE", 177.5, 24.1, { align: "center", baseline: "middle" })
            
            doc.line(15, 33, 195, 33)

            doc.setFontSize(11); doc.setFont("helvetica", "bold")
            doc.text(`Event: ${getEventLabel(eventName)}`, 15, 40)
        }

        // Draw First Header
        drawHeader()

        activeGroups.forEach((group, gIndex) => {
            if (gIndex > 0) {
                doc.addPage()
                drawHeader()
            }
            
            // Per-Page Density Calculation
            const groupWinners = group.divs.flatMap(d => divWinners[d] || [])
            const isTeamEvent = groupWinners.some(w => w.names.includes('\n'))
            const rowWeight = isTeamEvent ? 2.5 : 1
            const weightedRow = groupWinners.length * rowWeight
            const totalDivs = group.divs.length

            // DYNAMIC SCALING (Best Fit for THIS Page)
            // INCREASED SIZES FOR MC VISIBILITY
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

                // Check overflow for multi-page groups (rare but possible)
                if (currentY + 20 > 280) {
                    doc.addPage()
                    drawHeader()
                    currentY = 45
                }

            // Division Title
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
                    1: { halign: 'left', cellWidth: 80, cellPadding: { top: 2.5, right: 2.5, bottom: 2.5, left: 6 } }, // Added left padding for icon
                    2: { halign: 'left' }, 
                    3: { cellWidth: 35, fontStyle: 'bold' } 
                },
                didDrawCell: (data) => {
                     // Hook to draw custom icon in the Name column (index 1) which may have multiple lines
                    if (data.section === 'body' && data.column.index === 1 && iconDataUrl) {
                        const doc = data.doc;
                        const cell = data.cell;
                        
                        // Retrieve original data 
                        const w = winners[data.row.index];
                        if (!w) return;

                        const rawNames = [w.name1, w.name2, w.name3, w.name4].filter(n => n && n.trim());
                        if (rawNames.length === 0) return;

                        // Calculate Dimensions
                        const fontSizePt = cell.styles.fontSize;
                        const lineHeightFactor = doc.getLineHeightFactor();
                        const lineHeightMm = fontSizePt * lineHeightFactor * 0.352778; // 1pt = 0.3528mm
                        const iconSize = 3; 

                        const totalRenderedLines = cell.text.length;
                        const contentHeight = totalRenderedLines * lineHeightMm;
                        const startY = cell.y + (cell.height - contentHeight) / 2;

                        let currentNameIndex = 0;

                        cell.text.forEach((line, i) => {
                            if (currentNameIndex >= rawNames.length) return;

                            const cleanLine = String(line).trim();
                            if (!cleanLine) return; 

                            const targetName = String(rawNames[currentNameIndex]).trim();
                            
                            // Check for match at start of line
                            if (targetName.toLowerCase().startsWith(cleanLine.toLowerCase())) {
                                
                                const lineMidY = startY + (i * lineHeightMm) + (lineHeightMm / 2);
                                const iconY = lineMidY - (iconSize / 2);
                                doc.addImage(iconDataUrl, 'PNG', cell.x + 2, iconY, iconSize, iconSize);

                                currentNameIndex++;
                            }
                        });
                    }
                },
                didDrawPage: (data) => {
                    // Draw header if autoTable created a new page
                    drawHeader()
                },
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
        
        // Draw Footer on Every Page
        const totalPages = doc.internal.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i)
            doc.setFontSize(8); doc.setTextColor(100); doc.setFont("helvetica", "normal")
            doc.text(`Generated: ${currentTime.value} | Page ${i} of ${totalPages}`, 15, doc.internal.pageSize.getHeight() - 10)
        }

        const blob = doc.output('blob')
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
        
        // Revoke after a delay to allow browser to load
        setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (err) {
        console.error(err)
        alert("Export failed: " + err.message)
    } finally {
        isExporting.value = false
        exportEvent.value = ''
    }
}

watch(currentTime, () => {}) // Dummy watch to keep imports valid if needed, or remove imports.

onUnmounted(() => {
    unsubs.forEach(u => u())
    if (systemUnsub) systemUnsub()
})

// --- COMPUTED ---
const distinctHeats = computed(() => {
    const heats = allParticipantsMeta.value
        .map(p => Number(p.heat))
        .filter(h => !isNaN(h) && h > 0)
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


const getNamesList = (p) => {
    return [p.name1, p.name2, p.name3, p.name4].filter(n=>n)
}

// Modal Logic
const openStationModal = (s) => {
    selectedStation.value = s
}
const closeModal = () => {
    selectedStation.value = null
}
const isFreestyle = (p) => FREESTYLE_EVENTS.includes(p?.event)
const activeHeatParticipants = computed(() => {
    return participants.value.filter(p => Number(p.heat) === Number(activeHeat.value))
})

// Auto-initialize heat
watch(distinctHeats, (newHeats) => {
    if (newHeats.length > 0 && (activeHeat.value === 1 || !newHeats.includes(Number(activeHeat.value)))) {
        activeHeat.value = newHeats[0]
    }
}, { immediate: true })

// REBUILD LISTENERS ON HEAT CHANGE
watch(activeHeat, () => {
    setupListeners()
})

// Navigation
const changeHeat = (delta) => {
    if (distinctHeats.value.length === 0) return
    const currentHeatNum = Number(activeHeat.value)
    const idx = distinctHeats.value.indexOf(currentHeatNum)
    let newIdx = idx + delta
    if (newIdx >= 0 && newIdx < distinctHeats.value.length) {
        activeHeat.value = distinctHeats.value[newIdx]
    }
}

// Helpers for Grid
const getParticipantAtStation = (s) => activeHeatParticipants.value.find(p => Number(p.station) === s)

const hasJudgeResult = (station, type) => {
    const p = getParticipantAtStation(station)
    if (!p) return false
    
    // Check resultsFreestyle
    // We look for any doc with entry_code == p.entry_code
    // AND (judge_type == type OR nested key exists)
    return resultsFreestyle.value.some(r => {
        const matchId = String(r.entry_code) === String(p.entry_code)
        if (!matchId) return false
        
        // Check Consolidated (New)
        if (type === 'technical' && r.technical) return true
        if (type === 'difficulty' && r.difficulty) return true
        if (type === 'presentation' && r.presentation) return true
        if (type === 're' && r.re) return true
        
        // Check Legacy
        if (r.judge_type === type) return true
        
        return false
    })
}



// UPDATE STATUS
import { updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
const updateStationStatus = async (status) => {
    if (!selectedStation.value) return
    const p = getParticipantAtStation(selectedStation.value)
    if (!p) return

    try {
        // 1. Update Main Entry
        // We know the Collection path is: /competition/{station}/entries/{id}
        const ref = doc(db, 'competition', String(selectedStation.value), 'entries', p.id)
        await updateDoc(ref, { status: status })

        // 2. Broadcast to Live Board
        await setDoc(doc(db, 'live_scores', String(selectedStation.value)), {
            station: Number(selectedStation.value),
            score: 0, // Reset score visually
            status: status, // NEW FIELD
            updated_at: serverTimestamp()
        })
        
        closeModal()
    } catch (e) {
        alert("Error updating status: " + e.message)
    }
}

const getStationStatusText = (s) => {
    const p = getParticipantAtStation(s)
    if (!p) return 'EMPTY'

    // Status Overrides (Case-Insensitive)
    const st = String(p.status || '').toLowerCase()
    if (st === 'dq') return 'DQ'
    if (st === 'scratch') return 'SCRATCH'
    if (st === 'rejump') return 'RE-JUMP'
    if (st === 'pending') return 'Waiting'
    
    // Check Result
    if (isFreestyle(p)) {
        // Freestyle
        const judgeTypes = ['difficulty', 'presentation', 'technical', 're']
        const submittedCount = judgeTypes.filter(t => hasJudgeResult(s, t)).length
        
        if (submittedCount === 4) return 'Done' 
        if (submittedCount > 0) return 'Judging...'
        return 'Waiting'
    } else {
        // Speed
        const res = resultsSpeed.value.find(r => String(r.entry_code) === String(p.entry_code))
        if (res) return 'Done'
        return 'Waiting'
    }
}

// Debug Watcher
watch(participants, (newVal) => {
    const specials = newVal.filter(p => p.status && ['dq', 'scratch', 'rejump'].includes(p.status.toLowerCase()))
    if (specials.length > 0) {
        console.log("[Host] Special status detected in participants array:", specials.map(p => `${p.entry_code}: ${p.status}`))
    }
}, { deep: true })


const getStationStatusClass = (s) => {
    const status = getStationStatusText(s)
    if (status === 'Done') return 'bs-done'
    if (status === 'Judging...') return 'bs-judging'
    if (status === 'DQ') return 'bs-dq'
    if (status === 'SCRATCH') return 'bs-scratch'
    if (status === 'RE-JUMP') return 'bs-rejump'
    return 'bs-waiting'
}



</script>

<style scoped>
.live-btn {
    background: #4633f5 !important;
    color: white !important;
    border: none !important;
}
.live-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #334155;
    padding: 4px;
    border-radius: 8px;
    margin-left: 1rem;
}
.live-select {
    background: #1e293b;
    color: white;
    border: 1px solid #475569;
    padding: 6px 8px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    outline: none;
}
.live-select:hover {
    border-color: #64748b;
}
/* RESULTS VIEW */
.results-panel {
    background: #0f172a;
}

.menu-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 2rem;
    padding-top: 4vh;
    overflow-y: auto;
}

.event-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
    width: 100%;
    max-width: 1200px;
}

.event-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0.75rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.event-card:hover {
    transform: translateY(-4px);
    background: #334155;
    border-color: #facc15;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
}

.event-code {
    font-size: 1.5rem;
    font-weight: 900;
    color: #facc15;
}

.event-name {
    font-size: 0.9rem;
    color: #94a3b8;
    font-weight: 600;
    line-height: 1.4;
}

.selected-result-container {
    padding: 1.5rem 2rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.header-back {
    display: flex;
    align-items: center;
    margin-bottom: 2rem;
}

.glass-panel {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 2rem;
}

.export-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(250, 204, 21, 0.1);
    border-top: 5px solid #facc15;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.text-yellow-500 { color: #facc15; }
.mx-auto { margin-left: auto; margin-right: auto; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-8 { margin-bottom: 2rem; }
.mt-4 { margin-top: 1rem; }
.mt-8 { margin-top: 2rem; }
.p-12 { padding: 3rem; }
.px-12 { padding-left: 3rem; padding-right: 3rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-2xl { font-size: 1.5rem; }
.ml-2 { margin-left: 0.5rem; }
.mr-2 { margin-right: 0.5rem; }

.export-spinner-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
}

.spinner-small {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(250, 204, 21, 0.1);
    border-top: 3px solid #facc15;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.layout, .admin-layout { 
    height: 100vh; 
    display: flex; 
    flex-direction: column; 
    background-color: #0f172a; 
    color: #f8fafc; 
    font-family: 'Outfit', sans-serif; 
    overflow: hidden; 
}

/* HEADER */
.header { 
    padding: 1.5rem 2rem; 
    display: flex; 
    align-items: center; 
    background: #0f172a;
    border-bottom: 1px solid #1e293b;
    flex-shrink: 0;
    position: relative;
    gap: 1rem;
}
.brand { 
    display: flex; 
    align-items: center; 
    gap: 1rem; 
    max-width: 35%; /* Prevent overlap */
}
.logo { height: 64px; }
.brand h1 { 
    font-size: 1.5rem; 
    font-weight: 800; 
    margin: 0; 
    color: #f8fafc; 
    letter-spacing: -0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.nav-links {
    display: flex;
    gap: 0.5rem;
    margin-left: auto; /* Push to right */
    margin-right: 1rem; /* Space before status */
    background: #1e293b;
    padding: 0.25rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-link {
    background: transparent;
    color: #94a3b8;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.nav-link:hover {
    color: white;
    background: rgba(255,255,255,0.05);
}

.nav-link.active {
    background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.system-status-container { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
.system-status { display: flex; align-items: center; gap: 8px; color: #10b981; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; white-space: nowrap; }
.pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
.time-display { font-family: 'JetBrains Mono', monospace; font-size: 0.9rem; color: #94a3b8; margin-top: 4px; white-space: nowrap; }



/* PANELS */
.panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem 2rem;
    overflow: hidden;
}

/* CONTROLS */
.controls-row {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    background: rgba(255, 255, 255, 0.03);
    padding: 0.75rem 1.5rem;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.1);
    flex-shrink: 0;
}
.filter-select { 
    background: #1e293b; 
    color: white; 
    border: 1px solid rgba(255,255,255,0.1); 
    padding: 0.5rem; 
    border-radius: 8px; 
    width: 200px;
}



/* GRID */
/* GRID - 6 COLUMNS NOW */
.stations-grid { 
    display: grid; 
    grid-template-columns: repeat(4, 1fr); 
    grid-template-rows: repeat(3, 1fr);
    gap: 0.75rem; 
    padding: 1rem 0;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    align-content: stretch;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
}

.station-card { 
    background: rgba(255,255,255,0.03); 
    border-radius: 12px; 
    border: 2px solid rgba(255,255,255,0.1); 
    overflow: hidden; 
    transition: all 0.2s;
    position: relative;
    cursor: pointer;
    min-height: 6rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
.station-card:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.3); }

/* MODAL FOOTER */
.modal-footer {
    padding-top: 1rem;
    border-top: 1px solid rgba(255,255,255,0.1);
    margin-top: 1rem;
}
.status-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
}
.btn-action {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
}
.btn-scratch { background: #64748b; color: white; }
.btn-dq { background: #ef4444; color: white; }
.btn-reset { background: #3b82f6; color: white; }
.btn-action:hover { filter: brightness(1.1); transform: translateY(-1px); }

.station-card.bs-done { border-color: #10b981; background: rgba(16, 185, 129, 0.2); }
.station-card.bs-judging { border-color: #f59e0b; background: rgba(245, 158, 11, 0.2); }
.station-card.bs-dq { border-color: #ef4444; background: rgba(239, 68, 68, 0.2); }
.station-card.bs-scratch { border-color: #475569; background: rgba(71, 85, 105, 0.3); opacity: 0.8; }
.station-card.bs-rejump { border-color: #f97316; background: rgba(249, 115, 22, 0.2); }

/* CARD CONTENT MINI */
.giant-num { font-size: 2.5rem; font-weight: 900; color: rgba(255,255,255,0.8); line-height: 0.9; position: relative; z-index: 20; }
.mini-status { font-size: 0.65rem; text-transform: uppercase; font-weight: 800; color: rgba(255,255,255,0.5); position: absolute; top: 8px; width: 100%; text-align: center; z-index: 20; }
.station-lbl { font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.4); letter-spacing: 1px; margin-bottom: -5px; position: relative; z-index: 20; }


/* ⭐ COMPLETED STAMP OVERLAY */
.status-stamp-mini {
    position: absolute;
    bottom: 8px;
    font-size: 0.8rem;
    font-weight: 900;
    text-transform: uppercase;
    color: white;
    background: rgba(0,0,0,0.5);
    padding: 2px 6px;
    border-radius: 4px;
}
.stamp-empty {
    color: #475569;
    border: 1px solid #475569;
    background: rgba(0,0,0,0.5);
}

/* MODAL STYLES */
.modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(5px);
    z-index: 100;
    display: flex; align-items: center; justify-content: center;
}
.modal-content {
    background: #1e293b;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    width: 90%; max-width: 500px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.modal-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    display: flex; justify-content: space-between; align-items: center;
}
.modal-header h2 { font-size: 1.25rem; font-weight: 700; margin: 0; color: white; }
.close-btn { background: transparent; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1; }
.close-btn:hover { color: white; }

.modal-body { padding: 2rem; text-align: center; }
.modal-info { margin-bottom: 2rem; text-align: left; }
.m-entry { font-family: monospace; color: #94a3b8; font-size: 1rem; margin-bottom: 0.5rem; background: rgba(255,255,255,0.05); display: inline-block; padding: 2px 8px; border-radius: 4px; }
.m-name { font-size: 1rem; font-weight: 800; line-height: 1.2; margin-bottom: 0.5rem; color: white; display: flex; flex-direction: column; gap: 4px; text-align: left; }
.m-team { font-size: 1.1rem; color: #64748b; font-weight: 600; margin-top: 4px; }

.name-row { display: flex; align-items: center; gap: 8px; }
.w-4 { width: 1rem; height: 1rem; }
.text-muted { color: #64748b; }

.btn-yellow { 
    background: linear-gradient(135deg, #facc15 0%, #eab308 100%); 
    border: none;
    color: #0f172a; 
    padding: 0.75rem 1.5rem; 
    border-radius: 12px; 
    cursor: pointer; 
    transition: all 0.2s;
    font-size: 1.1rem; 
    font-weight: 700;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.btn-yellow:hover { filter: brightness(1.1); transform: translateY(-1px); }
.btn-yellow:active { transform: scale(0.98); }
.btn-yellow:disabled { opacity: 0.5; cursor: not-allowed; background: #94a3b8; }

.judges-flex { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
.j-pill { 
    display: flex; justify-content: space-between; align-items: center; 
    background: rgba(255,255,255,0.05); padding: 0.75rem 1rem; border-radius: 8px; 
    border-left: 4px solid #475569;
}
.j-pill.ready { border-left-color: #10b981; background: rgba(16, 185, 129, 0.05); }
.j-pill .lbl { font-weight: 600; color: #94a3b8; }
.j-pill.ready .lbl { color: white; }
.j-pill .st { font-weight: 800; color: #475569; }
.j-pill.ready .st { color: #10b981; }

/* RESPONSIVE */
@media (max-width: 1280px) {
    .header { padding: 1rem 1.5rem; }
    .logo { height: 48px; }
    .brand h1 { font-size: 1.25rem; }
    .panel { padding: 1rem 1.5rem; gap: 0.75rem; }
}

@media (max-width: 1024px) {
    .brand h1 { font-size: 1.1rem; }
    .nav-link { padding: 0.4rem 0.8rem; font-size: 0.85rem; }
    .stations-grid { gap: 0.5rem; padding: 0.5rem 0; }
    .giant-num { font-size: 2rem; }
}

@media (max-width: 768px) {
    .stations-grid { 
        grid-template-columns: repeat(3, 1fr); 
        grid-template-rows: repeat(4, 1fr);
    }
    .header { padding: 0.75rem 1rem; }
    .brand { gap: 0.5rem; }
    .logo { height: 40px; }
}

@media (max-width: 480px) {
    .header { flex-direction: column; align-items: stretch; gap: 0.75rem; }
    .brand { max-width: 100%; justify-content: center; }
    .nav-links { margin: 0; justify-content: center; }
    .system-status-container { align-items: center; }
    .stations-grid { 
        grid-template-columns: repeat(2, 1fr); 
        grid-template-rows: repeat(6, 1fr);
    }
}

</style>
