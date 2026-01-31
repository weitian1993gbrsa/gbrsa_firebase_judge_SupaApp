<template>
  <div class="page judge" :class="{ 'form-locked': isLocked }">
    <header class="judge-header">
      <!-- Left: Back -->
      <button @click="goBack" class="btn-back-circle">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
  
      <!-- Center: Title -->
      <div class="header-title" style="display:flex; justify-content:center;">
        <div class="heat-pill">HEAT <span>{{ heat || '-' }}</span></div>
      </div>
  
      <!-- Right: Spacer -->
      <div class="header-right"></div>
    </header>
  
    <main class="container">
      <div class="form anim-up">
        
        <!-- TAP AREA (Main Interaction) -->
        <div class="tap-hit-box" @pointerdown.prevent="handleTap">
            <div 
                class="tap-zone"
                :class="{ 'locked': isTapLocked, 'active': isTouched }"
            >
                <div class="tap-content">
                    <div class="score-display">{{ currentScore }}</div>
                    <div class="tap-hint" v-if="!isTapLocked">TAP TO COUNT</div>
                    <div class="tap-hint locked-msg" v-else>
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="lock-icon">
                           <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                         </svg>
                         LOCKED
                    </div>
                </div>
            </div>
        </div>

    <div class="controls-sidebar">

        <!-- CONTROL BAR (Minus, Reset, FS) -->
        <div class="control-bar">
            <!-- Reset Button: Always enabled to allow unlocking/rescoring -->
            <button class="ctrl-btn reset" @click="resetScore">
               RESET
            </button>

            <button class="ctrl-btn minus" @pointerdown.prevent="decrementScore" :disabled="isLocked || isTapLocked">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>
            </button>

             <!-- False Start Toggle -->
            <button 
                type="button" 
                class="ctrl-btn fs-btn" 
                :class="falseStart ? 'fs-yes' : 'fs-no'"
                @click="toggleFalseStart"
                :disabled="isLocked"
            >
             {{ falseStart ? 'False Start: Yes' : 'False Start: No' }}
            </button>
        </div>
  
        <!-- BOTTOM ACTIONS: Remark, Keypad, Submit -->
        <div class="bottom-actions">
           <button class="action-btn remark-btn" @click="openRemark" :class="{ 'has-data': remark.length > 0 }" :disabled="isLocked">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
               </svg>
               REMARK
           </button>

           <button class="action-btn keypad-btn" @click="openKeypad" :disabled="isLocked">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="icon">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
               </svg>
               KEYPAD
           </button>
          
          <button class="submit-btn" @click="submitScore" :disabled="isSubmitting || isLocked">
             {{ isSubmitting ? '...' : 'SUBMIT' }}
          </button>
        </div>
        
    </div>
  
      </div>
    </main>

    <!-- REMARK MODAL -->
    <Teleport to="body">
       <div v-if="showRemarkModal" class="modal-backdrop" @click.self="closeRemark">
          <div class="modal-card">
              <h3>Add Remark</h3>
              <textarea v-model="tempRemark" placeholder="Enter details..." rows="3"></textarea>
              <div class="modal-actions">
                  <button class="m-btn cancel" @click="closeRemark">Cancel</button>
                  <button class="m-btn confirm" @click="saveRemark">Save</button>
              </div>
          </div>
       </div>
    </Teleport>

    <!-- KEYPAD MODAL -->
    <Teleport to="body">
       <div v-if="showKeypadModal" class="modal-backdrop" @click.self="closeKeypad">
          <div class="modal-card keypad-card">
              <div class="keypad-display">{{ tempNumpadScore }}</div>
              <div class="numpad-grid">
                  <button v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" @click="numpadAppend(n)">{{ n }}</button>
                  <button class="np-del" @click="numpadReset">C</button>
                  <button @click="numpadAppend(0)">0</button>
              </div>
               <div class="modal-actions">
                  <button class="m-btn cancel" @click="closeKeypad">Cancel</button>
                  <button class="m-btn confirm" @click="saveKeypad">Set Score</button>
              </div>
          </div>
       </div>
    </Teleport>

    <!-- Locked Stamp -->
    <Teleport to="body">
       <div v-if="isLocked" class="locked-stamp">COMPLETED</div>
    </Teleport>

    <!-- Overlay -->
    <Teleport to="body">
        <div class="overlay" :class="{ show: isStationBusy }">
            <div class="overlay-card occupied-card">
                 <div class="occupied-icon">🔒</div>
                 <div class="overlay-text">STATION OCCUPIED</div>
                 <div class="overlay-subtext" style="max-width:300px; margin: 0 auto; line-height:1.4;">
                    Another judge is currently active on Station {{ station }}.
                 </div>
                 <button class="force-btn" @click="forceUnlock">
                    FORCE UNLOCK
                 </button>
                 <button class="m-btn cancel" @click="goBack" style="width:100%; margin-top:0.5rem;">
                    Go Back
                 </button>
            </div>
        </div>
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../firebase'
import { doc, getDoc, updateDoc, collection, setDoc, serverTimestamp, query, where, getDocs, limit, deleteDoc } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()

// Data
const entryCode = route.query.entry
const station = route.query.station || sessionStorage.getItem('gbrsa_allowed_station')

if (!station && route.query.test !== 'true') {
    alert("CRITICAL ERROR: No Station Configuration Found.\n\nPlease return to the home screen and log in again.");
    router.push('/');
}

const sId = station;
const heat = ref("-")
const participant = ref(null)

// Form State
const currentScore = ref(0)
const falseStart = ref(false)
const remark = ref("")
const isSubmitting = ref(false)
const isSuccess = ref(false)
const isLocked = ref(false)
const isTapLocked = ref(false) // LOCK STATE
const isTouched = ref(false) // ANIMATION STATE

// UI State
const showRemarkModal = ref(false)
const tempRemark = ref("")
const showKeypadModal = ref(false)
const tempNumpadScore = ref("0")

// Fetch Participant Meta
// Fetch Participant Meta
// Fetch Participant Meta
onMounted(async () => {
    // Monitor Locks
    if (station !== 'TEST') {
        // const sId = station || '1'
        
        // Acquire Lock Immediately (For both Competition AND Practice)
        await checkAndAcquireLock(sId)

        if(!entryCode) return 

        const isPractice = route.query.test === 'true'

        if (isPractice) {
            // PRACTICE MODE: Mock Data but ENABLE Broadcast
            participant.value = {
                name: "TEST JUMPER",
                team: "MOCK TEAM",
                id: "TEST-001",
                heat: "TEST"
            }
            heat.value = "TEST"
            // Intentional fall-through to BROADCAST INIT
        } else {
            // COMPETITION MODE: Real Data
            const docRef = doc(db, "competition", sId, "entries", entryCode)
            const snap = await getDoc(docRef)
            
            if (snap.exists()) {
                 participant.value = snap.data()
                 heat.value = participant.value.heat
                 
                 // Locking Logic
                 if (participant.value.status === 'done') {
                     isLocked.value = true
                     await restoreScore()
                     return // Don't broadcast if already done
                 }
             } else {
                 return // Entry not found
             }
        }

        // BROADCAST INIT (Live Board) - For both Practice & Active Competition
        const broadcastId = station || '0' 
        setDoc(doc(db, "live_scores", String(broadcastId)), {
             station: Number(broadcastId),
             heat: heat.value,
             entry_code: entryCode,
             score: 0,
             status: 'judging',
             updated_at: serverTimestamp()
         }).catch(e => console.error("Init broadcast failed", e))

    } else {
        // PURE TEST MODE (Speed Judge Button)
        // No Lock, No Broadcast
        if (route.query.test === 'true') {
            participant.value = {
                name: "TEST JUMPER",
                team: "MOCK TEAM",
                id: "TEST-001",
                heat: "TEST"
            }
            heat.value = "TEST"
        }
    }
})

const restoreScore = async () => {
    try {
        const docRef = doc(db, "results_speed", entryCode)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
            const data = snap.data()
            currentScore.value = Number(data.score || 0)
            falseStart.value = data.false_start || false
            remark.value = data.remark || ""
        } else {
             // Fallback
            const q = query(collection(db, "results_speed"), where("entry_code", "==", entryCode), limit(1))
            const legacySnap = await getDocs(q)
            if (!legacySnap.empty) {
                const data = legacySnap.docs[0].data()
                currentScore.value = Number(data.score || 0)
                falseStart.value = data.false_start || false
                remark.value = data.remark || ""
            }
        }
    } catch (e) {
        console.error("Failed to restore score", e)
    }
}

onUnmounted(() => {
    // If we are leaving (back button, etc), disconnect the heat
    if (!isSubmitting.value && station !== 'TEST') { 
        const sId = station || '0'
        setDoc(doc(db, "live_scores", String(sId)), {
            station: Number(sId),
            score: 0,
            status: 'waiting',
            heat: '-',
            entry_code: '',
            updated_at: serverTimestamp()
        }).catch(e => console.error("Cleanup broadcast failed", e))
    }

    // RELEASE STATION LOCK
    if (hasLock.value && station && station !== 'TEST') {
        deleteDoc(doc(db, 'station_locks', String(station))).catch(e => console.error("Unlock failed", e))
    }
})

// ...

// --- STATION LOCKING ---
const hasLock = ref(false)
const isStationBusy = ref(false)
const mySessionId = crypto.randomUUID()

const checkAndAcquireLock = async (sId) => {
    if (!sId || sId === 'TEST') return // SKIP LOCK FOR TEST
    const lockRef = doc(db, 'station_locks', String(sId))
    
    try {
        const snap = await getDoc(lockRef)
        
        if (snap.exists()) {
             // LOCKED BY SOMEONE
             console.warn("Station is locked by another session")
             isStationBusy.value = true
        } else {
            // FREE - GRAB IT
            await acquireLock(sId)
        }
    } catch (e) {
        console.error("Lock check error", e)
        // Fail open or closed? Let's fail open but warn
    }
}

const acquireLock = async (sId) => {
    if (sId === 'TEST') return // Double safety
    try {
        await setDoc(doc(db, 'station_locks', String(sId)), {
            session_id: mySessionId,
            judge_key: sessionStorage.getItem('gbrsa_access_key') || 'anon',
            locked_at: serverTimestamp()
        })
        hasLock.value = true
        isStationBusy.value = false
    } catch (e) {
        console.error("Failed to acquire lock", e)
        alert("Network Error: Could not lock station.")
    }
}

const forceUnlock = async () => {
    if (station === 'TEST') return
    if (!confirm("Are you sure? Only do this if the other judge device is dead.")) return
    const sId = station || sessionStorage.getItem('gbrsa_allowed_station')
    await acquireLock(sId) // Overwrite existing lock
}

// ...

// Logic
const goBack = () => router.back()

const handleTap = async () => {
    if(isLocked.value || isTapLocked.value) return
    currentScore.value++
    
    // Hapic Feedback (Immediate)
    if(navigator.vibrate) navigator.vibrate(15)

    // Animation Trigger (Punchier RE-trigger)
    isTouched.value = false
    await nextTick()
    isTouched.value = true
    setTimeout(() => { isTouched.value = false }, 80)
}

const decrementScore = () => {
    if(isLocked.value || isTapLocked.value) return
    if(currentScore.value > 0) currentScore.value--
    if(navigator.vibrate) navigator.vibrate(40)
}

const toggleFalseStart = () => {
    if(isLocked.value) return
    falseStart.value = !falseStart.value
    if(navigator.vibrate) navigator.vibrate(50)
}

const resetScore = () => {
    isLocked.value = false // Unlock if previously done
    isTapLocked.value = false // Unlock tap zone
    currentScore.value = 0
    falseStart.value = false
    remark.value = ""
    if(navigator.vibrate) navigator.vibrate(50)
}

// REMARK MODAL
const openRemark = () => {
    if(isLocked.value) return
    tempRemark.value = remark.value
    showRemarkModal.value = true
}
const closeRemark = () => showRemarkModal.value = false
const saveRemark = () => {
    remark.value = tempRemark.value
    showRemarkModal.value = false
}

// NUMPAD MODAL (MANUAL EDIT)
const openKeypad = () => {
    if(isLocked.value) return
    tempNumpadScore.value = String(currentScore.value)
    showKeypadModal.value = true
}
const closeKeypad = () => showKeypadModal.value = false
const numpadAppend = (n) => {
    if(tempNumpadScore.value.length >= 3) return
    if(tempNumpadScore.value === "0") tempNumpadScore.value = String(n)
    else tempNumpadScore.value += String(n)
}
const numpadReset = () => {
    tempNumpadScore.value = "0"
}
const saveKeypad = () => {
    currentScore.value = Number(tempNumpadScore.value)
    isTapLocked.value = true // LOCK
    showKeypadModal.value = false
}

const submitScore = async () => {
    if (isSubmitting.value || isLocked.value) return
    isSubmitting.value = true
    if(navigator.vibrate) navigator.vibrate([100])

    try {
        const payload = {
            entry_code: entryCode,
            score: Number(currentScore.value),
            false_start: falseStart.value,
            remark: remark.value,
            station: station,
            judge_key: sessionStorage.getItem('gbrsa_access_key') || 'unknown',
            created_at: serverTimestamp() 
        }

        if (route.query.test === 'true') {
             isSuccess.value = true
             setTimeout(() => {
                 isSubmitting.value = false
                 router.push('/tester') 
             }, 1200)
             return
        }

        const resultRef = doc(db, "results_speed", entryCode)
        await setDoc(resultRef, payload, { merge: true })

        const sId = station || '1'
        const pRef = doc(db, "competition", sId, "entries", entryCode)
        await updateDoc(pRef, { status: "done" })

        // BROADCAST RESET
        await setDoc(doc(db, "live_scores", String(sId)), {
             station: Number(sId),
             score: 0,
             status: 'waiting',
             heat: '-',
             entry_code: '',
             updated_at: serverTimestamp()
        })

        isSuccess.value = true
        setTimeout(() => {
            isSubmitting.value = false
            goBack()
        }, 1200)

    } catch (e) {
        alert("Error submitting: " + e.message)
        isSubmitting.value = false
    }
}

const updateLiveScore = async (newScore) => {
    if (station === 'TEST') return // SKIP LIVE UPDATE FOR TEST

    try {
        const sId = station || '0'
        await setDoc(doc(db, "live_scores", String(sId)), {
            station: Number(sId),
            score: Number(newScore),
            entry_code: entryCode || '',
            heat: heat.value || '',
            status: 'judging',
            updated_at: serverTimestamp()
        })
    } catch (e) {
        console.error("Live update failed", e)
    }
}

// Watch Score Changes
import { watch } from 'vue'
watch(currentScore, (val) => {
    if (!isLocked.value) {
        updateLiveScore(val)
    }
})
</script>

<style scoped>
    /* ADD LOCKED STYLE */
    .tap-zone.locked {
        background: #e2e8f0;
        border-color: #cbd5e1;
        cursor: not-allowed;
        opacity: 0.9;
    }
    .tap-zone.locked .score-display {
        color: #94a3b8;
    }
    .locked-msg {
        color: #ef4444;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .lock-icon { width: 16px; height: 16px; }

    :root {
      --bg: #f8fafc;
      --text: #0f172a;
      --indigo: #4633f5;
    }

    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      touch-action: manipulation;
    }

    .page.judge {
      margin: 0;
      padding: 0;
      height: 100dvh;
      width: 100%;
      background: #f3f4f6;
      font-family: 'Outfit', system-ui, -apple-system, sans-serif;
      color: #0f172a;
      overflow: hidden; 
      overscroll-behavior: none;
      touch-action: none;
      background-image:
        radial-gradient(at 0% 0%, hsla(253, 16%, 7%, 1) 0, transparent 50%),
        radial-gradient(at 50% 0%, hsla(225, 39%, 30%, 1) 0, transparent 50%);
      background-image:
        radial-gradient(at 40% 20%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
        radial-gradient(at 80% 0%, rgba(147, 51, 234, 0.15) 0px, transparent 50%);
      background-attachment: fixed;
      background-size: cover;
      display: flex;
      flex-direction: column;
    }
    
    .page.judge.form-locked {
        pointer-events: none;
    }
    /* ALLOW BACK BUTTON WHEN LOCKED */
    .page.judge.form-locked .btn-back-circle,
    .page.judge.form-locked .control-bar {
        pointer-events: auto;
        opacity: 1 !important;
        position: relative;
        z-index: 10001;
    }

    /* HEADER */
    .judge-header {
      flex: 0 0 64px;
      z-index: 999;
      background: rgba(255, 255, 255, 0.65);
      backdrop-filter: blur(24px);
      display: flex;
      align-items: center;
      padding: 0 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
      justify-content: space-between;
    }

    .btn-back-circle {
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
    }
    .btn-back-circle svg { width: 24px; height: 24px; stroke-width: 2.5px; }
    .header-title {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
    }
    .heat-pill {
      background: #0f172a;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.05em;
    }

    /* MAIN */
    .container {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1rem;
      overflow: hidden;
    }

    .form {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      height: 100%;
    }

    /* TAP ZONE */
    .tap-hit-box {
        flex: 1;
        width: 100%;
        display: flex;
        /* No pointer-events: none here, we want it to capture clicks */
    }
    .tap-zone {
        width: 100%;
        height: 100%;
        background: rgba(255,255,255,0.7);
        backdrop-filter: blur(20px);
        border: 2px solid rgba(255,255,255,0.5);
        border-radius: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        box-shadow: 0 10px 30px -5px rgba(0,0,0,0.1);
        cursor: pointer;
        /* Fast recovery (decay) */
        transition: background 0.05s ease-out, transform 0.05s ease-out;
        position: relative;
        overflow: hidden;
    }
    /* Instant Attack */
    .tap-zone.active {
        background: rgba(255,255,255,0.9);
        transform: scale(0.96);
        border-color: #4633f5;
        transition: none; /* No delay on press */
    }
    .score-display {
        font-size: clamp(6rem, 25vw, 12rem); /* Responsive size */
        font-weight: 900;
        line-height: 1;
        color: #1e293b;
        font-variant-numeric: tabular-nums;
        font-family: 'Outfit', 'Courier New', monospace; /* Monospace fallback */
        text-shadow: 0 4px 10px rgba(0,0,0,0.1);
        white-space: nowrap; /* Prevent wrapping */
        width: 100%;
        text-align: center;
    }
    .tap-hint {
        font-size: 0.9rem;
        letter-spacing: 0.2rem;
        font-weight: 700;
        color: #94a3b8;
        margin-top: 1rem;
    }

    /* CONTROL BAR */
    .control-bar {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.75rem;
        height: 64px;
    }
    .ctrl-btn {
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.4);
        background: rgba(255,255,255,0.6);
        backdrop-filter: blur(10px);
        font-weight: 800;
        color: #334155;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        height: 100%; /* Fill Grid */
        width: 100%;
    }
    .ctrl-btn:active { transform: scale(0.95); filter: brightness(0.9); }
    .ctrl-btn.minus { color: #ef4444; }
    .ctrl-btn.minus svg { width: 32px; height: 32px; }
    .ctrl-btn.reset { background: #fee2e2; color: #dc2626; border-color: rgba(220,38,38,0.2); }
    .fs-btn { transition: all 0.3s; }
    .fs-no { 
        background: #22c55e;
        border: 1px solid #16a34a;
        color: white; 
    }
    .fs-yes { background: #ef4444; border: 1px solid #dc2626; color: white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); }

    /* BOTTOM ACTIONS */
    .bottom-actions {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr; /* Uniform columns */
        gap: 0.75rem;
        height: 64px; /* Match Top Bar */
    }
    .action-btn {
        border-radius: 16px;
        border: 1px solid #cbd5e1;
        background: rgba(255,255,255,0.8);
        font-weight: 700;
        font-size: 0.7rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #64748b;
        gap: 2px;
        height: 100%;
        width: 100%;
    }
    .action-btn.has-data { background: #eff6ff; border-color: #4633f5; color: #4633f5; }
    .action-btn .icon { width: 20px; height: 20px; }

    .submit-btn {
        height: 100%;
        width: 100%;
        border-radius: 16px;
        background: #4633f5;
        color: white;
        font-weight: 800;
        letter-spacing: 1px;
        border: none;
        box-shadow: 0 4px 12px rgba(70, 51, 245, 0.3);
    }
    .submit-btn:disabled { opacity: 0.7; background: #94a3b8; box-shadow: none; }

    /* MODALS */
    .modal-backdrop {
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(0,0,0,0.5); backdrop-filter: blur(5px);
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.2s;
    }
    .modal-card {
        background: #ffffff !important; 
        color: #0f172a !important;
        width: 90%; max-width: 320px;
        border-radius: 24px; padding: 1.5rem;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        display: flex; flex-direction: column; gap: 1rem;
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-card h3 { margin: 0; font-size: 1.25rem; color: #0f172a; }
    .modal-card textarea {
        background: #f8fafc;
        color: #334155;
        width: 100%; border: 1px solid #cbd5e1; border-radius: 12px;
        padding: 0.75rem; font-family: inherit; resize: none;
    }
    .modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .m-btn {
        padding: 12px; border-radius: 12px; font-weight: 700; border: none;
    }
    .m-btn.cancel { background: #f1f5f9; color: #64748b; }
    .m-btn.confirm { background: #4633f5; color: white; }

    /* KEYPAD SPECIFIC */
    .keypad-display {
        font-size: 2.5rem; font-weight: 800; text-align: center;
        background: #f8fafc; padding: 0.5rem; border-radius: 12px;
    }
    .numpad-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .numpad-grid button {
        height: 56px; background: #f1f5f9; border: none; border-radius: 12px;
        font-size: 1.5rem; font-weight: 600; color: #334155;
    }
    .numpad-grid button:active { background: #e2e8f0; }
    .numpad-grid .np-del { color: #ef4444; background: #fee2e2; }

    /* ANIMATIONS */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* LOCKED STAMP & OVERLAY */
    /* LOCKED STAMP & OVERLAY */
    .locked-stamp {
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-12deg) scale(1);
      border: 8px solid #ffffff; color: #ffffff; font-size: 3rem; font-weight: 900;
      padding: 1rem 3rem; text-transform: uppercase; letter-spacing: 0.1em;
      pointer-events: none; z-index: 9999; border-radius: 24px;
      white-space: nowrap;
      background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
    }
    
    /* Dim content when locked to make stamp pop */
    .page.judge.form-locked .tap-zone,
    .page.judge.form-locked .bottom-actions,
    .page.judge.form-locked .ctrl-btn.minus,
    .page.judge.form-locked .ctrl-btn.fs-btn {
        opacity: 0.4;
        filter: grayscale(0.8);
    }
    .overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(12px);
      display: flex; justify-content: center; align-items: center;
      opacity: 0; pointer-events: none; transition: all 0.3s;
    }
    .overlay.show { opacity: 1; pointer-events: all; }
    .overlay-card { 
        background: rgba(255, 255, 255, 0.95); padding: 2.5rem 3rem;
        border-radius: 24px; text-align: center;
    }
    .overlay.show .overlay-card { transform: scale(1); }
    .spinner-svg { width: 48px; height: 48px; color: #4633f5; animation: spin 1s linear infinite; }
    .check-svg { width: 56px; height: 56px; color: #10b981; display: none; margin: 0 auto; }
    .overlay.success .spinner-svg { display: none; }
    .overlay.success .check-svg { display: block; animation: popIn 0.4s; }
    .overlay-text { font-weight: 800; font-size: 1.25rem; color: #1e293b; margin-top: 1rem; }
    .overlay-subtext { font-size: 0.9rem; color: #64748b; margin-top: 4px; font-weight: 600; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes popIn { 0% { transform: scale(0) rotate(-45deg); opacity: 0; } 100% { transform: scale(1) rotate(0); opacity: 1; } }

    /* RESPONSIVE */
    @media (max-height: 750px) {
        .score-display { font-size: 8rem; }
        .tap-hit-box { margin-bottom: 0.5rem; }
        .control-bar { height: 56px; }
        .bottom-actions { height: 50px; }
        .action-btn { font-size: 0.6rem; }
    }
    /* OCCUPIED OVERLAY */
    .occupied-card { border: 2px solid #ef4444; }
    .occupied-icon { font-size: 3rem; margin-bottom: 1rem; }
    .force-btn {
        margin-top: 1.5rem;
        background: #ef4444; color: white;
        border: none; padding: 1rem 2rem;
        border-radius: 12px; font-weight: 800; font-size: 0.9rem;
        width: 100%;
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
    }
    .force-btn:active { transform: scale(0.95); }

/* --- MOBILE LAYOUT FIXES (PORTRAIT) --- */

/* 1. Add gap to the new sidebar container */
.controls-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.25rem; /* Increased vertical space between Row 1 and Row 2 */
}

/* 2. Increase spacing between buttons in the rows */
.control-bar, .bottom-actions {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem; /* Increased from 0.75rem to 1rem (16px) */
    height: 72px; /* Increased height from 64px for easier tapping */
}

/* 3. Taller buttons for easier touch */
.ctrl-btn, .action-btn, .submit-btn {
    height: 100%; /* Fill the new 72px height */
    font-size: 0.85rem; /* Slightly larger text */
}


/* --- TABLET/DESKTOP LAYOUT (LANDSCAPE) --- */
@media (min-width: 768px) and (orientation: landscape) {
    .form {
        flex-direction: row; /* Horizontal layout */
        align-items: stretch;
        gap: 24px;
        padding: 0 1rem;
    }

    .tap-hit-box {
        flex: 2; /* Tap zone takes 66% width */
        margin-bottom: 0;
    }

    .controls-sidebar {
        flex: 1; /* Controls take 33% width */
        gap: 1rem;
        justify-content: center;
        min-width: 260px;
    }

    /* Switch rows to columns inside the sidebar */
    .control-bar, .bottom-actions {
        display: flex;
        flex-direction: column; 
        height: auto;
        flex: 1; 
        gap: 16px; /* Good vertical gap between buttons */
    }

    /* Landscape button tweaks */
    .ctrl-btn, .action-btn, .submit-btn {
        width: 100%;
        min-height: 64px;
        font-size: 1rem;
    }

    .action-btn { flex-direction: row; gap: 8px; }
    .score-display { font-size: 14vw; }
}
</style>
