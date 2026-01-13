<template>
  <transition name="toast-anim">
    <div v-if="visible" class="toast">
      <div style="display:flex;align-items:center;gap:10px;">
        <svg style="width:18px;height:18px;color:#22c55e;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
let timer = null

// Expose global function
window.toast = (msg, timeout = 3000) => {
  message.value = msg
  visible.value = true
  
  if (timer) clearTimeout(timer)
  
  timer = setTimeout(() => {
    visible.value = false
  }, timeout)
}
</script>

<style scoped>
/* Exact copy of legacy toast styles */
.toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.98);
  color: white;
  padding: 12px 24px;
  border-radius: 99px;
  font-size: 14px;
  font-weight: 600;
  z-index: 10000;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  pointer-events: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.15);
}

.toast-anim-enter-active,
.toast-anim-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-anim-enter-from,
.toast-anim-leave-to {
  transform: translate(-50%, 40px);
  opacity: 0;
}
</style>
