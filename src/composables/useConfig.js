import { ref, watchEffect, computed } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import {
    COMPETITION_TITLE as DEFAULT_TITLE,
    SPEED_EVENTS as DEFAULT_SPEED,
    FREESTYLE_EVENTS as DEFAULT_FREESTYLE,
    EVENT_NAMES as DEFAULT_LABELS
} from '../constants'

// Global State (Singleton)
const config = ref({
    title: DEFAULT_TITLE,
    speedEvents: DEFAULT_SPEED,
    freestyleEvents: DEFAULT_FREESTYLE,
    divisions: [], // Default empty, usually derived from data if empty
    eventLabels: DEFAULT_LABELS,
    logo: '/logo.svg' // Default logo
})

const isLoaded = ref(false)

// Initialize Listener
let unsubscribe = null

export function useConfig() {

    // Auto-init on first use
    if (!unsubscribe) {
        // Listen to system/config
        unsubscribe = onSnapshot(doc(db, 'system', 'config'), (snap) => {
            if (snap.exists()) {
                const data = snap.data()

                // Merge with Defaults
                config.value = {
                    title: data.title || DEFAULT_TITLE,
                    logo: data.logo || '/logo.svg',
                    // If events provided, use them. Else default.
                    speedEvents: data.speedEvents?.length ? data.speedEvents : DEFAULT_SPEED,
                    freestyleEvents: data.freestyleEvents?.length ? data.freestyleEvents : DEFAULT_FREESTYLE,
                    divisions: data.divisions?.length ? data.divisions : [], // Optional explicit list

                    // Event Labels Map (Key -> Label)
                    eventLabels: data.eventLabels ? { ...DEFAULT_LABELS, ...data.eventLabels } : DEFAULT_LABELS
                }
            } else {
                // Fallback to constants if no config doc
                config.value = {
                    title: DEFAULT_TITLE,
                    speedEvents: DEFAULT_SPEED,
                    freestyleEvents: DEFAULT_FREESTYLE,
                    divisions: [],
                    eventLabels: DEFAULT_LABELS,
                    logo: '/logo.svg'
                }
            }
            isLoaded.value = true
        }, (error) => {
            console.error("Config Listener Error:", error)
        })
    }

    // Helpers
    const getEventLabel = (key) => {
        return config.value.eventLabels[key] || key
    }

    return {
        config,
        isLoaded,
        getEventLabel
    }
}
