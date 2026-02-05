<template>
  <div class="page-wrapper anim-down">
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
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()

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

onMounted(() => {
    if (localStorage.getItem('tester_authorized') !== 'true') {
        router.push('/')
    }
})
</script>

<style scoped>
.page-wrapper {
  height: 100vh;
  margin: 0;
  overflow: hidden; 
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
    overflow-y: auto;
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

.logo-box { display: flex; align-items: center; gap: 12px; }
.header-logo { height: 32px; width: auto; }
.logo-text { font-weight: 800; font-size: 1.1rem; color: #334155; letter-spacing: 0.5px; }

.btn-exit {
    background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
    border: none; color: #0f172a; padding: 8px 18px; border-radius: 10px;
    font-weight: 700; font-size: 0.9rem; cursor: pointer;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: all 0.2s;
}
.btn-exit:hover { transform: translateY(-1px); box-shadow: 0 6px 10px -2px rgba(0,0,0,0.15); }
.btn-exit:active { transform: scale(0.96); }

.foot { margin-top: 3rem; color: #94a3b8; font-size: 0.85rem; text-align: center; padding-bottom: 2rem; }

.center-stage { width: 100%; max-width: 360px; padding: 0 1rem; text-align: center; }
.title { font-size: 1.75rem; font-weight: 800; margin: 0 0 0.25rem 0; color: #1e293b; }
.subtitle { color: #64748b; margin: 0 0 2rem 0; font-size: 0.95rem; font-weight: 500; }

.menu-list { display: flex; flex-direction: column; gap: 12px; }

.menu-btn {
    width: 100%; background: white; border: 1px solid #cbd5e1;
    border-bottom: 3px solid #cbd5e1; padding: 1rem 1.25rem;
    border-radius: 12px; display: flex; align-items: center; gap: 1rem;
    cursor: pointer; transition: all 0.1s; text-align: left;
}
.menu-btn:active { transform: translateY(2px); border-bottom-width: 1px; margin-bottom: 2px; }

.btn-logo { height: 24px; width: auto; object-fit: contain; }
.label { font-size: 1.1rem; font-weight: 700; color: #334155; }
.anim-down { animation: fadeInDown 0.4s ease; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
</style>