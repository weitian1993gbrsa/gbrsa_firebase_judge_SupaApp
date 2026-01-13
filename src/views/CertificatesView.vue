<template>
  <div class="studio-layout">
    <!-- HEADER -->
    <header class="studio-header">
      <div class="header-left">
          <button @click="router.push('/host')" class="btn-back" title="Back">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7 7-7" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h18" /></svg>
          </button>
          <h1>Certificate Studio</h1>
      </div>
      
      <div class="header-center">
          <nav class="nav-links">
              <button class="nav-link" :class="{ active: mode === 'achievements' }" @click="mode = 'achievements'">Achievements</button>
              <button class="nav-link" :class="{ active: mode === 'excellence' }" @click="mode = 'excellence'">Excellence</button>
          </nav>
      </div>

      <div class="header-right">
          <button class="btn-primary" @click="generatePDF" :disabled="!recipients.length">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download PDF <span v-if="recipients.length">({{ recipients.length }})</span>
          </button>
      </div>
    </header>

    <div class="studio-body">
        
        <!-- 1. LEFT PANEL: DATA -->
        <aside class="panel-left">

            <div class="panel-section">
                <h3>Select Context</h3>
                <div class="form-group">
                    <label>Event Category</label>
                    <select v-model="selectedEvent">
                        <option value="">-- Choose Event --</option>
                        <optgroup label="Speed Events">
                            <option v-for="e in config.speedEvents" :key="e" :value="e">{{ e }}</option>
                        </optgroup>
                        <optgroup label="Freestyle Events">
                            <option v-for="e in config.freestyleEvents" :key="e" :value="e">{{ e }}</option>
                        </optgroup>
                    </select>
                </div>

                <div class="form-group">
                    <label>Division</label>
                    <select v-model="selectedDivision">
                        <option value="">-- Choose Division --</option>
                        <option value="all">ALL DIVISIONS</option>
                        <option v-for="d in config.divisions" :key="d" :value="d">{{ d }}</option>
                    </select>
                </div>
            </div>

            <div class="panel-section flex-grow scrollable">
                <div class="section-header">
                    <h3>Recipients <span v-if="recipients.length" class="count-badge">{{ recipients.length }}</span></h3>
                </div>
                
                <div class="recipient-list">
                    <div v-if="!recipients.length" class="empty-state">
                        <p v-if="!selectedEvent">Select an event to load data</p>
                        <p v-else>No recipients found</p>
                    </div>
                    
                    <ul v-else>
                        <li v-for="(r, i) in recipients" :key="r.entry_code + i" 
                            @click="previewIndex = i"
                            :class="{ selected: previewIndex === i }">
                            <div class="r-rank" v-if="mode === 'achievements' && r.rank <= 5" :class="`rank-${r.rank}`">
                                {{ r.rank }}
                            </div>
                            <div class="r-info">
                                <span class="r-name">{{ r.name }}</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </aside>

        <!-- 2. CENTER PANEL: PREVIEW -->
        <main class="panel-center">
            <div class="canvas-wrapper">
                <div class="canvas-toolbar">
                     <span class="zoom-label">Preview: {{ recipients[previewIndex]?.name || 'Template' }}</span>
                </div>

                <!-- SCROLLABLE STAGE -->
                <div class="paper-stage" @click="selectedField = null">
                    <!-- SCALING WRAPPER: Matches the scaled size to prevent whitespace issues -->
                    <div class="scale-wrapper" :style="{ width: (210 * scale) + 'mm', height: (297 * scale) + 'mm' }" @click.stop>
                        <div class="a4-sheet" 
                             :style="{ 
                                backgroundImage: templateImages[mode] ? `url(${templateImages[mode]})` : 'none',
                                transform: `scale(${scale})`
                             }">
                            <div class="print-field" 
                                 v-for="(pos, key) in layout" 
                                 :key="key"
                                 :class="{ dragging: dragState.key === key, selected: selectedField === key }"
                                 @mousedown="startDrag(key, $event)"
                                 @click.stop="selectedField = key"
                                 :style="getFieldStyle(key, pos)">
                                {{ getPlaceholder(key) }}
                            </div>
                        </div>
                        <div class="watermark">A4 PREVIEW</div>
                    </div>
                </div>
            </div>
        </main>

        <!-- 3. RIGHT PANEL: CONTROLS -->
        <aside class="panel-right">
            <div class="panel-section flex-grow scrollable">
                <h3>Element Properties</h3>
                <p class="section-desc">Select an element on the canvas to edit.</p>
                
                <div class="field-properties">
                    <div v-for="(pos, key) in layout" :key="key" class="property-group" :class="{ open: selectedField === key }">
                        <template v-if="mode === 'excellence' && key === 'place'"></template>
                        <template v-else>
                            <div class="prop-header" @click="selectedField = key">
                                <span class="prop-label">{{ key.toUpperCase() }}</span>
                                <span class="prop-status" v-if="selectedField === key">Active</span>
                            </div>
                                
                            <div class="prop-body">
                                <div class="prop-row">
                                    <div class="input-wrap sm">
                                        <label>X (mm)</label>
                                        <input type="number" v-model.number="pos.x">
                                    </div>
                                    <div class="input-wrap sm">
                                        <label>Y (mm)</label>
                                        <input type="number" v-model.number="pos.y">
                                    </div>
                                     <button class="btn-icon-sm" @click="pos.x = 105" title="Center Horizontally">
                                        ⟷
                                    </button>
                                </div>
                                <div class="prop-row">
                                    <div class="input-wrap sm">
                                        <label>Size (pt)</label>
                                        <input type="number" v-model.number="pos.size">
                                    </div>
                                     <button class="btn-toggle" :class="{ active: pos.bold }" @click="pos.bold = !pos.bold" title="Bold Text">
                                        B
                                    </button>
                                </div>
                                <div class="prop-row" v-if="key === 'name'">
                                     <div class="input-wrap sm">
                                        <label title="Auto-shrink if longer than (mm)">Max Width</label>
                                        <input type="number" v-model.number="pos.maxWidth" placeholder="180">
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>

             <div class="panel-section property-group">
                <h3>Global Settings</h3>
                 <div class="form-group">
                    <label>Font Type</label>
                    <select v-model="globalFont" class="input" style="width: 100%">
                        <option value="helvetica">Helvetica / Arial</option>
                        <option value="times">Times New Roman</option>
                        <option value="courier">Courier New</option>
                        <option value="calibri">Calibri</option>
                    </select>
                </div>
            </div>

            <div class="panel-section footer-settings">
                <h3>Template Background</h3>
                <div class="file-upload-box">
                    <label for="bg-upload">
                        <span v-if="!templateImages[mode]">Upload {{ mode }} Image</span>
                        <span v-else>Change Image</span>
                    </label>
                    <input id="bg-upload" type="file" accept="image/*" @change="onTemplateUpload">
                </div>
                
                <div class="form-group">
                    <label>View Scale: {{ Math.round(scale * 100) }}%</label>
                    <input type="range" min="0.3" max="1.0" step="0.05" v-model.number="scale" style="width: 100%">
                </div>

                <button class="btn-secondary" @click="saveLayout">
                    Save Layout to Cloud
                </button>
            </div>
        </aside>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { db, storage } from '../firebase' 
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore' 
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import jsPDF from 'jspdf'
import { useConfig } from '../composables/useConfig'

const router = useRouter()
const { config, getEventLabel } = useConfig()

// == STATE ==
const mode = ref('achievements') // 'achievements' or 'excellence'

// Independent selection state for each mode
const selections = reactive({
    achievements: { event: '', division: '' },
    excellence: { event: '', division: '' }
})

const selectedEvent = computed({
    get: () => selections[mode.value].event || '',
    set: (v) => selections[mode.value].event = v
})

const selectedDivision = computed({
    get: () => selections[mode.value].division || '',
    set: (v) => selections[mode.value].division = v
})
const rawResults = ref([])
const previewIndex = ref(0)
const templateImages = ref({ achievements: null, excellence: null })
const pendingUploads = ref({ achievements: null, excellence: null }) // Store file for upload
const selectedField = ref('name')
const scale = ref(0.6) // Dynamic Scale
const globalFont = ref('helvetica') // Global Font Setting

// 1mm ~ 3.78px for screen preview
const mmToPx = 3.7795275591 

// Default Layout (in mm)
const defaultLayout = {
    name: { x: 105, y: 100, size: 24, bold: true, align: 'center' },
    place: { x: 105, y: 130, size: 30, bold: false, align: 'center' },
    event: { x: 105, y: 150, size: 14, bold: false, align: 'center' },
    division: { x: 105, y: 160, size: 14, bold: false, align: 'center' }
}

const layout = ref({ ...defaultLayout })

// == LOAD ==
onMounted(async () => {
    // 1. Load Layout
    try {
        const snap = await getDoc(doc(db, 'system', 'print_layout'))
        if(snap.exists()) {
            const data = snap.data()
            layout.value = { ...defaultLayout, ...data.layout }
            if (data.globalFont) globalFont.value = data.globalFont
            // Load saved background URLs
            if (data.templateImages) templateImages.value = { ...templateImages.value, ...data.templateImages }
        }
    } catch(e) { console.error("Cloud Layout Load Error:", e) }

    // 2. Fetch Data (12 Stations Logic)
    await fetchResults()
})

const fetchResults = async () => {
    try {
        let all = []
        // 1. Fetch from all 12 stations
        for (let s=1; s<=12; s++) {
             const snap = await getDocs(collection(db, "competition", String(s), "entries"))
             snap.forEach(doc => all.push({ ...doc.data(), id: doc.id, station: s }))
        }
        
        // Fetch Scores
        const speedSnap = await getDocs(collection(db, "results_speed"))
        const freeSnap = await getDocs(collection(db, "results_freestyle"))
        
        const speedMap = new Map(); 
        speedSnap.forEach(d => {
            const data = d.data(); const key = data.entry_code || d.id
            if (key) speedMap.set(key, data)
        })
        const freeMap = new Map(); 
        freeSnap.forEach(d => {
            const data = d.data(); const key = data.entry_code || d.id
            if (key) freeMap.set(key, data)
        })
        
        // Merge
        all = all.map(entry => {
            const isSpeed = config.value.speedEvents.includes(entry.event)
            let res = isSpeed ? speedMap.get(entry.entry_code) : freeMap.get(entry.entry_code)
            
            let finalScore = 0
            if (res) {
                if (isSpeed) finalScore = Number(res.score || 0)
                else if (res.presentation_score) finalScore = res.presentation_score // Simplified fallback
                else {
                    const d = res.difficulty?.score || 0; const p = res.presentation?.score || 0
                    const t = res.technical?.score || 0; const r = res.re?.score || 0
                    finalScore = d + p + t + r
                }
            }
            
            return {
                ...entry,
                finalScore,
                rank: res?.rank || 999,
                hasResult: !!res
            }
        })
        
        // Explode Teams / Handle Multiple Names (name1..name4 or name="A, B")
        const processed = []
        all.forEach(base => {
            let names = []
            // 1. Try name1..name4 (Standard)
            const multiNames = [base.name1, base.name2, base.name3, base.name4].filter(n => n && n.trim())
            if (multiNames.length > 0) names = multiNames
            // 2. Fallback to 'name' field (Legacy/Imported)
            else if (base.name) {
                if (base.name.includes(',') || base.name.includes('&')) names = base.name.split(/[&,]+/).map(n => n.trim())
                else names = [base.name]
            }

            if (names.length > 0) names.forEach(n => processed.push({ ...base, name: n }))
            else processed.push({ ...base, name: "Unknown Name" })
        })
        
        rawResults.value = processed
    } catch(e) { console.error("Fetch Error:", e) }
}

const saveLayout = async () => {
    try {
        // Only save layout coordinates and font setting
        await setDoc(doc(db, 'system', 'print_layout'), { 
            layout: layout.value,
            globalFont: globalFont.value
            // templateImages not saved to cloud per user request
        })
        alert("Layout Settings Saved (Background not saved)")
    } catch(e) { alert("Error Save: " + e.message) }
}

const recipients = computed(() => {
    if (!selectedEvent.value || !selectedDivision.value) return []
    
    // 1. Initial Filter: Event
    let list = rawResults.value.filter(r => (r.event||'').trim() === (selectedEvent.value||'').trim())

    // 2. Filter No-Results (Achievements Mode Only)
    // User requested "no result... do not show"
    if (mode.value === 'achievements') {
        list = list.filter(r => r.hasResult)
    }
    
    // 3. Group by Division -> Then by Doc ID (Team)
    const byDivision = {}
    list.forEach(r => {
        const d = r.division || 'Unassigned'
        if (!byDivision[d]) byDivision[d] = []
        byDivision[d].push(r)
    })

    let rankedList = []
    Object.keys(byDivision).forEach(div => {
        // Group individuals by Doc ID (1 Doc = 1 Team/Entry)
        const entriesMap = {}
        byDivision[div].forEach(r => {
            const key = r.id // Robust grouping by Doc ID
            if (!entriesMap[key]) entriesMap[key] = { score: r.finalScore, members: [] }
            entriesMap[key].members.push(r)
        })

        // Convert to array of Entries and Sort
        const entriesArr = Object.values(entriesMap)
        entriesArr.sort((a,b) => b.score - a.score)

        // Assign Rank to Entries
        let lastScore = null
        let lastPlace = 0
        let currentRank = 0

        entriesArr.forEach((entry, idx) => {
            currentRank = idx + 1
            if (entry.score !== lastScore) lastPlace = currentRank
            lastScore = entry.score

            // Apply calculated rank to all members of this entry
            entry.members.forEach(m => {
                rankedList.push({ ...m, rank: lastPlace })
            })
        })
    })

    // 3. Final Filter: Division selection
    if (selectedDivision.value !== 'all') {
         rankedList = rankedList.filter(r => (r.division||'').trim() === (selectedDivision.value||'').trim())
    }

    if (mode.value === 'achievements') {
        // Filter Top 5 using the newly calculated rank
        rankedList = rankedList.filter(r => r.rank <= 5)
        return rankedList.sort((a,b) => {
            if (a.rank !== b.rank) return a.rank - b.rank
            return a.division.localeCompare(b.division)
        })
    } else {
        // Excellence: Alpha Sort
        return rankedList.sort((a,b) => a.name.localeCompare(b.name))
    }
})

// == PREVIEW ==
const getPlaceholder = (key) => {
    const person = recipients.value[previewIndex.value]
    if (!person) return `{${key}}`
    
    if (key === 'name') return person.name
    if (key === 'place') {
        if (mode.value === 'excellence') return ''
        const r = person.rank
        return (r===1?'1st':r===2?'2nd':r===3?'3rd':r+'th') + ' Place'
    }
    if (key === 'event') return getEventLabel(person.event.trim())
    if (key === 'division') return person.division
    return ""
}

const getFieldStyle = (key, pos) => {
    const isSelected = selectedField.value === key
    
    // Map Global Font to CSS
    let fontFamily = "'Helvetica', 'Arial', sans-serif"
    if (globalFont.value === 'times') fontFamily = "'Times New Roman', serif"
    if (globalFont.value === 'courier') fontFamily = "'Courier New', monospace"
    if (globalFont.value === 'calibri') fontFamily = "'Calibri', 'Arial', sans-serif"

    const style = {
        left: (pos.x * mmToPx) + 'px', 
        top: (pos.y * mmToPx) + 'px',
        fontWeight: pos.bold ? 'bold' : 'normal',
        transform: 'translate(-50%, -50%)',
        textAlign: pos.align,
        display: (mode.value === 'excellence' && key === 'place') ? 'none' : 'block',
        zIndex: isSelected ? 10 : 1,
        fontFamily: fontFamily
    }

    let fontSize = pos.size * 1.333

    // Auto-Shrink Name
    if (key === 'name') {
         const text = getPlaceholder(key)
         const maxW = (pos.maxWidth || 180) * mmToPx
         const canvas = document.createElement("canvas")
         const ctx = canvas.getContext("2d")
         ctx.font = (pos.bold ? 'bold ' : '') + fontSize + "px " + fontFamily
         const textW = ctx.measureText(text).width
         if (textW > maxW) fontSize = fontSize * (maxW / textW)
    }

    style.fontSize = fontSize + 'px'
    return style
}

const onTemplateUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Store for upload on Save
    pendingUploads.value[mode.value] = file

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => templateImages.value[mode.value] = e.target.result
    reader.readAsDataURL(file)
}

// == DRAG & DROP ==
const dragState = ref({ isDragging: false, key: null, startX: 0, startY: 0, initialLayoutX: 0, initialLayoutY: 0 })

const startDrag = (key, e) => {
    e.preventDefault()
    e.stopPropagation() 
    selectedField.value = key
    dragState.value = {
        isDragging: true, key, startX: e.clientX, startY: e.clientY,
        initialLayoutX: layout.value[key].x, initialLayoutY: layout.value[key].y
    }
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', endDrag)
}

const onDrag = (e) => {
    if (!dragState.value.isDragging) return
    
    // Calculate Delta in Screen Pixels
    const dxPx = e.clientX - dragState.value.startX
    const dyPx = e.clientY - dragState.value.startY
    
    // Adjust for Scale Factor (Critical Fix)
    // Movement on screen = Delta / Scale
    const dxScaled = dxPx / scale.value
    const dyScaled = dyPx / scale.value
    
    // Convert to mm
    let dxMm = dxScaled / mmToPx
    let dyMm = dyScaled / mmToPx
    
    // Shift Lock
    if (e.shiftKey) {
        if (Math.abs(dxMm) > Math.abs(dyMm)) dyMm = 0
        else dxMm = 0
    }

    layout.value[dragState.value.key].x = Math.round((dragState.value.initialLayoutX + dxMm) * 10) / 10
    layout.value[dragState.value.key].y = Math.round((dragState.value.initialLayoutY + dyMm) * 10) / 10
}

const endDrag = () => {
    dragState.value.isDragging = false
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', endDrag)
}
onUnmounted(endDrag)

// == PDF ==
const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    
    recipients.value.forEach((person, i) => {
        if(i > 0) doc.addPage()
        
        Object.keys(layout.value).forEach(key => {
            if (mode.value === 'excellence' && key === 'place') return
            const conf = layout.value[key]
            
            // Get Text
            let text = ""
            if (key === 'name') text = person.name
            if (key === 'place') { const r = person.rank; text = (r===1?'1st':r===2?'2nd':r===3?'3rd':r+'th') + ' Place' }
            if (key === 'event') text = getEventLabel(person.event.trim())
            if (key === 'division') text = person.division
            
            // Auto-Scale
            let finalSize = conf.size
            let targetFont = globalFont.value
            if (targetFont === 'calibri') targetFont = 'helvetica' // Fallback for PDF

            if (key === 'name') {
                const maxW = conf.maxWidth || 180
                doc.setFontSize(finalSize)
                
                // Use Global Font
                doc.setFont(targetFont, conf.bold ? 'bold' : 'normal')
                
                const textW = doc.getTextWidth(text)
                if (textW > maxW) finalSize = finalSize * (maxW / textW)
            }
            
            doc.setFontSize(finalSize)
            // Use Global Font
            doc.setFont(targetFont, conf.bold ? 'bold' : 'normal')
            doc.text(text, conf.x, conf.y, { align: 'center' })
        })
    })
    doc.save(`Certificates-${mode.value}-${selectedEvent.value}.pdf`)
}
</script>

<style scoped>
/* 3-COLUMN STUDIO LAYOUT */
.studio-layout {
    display: flex; flex-direction: column; height: 100vh; background: #e2e8f0; font-family: 'Inter', sans-serif;
}

/* HEADER */
.studio-header {
    height: 50px; background: white; border-bottom: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: space-between; padding: 0 1rem; z-index: 50; flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: 1rem; }
.header-left h1 { font-size: 1rem; font-weight: 800; color: #1e293b; margin: 0; }
.btn-back { border: none; background: transparent; cursor: pointer; color: #64748b; padding: 4px; border-radius: 4px; display: flex; }
.btn-back:hover { background: #f1f5f9; color: #1e293b; }
.btn-back svg { width: 20px; height: 20px; }

.header-center { flex: 1; display: flex; justify-content: center; }
.mode-capsule {
    background: #f1f5f9; border-radius: 20px; padding: 3px; display: flex; gap: 2px;
}
.mode-capsule button {
    padding: 4px 16px; border-radius: 16px; border: none; background: transparent; 
    font-size: 0.8rem; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s;
}
.mode-capsule button.active { background: white; color: #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.header-right .btn-primary { padding: 8px 16px; font-size: 0.85rem; }

/* BODY */
.studio-body { flex: 1; display: flex; overflow: hidden; }

/* PANEL LEFT & RIGHT */
.panel-left, .panel-right {
    width: 280px; background: white; display: flex; flex-direction: column;
    border-right: 1px solid #cbd5e1;
    overflow: hidden;
    flex-shrink: 0;
    z-index: 20;
}
.panel-right { border-right: none; border-left: 1px solid #cbd5e1; }

.panel-section { padding: 16px; border-bottom: 1px solid #f1f5f9; }
.panel-section h3 { font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px; font-weight: 800; letter-spacing: 0.05em; display: flex; justify-content: space-between; }
.panel-section.flex-grow { flex: 1; display: flex; flex-direction: column; padding-bottom: 0; min-height: 0; }
.panel-section.scrollable { overflow-y: auto; }

/* FORM CONTROLS */
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px; }
select, input { width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; }
.btn-primary { background: #4f46e5; color: white; padding: 10px 16px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.btn-primary:disabled { background: #cbd5e1; cursor: not-allowed; }
.btn-primary svg { width: 18px; height: 18px; }

/* CONTROLS */
.section-desc { font-size: 0.8rem; color: #64748b; margin-bottom: 1rem; }
.property-group { border: 1px solid #e2e8f0; border-radius: 6px; background: white; margin-bottom: 0.5rem; overflow: hidden; }
.property-group.open { border-color: #3b82f6; box-shadow: 0 2px 4px rgba(59,130,246,0.1); }
.prop-header { padding: 0.5rem 0.75rem; background: #f8fafc; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.prop-label { font-size: 0.75rem; font-weight: 700; color: #475569; }
.prop-status { font-size: 0.65rem; background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
.prop-body { padding: 0.5rem; border-top: 1px solid #e2e8f0; }
.prop-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: flex-end; }
.prop-row:last-child { margin-bottom: 0; }
.input-wrap input { width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; }
.btn-toggle { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; background: white; }
.btn-toggle.active { background: #4f46e5; color: white; border-color: #4f46e5; }
.btn-icon-sm { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: none; border-radius: 6px; cursor: pointer; color: #64748b; }
.btn-icon-sm:hover { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer; color: #64748b; }
.btn-secondary { width: 100%; padding: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 600; color: #475569; cursor: pointer; }
.btn-secondary:hover { background: #f1f5f9; }
.file-upload-box { border: 2px dashed #cbd5e1; border-radius: 8px; padding: 1rem; text-align: center; margin-bottom: 1rem; cursor: pointer; transition: all 0.2s; background: #f8fafc; }
.file-upload-box:hover { border-color: #94a3b8; background: #f1f5f9; }
.file-upload-box input { display: none; }
.file-upload-box label { cursor: pointer; font-size: 0.85rem; color: #64748b; font-weight: 500; }
.footer-settings { margin-top: auto; background: white; }

/* RECIPIENT LIST */
.recipient-list { flex: 1; overflow-y: auto; padding-right: 4px; }
.empty-state { text-align: center; color: #94a3b8; font-size: 0.9rem; padding: 2rem 0; }
.recipient-list ul { list-style: none; padding: 0; margin: 0; }
.recipient-list li {
    padding: 8px 12px; border-radius: 6px; margin-bottom: 4px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: background 0.15s;
}
.recipient-list li:hover { background: #f1f5f9; }
.recipient-list li.selected { background: #eff6ff; border: 1px solid #bfdbfe; }
.r-rank { 
    width: 24px; height: 24px; border-radius: 50%; background: #94a3b8; color: white; 
    display: flex; align-items: center; justify-content: center; font-size: 0.75rem; 
    font-weight: 700; flex-shrink: 0;
}
.rank-1 { background: #F59E0B; }
.rank-2 { background: #94A3B8; }
.rank-3, .rank-4, .rank-5 { background: #B45309; }
.r-info { display: flex; flex-direction: column; overflow: hidden; }
.r-name { font-size: 0.8rem; font-weight: 600; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.r-div { font-size: 0.75rem; color: #94a3b8; }
.count-badge { background: #f1f5f9; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; color: #64748b; }

/* CENTER PANEL CANVAS */
.panel-center { flex: 1; background: #f1f5f9; display: flex; flex-direction: column; overflow: hidden; }
.canvas-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.canvas-toolbar { height: 40px; display: flex; align-items: center; justify-content: center;  }
.zoom-label { font-size: 0.8rem; color: #94a3b8; font-weight: 600; }

.paper-stage { flex: 1; overflow: auto; display: flex; justify-content: center; padding: 40px; }
.scale-wrapper { position: relative; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.a4-sheet { 
    width: 210mm; height: 297mm; background: white; position: absolute; transform-origin: top left; overflow: hidden;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center;
}
.watermark { position: absolute; bottom: -30px; left: 0; right: 0; text-align: center; font-size: 1rem; font-weight: 700; color: #94a3b8; user-select: none; pointer-events: none; }

.print-field { position: absolute; cursor: grab; white-space: nowrap; transform: translate(-50%, -50%); border: 1px dashed transparent; user-select: none; }
.print-field:hover { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
.print-field.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); z-index: 10; }
.print-field.dragging { cursor: grabbing; opacity: 0.8; }
/* NAV LINKS (PILL STYLE) */
.nav-links {
    display: flex;
    gap: 0.5rem;
}
.nav-link {
    background: transparent;
    color: #64748b;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.nav-link:hover {
    color: #334155;
    background: rgba(255,255,255,0.5);
}
.nav-link.active {
    background: #3b82f6;
    color: white;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}
</style>
