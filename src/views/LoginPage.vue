<template>
  <div class="page-wrapper">
    <div class="glass-card-wrapper">
      <div class="branding">
        <div class="titles">
          <img src="/logo.svg" alt="Logo" class="main-logo">
          <h1 class="logo-text">GBRSA SupaApp</h1>
        </div>
      </div>

      <div class="glass-card">
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

    <footer class="foot">
      <div class="ver-text">v{{ appVersion }}</div>
      <div class="copy-text">© 2026 GB ROPE SKIPPING ACADEMY, MALAYSIA</div>
    </footer>

    <div v-if="showScanner" class="qr-modal-overlay">
        <div class="qr-card">
            <h3 class="qr-title">Scan Login QR</h3>
            <div class="scanner-wrapper">
                <div id="reader" class="qr-reader-box"></div>
                <div class="scan-overlay"><div class="scan-line"></div></div>
                <div v-if="isScannerInit" class="scanner-loader">
                    <div class="spinner"></div><span>Starting Camera...</span>
                </div>
            </div>
            <button class="btn-close" @click="stopScan">Close Scanner</button>
        </div>
    </div>
  </div>
</template>

<script setup>
const appVersion = __APP_VERSION__

import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue' 
import { useRouter } from 'vue-router'
import { db } from '../firebase'
import { doc, getDoc, onSnapshot, query, collection, where, getDocs } from 'firebase/firestore'
import { Html5Qrcode } from 'html5-qrcode'
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
let typingTimer = null

onMounted(() => {
    unsubLock = onSnapshot(doc(db, 'system', 'status'), (doc) => {
        if (doc.exists()) {
             const locked = doc.data().locked === true
             isLocked.value = locked
             if(locked) accessKey.value = '' 
        }
    })
    // Auto-clear network errors
    window.addEventListener('online', () => { if (errorMsg.value === 'No Internet Connection') errorMsg.value = '' })
})

onUnmounted(() => {
    if(unsubLock) unsubLock()
    if(html5QrCode && html5QrCode.isScanning) html5QrCode.stop().then(() => html5QrCode.clear())
})

watch(accessKey, (newVal) => {
    if (typingTimer) clearTimeout(typingTimer)
    if (!newVal || newVal.length < 3) return
    typingTimer = setTimeout(() => handleLogin(true), 300) 
})

const handleLogin = async (isSilent = false) => {
    const silentMode = typeof isSilent === 'boolean' ? isSilent : false
    if (!silentMode) errorMsg.value = ''
    const key = accessKey.value.trim()
    if (!key) return
    if (!silentMode) loading.value = true
    try {
        const keyRef = doc(db, 'access_keys', key)
        const keySnap = await withTimeout(getDoc(keyRef), 8000)
        if (!keySnap.exists()) throw new Error("Invalid Access Code")
        const data = keySnap.data()
        const role = data.role
        // Allow super_admin, admin, importer, host to bypass lock
        if (isLocked.value && role !== 'admin' && role !== 'importer' && role !== 'super_admin' && role !== 'host') {
            throw new Error("System is LOCKED by Host")
        }
        
        loading.value = true 
        if (role === 'super_admin') {
            localStorage.setItem('gbrsa_access_key', key);
            await safeNavigate('/keys'); 
        }
        else if (role === 'admin') { 
            localStorage.setItem('gbrsa_access_key', key); 
            localStorage.setItem('admin_authorized', 'true'); 
            await safeNavigate('/admin') 
        } 
        else if (role === 'importer') { 
            localStorage.setItem('gbrsa_access_key', key); 
            await safeNavigate('/importer') 
        }
        else if (role === 'tester') { 
            localStorage.setItem('gbrsa_access_key', 'tester'); 
            localStorage.setItem('tester_authorized', 'true'); 
            await safeNavigate('/tester') 
        }
        else if (role === 'practice') { 
             // Behave like a tester but go to practice
            localStorage.setItem('gbrsa_access_key', 'practice'); 
            localStorage.setItem('tester_authorized', 'true'); 
            await safeNavigate('/practice') 
        }
        else if (role === 'host') { 
            localStorage.setItem('gbrsa_access_key', key); 
            await safeNavigate('/host') 
        }
        else if (role === 'live_board') { 
            localStorage.setItem('gbrsa_live_key', key); 
            await safeNavigate({ path: '/live' }) 
        }
        else if (role === 'judge') { 
            sessionStorage.setItem('gbrsa_access_key', key); 
            sessionStorage.setItem('gbrsa_allowed_station', data.station); 
            await safeNavigate({ path: '/station', query: { event: data.event, judgeType: data.judgeType, station: data.station } }) 
        }
        else { 
            throw new Error("Unknown Role") 
        }
    } catch (e) {
        if (silentMode) { loading.value = false; return }
        if (!navigator.onLine) { errorMsg.value = "No Internet Connection"; loading.value = false; return }
        const isVersionError = e.message && (e.message.includes("Importing") || e.message.includes("dynamically imported module") || (e.message.includes("Failed to fetch") && e.stack && e.stack.includes('router')))
        if (isVersionError) { errorMsg.value = "New Version Found! Updating..."; setTimeout(() => { window.location.reload(true) }, 1500); return }
        if (e.message === "Invalid Access Code") errorMsg.value = "Invalid Access Code"
        else if (e.message === "System is LOCKED by Host") errorMsg.value = "System is LOCKED by Host"
        else if (e.message === "Network Timeout") errorMsg.value = "Slow Connection. Retry?"
        else if (e.message === "Navigation Timeout") errorMsg.value = "Loading Stuck. Refresh App?"
        else errorMsg.value = "Login Failed (Network)"
        loading.value = false
        if (navigator.vibrate) navigator.vibrate(200)
    }
}
const startScan = async () => { showScanner.value = true; isScannerInit.value = true; await nextTick(); if (html5QrCode) { try { if (html5QrCode.isScanning) await html5QrCode.stop(); html5QrCode.clear() } catch (e) {} } html5QrCode = new Html5Qrcode("reader"); const config = { fps: 20, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, videoConstraints: { facingMode: "environment", focusMode: "continuous" } }; try { await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, (err) => {}).then(() => isScannerInit.value = false) } catch (err) { try { const devices = await Html5Qrcode.getCameras(); if (devices && devices.length) { const backCam = devices.find(d => d.label.toLowerCase().includes('back')) || devices[0]; await html5QrCode.start(backCam.id, config, onScanSuccess, (err)=>{}); isScannerInit.value = false } else { throw new Error("No camera found") } } catch (finalErr) { showScanner.value = false; if (html5QrCode) html5QrCode.clear() } } }
const stopScan = () => { if(html5QrCode) html5QrCode.stop().then(() => { html5QrCode.clear(); showScanner.value = false }).catch(() => showScanner.value = false); else showScanner.value = false }
const onScanSuccess = async (decodedText) => {
    // 1. Stop Scanner UI
    if(html5QrCode) {
        html5QrCode.stop().then(() => { html5QrCode.clear(); showScanner.value = false }).catch(console.error)
    } else {
        showScanner.value = false
    }

    let scannedVal = decodedText
    
    // 2. Token Lookup
    try {
        // Query for token match
        const q =  query(collection(db, 'access_keys'), where('qr_token', '==', scannedVal))
        const snaps = await getDocs(q)
        
        if (!snaps.empty) {
            // FOUND: It's a secure token. Use the ID (Real Password)
            const realKey = snaps.docs[0].id
            accessKey.value = realKey
        } else {
            // NOT FOUND: Might be a Legacy Base64 Code or Plain Password
            try {
                const decoded = atob(decodedText)
                if(decoded) scannedVal = decoded
            } catch(e) {}
            
            accessKey.value = scannedVal
        }
        
        // 3. Auto Login
        await handleLogin(false)
        
    } catch (e) {
        // Fallback if query fails
        accessKey.value = scannedVal
        handleLogin(false)
    }
}
const withTimeout = (promise, ms = 8000) => { return new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error("Network Timeout")), ms); promise.then((res) => { clearTimeout(timer); resolve(res) }, (err) => { clearTimeout(timer); reject(err) }) }) }
const safeNavigate = async (routeParams) => { const navPromise = router.push(routeParams); const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Navigation Timeout")), 5000)); await Promise.race([navPromise, timeoutPromise]) }
</script>

<style scoped>
.page-wrapper {
  /* Ensure it fills screen but allows scrolling only if needed */
  height: 100%; 
  overflow-y: auto;
  width: 100%;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  
  /* Reduced padding for better fit */
  padding: 1.5rem;
  /* Ensure we respect iPhone Home Bar area */
  padding-bottom: env(safe-area-inset-bottom, 1rem); 
  
  background-color: #f8fafc;
  background-image: linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(59, 130, 246, 0.1) 35%, rgba(254, 240, 138, 0.2) 65%, rgba(234, 179, 8, 0.25) 100%);
  background-attachment: fixed;
  background-size: cover;
}

.glass-card-wrapper {
    flex: 1; 
    display: flex;
    flex-direction: column;
    justify-content: center; 
    align-items: center;
    width: 100%;
    /* Reduced vertical gaps */
    gap: 1.5rem; 
}

.branding { text-align: center; }

.main-logo {
  height: 90px;
  width: auto;
  object-fit: contain;
  margin-bottom: 0.5rem; 
  display: block; 
  margin-left: auto; 
  margin-right: auto;
}

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
  /* Compact Padding */
  border-radius: 24px;
  /* Compact Padding: Top/Sides 2rem, Bottom 1rem */
  padding: 2rem 2rem 1.5rem 2rem;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
  text-align: center;
}

.card-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem 0; color: #0f172a; }
.card-desc { font-size: 0.85rem; color: #64748b; margin: 0 0 1.5rem 0; }

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
  color: #0f172a;
  letter-spacing: 2px;
}
.input:focus { outline: none; border-color: #facc15; background: #fff; box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.25); }
.input.has-icon { padding-right: 3rem; }

.btn-primary {
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
  color: #0f172a;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}
.btn-primary:active { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; background: #cbd5e1; color: #64748b; transform: none; }
.btn-locked { background: #e2e8f0 !important; color: #64748b !important; border: 1px solid #cbd5e1; }

.judge-error { color: #ef4444; font-weight: 600; margin-top: 1rem; height: 1.5rem; transition: opacity 0.2s; }

/* === FOOTER (COMPACT) === */
.foot { 
  margin-top: auto; /* Pushes to bottom if space permits */
  padding-bottom: 2rem;
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ver-text {
  font-size: 0.8rem;
  color: #d97706; /* Amber-600 */
  font-weight: 600;
  font-family: monospace;
  letter-spacing: 0.05em;
}
.copy-text {
  color: #94a3b8; 
  font-size: 0.75rem; 
}

/* === MOBILE COMPACT MODE (Key Fix) === */
@media (max-height: 750px) {
  .page-wrapper { padding: 1rem; }
  .glass-card-wrapper { gap: 1rem; }
  .main-logo { height: 70px; }
  .glass-card { padding: 1.5rem; }
  .input, .btn-primary { height: 48px; }
  .card-desc { margin-bottom: 1rem; }
  .foot { display: block; font-size: 0.7rem; } /* Ensure footer visible but small */
}

/* === QR & ICON STYLES (Unchanged) === */
.input-wrapper { position: relative; width: 100%; }
.icon-btn-qr {
    position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
    background: transparent; border: none; color: #64748b; font-size: 1.25rem;
    padding: 8px; cursor: pointer; z-index: 10;
}
.qr-modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; padding: 2rem; }
.qr-card { background: white; width: 100%; max-width: 360px; border-radius: 20px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.qr-title { margin: 0; text-align: center; color: #1e293b; font-weight: 800; }
.btn-close { width: 100%; padding: 12px; background: #ef4444; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; }
.scanner-wrapper { position: relative; width: 100%; border-radius: 12px; overflow: hidden; background: #000; }
.qr-reader-box { width: 100%; min-height: 250px; }
.scan-overlay { position: absolute; inset: 0; pointer-events: none; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 12px; }
.scan-line { position: absolute; width: 100%; height: 3px; background: #facc15; box-shadow: 0 0 10px #facc15; top: 10%; animation: scanMove 1.5s ease-in-out infinite alternate; opacity: 0.8; }
.scanner-loader { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000; color: white; z-index: 10; gap: 1rem; }
.spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #facc15; animation: spin 1s ease-in-out infinite; }
@keyframes scanMove { 0% { top: 5%; } 100% { top: 95%; } }
</style>