<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { broadcastService } from '../services/BroadcastService'

const router = useRouter()
const alertMessage = ref(null)
const isPendingLogout = ref(false)
const isSystemLocked = ref(false)
const alertQueue = ref([])

const showLockOverlay = computed(() => {
    if (!isSystemLocked.value) return false
    const path = router.currentRoute.value.path || window.location.pathname
    if (path.includes('/admin') || path.includes('/host')) return false
    return true
})

const isReady = ref(false)

onMounted(() => {
    // Small delay to ensure any initial state snapshot from Firestore is settled
    setTimeout(() => {
        isReady.value = true
    }, 1000)

    broadcastService.startListening({
        onAlert: (msg) => {
            if (isReady.value) handleIncomingAlert(msg)
        },
        onReload: () => {
            if (!isReady.value) return
            const currentPath = router.currentRoute.value.path || window.location.pathname
            
            // Protection: Don't reload Admin/Host
            if (currentPath.includes('/admin') || currentPath.includes('/host')) return

            console.log("Force Reload Triggered - Resetting Viewport...")

            // 1. FORCE CLOSE KEYBOARD
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur(); 
            }

            // 2. Reset Scroll (Target #app because body is overflow:hidden)
            const app = document.getElementById('app');
            if (app) app.scrollTop = 0;
            window.scrollTo(0, 0);

            // 3. Wait for Keyboard Animation & Settle
            setTimeout(() => {
                // 4. Force Hard Reload / State Reset using timestamp
                const url = new URL(window.location.href);
                url.searchParams.set('t', Date.now());
                window.location.href = url.toString();
            }, 500); 
        },
        onForceLogout: () => {
            const currentRoute = router.currentRoute.value
            const currentPath = currentRoute.path || window.location.pathname
            const isJudgeForm = currentPath.includes('/judge/') || currentPath.includes('freestyle-') || currentPath.includes('speed-')
            
            // Exempt Admin and Host from Force Logout
            if (currentPath.includes('/admin') || currentPath.includes('/host')) return

            // Check if Test Mode (Immediate Logout)
            const isTestMode = currentRoute.query.test === 'true' || currentRoute.query.entry === 'PRACTICE'

            if (isJudgeForm && !isTestMode) {
                // Real Live Judge: Wait (Pend)
                isPendingLogout.value = true
                localStorage.setItem('gbrsa_pending_logout', 'true')
            } else {
                // Not a judge form OR it is a Test Mode judge: Immediate Logout
                doLogout()
            }
        },
        onSystemLock: (locked) => {
            isSystemLocked.value = locked
        }
    })
})

onUnmounted(() => {
    broadcastService.stopListening()
})

const handleIncomingAlert = (msg) => {
    const path = router.currentRoute.value.path || window.location.pathname
    
    // EXEMPT Admin and Host from Alerts
    if (path.includes('/admin') || path.includes('/host')) return

    // If we are on a judge form, queue it
    const isJudgeForm = path.includes('/judge/') || path.includes('freestyle-') || path.includes('speed-')
    
    if (isJudgeForm) {
        // Quietly queue
        alertQueue.value.push(msg)
    } else {
        // Show immediately
        showAlert(msg)
    }
}

const showAlert = (msg) => {
    // Audio Cue
    if (window.playClick) {
        window.playClick(800, 0.15)
        setTimeout(() => window.playClick(1000, 0.1), 150)
    }
    alertMessage.value = msg
}

// Watch for route changes to flush queue
import { watch } from 'vue'
watch(() => router.currentRoute.value.path, (newPath) => {
    // If moving back to station or non-judge page, and has queue
    const isJudgeForm = newPath.includes('/judge/') || newPath.includes('freestyle-') || newPath.includes('speed-')
    
    if (!isJudgeForm && alertQueue.value.length > 0 && !alertMessage.value) {
        // Show the oldest queued message
        const nextMsg = alertQueue.value.shift()
        showAlert(nextMsg)
    }
})

const doLogout = () => {
    localStorage.removeItem('gbrsa_access_key')
    localStorage.removeItem('admin_authorized')
    localStorage.removeItem('gbrsa_pending_logout')
    router.push('/')
}

const dismissAlert = () => {
    alertMessage.value = null
    // Check if more in queue
    if (alertQueue.value.length > 0) {
        // Small delay to feel natural
        setTimeout(() => {
            const nextMsg = alertQueue.value.shift()
            showAlert(nextMsg)
        }, 300)
    }
}
</script>

<template>
    <!-- System Lock Overlay -->
    <div v-if="showLockOverlay" class="lock-overlay">
        <div class="lock-card">
            <div class="lock-icon">🔒</div>
            <div class="lock-title">System Locked</div>
            <div class="lock-text">The host has temporarily locked the system. Please wait for the next heat.</div>
        </div>
    </div>

    <!-- Broadcast Overlay -->
    <div v-if="alertMessage" class="broadcast-overlay">
        <div class="broadcast-container">
            <div class="broadcast-body">
                <div class="broadcast-message">{{ alertMessage }}</div>
            </div>
            <div class="broadcast-footer">
                <div class="broadcast-label">ADMIN'S MESSAGE</div>
                <button class="broadcast-close-btn" @click="dismissAlert">DISMISS</button>
            </div>
        </div>
    </div>

    <!-- Logout Warning Toast -->
    <div v-if="isPendingLogout" class="logout-pill">
        ⚠️ SESSION ENDING: Auto-logout after submit
    </div>
</template>

<style scoped>
.broadcast-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(8px);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.broadcast-container {
    background: white;
    width: 100%;
    max-width: 400px;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.broadcast-message {
    color: #1e293b;
    font-size: 1.15rem;
    line-height: 1.6;
    font-weight: 600;
    white-space: pre-wrap;
    text-align: center;
}

.broadcast-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
}

.broadcast-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94a3b8;
    font-weight: 800;
}

.broadcast-close-btn {
    background: #0f172a;
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
}

.logout-pill {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #ef4444;
    color: white;
    padding: 8px 20px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.8rem;
    z-index: 10002;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.lock-overlay {
    position: fixed;
    inset: 0;
    background: #f8fafc;
    z-index: 20000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
}
.lock-card {
    max-width: 400px;
}
.lock-icon { font-size: 4rem; margin-bottom: 1rem; }
.lock-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
.lock-text { color: #64748b; font-weight: 500; }
</style>
