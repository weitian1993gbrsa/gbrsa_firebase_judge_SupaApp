import { createRouter, createWebHistory } from 'vue-router'
import { db } from '../firebase' // Import DB for verification
import { doc, getDoc } from 'firebase/firestore' // Import Firestore methods

import LoginView from '../views/LoginView.vue'
import TesterView from '../views/TesterView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'home', component: LoginView },
        { path: '/station', name: 'station', component: () => import('../views/StationView.vue') },
        { path: '/judge/speed', name: 'judge-speed', component: () => import('../views/SpeedJudgeView.vue') },
        { path: '/judge/freestyle/difficulty', name: 'judge-freestyle-difficulty', component: () => import('../views/FreestyleDifficultyView.vue') },
        { path: '/judge/freestyle/technical', name: 'judge-freestyle-technical', component: () => import('../views/FreestyleTechnicalView.vue') },
        { path: '/judge/freestyle/presentation', name: 'judge-freestyle-presentation', component: () => import('../views/FreestylePresentationView.vue') },
        { path: '/judge/freestyle/re', name: 'judge-freestyle-re', component: () => import('../views/FreestyleReView.vue') },
        { path: '/importer', name: 'importer', component: () => import('../views/ImporterView.vue') },
        { path: '/admin', name: 'admin', component: () => import('../views/AdminView.vue') },
        { path: '/admin/certificates', name: 'certificates', component: () => import('../views/CertificatesView.vue') },
        { path: '/host', name: 'host', component: () => import('../views/HostView.vue') },
        { path: '/tester', name: 'tester', component: TesterView },
        { path: '/live', name: 'live-setup', component: () => import('../views/ScoreboardSetupView.vue') },
        { path: '/live/board', name: 'live-scoreboard', component: () => import('../views/LiveScoreboardView.vue') }
    ],
})

// --- SECURITY GUARD ---
router.beforeEach(async (to, from, next) => {
    const publicPages = ['/', '/live/board', '/live'];
    const authRequired = !publicPages.includes(to.path);

    // Get the key (Admin/Importer uses Local, Judges use Session)
    const key = localStorage.getItem('gbrsa_access_key') || sessionStorage.getItem('gbrsa_access_key');
    const allowedStation = localStorage.getItem('gbrsa_allowed_station') || sessionStorage.getItem('gbrsa_allowed_station');

    // 1. Basic Auth Check
    if (authRequired && !key) {
        return next('/');
    }

    // 2. High-Security Verification for Admin/Importer/Host
    // We check the DB to ensure the key is actually valid and has the right role.
    if (to.path.startsWith('/admin') || to.path.startsWith('/importer') || to.path.startsWith('/host')) {
        try {
            // Verify against Firestore
            const docRef = doc(db, 'access_keys', key);
            const snap = await getDoc(docRef);

            if (!snap.exists()) {
                console.warn("Security Alert: Invalid Key used for Admin Access");
                return next('/');
            }

            const role = snap.data().role;

            // Allow if role matches the route requirements
            if (to.path.startsWith('/admin') && role === 'admin') return next();
            if (to.path.startsWith('/importer') && (role === 'importer' || role === 'admin')) return next();
            if (to.path.startsWith('/host') && role === 'admin') return next();

            // If role doesn't match
            return next('/');

        } catch (error) {
            console.error("Auth Verification Failed:", error);
            // If offline, we might be stuck. 
            // Optional: fallback to localStorage 'admin_authorized' check if you need offline Admin support
            // But for security, we default to deny.
            return next('/');
        }
    }

    // 3. Station Authorization Check (Lane Enforcer)
    // Only applies if trying to access a station/judge route
    if (to.path.startsWith('/station') || to.path.startsWith('/judge')) {
        const isTester = localStorage.getItem('tester_authorized') === 'true';

        // Admins can go anywhere, so we skip this check if they just verified as admin above.
        // But since we are inside a standard route now, we assume they are a Judge or Tester.

        if (!isTester && !allowedStation) {
            localStorage.removeItem('gbrsa_access_key');
            sessionStorage.removeItem('gbrsa_access_key');
            return next('/');
        }
    }

    next();
});

router.onError((error, to) => {
    if (error.message.includes('Failed to fetch dynamically imported module') || error.message.includes('Importing a module script failed')) {
        window.location.reload();
    }
});

export default router
