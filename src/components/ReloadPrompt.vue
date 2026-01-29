<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const {
  needRefresh,
  updateServiceWorker,
  close
} = useRegisterSW()

const closePrompt = () => {
  close()
  needRefresh.value = false
}
</script>

<template>
  <div v-if="needRefresh" class="pwa-backdrop"></div>

  <div
    v-if="needRefresh"
    class="pwa-modal"
    role="alert"
  >
    <div class="icon-box">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="icon">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    </div>
    
    <div class="message">
      <div class="title">New Version Available</div>
      <div class="subtitle">A new update is ready. Update now to get the latest features.</div>
    </div>

    <div class="buttons">
        <button v-if="needRefresh" @click="updateServiceWorker()" class="reload-btn">
          Update Now
        </button>
        <button @click="closePrompt" class="close-btn">
          Later
        </button>
    </div>
  </div>
</template>

<style scoped>
/* Backdrop to dim the background */
.pwa-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 99998;
}

/* Centered Card */
.pwa-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 320px;
  background: white;
  padding: 24px;
  border-radius: 24px;
  z-index: 99999;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
  font-family: 'Outfit', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.icon-box {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #2563eb;
}
.icon { width: 24px; height: 24px; }

.message {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.title { font-weight: 800; font-size: 1.1rem; color: #0f172a; }
.subtitle { font-size: 0.9rem; color: #64748b; line-height: 1.4; }

.buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
}

button {
  border: none;
  outline: none;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  width: 100%;
  transition: transform 0.1s;
}
button:active { transform: scale(0.97); }

.reload-btn {
    background: #4633f5;
    color: white;
    box-shadow: 0 4px 10px rgba(70, 51, 245, 0.25);
}

.close-btn {
    background: transparent;
    color: #64748b;
    font-size: 0.9rem;
}

@keyframes popIn {
  from { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
</style>
