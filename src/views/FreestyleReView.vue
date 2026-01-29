<template>
  <div class="wrapper anim-up" :class="{ 'form-locked': isLocked }">
    <!-- Header -->
    <header class="judge-header">
      <button class="btn-back" @click="goBack">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div class="header-center">
        <div class="heat-pill">HEAT <span>{{ heat || '-' }}</span></div>
      </div>

      <button class="submit-btn" :disabled="isSubmitting || isLocked" @click="submitScore">
         {{ isSubmitting ? '...' : 'Submit' }}
      </button>
    </header>

    <!-- Controls -->
    <div class="control-row">
      <button class="btn-undo" :class="{ hidden: !history.length }" @click="undo" :disabled="isLocked">Undo</button>
      <div class="total-score">RE (Missing: {{ missing }})</div>
      <button class="btn-reset" @click="resetScore">Reset</button>
    </div>

    <!-- Scroll Container -->
    <div id="reScroll">
      <div id="reContainer">
          
        <div v-for="cat in categories" :key="cat.key" class="re-item">
            <!-- HALF (+0.5) -->
            <button 
                class="re-btn-half" 
                :class="{ disabled: values[cat.key] >= 4 }"
                @click="addScore(cat.key, 0.5)"
                :disabled="isLocked || values[cat.key] >= 4"
            >
                <span class="re-btn-label">{{ cat.label }}</span>
                <span class="re-btn-val">+½</span>
            </button>

            <!-- CENTER PILL -->
            <div class="re-value-pill">
                <span>{{ formatValue(values[cat.key]) }}</span>
                <span class="slash">/</span>
                <span>4</span>
            </div>

            <!-- FULL (+1) -->
            <button 
                class="re-btn-full" 
                :class="{ disabled: values[cat.key] >= 4 }"
                @click="addScore(cat.key, 1)"
                :disabled="isLocked || values[cat.key] >= 4"
            >
                <span class="re-btn-label">{{ cat.label }}</span>
                <span class="re-btn-val">+1</span>
            </button>
        </div>



      </div>
    </div>

    <!-- Locked Stamp -->
    <Teleport to="body">
       <div v-if="isLocked" class="locked-stamp">COMPLETED</div>
    </Teleport>

    <!-- Overlay -->
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
import { ref, reactive, computed, onMounted } from 'vue'
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

const categories = [
  { key: "power", label: "Power / Gymnastics" },
  { key: "multiples", label: "Multiples" },
  { key: "manipulation", label: "Rope Manipulation" }
]

const values = reactive({
    power: 0, 
    multiples: 0, 
    manipulation: 0 
})

const history = ref([])

const missing = computed(() => {
    // Logic from legacy: completed(v) -> Math.floor(v)
    // missing = 12 - total_completed
    const total = Math.floor(values.power) + Math.floor(values.multiples) + Math.floor(values.manipulation)
    return 12 - total
})

const formatValue = (v) => {
    // 1.5 -> "1.5", 1.0 -> "1"
    return v.toFixed(1).replace(/\.0$/, "")
}

onMounted(async () => {
    if(entryCode) {
        // MIGRATE: competition/{station}/entries
        // const sId = station || '1'

        // TESTER MODE
        if (route.query.test === 'true') {
             heat.value = "TEST"
             return // Skip Firebase
        }

        const snap = await getDoc(doc(db, "competition", sId, "entries", entryCode))
        if(snap.exists()) {
            const data = snap.data()
            heat.value = data.heat
            if (data.status === 'done' || data.status_re === true) {
                isLocked.value = true
                await restoreScore()
            }
        }
    }
})

const restoreScore = async () => {
    try {
        const docRef = doc(db, "results_freestyle", entryCode)
        const snap = await getDoc(docRef)
        
        if (snap.exists()) {
            const data = snap.data()
            const reData = data.re
            
            if(reData && reData.values) {
                values.power = reData.values.power || 0
                values.multiples = reData.values.multiples || 0
                values.manipulation = reData.values.manipulation || 0
            }
        }
    } catch (e) {
        console.error("Failed to restore score", e)
    }
}

const addScore = (key, val) => {
    if(isLocked.value) return
    if(values[key] >= 4) return // Max 4 check

    const prev = values[key]
    const next = Math.min(prev + val, 4)
    
    // Only update if changed
    if (next !== prev) {
        history.value.push({ key, prev })
        values[key] = next
        if(navigator.vibrate) navigator.vibrate(50)
    }
}

const undo = () => {
    if(isLocked.value) return
    const last = history.value.pop()
    if (last) {
        values[last.key] = last.prev
        if(navigator.vibrate) navigator.vibrate([50, 30])
    }
}

const resetScore = () => {
    // Unlock and Reset
    isLocked.value = false
    values.power = 0
    values.multiples = 0
    values.manipulation = 0
    history.value = []
    if(navigator.vibrate) navigator.vibrate(120)
}

const goBack = () => router.back()

const submitScore = async () => {
    if (isSubmitting.value || isLocked.value) return
    isSubmitting.value = true
    if(navigator.vibrate) navigator.vibrate([100])

    try {
        const payload = {
            entry_code: entryCode,
            re: {
                // Save structured values
                values: { ...values },
                
                score: Math.floor(values.power) + Math.floor(values.multiples) + Math.floor(values.manipulation),
                judge_key: sessionStorage.getItem('gbrsa_access_key') || 'unknown',
                updated_at: serverTimestamp()
            },
            
            station: station,
            created_at: serverTimestamp()
        }

        // CONSOLIDATED WRITE
        await setDoc(doc(db, "results_freestyle", entryCode), payload, { merge: true })
        
        // TESTER MODE
        if (route.query.test === 'true') {
             isSuccess.value = true
             setTimeout(() => {
                 isSubmitting.value = false
                 router.push('/tester')
             }, 1200)
             return
        }

        const pRef = doc(db, "competition", sId, "entries", entryCode)
        await updateDoc(pRef, { status_re: true })

        isSuccess.value = true
        setTimeout(() => {
            isSubmitting.value = false
            goBack()
        }, 1200)

    } catch (e) {
        alert("Error: " + e.message)
        isSubmitting.value = false
    }
}
</script>

<style scoped>
/* LEGACY CSS MATCH - EXACT PORT */
:root {
  --bg: #f8fafc;
  --text: #0f172a;
  --muted: #64748b;
  --indigo: #4633f5;
  --green: #22c55e;
  --red: #ef4444;
  --glass: rgba(255, 255, 255, 0.65);
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: manipulation;
}

.wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: -webkit-fill-available;
  position: relative;
  background: #f8fafc;
  font-family: 'Outfit', sans-serif;
  color: #0f172a;
  overflow: hidden;
  background-image:
    radial-gradient(at 0% 0%, rgba(70, 51, 245, 0.08) 0, transparent 50%),
    radial-gradient(at 100% 0%, rgba(34, 197, 94, 0.08) 0, transparent 50%);
}

.wrapper.form-locked {
    pointer-events: none;
}
.wrapper.form-locked .btn-reset, 
.wrapper.form-locked .btn-back {
    pointer-events: auto;
    opacity: 1 !important;
    position: relative;
    z-index: 10001;
}
.wrapper.form-locked #reScroll,
.wrapper.form-locked .control-row .total-score {
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
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
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
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transition: all 0.2s;
}
.btn-back:active { transform: scale(0.95); background: rgba(255, 255, 255, 0.8); }
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

.submit-btn {
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
  cursor: pointer;
}
.submit-btn:active { transform: scale(0.96); filter: brightness(1.2); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* CONTROLS */
.control-row {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

.total-score {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.1rem;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: 0.5px;
  white-space: nowrap;
  pointer-events: none;
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
.btn-undo { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 4px 10px rgba(245, 158, 11, 0.25); }
.btn-reset { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25); }

.btn-undo:active, .btn-reset:active { transform: scale(0.95); filter: brightness(1.3) saturate(1.1); }
.hidden { visibility: hidden !important; pointer-events: none !important; }

/* RE SCROLL & ITEMS */
#reScroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 1rem;
  /* REDUCED: Changed from 2.5rem to 1rem to match side padding + safe area */
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* REVERTED: Restored original flex column layout */
#reContainer {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  min-height: 100%;
  /* REMOVED: padding-bottom: 20px; */
  padding-bottom: 0;
}

.re-item {
  flex: 1;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: center;
  min-height: 110px;
}

.re-value-pill {
  background: #0f172a;
  color: white;
  padding: 6px 0;
  border-radius: 99px;
  font-size: 0.95rem;
  font-weight: 900;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.2);
  width: 66px;
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
  z-index: 10;
  line-height: 1;
  height: 44px;
}

.slash {
  opacity: 0.5;
  font-size: 0.9rem;
  margin: 0 4px;
}

.re-btn-half, .re-btn-full {
  flex: 1;
  height: 100%;
  min-height: 110px;
  border: none;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transition: all 0.1s;
  padding: 8px 12px;
}

.re-btn-half { background: linear-gradient(135deg, #f87171 0%, #dc2626 100%); }
.re-btn-full { background: linear-gradient(135deg, #34d399 0%, #059669 100%); }

.re-btn-half:active, .re-btn-full:active { 
  transform: scale(0.96); 
  filter: brightness(1.3) saturate(1.1); 
  transition: none;
}
.disabled { opacity: 0.2; pointer-events: none; filter: grayscale(1); }

.re-btn-label {
  font-size: 10px;
  font-weight: 700;
  margin-bottom: 3px;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.re-btn-val {
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 0.5px;
}

.bottom-spacer { height: 0; display: none; } /* Alternatively, just hide it via CSS if you kept the tag */

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

</style>
