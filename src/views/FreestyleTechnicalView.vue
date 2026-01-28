<template>
  <div class="wrapper" :class="{ 'form-locked': isLocked }">
    <!-- Header -->
    <header class="judge-header">
      <button class="btn-back" @click="goBack">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
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
      <div class="total-card-plain">Technical</div>
      <button class="btn-reset" @click="resetScore">Reset</button>
    </div>

    <!-- Grid -->
    <div class="grid anim-up">
      <button class="skill-btn miss-btn" @click="addCount('misses')" :disabled="isLocked">
        <div class="block-label">MISSES</div>
        <div class="block-number">{{ counts.misses }}</div>
      </button>

      <button class="skill-btn break-btn" @click="addCount('breaks')" :disabled="isLocked">
        <div class="block-label">BREAKS</div>
        <div class="block-number">{{ counts.breaks }}</div>
      </button>

      <button id="spaceBtn" class="skill-btn space-btn" @click="addCount('space')" :disabled="isLocked">
        <div class="block-label">SPACE VIOLATION</div>
        <div class="block-number">{{ counts.space }}</div>
      </button>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../firebase'
// [CLEANUP] Removed unused imports
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const entryCode = route.query.entry
const station = localStorage.getItem('gbrsa_allowed_station') || route.query.station

if (!station && route.query.test !== 'true') {
    alert("CRITICAL ERROR: No Station Configuration Found.\n\nPlease return to the home screen and log in again.");
    router.push('/');
}

const sId = station;

const heat = ref("-")
const isSubmitting = ref(false)
const isSuccess = ref(false)
const isLocked = ref(false)

const counts = ref({
    misses: 0,
    breaks: 0,
    space: 0
})
const history = ref([])

onMounted(async () => {
    if(!entryCode) return
    // MIGRATE: competition/{station}/entries
    // const sId = station || '1'

    // TESTER MODE
    if (route.query.test === 'true') {
        heat.value = "TEST"
        return // Skip Firebase
    }

    const docRef = doc(db, "competition", sId, "entries", entryCode)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
        const data = snap.data()
        heat.value = data.heat
        
        // Locking & Restoration Logic
        if (data.status === 'done' || data.status_technical === true) {
            isLocked.value = true
            await restoreScore()
        }
    }
})

const restoreScore = async () => {
    try {
        // Consolidated Read: Direct Doc Request
        const docRef = doc(db, "results_freestyle", entryCode)
        const snap = await getDoc(docRef)
        
        if (snap.exists()) {
            const data = snap.data()
            // Check for new consolidated format first
            if (data.technical) {
                 counts.value.misses = data.technical.misses || 0
                 counts.value.breaks = data.technical.breaks || 0
                 counts.value.space = data.technical.space_violation || 0
            } 
            // Fallback to legacy check (if user didn't wipe, but ideally we are clean slate)
            else if (data.judge_type === 'technical') {
                 counts.value.misses = data.misses || 0
                 counts.value.breaks = data.breaks || 0
                 counts.value.space = data.space_violation || 0
            }
        } else {
             // Try Legacy Query just in case? No, let's stick to clean migration or assume user knows.
             // Actually, the user asked to "combine into 1 like consolidated", implying new data.
        }
    } catch (e) {
        console.error("Failed to restore score", e)
    }
}

const addCount = (type) => {
    if(isLocked.value) return
    history.value.push({ type, oldVal: counts.value[type] })
    counts.value[type]++
    if (navigator.vibrate) navigator.vibrate(50) 
}

const undo = () => {
    if(isLocked.value) return
    const last = history.value.pop()
    if (last) {
        counts.value[last.type]--
    }
}

const resetScore = () => {
    // Unlock and Reset
    isLocked.value = false
    counts.value = { misses: 0, breaks: 0, space: 0 }
    history.value = []
    if (navigator.vibrate) navigator.vibrate(100)
}

const goBack = () => router.back()

const submitScore = async () => {
    if (isSubmitting.value || isLocked.value) return
    isSubmitting.value = true
    if(navigator.vibrate) navigator.vibrate([100])

    const missDed = counts.value.misses * 0.5
    const breakDed = counts.value.breaks * 0.5
    const spaceDed = counts.value.space * 0.1
    const finalScore = Number((10 - missDed - breakDed - spaceDed).toFixed(2))

    try {
        const payload = {
            entry_code: entryCode,
            // Consolidate under 'technical' key
            technical: {
                misses: counts.value.misses,
                breaks: counts.value.breaks,
                space_violation: counts.value.space,
                score: finalScore,
                judge_key: localStorage.getItem('gbrsa_access_key') || 'unknown',
                updated_at: serverTimestamp()
            },
            
            // Top-level metadata for easier indexing (optional but good practice)
            station: station,
            created_at: serverTimestamp() // This will update on every write, acceptable
        }

        // CONSOLIDATED WRITE: setDoc with merge
        // This creates the doc if missing, or updates just the 'technical' field if exists
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

        // const sId = station || '1'
        const pRef = doc(db, "competition", sId, "entries", entryCode)
        // Update Judge Specific Status (and keep global status if already done)
        await updateDoc(pRef, { 
            status_technical: true 
        })

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
    :root {
      --bg: #f8fafc;
      --text: #0f172a;
      --muted: #64748b;
      --indigo: #4633f5;
      --green: #22c55e;
      --red: #ef4444;
      --glass: rgba(255, 255, 255, 0.65);
      --glass-border: rgba(255, 255, 255, 0.4);
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
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
      width: 100%;
      background: #f8fafc;
      font-family: 'Outfit', system-ui, -apple-system, sans-serif;
      color: #0f172a;
      overflow: hidden;
      
      /* Premium Background */
      background-image:
        radial-gradient(at 0% 0%, rgba(70, 51, 245, 0.08) 0, transparent 50%),
        radial-gradient(at 100% 0%, rgba(34, 197, 94, 0.08) 0, transparent 50%);
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
    /* UNLOCK BACK */
    .wrapper.form-locked .btn-back {
        pointer-events: auto;
        opacity: 1 !important;
        position: relative;
        z-index: 10001;
    }
    .wrapper.form-locked .grid {
        opacity: 0.5;
        filter: grayscale(0.5);
    }

    /* ---------------------------------
       HEADER (Glass Navbar)
    ----------------------------------- */
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

    /* Back Button (Circle) */
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

    .btn-back:active {
      transform: scale(0.92);
    }

    .btn-back svg {
      width: 22px;
      height: 22px;
    }

    /* Centered Title/Badge */
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

    /* Submit Button (Small) */
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
    }

    .submit-btn:active {
      transform: scale(0.96);
    }
    .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* ---------------------------------
       CONTROLS (Total Score Bar)
    ----------------------------------- */
    .control-row {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.4);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .total-card-plain {
      font-size: 1.1rem;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: 0.5px;
    }

    /* PRESERVED: Undo/Reset Buttons */
    .btn-undo,
    .btn-reset {
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

    .btn-undo {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      box-shadow: 0 4px 10px rgba(245, 158, 11, 0.25);
    }

    .btn-reset {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25);
    }

    .btn-undo:active,
    .btn-reset:active {
      transform: scale(0.95);
      filter: brightness(1.3) saturate(1.1);
    }
    .btn-undo:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .hidden {
      visibility: hidden !important;
      pointer-events: none !important;
    }

    /* ---------------------------------
       GRID LAYOUT
    ----------------------------------- */
    .grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-auto-rows: 1fr;
      gap: 14px;
      padding: 16px;
      padding-bottom: calc(120px + env(safe-area-inset-bottom));
      min-height: 0;
      overflow-y: auto;
      max-width: 600px;
      margin: 0 auto;
      width: 100%;
    }

    /* Skill Buttons */
    .skill-btn {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      border: none;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition: transform 0.1s;
      cursor: pointer;
    }
    
    .skill-btn:active {
      transform: scale(0.96);
      opacity: 1;
      filter: brightness(1.3) saturate(1.1);
      transition: none;
    }
    .skill-btn:disabled {
        opacity: 1 !important; /* Keep full opacity for viewing */
        cursor: not-allowed;
    }

    .miss-btn {
      background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
    }

    .break-btn {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .space-btn {
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
      grid-column: span 2;
    }

    .block-label {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .block-number {
      font-size: 16px;
      font-weight: 900;
      background: rgba(0, 0, 0, 0.15);
      padding: 2px 12px;
      border-radius: 8px;
    }

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
