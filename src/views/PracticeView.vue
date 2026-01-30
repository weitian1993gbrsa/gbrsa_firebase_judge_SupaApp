<template>
  <div class="page-wrapper anim-down">
    <header class="view-header">
       <div class="logo-box">
           <img src="/logo.svg" alt="Logo" class="header-logo">
           <div class="header-text">
               <span class="logo-title">PRACTICE MODE</span>
               <span class="logo-subtitle">Live Board Control</span>
           </div>
       </div>
       <button class="btn-exit" @click="goBack">Back</button>
    </header>

    <main class="content">
       <div class="center-stage">
           <h2 class="title">Select Station</h2>
           <p class="subtitle">Choose a station to simulate live judging.</p>

           <div class="station-grid">
                <button 
                    v-for="n in 12" 
                    :key="n" 
                    class="st-btn" 
                    :class="{ 'is-locked': lockedStations[String(n)] }"
                    @click="goPractice(n)"
                >
                    <span class="st-num">{{ n }}</span>
                    <span v-if="lockedStations[String(n)]" class="used-tag">IN USE</span>
                    <span v-else class="free-tag">OPEN</span>
                </button>
           </div>
       </div>
    </main>

    <footer class="foot">
      © 2026 GB ROPE SKIPPING ACADEMY
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { onMounted, ref, onUnmounted } from 'vue'
import { db } from '../firebase'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'

const router = useRouter()
const lockedStations = ref({})
let unsubLocks = null

const goBack = () => {
    router.push('/tester')
}

const goPractice = async (station) => {
    const sId = String(station)

    // [FIX] Clear cached station data so this device doesn't use old data
    localStorage.removeItem('gbrsa_allowed_station');

    // CHECK: Is it locked?
    if (lockedStations.value[sId]) {
        // PROMPT: Ask user to confirm force entry
        const proceed = confirm(
            `⚠️ Station ${sId} is being used by another device.\n\n` +
            `Click OK to FORCE UNLOCK and overwrite that session.`
        )
        
        if (!proceed) return

        // ACTION: Clear the stale lock from database
        try {
            await deleteDoc(doc(db, 'station_locks', sId))
        } catch (e) {
            console.error("Failed to clear lock:", e)
        }
    }
    
    // Proceed to navigation
    router.push({ 
        path: `/judge/speed`, 
        query: { 
            test: 'true',
            station: sId,
            entry: `PRACTICE`
        }
    })
}

onMounted(() => {
    // Basic Gate: Ensure user is authorized as a tester
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
</script>

<style scoped>
.page-wrapper {
  height: 100vh;
  margin: 0;
  overflow: hidden;
  background-color: #f8fafc;
  background-image: linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(59, 130, 246, 0.1) 100%);
  display: flex;
  flex-direction: column;
  font-family: 'Outfit', sans-serif;
  color: #0f172a;
}

.content {
    flex: 1;
    display: flex;
    justify-content: center;
    padding-top: 2rem;
    padding-bottom: 2rem;
    overflow-y: auto;
}

.view-header {
    height: 70px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.logo-box { display: flex; align-items: center; gap: 12px; }
.header-logo { height: 36px; width: auto; }
.header-text { display: flex; flex-direction: column; }
.logo-title { font-weight: 800; font-size: 1rem; color: #1e293b; letter-spacing: 0.5px; line-height: 1.1; }
.logo-subtitle { font-size: 0.75rem; color: #f59e0b; font-weight: 700; letter-spacing: 0.5px; }

.btn-exit {
    background: white; border: 1px solid #cbd5e1; color: #64748b;
    padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-exit:hover { background: #f1f5f9; color: #0f172a; border-color: #94a3b8; }

.center-stage { width: 100%; max-width: 500px; padding: 0 1rem; text-align: center; }
.title { font-size: 1.75rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #1e293b; }
.subtitle { color: #64748b; margin: 0 0 2rem 0; font-size: 1rem; }

/* GRID STYLES */
.station-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 3 columns for better mobile fit */
    gap: 12px;
}

.st-btn {
    aspect-ratio: 1.2;
    background: white;
    border: 1px solid #cbd5e1;
    border-bottom: 3px solid #cbd5e1;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.1s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 10px;
}

.st-btn:active { transform: translateY(2px); border-bottom-width: 1px; margin-bottom: 2px; }

.st-num { font-size: 2rem; font-weight: 800; color: #334155; line-height: 1; margin-bottom: 4px; }
.free-tag { font-size: 0.7rem; color: #10b981; font-weight: 700; background: #ecfdf5; padding: 2px 8px; border-radius: 4px; }

/* LOCKED STATE */
.st-btn.is-locked {
    background: #fef2f2; border-color: #fca5a5; border-bottom-color: #f87171;
}
.st-btn.is-locked .st-num { color: #ef4444; }
.used-tag { font-size: 0.7rem; color: #ef4444; font-weight: 700; background: #fee2e2; padding: 2px 8px; border-radius: 4px; }

.foot { margin-top: auto; padding: 1.5rem; color: #94a3b8; font-size: 0.85rem; text-align: center; }
.anim-down { animation: fadeInDown 0.4s ease; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

/* TABLET/DESKTOP TWEAK */
@media (min-width: 600px) {
    .station-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
}
</style>
