import { db } from '../firebase'
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp, doc } from 'firebase/firestore'

class BroadcastService {
    constructor() {
        this.unsubscribe = null
        this.lastHandledTimestamp = Date.now()
    }

    startListening(callbacks) {
        let isInitial = true
        this.lastHandledTimestamp = Date.now()

        if (this.unsubscribe) this.unsubscribe()

        // Listen to the SINGLE document 'broadcasts/latest'
        const docRef = doc(db, 'broadcasts', 'latest')

        this.unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data()
                const ts = data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp?.seconds * 1000 || 0)

                // On first load, capture the current timestamp to ignore it
                if (isInitial) {
                    isInitial = false
                    this.lastHandledTimestamp = Math.max(this.lastHandledTimestamp, ts)
                    return
                }

                // Only handle truly NEW broadcasts
                if (ts > this.lastHandledTimestamp) {
                    this.lastHandledTimestamp = ts // Slide the window forward
                    this.handleBroadcast(String(ts), data, callbacks)
                }
            } else {
                isInitial = false
            }
        })

        // Add System Lock Listener
        const systemDoc = doc(db, "participants", "0")
        this.systemUnsubscribe = onSnapshot(systemDoc, (snap) => {
            if (snap.exists()) {
                const data = snap.data()
                if (callbacks.onSystemLock) callbacks.onSystemLock(data.station === 'LOCKED')
            }
        })
    }

    handleBroadcast(id, data, callbacks) {
        // Track handled messages in sessionStorage to survive reloads but prevent loops
        const handledRaw = sessionStorage.getItem('gbrsa_handled_broadcasts') || '[]'
        let handled = []
        try { handled = JSON.parse(handledRaw) } catch (e) { handled = [] }

        if (handled.includes(id)) {
            console.log("[Broadcast] Already handled ID:", id)
            return
        }

        console.log("[Broadcast] Received New Broadcast:", id, data)

        // Mark as handled BEFORE execution
        handled.push(id)
        if (handled.length > 20) handled.shift() // Keep only recent history
        sessionStorage.setItem('gbrsa_handled_broadcasts', JSON.stringify(handled))

        switch (data.type) {
            case 'alert':
                if (callbacks.onAlert) callbacks.onAlert(data.message)
                break
            case 'reload':
            case 'wipe_all':
                if (callbacks.onReload) callbacks.onReload()
                break
            case 'force_logout':
                if (callbacks.onForceLogout) callbacks.onForceLogout()
                break
        }
    }

    stopListening() {
        if (this.unsubscribe) this.unsubscribe()
        if (this.systemUnsubscribe) this.systemUnsubscribe()
    }
}

export const broadcastService = new BroadcastService()
