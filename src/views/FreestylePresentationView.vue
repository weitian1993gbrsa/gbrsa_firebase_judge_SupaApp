<template>
  <div class="wrapper anim-up" :class="{ 'form-locked': isLocked }">
    
    <section v-show="page === 1" class="page" id="page1" style="display: flex;">
        <header class="judge-header">
            <button class="btn-back" @click="goBack">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div class="header-center"><div class="heat-pill">HEAT <span>{{ heat || '-' }}</span></div></div>
            <button class="btn-primary" @click="goToPage2">Next</button>
        </header>

        <div class="control-row">
            <button class="btn-undo" :class="{ hidden: !history.length }" @click="undo" :disabled="isLocked">Undo</button>
            <div class="total-score">Presentation</div>
            <button class="btn-reset" @click="resetScore">Reset</button>
        </div>

        <div class="pres-grid">
            <button class="pres-btn minus" @click="adjust('cre', -1)" :disabled="isLocked">Creativity -<br><span>{{ counts.creMinus }}</span></button>
            <div></div>
            <button class="pres-btn plus" @click="adjust('cre', 1)" :disabled="isLocked">Creativity +<br><span>{{ counts.crePlus }}</span></button>

            <button class="pres-btn minus" @click="adjust('mus', -1)" :disabled="isLocked">Musicality -<br><span>{{ counts.musMinus }}</span></button>
            <button class="miss-btn" @click="addMiss" :disabled="isLocked">Miss<br><span>{{ misses }}</span></button>
            <button class="pres-btn plus" @click="adjust('mus', 1)" :disabled="isLocked">Musicality +<br><span>{{ counts.musPlus }}</span></button>

            <button class="pres-btn minus" @click="adjust('ent', -1)" :disabled="isLocked">Entertainment -<br><span>{{ counts.entMinus }}</span></button>
            <button class="pres-btn plus" @click="adjust('ent', 1)" :disabled="isLocked">Entertainment +<br><span>{{ counts.entPlus }}</span></button>

            <button class="pres-btn minus" @click="adjust('form', -1)" :disabled="isLocked">Form -<br><span>{{ counts.formMinus }}</span></button>
            <button class="pres-btn plus" @click="adjust('form', 1)" :disabled="isLocked">Form +<br><span>{{ counts.formPlus }}</span></button>

            <button class="pres-btn minus" @click="adjust('var', -1)" :disabled="isLocked">Repetition -<br><span>{{ counts.varMinus }}</span></button>
            <div></div>
            <button class="pres-btn plus" @click="adjust('var', 1)" :disabled="isLocked">Variety +<br><span>{{ counts.varPlus }}</span></button>
        </div>
    </section>

    <section v-show="page === 2" class="page" id="page2" style="display: flex;">
        <header class="judge-header">
            <button class="btn-back" @click="page = 1">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div class="header-center"><div class="heat-pill">HEAT <span>{{ heat || '-' }}</span></div></div>
            <button class="btn-primary" id="submitBtn" :disabled="isSubmitting || isLocked" @click="submitScore">
                 {{ isSubmitting ? '...' : 'Submit' }}
            </button>
        </header>

        <div class="score-values">
            <div id="scoreText">Score ({{ currentDisplayScore }})</div>
            <div id="missText">Misses ({{ misses }})</div>
        </div>

        <div id="summaryScroll">
            <div id="summaryContainer">
              <div v-for="cat in categories" :key="cat.key" class="row">
                   <button class="box-minus" @click="adjustSlider(cat.key, -1)" :disabled="isLocked">
                       <div class="label-text">{{ cat.minusLabel || cat.label }}</div>
                       <div class="symbol">-</div>
                   </button>
                   
                   <div class="slider-group">
                       <div class="level-labels">
                           <div>0</div>
                           <div :id="'val_'+cat.key" style="color:var(--text); font-size:18px; font-weight:900;">{{ summaryVals[cat.key] }}</div>
                           <div>24</div>
                       </div>
                       <input type="range" min="0" max="24" v-model.number="summaryVals[cat.key]" class="summary-slider" :disabled="isLocked">
                   </div>

                   <button class="box-plus" @click="adjustSlider(cat.key, 1)" :disabled="isLocked">
                       <div class="label-text">{{ cat.plusLabel || cat.label }}</div>
                       <div class="symbol">+</div>
                   </button>
              </div>
            </div>
        </div>
    </section>
    
    <Teleport to="body">
       <div v-if="isLocked" class="locked-stamp">COMPLETED</div>
    </Teleport>

    <Teleport to="body">
        <div class="overlay" :class="{ show: isSubmitting, success: isSuccess }">
            <div class="overlay-card">
                <div class="overlay-icon-box">
                    <svg class="spinner-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity: 0.2"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg class="check-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="overlay-text">{{ isSuccess ? 'Saved!' : 'Submitting...' }}</div>
                <div class="overlay-subtext">Syncing with Server</div>
            </div>
        </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../firebase'
import { doc, getDoc, collection, addDoc, setDoc, serverTimestamp, updateDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const entryCode = route.query.entry
const station = route.query.station || sessionStorage.getItem('gbrsa_allowed_station')

if (!station && route.query.test !== 'true') {
    alert("CRITICAL ERROR: No Station Configuration Found.\n\nPlease return to the home screen and log in again.");
    router.push('/');
}

const sId = station;

const heat = ref("-")
const isSubmitting = ref(false)
const isSuccess = ref(false)
const isLocked = ref(false)

const page = ref(1)

// PAGE 1 STATE
const counts = ref({
    crePlus: 0, creMinus: 0,
    musPlus: 0, musMinus: 0,
    entPlus: 0, entMinus: 0,
    formPlus: 0, formMinus: 0,
    varPlus: 0, varMinus: 0
})
const misses = ref(0)
const history = ref([])

// PAGE 2 STATE
const categories = [
    { key: "cre", label: "Creativity" },
    { key: "mus", label: "Musicality" },
    { key: "ent", label: "Entertainment" },
    { key: "form", label: "Form" },
    { 
        key: "var", 
        label: "Variety / Repetition", 
        minusLabel: "Repetition", 
        plusLabel: "Variety" 
    }
]

const summaryVals = ref({ cre: 12, mus: 12, ent: 12, form: 12, var: 12 })
const WEIGHTS = { cre: 0.15, mus: 0.20, ent: 0.25, form: 0.25, var: 0.15 }

onMounted(async () => {
    if(!entryCode) return
    if (route.query.test === 'true') {
        heat.value = "TEST"
        return
    }

    const docRef = doc(db, "competition", sId, "entries", entryCode)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
        const data = snap.data()
        heat.value = data.heat
        
        if (data.status === 'done' || data.status_presentation === true) {
            isLocked.value = true
            await restoreScore()
        }
    }
})

const restoreScore = async () => {
    try {
        const docRef = doc(db, "results_freestyle", entryCode)
        const snap = await getDoc(docRef)
        
        if (snap.exists()) {
            const data = snap.data()
            const pData = data.presentation || {}
            
            if(pData.counts) {
                Object.keys(pData.counts).forEach(k => {
                    counts.value[k] = pData.counts[k]
                })
            }
            if(pData.misses != null) misses.value = pData.misses
            
            if (pData.creativity != null) summaryVals.value.cre = pData.creativity
            if (pData.musicality != null) summaryVals.value.mus = pData.musicality
            if (pData.entertainment != null) summaryVals.value.ent = pData.entertainment
            if (pData.form != null) summaryVals.value.form = pData.form
            if (pData.variety != null) summaryVals.value.var = pData.variety
        }
    } catch (e) {
        console.error("Failed to restore score", e)
    }
}

const adjust = (cat, dir) => {
    if (isLocked.value) return
    const key = cat + (dir > 0 ? 'Plus' : 'Minus')
    history.value.push({ key, old: counts.value[key] })
    counts.value[key]++
    if (navigator.vibrate) navigator.vibrate(50)
}

const addMiss = () => {
    if (isLocked.value) return
    history.value.push({ key: 'miss', old: misses.value })
    misses.value++
    if (navigator.vibrate) navigator.vibrate(70)
}

const undo = () => {
    if (isLocked.value) return
    const last = history.value.pop()
    if (!last) return
    if (last.key === 'miss') misses.value = last.old
    else counts.value[last.key] = last.old
}

const resetScore = () => {
    isLocked.value = false
    Object.keys(counts.value).forEach(k => counts.value[k] = 0)
    misses.value = 0
    history.value = []
    
    // Also reset summary vals to default
    summaryVals.value = { cre: 12, mus: 12, ent: 12, form: 12, var: 12 }
    page.value = 1
}

const goToPage2 = () => {
    if (!isLocked.value) {
        const calc = (plus, minus) => Math.max(0, Math.min(24, 12 + plus - minus))
        summaryVals.value.cre = calc(counts.value.crePlus, counts.value.creMinus)
        summaryVals.value.mus = calc(counts.value.musPlus, counts.value.musMinus)
        summaryVals.value.ent = calc(counts.value.entPlus, counts.value.entMinus)
        summaryVals.value.form = calc(counts.value.formPlus, counts.value.formMinus)
        summaryVals.value.var = calc(counts.value.varPlus, counts.value.varMinus)
    }
    page.value = 2
}

const adjustSlider = (key, delta) => {
    if (isLocked.value) return
    summaryVals.value[key] = Math.max(0, Math.min(24, summaryVals.value[key] + delta))
    if (navigator.vibrate) navigator.vibrate(50)
}

const calculateFinalScore = () => {
    const v = summaryVals.value
    let sum = 
        (v.cre * WEIGHTS.cre) +
        (v.mus * WEIGHTS.mus) +
        (v.ent * WEIGHTS.ent) +
        (v.form * WEIGHTS.form) +
        (v.var * WEIGHTS.var)
    sum -= (misses.value)
    return Number(sum.toFixed(2))
}

const currentDisplayScore = computed(() => calculateFinalScore().toFixed(2))

const goBack = () => {
    if (page.value === 2) {
        page.value = 1
    } else {
        router.back()
    }
}

const submitScore = async () => {
    if (isSubmitting.value || isLocked.value) return
    isSubmitting.value = true
    if (navigator.vibrate) navigator.vibrate([100])

    const finalScore = calculateFinalScore()
    try {
        const payload = {
            entry_code: entryCode,
            presentation: {
                creativity: summaryVals.value.cre,
                musicality: summaryVals.value.mus,
                entertainment: summaryVals.value.ent,
                form: summaryVals.value.form,
                variety: summaryVals.value.var,
                misses: misses.value,
                score: finalScore,
                presentation_score: finalScore, 
                counts: counts.value,
                judge_key: sessionStorage.getItem('gbrsa_access_key') || 'unknown',
                updated_at: serverTimestamp()
            },
            station: station,
            created_at: serverTimestamp()
        }

        await setDoc(doc(db, "results_freestyle", entryCode), payload, { merge: true })
        
        if (route.query.test === 'true') {
             isSuccess.value = true
             setTimeout(() => {
                 isSubmitting.value = false
                 router.push('/tester')
             }, 1200)
             return
        }

        const pRef = doc(db, "competition", sId, "entries", entryCode)
        await updateDoc(pRef, { status_presentation: true })

        isSuccess.value = true
        setTimeout(() => {
            isSubmitting.value = false
            router.push({ path: '/station', query: route.query })
        }, 1200)

    } catch (e) {
        alert("Error: " + e.message)
        isSubmitting.value = false
    }
}
</script>

<style scoped>
/* LEGACY CSS MATCH */
:root {
  --bg: #f8fafc;
  --text: #0f172a;
  --muted: #64748b;
  --indigo: #4633f5;
  --green: #22c55e;
  --red: #ef4444;
  --glass: rgba(255, 255, 255, 0.95);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: manipulation;
}

.wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: -webkit-fill-available;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
  background-image:
    radial-gradient(at 0% 0%, rgba(70, 51, 245, 0.04) 0, transparent 50%),
    radial-gradient(at 50% 0%, rgba(34, 197, 94, 0.04) 0, transparent 50%);
  color: #0f172a;
  font-family: 'Outfit', sans-serif;
}

.wrapper.form-locked {
    pointer-events: none;
}
.wrapper.form-locked .btn-reset {
    pointer-events: auto;
    opacity: 1 !important;
    position: relative;
    z-index: 10001;
}
/* UNLOCK BACK & NAV */
.wrapper.form-locked .btn-primary, .wrapper.form-locked .btn-back {
    pointer-events: auto; /* Allow navigating */
    opacity: 1 !important;
    position: relative;
    z-index: 10001;
}

.wrapper.form-locked .pres-grid, 
.wrapper.form-locked #summaryContainer {
    opacity: 0.5;
    filter: grayscale(0.5);
}

/* HEADER */
.judge-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  z-index: 50;
  position: relative;
}

.btn-back {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #0f172a;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}
.btn-back:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.8);
}
.btn-back svg { width: 22px; height: 22px; }

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.heat-pill {
  background: #0f172a;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.15);
}

.btn-primary {
  height: 44px;
  padding: 0 1.25rem;
  background: linear-gradient(135deg, #4633f5 0%, #3b82f6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  box-shadow: 0 4px 10px rgba(70, 51, 245, 0.25);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  cursor: pointer;
}
.btn-primary:active { transform: scale(0.96); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* PAGE 1 CONTENT */
.page {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.control-row {
  display: grid;
  grid-template-columns: 100px 1fr 100px;
  align-items: center;
  padding: 0 16px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  height: 56px;
  flex-shrink: 0;
}

.btn-undo {
  grid-column: 1;
  justify-self: start;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.25);
}

.total-score {
  grid-column: 2;
  justify-self: center;
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  white-space: nowrap;
}

.btn-reset {
  grid-column: 3;
  justify-self: end;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25);
}

.btn-undo, .btn-reset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 8px 16px;
  width: 96px;
  height: 40px;
  font-size: 14px;
  font-weight: 800;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: transform 0.1s;
}
.btn-undo:active, .btn-reset:active { transform: scale(0.95); filter: brightness(1.3) saturate(1.1); transition: none; }
.hidden { visibility: hidden !important; pointer-events: none !important; }


/* PAGE 1 GRID (UNTOUCHED) */
.pres-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  padding: 24px 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  overflow-y: auto;
}

@media (max-width: 480px) {
    .pres-grid {
        gap: 10px;
        padding-left: 6px;
        padding-right: 6px;
    }
}

.pres-btn, .miss-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.1s;
  padding: 10px;
  text-align: center;
  word-break: break-word; 
  white-space: normal;
  line-height: 1.2;
}
.pres-btn span, .miss-btn span { 
  font-size: 16px; 
  font-weight: 900; 
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.15);
  padding: 2px 12px;
  border-radius: 8px;
}

.pres-btn:active, .miss-btn:active { transform: scale(0.96); filter: brightness(1.3) saturate(1.1); transition: none; }

.pres-btn.minus { background: linear-gradient(135deg, #f87171 0%, #dc2626 100%); }
.pres-btn.plus { background: linear-gradient(135deg, #34d399 0%, #059669 100%); }
.miss-btn { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); font-size: 18px; grid-row: span 3; }

/* PAGE 2 SUMMARY (FIXED) */
.score-values {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 12px 0;
  border-bottom: 2px solid #e2e8f0;
  background: #fff;
  font-weight: 800;
  color: #0f172a;
  flex-shrink: 0;
}

/* CONTAINER FIX: Flex column to fill height */
#summaryScroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
}

/* GAP FIX: Add gap back so it matches Page 1 */
#summaryContainer {
    flex: 1;
    display: flex;
    flex-direction: column;
    /* CHANGED: Use gap for spacing instead of just justify-content */
    gap: 12px; 
    min-height: 100%;
    padding-bottom: 10px;
}

/* ROW FIX: Fixed Width Columns & Stretching Height */
.row {
  display: grid;
  /* CHANGED: Force fixed column ratios (ignore text length) */
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr);
  gap: 12px;
  align-items: center; 
  margin: 0 auto;
  width: 100%;
  
  /* HEIGHT LOGIC: Stretch to fill container */
  flex: 1; 
  min-height: 80px; 
}

/* BUTTON FIX: Fill the row height */
.box-minus, .box-plus {
  color: white;
  height: 100%; 
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.06);
  transition: transform 0.1s;
  user-select: none;
}
.box-minus:active, .box-plus:active { transform: scale(0.96); filter: brightness(1.3) saturate(1.1); transition: none; }

.box-minus { background: linear-gradient(135deg, #f87171 0%, #dc2626 100%); }
.box-plus { background: linear-gradient(135deg, #34d399 0%, #059669 100%); }

/* LABEL TEXT FIX: Handle overflow */
.label-text { 
    font-size: 10px; 
    text-transform: uppercase; 
    margin-bottom: 4px; 
    text-align: center;
    /* Wrap long words if needed */
    white-space: normal;
    word-break: break-word;
    padding: 0 4px;
    line-height: 1.1;
}
.symbol { font-size: 24px; font-weight: 900; }

.slider-group {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
}

.level-labels { display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; margin-bottom: 4px; padding: 0 4px; color: #64748b; }

.summary-slider { width: 100%; accent-color: #4633f5; border-radius: 10px; height: 8px; }

/* OVERLAY */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.4); /* Lighter backdrop */
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s;
}
.overlay.show { opacity: 1; pointer-events: all; }

.overlay-card { 
    background: rgba(255, 255, 255, 0.95);
    padding: 2.5rem 3rem;
    border-radius: 24px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    text-align: center;
    border: 1px solid rgba(255,255,255,0.8);
    transform: scale(0.9);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    min-width: 280px;
}
.overlay.show .overlay-card { transform: scale(1); }

.spinner-svg { width: 48px; height: 48px; color: #4633f5; animation: spin 1s linear infinite; }
.check-svg { width: 56px; height: 56px; color: #10b981; display: none; margin: 0 auto; }

.overlay.success .spinner-svg { display: none; }
.overlay.success .check-svg { display: block; animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

.overlay-text { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.25rem; color: #1e293b; margin-top: 1rem; }
.overlay-subtext { font-family: 'Outfit', sans-serif; font-size: 0.9rem; color: #64748b; margin-top: 4px; font-weight: 600; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes popIn { 0% { transform: scale(0) rotate(-45deg); opacity: 0; } 100% { transform: scale(1) rotate(0); opacity: 1; } }

/* LOCKED STAMP */
.locked-stamp {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-12deg) scale(1);
  border: 8px solid #ffffff;
  color: #ffffff;
  font-size: 3rem;
  font-weight: 900;
  padding: 1rem 3rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  white-space: nowrap;
  pointer-events: none;
  z-index: 9999;
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
  /* ANIMATION REMOVED */
}

@keyframes stampIn {
    from { opacity: 0; transform: translate(-50%, -50%) rotate(-12deg) scale(2); }
    to { opacity: 1; transform: translate(-50%, -50%) rotate(-12deg) scale(1); }
}
/* ANIMATION REMOVED */
</style>