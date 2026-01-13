<template>
  <div class="page-wrapper anim-down">
     <!-- Simple Header -->
    <header class="tester-header">
       <div class="logo-box">
           <img src="/logo.svg" alt="Logo" class="header-logo">
           <span class="logo-text">TESTER</span>
       </div>
       <button class="btn-exit" @click="exitTester">Exit</button>
    </header>

    <main class="content">
       <div class="center-stage">
           <h2 class="title">Select Form</h2>
           <p class="subtitle">Educational Purposes Only</p>

           <div class="menu-list">
              <!-- PRACTICE MODE -->
              <button class="menu-btn practice-btn" @click="openPracticeModal">
                 <img src="/logo.svg" class="btn-logo" alt="logo">
                 <div class="btn-text">
                    <span class="label">Practice Mode</span>
                    <span class="sub-label">Control Live Board</span>
                 </div>
              </button>

              <button class="menu-btn" @click="go('speed')">
                 <img src="/logo.svg" class="btn-logo" alt="logo">
                 <span class="label">Speed Judge</span>
              </button>

              <button class="menu-btn" @click="go('freestyle/difficulty')">
                 <img src="/logo.svg" class="btn-logo" alt="logo">
                 <span class="label">Difficulty</span>
              </button>

              <button class="menu-btn" @click="go('freestyle/presentation')">
                 <img src="/logo.svg" class="btn-logo" alt="logo">
                 <span class="label">Presentation</span>
              </button>

              <button class="menu-btn" @click="go('freestyle/technical')">
                 <img src="/logo.svg" class="btn-logo" alt="logo">
                 <span class="label">Technical</span>
              </button>
              
              <button class="menu-btn" @click="go('freestyle/re')">
                 <img src="/logo.svg" class="btn-logo" alt="logo">
                 <span class="label">Required Elements</span>
              </button>
           </div>
       </div>
    </main>

    <footer class="foot">
      © 2026 GB ROPE SKIPPING ACADEMY, MALAYSIA
    </footer>

    <!-- STATION SELECTOR MODAL -->
    <Teleport to="body">
        <div v-if="showStationModal" class="modal-backdrop" @click.self="closePracticeModal">
            <div class="modal-card">
                <h3>Select Station</h3>
                <div class="station-grid">
                    <button 
                        v-for="n in 12" 
                        :key="n" 
                        class="st-btn" 
                        :class="{ 'is-locked': lockedStations[String(n)] }"
                        @click="goPractice(n)"
                    >
                        {{ n }}
                        <span v-if="lockedStations[String(n)]" class="used-tag">USED</span>
                    </button>
                </div>
                <button class="close-btn" @click="closePracticeModal">Cancel</button>
            </div>
        </div>
    </Teleport>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { onMounted, ref, onUnmounted } from 'vue'
import { db } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'

const router = useRouter()

// STATE
const showStationModal = ref(false)
const lockedStations = ref({})
let unsubLocks = null

const openPracticeModal = () => showStationModal.value = true
const closePracticeModal = () => showStationModal.value = false

const goPractice = (station) => {
    // Optional: Prevent clicking if locked? 
    // User requested "show used", didn't strictly say "disable".
    // But logically, if it's used, we should probably warn or let the SpeedJudgeView handle the block.
    // SpeedJudgeView ALREADY handles the block (showing "Occupied").
    // So here we just allow them to click, but they will see the block screen.
    // Making it clear visually is enough.
    
    router.push({ 
        path: `/judge/speed`, 
        query: { 
            test: 'true',
            station: String(station),
            entry: `PRACTICE`
        }
    })
    closePracticeModal()
}

onMounted(() => {
    // Basic Gate
    if (localStorage.getItem('tester_authorized') !== 'true') {
        router.push('/')
        return
    }

    // Monitor Locks
    unsubLocks = onSnapshot(collection(db, 'station_locks'), (snap) => {
        const locks = {}
        snap.forEach(doc => {
            locks[doc.id] = true
        })
        lockedStations.value = locks
    })
})

onUnmounted(() => {
    if (unsubLocks) unsubLocks()
})

const go = (path) => {
    router.push({ 
        path: `/judge/${path}`, 
        query: { 
            test: 'true',
            station: 'TEST',
            entry: 'TEST-001'
        }
    })
}

const exitTester = () => {
    localStorage.removeItem('tester_authorized')
    router.push('/')
}
</script>

<style scoped>
.page-wrapper {
  height: 100vh;
  margin: 0;
  overflow: hidden; /* Prevent body scroll */

  /* Modern Flow Background from LoginView */
  background-color: #f8fafc;
  background-image: linear-gradient(135deg,
      rgba(30, 58, 138, 0.05) 0%,
      rgba(59, 130, 246, 0.1) 35%,
      rgba(254, 240, 138, 0.2) 65%,
      rgba(234, 179, 8, 0.25) 100%
    );
  background-attachment: fixed;
  background-size: cover;

  display: flex;
  flex-direction: column;
  font-family: 'Outfit', sans-serif;
  color: #0f172a;
}

.content {
    flex: 1;
    display: flex;
    justify-content: center;
    padding-top: 3rem;
    padding-bottom: 2rem;
    overflow-y: auto; /* Allow content scroll */
}

.tester-header {
    height: 60px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
}

.logo-box {
    display: flex;
    align-items: center;
    gap: 12px;
}

.header-logo {
    height: 32px;
    width: auto;
}

.logo-text {
    font-weight: 800;
    font-size: 1.1rem;
    color: #334155;
    letter-spacing: 0.5px;
}

.btn-exit {
    background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
    border: none;
    color: #0f172a;
    padding: 8px 18px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    transition: all 0.2s;
}
.btn-exit:hover { transform: translateY(-1px); box-shadow: 0 6px 10px -2px rgba(0,0,0,0.15); }
.btn-exit:active { transform: scale(0.96); }

/* Match LoginView Footer */
.foot { 
    margin-top: 3rem; 
    color: #94a3b8; 
    font-size: 0.85rem; 
    text-align: center;
    padding-bottom: 2rem;
}



.center-stage {
    width: 100%;
    max-width: 360px;
    padding: 0 1rem;
    text-align: center;
}

.title { font-size: 1.75rem; font-weight: 800; margin: 0 0 0.25rem 0; color: #1e293b; }
.subtitle { color: #64748b; margin: 0 0 2rem 0; font-size: 0.95rem; font-weight: 500; }

.menu-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.menu-btn {
    width: 100%;
    background: white;
    border: 1px solid #cbd5e1;
    border-bottom: 3px solid #cbd5e1; /* Chunky click feel */
    padding: 1rem 1.25rem;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    transition: all 0.1s;
    text-align: left;
}

.menu-btn:active {
    transform: translateY(2px);
    border-bottom-width: 1px;
    margin-bottom: 2px; /* Keep alignment */
}

.btn-logo {
    height: 24px;
    width: auto;
    object-fit: contain;
}

.label { 
    font-size: 1.1rem; 
    font-weight: 700; 
    color: #334155;
}

.anim-down { animation: fadeInDown 0.4s ease; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

/* PRACTICE BUTTON DISTINCT STYLE */
.practice-btn {
    border-color: #facc15;
    background: #fffbeb;
}
.btn-text { display: flex; flex-direction: column; }
.sub-label { font-size: 0.75rem; color: #b45309; font-weight: 600; }

/* MODAL */
.modal-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.2s;
}
.modal-card {
    background: white; width: 90%; max-width: 340px;
    padding: 1.5rem; border-radius: 20px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    text-align: center;
}
.modal-card h3 { margin: 0 0 1.5rem 0; color: #0f172a; font-size: 1.25rem; }

.station-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
    margin-bottom: 1.5rem;
}
.st-btn {
    aspect-ratio: 1;
    background: #f1f5f9; border: 1px solid #cbd5e1;
    border-radius: 12px; font-weight: 800; font-size: 1.2rem;
    color: #334155; cursor: pointer;
    transition: all 0.1s;
    position: relative;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.st-btn:active { background: #4633f5; color: white; transform: scale(0.95); }

.st-btn.is-locked {
    background: #fee2e2;
    border-color: #fecaca;
    color: #ef4444;
}
.used-tag {
    font-size: 0.6rem;
    background: #ef4444;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 4px;
}

.close-btn {
    width: 100%; padding: 12px; background: white; border: 1px solid #e2e8f0;
    border-radius: 12px; font-weight: 700; color: #64748b; cursor: pointer;
}
</style>
