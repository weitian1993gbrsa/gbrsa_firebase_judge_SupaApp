
// ⚡ Cache Buster: Force reload ONLY when version changes (after a new deploy)
const BUILD_ID = '20260117_0011'; // Increment this string every time you deploy
const lastBuild = localStorage.getItem('gbrsa_build_id');
if (lastBuild && lastBuild !== BUILD_ID) {
    console.log("New version detected. Refreshing for latest assets...");
    localStorage.setItem('gbrsa_build_id', BUILD_ID);
    window.location.reload(true);
} else {
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
