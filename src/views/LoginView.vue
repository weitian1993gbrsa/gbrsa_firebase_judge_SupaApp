<template>
  <div class="page-wrapper">
    <!-- Main Content Wrapper (Centers Logo + Card) -->
    <div class="glass-card-wrapper">
      <!-- Hero Branding -->
      <div class="branding anim-down">
        <div class="titles">
          <img src="/logo.svg" alt="Logo" style="height: 90px; width: auto; object-fit: contain; margin-bottom: 0.75rem; display: block; margin-left: auto; margin-right: auto;">
          <h1 class="logo-text">GBRSA SupaApp</h1>
        </div>
      </div>

      <!-- Glass Login Card -->
      <div class="glass-card anim-up">
        <h3 class="card-title">System Access</h3>
        <p class="card-desc">Enter the assigned access code to begin.</p>

        <div class="login-stack">

          <div class="input-wrapper">
              <input 
                v-if="!isLocked"
                v-model="accessKey" 
                class="input has-icon" 
                placeholder="Access Code" 
                type="password"
                :disabled="loading" 
                autocomplete="off"
                name="gs_auth_key_v1"
                spellcheck="false"
                data-form-type="other"
                @keydown.enter="handleLogin(false)"
              >
              <button 
                  v-if="!isLocked && !loading"
                  class="icon-btn-qr" 
                  title="Scan QR Login"
                  @click="startScan"
              >
                  <FontAwesomeIcon icon="qrcode" />
              </button>
          </div>
          
          <button 
            class="btn-primary" 
            :class="{ 'btn-locked': isLocked }"
            :disabled="loading || isLocked"
            @click="handleLogin(false)"
          >
            {{ isLocked ? '⚠ SYSTEM LOCKED' : (loading ? 'Verifying...' : 'Login') }}
          </button>
        </div>

        <div class="judge-error" :style="{ opacity: errorMsg ? 1 : 0 }">
          {{ errorMsg || 'Wrong Key Code' }}
        </div>
      </div>
    </div>

    <footer class="foot anim-up" style="animation-delay: 0.2s;">
      © 2026 GB ROPE SKIPPING ACADEMY, MALAYSIA
    </footer>

    <!-- QR MODAL -->
    <div v-if="showScanner" class="qr-modal-overlay">
        <div class="qr-card">
            <h3 class="qr-title">Scan Login QR</h3>
            
            <div class="scanner-wrapper">
                <div id="reader" class="qr-reader-box"></div>
                <div class="scan-overlay">
                    <div class="scan-line"></div>
                </div>
                <!-- Loading State Triggered by isScannerInit -->
                <div v-if="isScannerInit" class="scanner-loader">
                    <div class="spinner"></div>
                    <span>Starting Camera...</span>
                </div>
            </div>

            <button class="btn-close" @click="stopScan">Close Scanner</button>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue' // <--- Added 'watch'
import { useRouter } from 'vue-router'
import { db } from '../firebase'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { Html5Qrcode } from 'html5-qrcode'

/* FontAwesome */
import { library } from '@fortawesome/fontawesome-svg-core'
import { faQrcode } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
library.add(faQrcode)

const router = useRouter()

const accessKey = ref('')
const errorMsg = ref('')
const loading = ref(false)
const isLocked = ref(false)
const showScanner = ref(false)
const isScannerInit = ref(true) 
let html5QrCode = null
let unsubLock = null

// Timer for the Silent Login
let typingTimer = null

onMounted(() => {
    unsubLock = onSnapshot(doc(db, 'system', 'status'), (doc) => {
        if (doc.exists()) {
             const locked = doc.data().locked === true
             isLocked.value = locked
             if(locked) accessKey.value = '' 
        }
    })

    // Auto-clear network errors when internet returns
    window.addEventListener('online', () => {
        if (errorMsg.value === 'No Internet Connection') {
            errorMsg.value = ''
        }
    })
})

onUnmounted(() => {
    if(unsubLock) unsubLock()
    if(html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear())
    }
})

/* =========================================
   ⚡️ FAST AUTO-LOGIN WATCHER
   ========================================= */
watch(accessKey, (newVal) => {
    // 1. Clear previous timer
    if (typingTimer) clearTimeout(typingTimer)
    
    // 2. Ignore short inputs to save data
    if (!newVal || newVal.length < 3) return

    // 3. The "Sweet Spot" Timer (300ms)
    // Fast enough to feel instant, slow enough to group "ss1" into one check.
    typingTimer = setTimeout(() => {
        handleLogin(true) // Trigger Silent Mode
    }, 300) 
})

/* =========================================
   LOGIN LOGIC (REFINED)
   ========================================= */
const handleLogin = async (isSilent = false) => {
    const silentMode = typeof isSilent === 'boolean' ? isSilent : false
    
    if (!silentMode) errorMsg.value = ''
    
    const key = accessKey.value.trim()
    if (!key) return

    if (!silentMode) loading.value = true
    
    try {
        // 1. Check Access Key
        const keyRef = doc(db, 'access_keys', key)
        const keySnap = await withTimeout(getDoc(keyRef), 8000)

        if (!keySnap.exists()) {
             throw new Error("Invalid Access Code")
        }

        const data = keySnap.data()
        const role = data.role

        // 2. Enforce Lock
        if (isLocked.value && role !== 'admin' && role !== 'importer') {
             throw new Error("System is LOCKED by Host")
        }

        // 3. Success! Routing...
        // (This is where "Chunk Load" errors happen if a new version exists)
        loading.value = true 
        
        if (role === 'admin') {
            localStorage.setItem('gbrsa_access_key', 'admin') 
            localStorage.setItem('admin_authorized', 'true')
            await safeNavigate('/admin')
        } 
        else if (role === 'importer') {
            localStorage.setItem('gbrsa_access_key', 'importer')
            await safeNavigate('/importer')
        }
        else if (role === 'tester') {
            localStorage.setItem('gbrsa_access_key', 'tester')
            localStorage.setItem('tester_authorized', 'true')
            await safeNavigate('/tester')
        }
        else if (role === 'live_board') {
            localStorage.setItem('gbrsa_live_key', key)
            await safeNavigate({ path: '/live' })
        }
        else if (role === 'judge') {
            sessionStorage.setItem('gbrsa_access_key', key)
            sessionStorage.setItem('gbrsa_allowed_station', data.station)
            await safeNavigate({ 
                path: '/station', 
                query: { event: data.event, judgeType: data.judgeType, station: data.station } 
            })
        }
        else {
             throw new Error("Unknown Role")
        }

    } catch (e) {
        if (silentMode) {
            loading.value = false
            return 
        }

        console.error("Login Error", e)

        // === 🛡️ REFINED ERROR HANDLING START ===

        // 1. Check for Offline Status FIRST (Prevent Reload Loop)
        if (!navigator.onLine) {
            errorMsg.value = "No Internet Connection"
            loading.value = false
            return
        }

        // 2. Identify Version Mismatches (Chunk Load Errors)
        // These happen when the router tries to load a file that was deleted by a new deployment
        const isVersionError = e.message && (
            e.message.includes("Importing") || 
            e.message.includes("dynamically imported module") ||
            (e.message.includes("Failed to fetch") && e.stack && e.stack.includes('router')) // Specific to router
        )

        if (isVersionError) {
            errorMsg.value = "New Version Found! Updating..."
            
            // Wait 1.5s for user to read message, then Force Reload (True = ignore cache)
            setTimeout(() => {
                window.location.reload(true)
            }, 1500)
            return
        }

        // === 🛡️ REFINED ERROR HANDLING END ===

        // Standard Errors
        if (e.message === "Invalid Access Code") {
            errorMsg.value = "Invalid Access Code"
        } else if (e.message === "System is LOCKED by Host") {
            errorMsg.value = "System is LOCKED by Host"
        } else if (e.message === "Network Timeout") {
            errorMsg.value = "Slow Connection. Retry?"
        } else if (e.message === "Navigation Timeout") {
            errorMsg.value = "Loading Stuck. Refresh App?"
        } else {
            // Fallback for generic Firestore errors
            errorMsg.value = "Login Failed (Network)"
        }
        
        loading.value = false
        if (navigator.vibrate) navigator.vibrate(200)
    }
}

// ... Keep your existing helpers (startScan, stopScan, withTimeout, safeNavigate) ...
const startScan = async () => {
    showScanner.value = true
    isScannerInit.value = true 
    await nextTick()
    if (html5QrCode) {
        try { if (html5QrCode.isScanning) await html5QrCode.stop(); html5QrCode.clear() } catch (e) {}
    }
    html5QrCode = new Html5Qrcode("reader")
    const config = { fps: 20, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, videoConstraints: { facingMode: "environment", focusMode: "continuous" } }
    try {
        await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, (err) => {}).then(() => isScannerInit.value = false)
    } catch (err) {
        try {
             const devices = await Html5Qrcode.getCameras()
             if (devices && devices.length) {
                 const backCam = devices.find(d => d.label.toLowerCase().includes('back')) || devices[0]
                 await html5QrCode.start(backCam.id, config, onScanSuccess, (err)=>{})
                 isScannerInit.value = false
             } else { throw new Error("No camera found") }
        } catch (finalErr) {
             showScanner.value = false
             if (html5QrCode) html5QrCode.clear()
        }
    }
}
const stopScan = () => { if(html5QrCode) html5QrCode.stop().then(() => { html5QrCode.clear(); showScanner.value = false }).catch(() => showScanner.value = false); else showScanner.value = false }
const onScanSuccess = (decodedText) => {
    if(html5QrCode) html5QrCode.stop().then(() => { html5QrCode.clear(); showScanner.value = false }).catch(console.error); else showScanner.value = false
    let key = decodedText
    try { const decoded = atob(decodedText); if(decoded) key = decoded } catch(e) {}
    accessKey.value = key
    handleLogin(false) // QR is manual-like success
}
const withTimeout = (promise, ms = 8000) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Network Timeout")), ms)
        promise.then((res) => { clearTimeout(timer); resolve(res) }, (err) => { clearTimeout(timer); reject(err) })
    })
}
const safeNavigate = async (routeParams) => {
    const navPromise = router.push(routeParams)
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Navigation Timeout")), 5000))
    await Promise.race([navPromise, timeoutPromise])
}
</script>

<style scoped>
.page-wrapper {
  min-height: 100dvh; /* Dynamic Viewport Height */
  width: 100%;
  overflow-x: hidden;
  
  /* FLEX LAYOUT */
  display: flex;
  flex-direction: column;
  align-items: center;
  
  padding: 2rem;
  /* Ensure we respect iPhone Home Bar area */
  padding-bottom: env(safe-area-inset-bottom, 2rem); 
  
  /* Background (Unchanged) */
  background-color: #f8fafc;
  background-image: linear-gradient(135deg,
      rgba(30, 58, 138, 0.05) 0%,
      rgba(59, 130, 246, 0.1) 35%,
      rgba(254, 240, 138, 0.2) 65%,
      rgba(234, 179, 8, 0.25) 100%
    );
  background-attachment: fixed;
  background-size: cover;
  position: relative;
}

/* Helper to center the card vertically */
.glass-card-wrapper {
    flex: 1; /* Takes up all empty space */
    display: flex;
    flex-direction: column;
    justify-content: center; /* Vertically Centers Card */
    align-items: center;
    width: 100%;
    padding: 2rem 0;
}

/* Animation */
.anim-down { animation: fadeInDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.anim-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.branding { margin-bottom: 2rem; text-align: center; }
.logo-text {
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(to right, #1e293b, #334155);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glass-card {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  padding: 2.5rem 2.5rem 1.5rem 2.5rem; /* Reduced bottom padding */
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
  text-align: center;
}

.card-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem 0; color: #0f172a; }
.card-desc { font-size: 0.8rem; color: #64748b; margin: 0 0 2rem 0; }

.login-stack { display: flex; flex-direction: column; gap: 1rem; }

.input {
  width: 100%;
  height: 52px;
  padding: 0 1.25rem;
  border-radius: 14px;
  border: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  text-align: center;
  transition: all 0.2s;
  letter-spacing: 2px;
  color: #0f172a;
}
.input:focus {
  outline: none;
  border-color: #facc15;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.25);
}

/* Hide Reveal Password Icon (Edge/IE/Chrome) */
.input::-ms-reveal,
.input::-ms-clear {
  display: none !important;
}
.input::-webkit-contacts-auto-fill-button,
.input::-webkit-credentials-auto-fill-button {
  visibility: hidden;
  pointer-events: none;
  position: absolute;
  right: 0;
} 
.input::-webkit-caps-lock-indicator {
    display: none !important;
}

.btn-primary {
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
  color: #0f172a;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  transition: all 0.2s;
}
.btn-primary:active { transform: scale(0.98); }
.btn-primary:disabled { 
    opacity: 0.7; 
    cursor: not-allowed; 
    background: #cbd5e1; /* Gray out */
    color: #64748b;
    transform: none;
    box-shadow: none;
}
.btn-locked {
    background: #e2e8f0 !important; /* Slate-200 */
    color: #64748b !important;      /* Slate-500 */
    border: 1px solid #cbd5e1;      /* Slate-300 */
    opacity: 1 !important;
    font-weight: 800;
    letter-spacing: 1px;
}

.locked-banner {
    background: #fee2e2;
    color: #ef4444;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.75rem;
    padding: 8px;
    border-radius: 8px;
    letter-spacing: 1px;
}

.judge-error {
  color: #ef4444;
  font-weight: 600;
  margin-top: 1rem;
  height: 1.5rem;
  transition: opacity 0.2s;
}

/* === UPDATED FOOTER === */
.foot { 
  position: relative; /* Not absolute */
  margin-top: 2rem;
  
  /* Controls height from bottom - Increase this to move it higher */
  padding-bottom: 3rem; 
  
  color: #94a3b8; 
  font-size: 0.85rem; 
  text-align: center;
  flex-shrink: 0;
}

@media (max-height: 600px) {
  .foot { display: none; } /* Hide on very small screens to save space */
}

.btn-secondary {
  width: 100%;
  height: 48px;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: white;
  color: #64748b;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-secondary:hover { background: #f1f5f9; color: #334155; border-color: #94a3b8; }

/* QR MODAL */
.qr-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.qr-card {
    background: white;
    width: 100%;
    max-width: 360px;
    border-radius: 20px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.qr-title { margin: 0; text-align: center; color: #1e293b; font-weight: 800; }

.btn-close {
    width: 100%;
    padding: 12px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
}

/* INPUT ICON STYLES */
.input-wrapper {
    position: relative;
    width: 100%;
}

.input.has-icon {
    padding-right: 3rem; /* Space for icon */
}

.icon-btn-qr {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: #64748b; /* Slate-500 */
    font-size: 1.25rem;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s;
    opacity: 0.8;
    z-index: 10; /* Ensure on top of input */
}

.icon-btn-qr:hover {
    background: rgba(0,0,0,0.05);
    opacity: 1;
    transform: translateY(-50%) scale(1.1);
}

@keyframes modalPop {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}

/* SCANNER ANIMATION */
.scanner-wrapper {
    position: relative;
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    background: #000;
}

.qr-reader-box {
    width: 100%;
    min-height: 250px;
}

.scan-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none; /* Let clicks pass through */
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
}

.scan-line {
    position: absolute;
    width: 100%;
    height: 3px;
    background: #3b82f6; /* Blue-500 */
    box-shadow: 0 0 10px #3b82f6, 0 0 20px #2563eb;
    top: 10%;
    animation: scanMove 1.5s ease-in-out infinite alternate;
    opacity: 0.8;
}

@keyframes scanMove {
    0% { top: 5%; opacity: 0.8; }
    100% { top: 95%; opacity: 0.8; }
}

.scanner-loader {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #000;
    color: white;
    z-index: 10;
    gap: 1rem;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #3b82f6;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
