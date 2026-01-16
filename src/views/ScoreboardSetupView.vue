<template>
  <div class="page setup-page">
    <header class="header">
        <img src="/logo.svg" alt="GBRSA" class="logo">
        <h1>Scoreboard Setup</h1>
    </header>

    <main class="content">
        <div class="card">
            <div class="form-group">
                <label>Number of Stations</label>
                <div class="grid-selector">
                    <button 
                        v-for="n in [1, 2, 4, 8, 12]" 
                        :key="n"
                        class="sel-btn"
                        :class="{ active: stationCount === n }"
                        @click="stationCount = n"
                    >
                        {{ n }}
                    </button>
                </div>
            </div>

            <div class="form-group">
                <label>Display Mode</label>
                <select v-model="displayMode" class="input-select" disabled>
                    <option value="projector">LED Wall / Projector / TV</option>
                </select>
                <p class="hint">
                    Optimized for large screens (Wake Lock & Auto-Hide Cursor).
                </p>
            </div>

            <button class="btn-launch" @click="launchScoreboard">
                LAUNCH SCOREBOARD
            </button>
        </div>
    </main>
    
    <footer class="foot">
        © 2026 GB ROPE SKIPPING ACADEMY
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { LIVE_BOARD_KEY } from '../authConfig'

const router = useRouter()
const stationCount = ref(12)
const displayMode = ref('projector')

const launchScoreboard = () => {
    router.push({
        path: '/live/board',
        query: {
            stations: stationCount.value,
            mode: displayMode.value
        }
    })
}

onMounted(() => {
    const key = localStorage.getItem('gbrsa_live_key')
    if (key !== LIVE_BOARD_KEY) {
        // Not authorized, kick back to login
        router.push('/')
    }
})

</script>

<style scoped>
.page {
    height: 100vh;
    background: #0f172a;
    color: white;
    font-family: 'Outfit', sans-serif;
    display: flex;
    flex-direction: column;
}

.header {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    border-bottom: 1px solid #1e293b;
}
.logo { height: 40px; }
h1 { font-size: 1.5rem; font-weight: 800; letter-spacing: 0.05em; margin: 0; }

.content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.card {
    background: #1e293b;
    padding: 2.5rem;
    border-radius: 20px;
    width: 100%;
    max-width: 450px;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    border: 1px solid #334155;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.75rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
}

.grid-selector {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.5rem;
}

.sel-btn {
    background: #0f172a;
    border: 1px solid #334155;
    color: #cbd5e1;
    padding: 0.75rem 0;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    transition: all 0.2s;
}
.sel-btn.active {
    background: #facc15;
    color: #0f172a;
    border-color: #facc15;
    transform: scale(1.05);
}

.input-select {
    width: 100%;
    padding: 1rem;
    background: #0f172a;
    border: 1px solid #334155;
    color: white;
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    cursor: pointer;
}
.hint {
    margin: 0.5rem 0 0 0;
    font-size: 0.85rem;
    color: #64748b;
}

.btn-launch {
    width: 100%;
    padding: 1.25rem;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 900;
    font-size: 1.1rem;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
}
.btn-launch:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4);
}
.btn-launch:active { transform: scale(0.98); }

.foot {
    text-align: center;
    padding: 1.5rem;
    color: #475569;
    font-size: 0.85rem;
}
</style>
