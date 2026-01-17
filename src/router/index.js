
import { createRouter, createWebHistory } from 'vue-router'
import TesterView from '../views/TesterView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: LoginView, // Login Page
        },
        {
            path: '/station',
            name: 'station',
            component: () => import('../views/StationView.vue')
        },
        {
            path: '/judge/speed',
            name: 'judge-speed',
            component: () => import('../views/SpeedJudgeView.vue')
        },
        {
            path: '/judge/freestyle/difficulty',
            name: 'judge-freestyle-difficulty',
            component: () => import('../views/FreestyleDifficultyView.vue')
        },
        {
            path: '/judge/freestyle/technical',
            name: 'judge-freestyle-technical',
            component: () => import('../views/FreestyleTechnicalView.vue')
        },
        {
            path: '/judge/freestyle/presentation',
            name: 'judge-freestyle-presentation',
            component: () => import('../views/FreestylePresentationView.vue')
        },
        {
            path: '/judge/freestyle/re',
            name: 'judge-freestyle-re',
            component: () => import('../views/FreestyleReView.vue')
        },
        {
            path: '/importer',
            name: 'importer',
            component: () => import('../views/ImporterView.vue')
        },
        {
            path: '/admin',
            name: 'admin',
            component: () => import('../views/AdminView.vue')
        },
        {
            path: '/host',
            name: 'host',
            component: () => import('../views/HostView.vue')
        },
        {
            path: '/tester',
            name: 'tester',
            component: TesterView
        },

        {
            path: '/live',
            name: 'live-setup',
            component: () => import('../views/ScoreboardSetupView.vue')
        },
        {
            path: '/live/board',
            name: 'live-scoreboard',
            component: () => import('../views/LiveScoreboardView.vue')
        }
    ],
})

router.beforeEach((to, from, next) => {
    const publicPages = ['/', '/live/board', '/live'];
    const authRequired = !publicPages.includes(to.path);
    const loggedIn = localStorage.getItem('gbrsa_access_key');
    const allowedStation = localStorage.getItem('gbrsa_allowed_station');
    const isAdmin = loggedIn === 'admin';

    // 1. Authentication Check
    if (authRequired && !loggedIn) {
        return next('/');
    }

    // 2. Station Authorization Check (Lane Enforcer)
    // Only applies if user is NOT admin and trying to access a station/judge route
    if (authRequired && !isAdmin && (to.path.startsWith('/station') || to.path.startsWith('/judge'))) {
        const isTester = localStorage.getItem('tester_authorized') === 'true';

        if (!isTester && !allowedStation) {
            // Basic Check: If not a tester and no station assigned, kick out.
            localStorage.removeItem('gbrsa_access_key');
            return next('/');
        }
    }

    next();
});

/* Global Error Handler for Dynamic Import Failures (New Version Deployed) */
router.onError((error, to) => {
    console.error("Router Error:", error);
    if (
        error.message.includes('Failed to fetch dynamically imported module') ||
        error.message.includes('Importing a module script failed')
    ) {
        if (!to?.path) return;

        // Prevent infinite loop if reload fails for some reason
        // We can just reload the page and let the browser fetch new index.html
        console.log("Chunk Load Error detected. Reloading page...");
        window.location.reload();
    }
});

export default router
