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
  <div
    v-if="needRefresh"
    class="pwa-toast"
    role="alert"
  >
    <div class="message">
      <span>New content available, click on reload button to update.</span>
    </div>
    <div class="buttons">
        <button v-if="needRefresh" @click="updateServiceWorker()" class="reload-btn">
        Update
        </button>
        <button @click="closePrompt" class="close-btn">
        Close
        </button>
    </div>
  </div>
</template>

<style scoped>
.pwa-toast {
  position: fixed;
  right: 0;
  bottom: 0;
  margin: 16px;
  padding: 12px;
  border: 1px solid #8885;
  border-radius: 12px;
  z-index: 99999;
  text-align: left;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  background: white; /* Explicit background */
  color: #1a1a1a;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 300px;
  font-family: 'Outfit', sans-serif;
}

.message {
  margin-bottom: 4px;
  font-weight: 600;
  font-size: 14px;
}

.buttons {
    display: flex;
    gap: 8px;
}

button {
  border: 1px solid #8885;
  outline: none;
  margin-right: 5px;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  flex: 1;
}

.reload-btn {
    background: #4633f5;
    color: white;
    border: none;
}

.close-btn {
    background: transparent;
    border: 1px solid #cbd5e1;
    color: #64748b;
}
</style>
