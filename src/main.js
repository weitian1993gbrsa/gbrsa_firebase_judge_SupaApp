// ⚡ Cache Buster & Safe Reload Logic
const BUILD_ID = '20260119_1111'; // Updated Build ID
const lastBuild = localStorage.getItem('gbrsa_build_id');

if (lastBuild && lastBuild !== BUILD_ID) {
    // Check if we JUST tried to reload for this (prevention of infinite loop)
    const isReloading = sessionStorage.getItem('gbrsa_update_reload');

    if (isReloading) {
        console.warn("Update reload attempted but old version persists. Stopping loop.");
        // Clear flag so next clean load works
        sessionStorage.removeItem('gbrsa_update_reload');
        // Update local storage to satisfy the check, even if we are potentially on old code
        localStorage.setItem('gbrsa_build_id', BUILD_ID);
    } else {
        console.log("New version detected. Refreshing...");
        sessionStorage.setItem('gbrsa_update_reload', 'true');
        localStorage.setItem('gbrsa_build_id', BUILD_ID);
        window.location.reload(true);
    }
} else {
    // Build matches, ensure clean state
    if (sessionStorage.getItem('gbrsa_update_reload')) {
        sessionStorage.removeItem('gbrsa_update_reload');
    }
    localStorage.setItem('gbrsa_build_id', BUILD_ID);
}

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

// 🛡️ Error Handler for Stale Deployment Assets
const handleChunkError = (error) => {
    const message = error.message || (error.reason && error.reason.message) || ''

    // Only target specific dynamic import failures
    const isChunkError = message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Importing a stopped module') ||
        message.includes('MIME type')

    if (isChunkError) {
        // Prevent infinite reload loops by checking a "last reload" timestamp
        const lastReload = sessionStorage.getItem('gbrsa_last_chunk_reload')
        const now = Date.now()

        if (!lastReload || (now - parseInt(lastReload)) > 5000) {
            sessionStorage.setItem('gbrsa_last_chunk_reload', now.toString())
            console.warn("New version detected or chunk load failure. Refreshing...")
            window.location.reload()
        } else {
            console.error("Multiple chunk errors detected. Stopping infinite reload.")
        }
    }
}

// Router errors are the primary place high-level dynamic import failures manifest
router.onError((error) => handleChunkError(error))

app.use(createPinia())
app.use(router)

app.mount('#app')
