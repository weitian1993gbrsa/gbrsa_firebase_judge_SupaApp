<template>
  <div class="admin-layout">
    <header class="header">
      <div class="brand">
        <img id="headerLogo" :src="COMPETITION_LOGO" alt="Logo" class="logo" />
        <div class="brand-text">
          <h1>{{ config.title }}</h1>
        </div>
      </div>
      <div class="nav-links">
            <button class="nav-link" :class="{ active: activeView === 'speed' }" @click="switchView('speed')">Speed</button>
            <button class="nav-link" :class="{ active: activeView === 'freestyle' }" @click="switchView('freestyle')">Freestyle</button>
            <button class="nav-link" :class="{ active: activeView === 'broadcast' }" @click="switchView('broadcast')">Broadcast</button>
            <button class="nav-link" :class="{ active: activeView === 'importer' }" @click="switchView('importer')">Import</button>
            <router-link to="/host" class="nav-link">Host Dashboard</router-link>
      </div>
      <div class="system-status-container">
        <div class="system-status">
            <div class="pulse-dot"></div>
            <span>Admin Control Panel</span>
        </div>
        <div class="time-display">{{ currentTime }}</div>
      </div>
    </header>

    <template v-if="activeView !== 'broadcast' && activeView !== 'importer'">
    <nav class="nav-bar">
      <div class="filters-group">
        <div class="filter-item">
            <label>Div</label>
            <select v-model="filterDivision" class="filter-select w-48">
                <option value="">(All Divisions)</option>
                <option v-for="d in distinctDivisions" :key="d" :value="d">{{ d }}</option>
            </select>
        </div>
        
        <div class="filter-item">
            <label>Heat</label>
            <select v-model="filterHeat" class="filter-select w-24">
                <option value="">(All)</option>
                <option v-for="h in distinctHeats" :key="h" :value="h">{{ h }}</option>
            </select>
        </div>
      </div>

      <div class="actions-group">
        <input type="text" v-model="searchQuery" placeholder="Search data" class="search-input" />
        
        <button @click="openExportModal" class="btn-outline">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
        
        <button @click="exportTeamResults" class="btn-outline">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Teams
        </button>

         <button @click="wipeAllData" class="btn-outline" style="background: #dc2626; border-color: #ef4444; color: white;">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
            Wipe
        </button>
        
        <button @click="fetchAll" class="btn-outline" style="background: #3b82f6; border-color: #3b82f6; color: white;">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
            Refresh
        </button>
      </div>
    </nav>

    <div v-if="!filterEvent" class="menu-container">
        <div class="event-grid">
            <button v-for="e in distinctEvents" :key="e" @click="filterEvent = e" class="event-card">
                <span class="event-code">{{ e }}</span>
                <span class="event-name">{{ getEventLabel(e) }}</span>
            </button>
        </div>
    </div>

    <div v-else class="glass-panel table-panel">
        <div class="table-scroll-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="text-center" style="width: 5%;">Place</th>
                        <th class="text-center" style="width: 7%;">Entry</th>
                        <th style="width: 20%;">Name</th>
                        <th style="width: 12%;">Team</th>
                        
                        <template v-if="activeView === 'speed'">
                            <th class="text-center" style="width: 11%;">Final<br>Score</th>
                            <th class="text-center" style="width: 6%;">False<br>Start</th>
                            <th class="text-center" style="width: 5%;">Heat</th>
                            <th class="text-center" style="width: 5%;">Station</th>
                            <th style="width: 7%;">Div</th>
                            <th style="width: 6%;">Event</th>
                            <th style="width: 8%;">Remark</th>
                        </template>
                        <template v-else>
                            <th class="text-center" style="width: 11%;">Final<br>Score</th>
                            <th class="text-center" style="width: 5%;">Diff</th>
                            <th class="text-center" style="width: 5%;">Pres</th>
                            <th class="text-center" style="width: 5%;">Req.El</th>
                            <th class="text-center" style="width: 5%;">Deduc</th>
                            <th style="width: 7%;">Div</th>
                            <th style="width: 6%;">Event</th>
                            <th style="width: 6%;">Remark</th>
                        </template>

                        <th class="text-center" style="width: 8%;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in sortedData.filter(r => r.entry_code !== '0' && r.entry_code !== 0)" :key="row.entry_code">
                        
                        <td class="text-center font-bold text-white">{{ row.displayPlace || '-' }}</td>

                        <td class="font-mono text-gray-400 font-bold text-center">{{ row.entry_code }}</td>
                        
                        <td>
                            <div class="flex flex-col gap-1">
                                <template v-for="(n, idx) in [row.name1, row.name2, row.name3, row.name4]">
                                    <div v-if="n && n.trim()" :key="idx" class="leading-tight" style="display: block;">
                                        {{ n }}
                                    </div>
                                </template>
                            </div>
                            <span v-if="row.is_live" class="badge-live bg-green-500 ml-2"></span>
                        </td>
                        
                        <td class="text-muted">{{ row.team }}</td>
                        
                        <template v-if="activeView === 'speed'">
                            <td class="font-bold text-lg cursor-pointer hover:text-white text-center" @click="openInlineEdit(row, 'speed', $event)">
                                <span v-if="row.status === 'rejump'" class="badge-status badge-rejump">Re-Jump</span>
                                <span v-else-if="row.status === 'scratch'" class="badge-status badge-scratch">SCRATCH</span>
                                <span v-else-if="row.status === 'dq'" class="badge-status badge-dq">DQ</span>
                                <span v-else>
                                    <template v-if="row.false_start === true || String(row.false_start).toLowerCase() === 'yes'">
                                        {{ (Number(row.score) || 0) - 10 }}
                                        <span class="text-red-500 text-sm ml-1">({{ row.score }})</span>
                                    </template>
                                    <template v-else>
                                        {{ row.score ?? '-' }}
                                    </template>
                                </span>
                            </td>
                            <td class="text-center">
                                <span v-if="row.false_start === true || String(row.false_start).toLowerCase() === 'yes'" class="text-red-500 font-bold">YES</span>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td class="text-center">{{ row.heat }}</td>
                            <td class="text-center">{{ row.station }}</td>
                            <td class="text-sm">{{ row.division }}</td>
                            <td class="text-sm font-bold">{{ row.event }}</td>
                            <td class="text-sm text-center text-muted italic">{{ row.remark || '-' }}</td>
                        </template>

                        <template v-else>
                             <td class="font-black text-lg text-indigo-400 cursor-pointer text-center" @click="openInlineEdit(row, 'freestyle', $event)">
                                 <span v-if="row.status === 'rejump'" class="badge-status badge-rejump">Re-Jump</span>
                                 <span v-else-if="row.status === 'scratch'" class="badge-status badge-scratch">SCRATCH</span>
                                 <span v-else-if="row.status === 'dq'" class="badge-status badge-dq">DQ</span>
                                 <span v-else>{{ formatNum(row.finalScore) }}</span>
                             </td>
                             <td class="text-center">
                                 <span v-if="row.difficulty_dq" class="badge-status badge-dq">DQ</span>
                                 <span v-else>{{ formatNum(row.difficulty_score) }}</span>
                             </td>
                             <td class="text-center" :title="'Raw: ' + formatNum(row.presentation_score)">{{ formatPres(row.presentation_score) }}</td>
                             <td class="text-center" :title="'Missing: ' + row.re_score">{{ formatRe(row.re_score) }}</td>
                             <td class="text-center" :title="`M:${row.misses||0} B:${row.breaks||0} V:${row.space_violation||0}`">{{ formatDed(row) }}</td>
                             <td class="text-sm">{{ row.division }}</td>
                             <td class="text-sm font-bold">{{ row.event }}</td>
                             <td class="text-sm text-center text-muted italic">{{ row.remark || '-' }}</td>
                        </template>

                        <td>
                            <select class="action-select bg-slate-800 border-slate-600 text-white text-xs rounded px-2 py-1 w-full"
                                @change="(e) => handleAction(row, e.target.value, e)">
                                <option value="normal" :selected="!row.status || row.status === 'normal' || row.status === 'pending'">Normal</option>
                                <option value="rejump" :selected="row.status === 'rejump'">Re-Jump</option>
                                <option value="scratch" :selected="row.status === 'scratch'">Scratch</option>
                                <option value="dq" :selected="row.status === 'dq'">DQ</option>
                                <option disabled>──────</option>
                                <option value="reset" class="text-red-300 font-bold">Reset (Wipe)</option>
                                <option disabled>──────</option>
                                <option value="edit_score">Edit Score...</option>
                            </select>
                        </td>
                    </tr>
                    <tr v-if="sortedData.length === 0">
                        <td colspan="10" class="text-center p-8 text-muted">No records found.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    </template>

    <div v-show="activeView === 'broadcast'" class="dashboard-container px-8 pt-2 pb-8">
        <div class="dashboard-single-card">
            <div class="glass-card host-dashboard">
                <div class="host-header">
                     <div>
                        <h3 class="host-title">Broadcast & System Check</h3>
                        <p class="host-subtitle">Manage announcements and system status</p>
                    </div>
                     <div class="live-badge">
                        <span class="dot"></span> LIVE
                    </div>
                </div>

                <div class="host-body">
                    <div class="host-section">
                        <label class="section-title">📢 Live Announcement</label>
                         <div class="composer-container">
                            <textarea v-model="broadcastMsg" rows="3" 
                                placeholder="Type a message to all screens..." 
                                class="simple-input"></textarea>
                            
                             <button @click="sendAlert" class="btn-transmit" :disabled="!broadcastMsg">
                                <span>SEND NOW</span>
                                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                            </button>
                         </div>
                         
                         <div class="presets-grid">
                            <button @click="broadcastMsg = 'Lunch Break - Stay Logged In'" class="preset-card">
                                <span class="emoji">🍔</span>
                                <span>Lunch Break</span>
                            </button>
                            <button @click="broadcastMsg = 'Short Break 5 minutes - Stay Logged In'" class="preset-card">
                                <span class="emoji">☕</span>
                                <span>Short Break</span>
                            </button>
                            <button @click="broadcastMsg = 'Next Event Starting Soon'" class="preset-card">
                                <span class="emoji">🚀</span>
                                <span>Next Event</span>
                            </button>
                            <button @click="broadcastMsg = 'All Judges report to Head Desk'" class="preset-card">
                                <span class="emoji">📢</span>
                                <span>Report to Desk</span>
                            </button>
                             <button @click="broadcastMsg = ''" class="preset-card clear">
                                <span class="emoji">✕</span>
                                <span>Clear Message</span>
                            </button>
                         </div>
                    </div>

                    <div class="host-divider"></div>

                    <div class="host-section">
                        <label class="section-title">⚙️ System Operations</label>
                        
                        <div class="ops-row-4">
                             <div class="ops-card-base status-card">
                                <div class="status-content">
                                    <div class="status-label">System Lock</div>
                                    <div class="status-desc">{{ isSystemLocked ? 'Locked' : 'Unlocked' }}</div>
                                </div>
                                <button @click="toggleSystemLock" class="toggle-switch-ios" :class="{ 'active': isSystemLocked }">
                                    <div class="knob"></div>
                                </button>
                            </div>

                            <button @click="forceRefresh" class="ops-card-base action-card blue">
                                <div class="icon-circle">
                                     <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                </div>
                                <span>Refresh Devices</span>
                            </button>

                            <div class="ops-card-base action-card red" @click="sendForceLogout">
                                <div class="icon-circle">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                </div>
                                <span>Force Logout</span>
                            </div>

                            <button @click="wipeAllData" class="ops-card-base action-card red">
                                <div class="icon-circle">
                                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </div>
                                <span>Wipe System</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-if="activeView === 'importer'" class="dashboard-container px-8 pt-2 pb-8">
        <SystemImporter />
    </div>

    <footer class="footer flex justify-between items-center px-6">
        <span>© 2026 GBRSA</span>
        <span class="text-xs text-gray-500">Designed and Developed by Rynns TENG</span>
    </footer>

    <div class="inline-editor" v-if="editState.active" :style="{ top: editState.y + 'px', left: editState.x + 'px' }">
        <input ref="scoreInput" type="number" v-model="editState.val" @keyup.enter="saveInline" @keyup.esc="closeInline" @click="$event.target.select()" class="inline-input" placeholder="000">
        <button @click="saveInline" class="btn-xs btn-primary"><span class="icon">✓</span></button>
        <button @click="closeInline" class="btn-xs"><span class="icon">✕</span></button>
    </div>

    <div class="modal-overlay" v-if="fsEditState.active" @click.self="closeFreestyleEditor">
        <div class="modal-card">
            <h3 style="margin:0; text-align:center; color:white;">Edit Freestyle Scores</h3>
            <p style="text-align:center; color:#94a3b8; font-size:0.9rem; margin-bottom:1.5rem; font-family:monospace;">
                Name: {{ [fsEditState.row?.name1, fsEditState.row?.name2, fsEditState.row?.name3, fsEditState.row?.name4].filter(n=>n).join(', ') || fsEditState.row?.name }}
            </p>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                <div>
                    <label style="color:#94a3b8; font-size:0.8rem; display:block; margin-bottom:4px;">Difficulty Score</label>
                    <input v-model="fsEditState.diff" class="modal-input" type="number" step="0.01" style="font-weight:bold;" />
                </div>
                <div>
                    <label style="color:#94a3b8; font-size:0.8rem; display:block; margin-bottom:4px;">Presentation Score</label>
                    <input v-model="fsEditState.pres" class="modal-input" type="number" step="0.01" style="font-weight:bold;" />
                </div>
                 <div>
                    <label style="color:#94a3b8; font-size:0.8rem; display:block; margin-bottom:4px;">Req. El. Misses (Q)</label>
                    <input v-model="fsEditState.re" class="modal-input" type="number" step="1" />
                </div>
                 <div>
                    <label style="color:#94a3b8; font-size:0.8rem; display:block; margin-bottom:4px;">Tech. Misses</label>
                    <input v-model="fsEditState.miss" class="modal-input" type="number" step="1" />
                </div>
                 <div>
                    <label style="color:#94a3b8; font-size:0.8rem; display:block; margin-bottom:4px;">Tech. Breaks</label>
                    <input v-model="fsEditState.break" class="modal-input" type="number" step="1" />
                </div>
                 <div>
                    <label style="color:#94a3b8; font-size:0.8rem; display:block; margin-bottom:4px;">Space Violations</label>
                    <input v-model="fsEditState.space" class="modal-input" type="number" step="1" />
                </div>
            </div>

            <div class="modal-actions" style="margin-top:2rem;">
               <button @click="closeFreestyleEditor" class="btn-outline" style="border:none; color:#ef4444; cursor:pointer; font-weight:600;">Cancel</button>
               <button @click="saveFreestyleEditor" class="btn-primary" style="padding:10px 20px;">Save Changes</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" v-if="exportModalOpen" @click.self="closeExportModal">
        <div class="export-modal-card">
            <div class="export-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 2.5rem; height: 2.5rem; color: white;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
            </div>
            
            <h3>Export Results</h3>
            <p>Select the format for the exported PDF document.</p>
            
            <div class="export-actions">
                <button @click="exportPDF(false)" class="export-btn unofficial">
                    <span class="btn-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 1.25rem; height: 1.25rem;">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                    </span>
                    <div class="btn-content">
                        <span class="btn-title">Unofficial Result</span>
                        <span class="btn-desc">For internal review</span>
                    </div>
                </button>

                <button @click="exportPDF(true)" class="export-btn official">
                    <span class="btn-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 1.25rem; height: 1.25rem;">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                    </span>
                    <div class="btn-content">
                        <span class="btn-title">Official Result</span>
                        <span class="btn-desc">Verified & Final</span>
                    </div>
                </button>
            </div>
            
            <button @click="closeExportModal" class="cancel-link">Cancel</button>
        </div>
    </div>
  </div>
</template>

<style>
/* Reset */
html, body { 
    margin: 0; 
    padding: 0; 
    height: 100%; 
    overflow: hidden; /* Prevent body scroll */
}
</style>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, nextTick, watch, defineAsyncComponent } from 'vue'
import { db } from '../firebase'
import { collection, collectionGroup, onSnapshot, doc, updateDoc, deleteDoc, addDoc, query, where, orderBy, getDocs, setDoc, serverTimestamp, writeBatch, limit } from 'firebase/firestore'
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { COMPETITION_LOGO, SPEED_EVENTS, FREESTYLE_EVENTS } from '../constants'
import { faCircleUser } from '@fortawesome/free-solid-svg-icons'
import { useConfig } from '../composables/useConfig'

const { config, getEventLabel } = useConfig()

const SystemImporter = defineAsyncComponent(() => import('../components/SystemImporter.vue'))

// --- STATE ---
const activeView = ref('speed')
const broadcastMsg = ref('')
const isSystemLocked = ref(false)
const currentTime = ref('00/00/0000 00:00:00')
const searchQuery = ref('')
const filterEvent = ref('')
const filterDivision = ref('')
const filterHeat = ref('')
const realtimeStatus = ref(true)
const scoreInput = ref(null)
const participants = ref([])
const resultsSpeed = ref([])
const resultsFreestyle = ref([])

const filters = reactive({ text: '', event: '', heat: '' }) 
const editState = reactive({ active: false, x: 0, y: 0, row: null, val: '', type: '' })

let systemUnsub = null
let unsubs = []

// Watchers
watch(activeView, () => {
    filterEvent.value = ''
    filterDivision.value = ''
    filterHeat.value = ''
    searchQuery.value = ''
})

// --- FIX 2: REALTIME FETCH OPTIMIZATION ---
const setupListeners = () => {
    // 1. Cleanup old listeners
    unsubs.forEach(u => u())
    unsubs = []

    // 2. Define Filters & Smart Listening
    const isLive = !!filterEvent.value
    realtimeStatus.value = isLive

    if (!isLive) {
        // MENU MODE: Clear Data & Stop Listening
        participants.value = []
        resultsSpeed.value = []
        resultsFreestyle.value = []
        return
    }

    // LIVE MODE (Filtered)
    // A. Listen to Participants (Filtered by Event)
    let qP = query(collectionGroup(db, 'entries'), where("event", "==", filterEvent.value))
    unsubs.push(onSnapshot(qP, snap => {
        participants.value = snap.docs.map(d => ({ ...d.data(), id: d.id, _path: d.ref.path }))
    }))

    // B. Listen to Results (Conditional - SAVE 50% DATA)
    if (activeView.value === 'speed') {
        let qS = collection(db, 'results_speed')
        unsubs.push(onSnapshot(qS, snap => {
            resultsSpeed.value = snap.docs.map(d => ({ ...d.data(), id: d.id }))
        }))
        resultsFreestyle.value = [] // Clear unused data
    } else {
        let qF = collection(db, 'results_freestyle')
        unsubs.push(onSnapshot(qF, snap => {
            resultsFreestyle.value = snap.docs.map(d => ({ ...d.data(), id: d.id }))
        }))
        resultsSpeed.value = [] // Clear unused data
    }
}

onMounted(() => {
    const updateClock = () => {
        const now = new Date()
        const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const time = now.toLocaleTimeString('en-US', { hour12: false })
        currentTime.value = `${date} ${time}`
    }
    updateClock(); setInterval(updateClock, 1000)

    systemUnsub = onSnapshot(doc(db, 'system', 'status'), s => {
        if (s.exists()) isSystemLocked.value = s.data().locked === true
    })
})

onUnmounted(() => { unsubs.forEach(u => u()); if (systemUnsub) systemUnsub() })

// Navigation Handler
const switchView = (view) => {
    filterEvent.value = ''
    filterDivision.value = ''
    filterHeat.value = ''
    searchQuery.value = ''
    activeView.value = view
    setupListeners()
}

watch(filterEvent, () => { setupListeners() })
const fetchAll = () => { setupListeners() }

// --- COMPUTED: Consolidate data automatically ---
const fullData = computed(() => {
    return participants.value.map(p => {
        const row = {
            entry_code: p.id, _path: p._path,
            name: [p.name1, p.name2, p.name3, p.name4].filter(n=>n).join(', '),
            team: p.team || '-', event: p.event, heat: p.heat, station: p.station,
            status: p.status || 'normal', division: p.division,
            timestamp: 0,
            name1: p.name1, name2: p.name2, name3: p.name3, name4: p.name4
        }

        if (activeView.value === 'speed') {
            const res = resultsSpeed.value.find(r => r.entry_code === p.id)
            if (res) {
                row.score = res.score
                row.remark = res.remark
                row.false_start = res.false_start
                row.timestamp = res.created_at?.seconds || 0
                row.result_id = res.id
            }
        } else {
             // Freestyle specific
             const allRes = resultsFreestyle.value.filter(r => String(r.entry_code) === String(p.id))
             
             if (allRes.length > 0) {
                 const merged = { difficulty_score: null, presentation_score: null, re_score: null, misses: null, breaks: null, space_violation: null, remark: '', result_ids: [] }
                 
                 // Check Admin Override
                 const adminRes = allRes.find(r => r.judge_type === 'admin')
                 if (adminRes) {
                     Object.assign(merged, adminRes)
                     merged.result_ids.push(adminRes.id)
                     merged.re_score = adminRes.re_score || 0 // Stored as MISSES in Admin
                 } else {
                     // Standard Aggregation
                     allRes.forEach(r => {
                         merged.result_ids.push(r.id)
                         if (r.technical) { merged.misses = r.technical.misses; merged.breaks = r.technical.breaks; merged.space_violation = r.technical.space_violation; }
                         if (r.difficulty) { merged.difficulty_score = r.difficulty.score; if(r.difficulty.dq) merged.difficulty_dq = true; }
                         if (r.presentation) merged.presentation_score = r.presentation.score;
                         if (r.re) { const val = Number(r.re.score); merged.re_score = !isNaN(val) ? (12 - val) : 12; }
                         
                         // Legacy / Single Doc
                         if (r.judge_type === 'difficulty') merged.difficulty_score = r.score;
                         else if (r.judge_type === 'presentation') merged.presentation_score = r.score;
                         else if (r.judge_type === 're') { const val = Number(r.score); merged.re_score = !isNaN(val) ? (12 - val) : 12; }
                         else if (r.judge_type === 'technical') { merged.misses = r.misses; merged.breaks = r.breaks; merged.space_violation = r.space_violation; }
                     })
                 }
                 
                 Object.assign(row, merged)
                 row.result_id = merged.result_ids[0]
                 
                 // Auto-DQ Logic
                 if (merged.difficulty_dq) {
                     row.status = 'dq'
                 }
                 
                 if (!row.finalScore) row.finalScore = calculateScore(row)
             }
        }
        if (p.status === 'rejump' || p.status === 'scratch') row.finalScore = null
        return row
    })
})

const calculateScore = (row) => {
    const D = Number(row.difficulty_score) || 0
    const P = (Number(row.presentation_score) || 0) * 0.05
    const Q = Math.max(0, 1 - ((Number(row.re_score)||0) * 0.025))
    const m = (0.05 * Math.min(Number(row.misses)||0, 1)) + (0.075 * Math.max(0, Math.min((Number(row.misses)||0) - 1, 1))) + (0.10 * Math.max(0, (Number(row.misses)||0) - 2));
    const M = Math.max(0, 1 - (m + ((Number(row.breaks)||0) * 0.05) + ((Number(row.space_violation)||0) * 0.05)));
    return Math.trunc((D * (1 + P) * Q * M) * 100) / 100
}

const sortedData = computed(() => {
    let data = fullData.value

    // 1. FILTER
    data = data.filter(r => {
        const isFreestyleEvent = ['SRIF','SRPF','SRTF','DDIF','DDPF','DDTF'].includes(r.event)
        if (r.entry_code === '0' || r.entry_code === 0 || r.name === 'SYSTEM') return false;
        return (activeView.value === 'speed' && !isFreestyleEvent) || (activeView.value === 'freestyle' && isFreestyleEvent)
    })

    if (filterEvent.value) data = data.filter(d => d.event === filterEvent.value)
    if (filterDivision.value) data = data.filter(d => d.division === filterDivision.value)
    if (filterHeat.value) data = data.filter(d => String(d.heat) === String(filterHeat.value))
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        data = data.filter(d => String(d.entry_code).includes(q) || String(d.name).toLowerCase().includes(q) || String(d.team).toLowerCase().includes(q))
    }

    // 2. RANKING LOGIC
    const groups = {}
    data.forEach(r => { const key = `${r.event}|${r.division}`; if (!groups[key]) groups[key] = []; groups[key].push(r) })

    const allProcessed = []
    Object.keys(groups).forEach(key => {
        const groupData = groups[key]
        const getRankVal = (row) => {
            if (activeView.value === 'freestyle') return calculateScore(row); 
            let s = Number(row.score) || 0
            if (row.false_start === true || String(row.false_start).toLowerCase() === 'yes') s -= 10
            return s
        }
        
        groupData.forEach(row => { row.finalScore = getRankVal(row) })

        const hasValidScore = (row) => {
            if (row.status === 'scratch' || row.status === 'dq' || row.status === 'rejump') return false
            if (activeView.value === 'freestyle') return (Number(row.difficulty_score) || 0) > 0
            return row.score != null && row.score !== ''
        }

        const toRank = groupData.filter(r => hasValidScore(r))
        const noRank = groupData.filter(r => !hasValidScore(r))

        toRank.sort((a,b) => getRankVal(b) - getRankVal(a))

        let lastScore = null, lastPlace = 0
        toRank.forEach((row, index) => {
            const score = getRankVal(row)
            if (score !== lastScore) lastPlace = index + 1
            row.assignedPlace = lastPlace
            lastScore = score
        })
        
        // TIE HANDLER
        const placeCounts = {}
        toRank.forEach(r => placeCounts[r.assignedPlace] = (placeCounts[r.assignedPlace] || 0) + 1)
        toRank.forEach(r => r.displayPlace = placeCounts[r.assignedPlace] > 1 ? `${r.assignedPlace} T` : r.assignedPlace)
        noRank.forEach(r => { r.assignedPlace = 99999; r.displayPlace = '-' })
        
        allProcessed.push(...toRank, ...noRank)
    })

    return allProcessed.sort((a, b) => {
         if (filterEvent.value && filterDivision.value && !filterHeat.value) {
            if (a.assignedPlace !== b.assignedPlace) return a.assignedPlace - b.assignedPlace
            return String(a.entry_code).localeCompare(String(b.entry_code), undefined, { numeric: true })
         }
         const entrySort = String(a.entry_code).localeCompare(String(b.entry_code), undefined, { numeric: true })
         if (entrySort !== 0) return entrySort
         return (Number(a.heat)||0) - (Number(b.heat)||0)
    })
})

const distinctEvents = computed(() => activeView.value === 'speed' ? config.value.speedEvents : config.value.freestyleEvents)
const distinctHeats = computed(() => [...new Set(fullData.value.map(p => p.heat))].filter(h => h && h !== '0' && h !== 0).sort((a,b)=>Number(a)-Number(b)))
const distinctDivisions = computed(() => {
    let list = [...new Set(fullData.value.map(p => p.division))].filter(d => d && d !== 'SYSTEM')
    const configDivs = config.value.divisions || []
    list = [...new Set([...configDivs, ...list])]
    return list.sort((a,b) => {
        const idxA = configDivs.indexOf(a), idxB = configDivs.indexOf(b)
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        if (idxA !== -1) return -1
        if (idxB !== -1) return 1
        return String(a).localeCompare(String(b), undefined, { numeric: true })
    })
})

const handleAction = async (row, action, event) => {
    if (event && event.target) { event.target.value = row.status || 'normal'; event.target.blur() }
    if (action === 'edit_score') return openInlineEdit(row, activeView.value)

    try {
        const statusUpdate = { status: action === 'reset' ? 'normal' : action }
        if (action === 'reset' || action === 'rejump') {
            statusUpdate.status_difficulty = false; statusUpdate.status_technical = false; 
            statusUpdate.status_presentation = false; statusUpdate.status_re = false;
        }

        await updateDoc(doc(db, row._path), statusUpdate)
        
        if (['rejump', 'reset', 'dq'].includes(action)) {
             const coll = activeView.value === 'speed' ? 'results_speed' : 'results_freestyle'
             const q = query(collection(db, coll), where("entry_code", "==", row.entry_code))
             const snap = await getDocs(q)
             const batch = writeBatch(db)
             snap.forEach(doc => batch.delete(doc.ref))
             if (row.station) batch.delete(doc(db, 'live_scores', String(row.station)))
             await batch.commit()
        }
    } catch(err) { alert("Error: " + err.message) }
}

// --- FIX 3: TEAM EXPORT (STATUS AWARE) ---
async function exportTeamResults() {
    console.log("[Admin] Team Export started...");
    const eventName = filterEvent.value;
    const divName = filterDivision.value;

    if (!eventName) { alert("Please select an Event first."); return; }
    
    let sourceData = fullData.value;
    let filtered = sourceData.filter(r => r.event === eventName);
    if (divName) filtered = filtered.filter(r => r.division === divName);

    if (filtered.length === 0) { alert("No data found for this selection."); return; }

    const groupsByTeam = {};
    filtered.forEach(r => {
        const team = r.team || "Independent / Unknown";
        if (!groupsByTeam[team]) groupsByTeam[team] = [];
        groupsByTeam[team].push(r);
    });

    const teamNames = Object.keys(groupsByTeam).sort();
    const doc = new jsPDF();

    doc.setFontSize(22); doc.text("TEAM SUMMARY RESULTS", 105, 20, { align: "center" });
    doc.setFontSize(14); doc.text(`${eventName} • ${divName || "All Divisions"}`, 105, 30, { align: "center" });
    doc.line(15, 35, 195, 35);

    let y = 45;
    teamNames.forEach((team) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(70, 51, 245);
        doc.text(`TEAM: ${team}`, 15, y); y += 8;
        doc.setTextColor(0);

        // Sort by division
        groupsByTeam[team].sort((a, b) => (a.division || "").localeCompare(b.division || ""));

        groupsByTeam[team].forEach(r => {
            doc.setFontSize(10); doc.setFont("helvetica", "normal");
            const names = [r.name1, r.name2, r.name3, r.name4].filter(n => n).join(", ") || r.name;
            doc.text(`• ${names}`, 20, y);
            doc.text(`${r.division}`, 120, y);
            
            // STATUS CHECK
            let scoreText = "-";
            if (r.status === 'scratch') scoreText = "SCRATCH";
            else if (r.status === 'dq') scoreText = "DQ";
            else if (r.status === 'rejump') scoreText = "RE-JUMP";
            else {
                let score = r.finalScore;
                if(score == null) score = (activeView.value === 'freestyle') ? calculateScore(r) : (Number(r.score)||0);
                if(activeView.value === 'speed' && (r.false_start === true || String(r.false_start).toLowerCase() === 'yes')) score -= 10;
                
                if (score !== null && score !== undefined) scoreText = parseFloat(score).toFixed(2);
            }

            doc.setFont("helvetica", "bold");
            doc.text(`Score: ${scoreText}`, 170, y);
            y += 6;
            if (y > 275) { doc.addPage(); y = 20; }
        });
        y += 8;
    });

    doc.save(`${eventName}_Team_Results.pdf`);
}

// --- FIX 1: WIPE ALL (CHUNKED SAFE) ---
const wipeAllData = async () => {
    if(!confirm("DANGER: DELETE ALL SCORES?\nAction CANNOT be undone.")) return
    if(prompt("To confirm, type 'DELETE':") !== "123") return alert("Wrong code")

    try {
        const processInChunks = async (docs, operation) => {
            const chunkSize = 450
            for (let i = 0; i < docs.length; i += chunkSize) {
                const batch = writeBatch(db)
                const chunk = docs.slice(i, i + chunkSize)
                chunk.forEach(d => operation(batch, d))
                await batch.commit()
            }
        }

        const sSnap = await getDocs(collection(db, 'results_speed'))
        await processInChunks(sSnap.docs, (b, d) => b.delete(d.ref))

        const fSnap = await getDocs(collection(db, 'results_freestyle'))
        await processInChunks(fSnap.docs, (b, d) => b.delete(d.ref))
        
        const pSnap = await getDocs(collectionGroup(db, "entries"))
        await processInChunks(pSnap.docs, (b, d) => {
             b.update(d.ref, { 
                 status: 'normal',
                 status_difficulty: false,
                 status_technical: false,
                 status_presentation: false,
                 status_re: false
             })
        })

        await setDoc(doc(db, "broadcasts", "latest"), { type: 'wipe_all', timestamp: serverTimestamp() })
        alert("System Cleaned."); window.location.reload()
    } catch(err) { alert("Wipe Failed: " + err.message) }
}

// --- INLINE EDIT (Speed) ---
const openInlineEdit = (row, type, event) => {
    if (type === 'freestyle') { openFreestyleEditor(row); return }
    editState.active = true; editState.row = row; editState.type = type; editState.val = row.score || '';
    if (event && event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect()
        editState.x = rect.left + (rect.width / 2); editState.y = rect.top + (rect.height / 2)
    } else {
        editState.x = window.innerWidth / 2; editState.y = window.innerHeight / 2
    }
    nextTick(() => { if(scoreInput.value) { scoreInput.value.focus(); scoreInput.value.select() } })
}
const closeInline = () => { editState.active = false; editState.row = null }
const saveInline = async () => {
    if(!editState.row) return
    const val = Number(editState.val); if(isNaN(val)) return alert("Invalid number")
    try {
        if (editState.row.result_id) await updateDoc(doc(db, 'results_speed', editState.row.result_id), { score: val })
        else await addDoc(collection(db, 'results_speed'), { entry_code: editState.row.entry_code, score: val, judge_key: 'admin', created_at: serverTimestamp() })
        closeInline()
    } catch(e) { alert(e.message) }
}

// --- FREESTYLE EDITOR MODAL ---
const fsEditState = reactive({ active: false, row: null, diff: 0, pres: 0, re: 0, miss: 0, break: 0, space: 0 })
const openFreestyleEditor = (row) => {
    fsEditState.row = row; fsEditState.diff = row.difficulty_score || 0; fsEditState.pres = row.presentation_score || 0;
    fsEditState.re = row.re_score || 0; fsEditState.miss = row.misses || 0; fsEditState.break = row.breaks || 0; fsEditState.space = row.space_violation || 0;
    fsEditState.active = true
}
const closeFreestyleEditor = () => { fsEditState.active = false; fsEditState.row = null }
const saveFreestyleEditor = async () => {
    if (!fsEditState.row) return
    const D = Number(fsEditState.diff) || 0; const rawP = Number(fsEditState.pres) || 0;
    const reMisses = Number(fsEditState.re)||0; const rawMisses = Number(fsEditState.miss)||0;
    const rawBreaks = Number(fsEditState.break)||0; const rawViolations = Number(fsEditState.space)||0;
    
    // Calc Score (Replicated logic)
    const P = rawP * 0.05; const Q = Math.max(0, 1 - (reMisses * 0.025));
    const m = (0.05 * Math.min(rawMisses, 1)) + (0.075 * Math.max(0, Math.min(rawMisses - 1, 1))) + (0.10 * Math.max(0, rawMisses - 2));
    const M = Math.max(0, 1 - (m + (rawBreaks * 0.05) + (rawViolations * 0.05)));
    const finalScore = Math.trunc((D * (1 + P) * Q * M) * 100) / 100

    const payload = {
        difficulty_score: D, presentation_score: rawP, re_score: reMisses, misses: rawMisses, breaks: rawBreaks, space_violation: rawViolations,
        score: finalScore, judge_type: 'admin', entry_code: fsEditState.row.entry_code, judge_key: 'admin'
    }
    try {
        const q = query(collection(db, 'results_freestyle'), where('entry_code', '==', fsEditState.row.entry_code), where('judge_type', '==', 'admin'), limit(1))
        const snap = await getDocs(q)
        if (!snap.empty) await updateDoc(doc(db, 'results_freestyle', snap.docs[0].id), payload)
        else await addDoc(collection(db, 'results_freestyle'), { ...payload, created_at: serverTimestamp() })
        closeFreestyleEditor()
    } catch(e) { alert("Save failed: " + e.message) }
}

// Helpers
const formatDed = (r) => {
    if (!r || r.misses == null) return ''
    const rawMisses = parseFloat(r.misses)||0; const rawBreaks = parseFloat(r.breaks)||0; const rawViolations = parseFloat(r.space_violation)||0
    const m = (0.05 * Math.min(rawMisses, 1)) + (0.075 * Math.max(0, Math.min(rawMisses - 1, 1))) + (0.10 * Math.max(0, rawMisses - 2));
    return Math.max(0, 1 - (m + (rawBreaks * 0.05) + (rawViolations * 0.05))).toFixed(2)
}
const formatNum = (v) => (v!=null && v!=='') ? Number(v).toFixed(2) : ''
const formatPres = (v) => (v!=null && v!=='') ? (Math.trunc((1 + (Number(v) * 0.05)) * 100) / 100).toFixed(2) : ''
const formatRe = (v) => (v!=null && v!=='') ? (Math.trunc(Math.max(0, 1 - (Number(v) * 0.025)) * 100) / 100).toFixed(2) : ''

// --- EXPORT PDF (Standard) ---
const exportModalOpen = ref(false)
const openExportModal = () => { if (!filterEvent.value) return alert("Select Event first."); exportModalOpen.value = true }
const closeExportModal = () => { exportModalOpen.value = false }

const exportPDF = async (isOfficial = false) => {
    try {
    closeExportModal()
    const doc = new jsPDF()
    const eventName = filterEvent.value
    const data = sortedData.value.filter(r => r.event === eventName)
    if (data.length === 0) return alert("No data to export.")

    const groups = {}
    data.forEach(r => { if(!groups[r.division]) groups[r.division] = []; groups[r.division].push(r) })
    const divisions = distinctDivisions.value.filter(d => groups[d])
    
    let firstPage = true
    let logoBase64 = null
    try {
        const logoImg = await new Promise((resolve) => { const img = new Image(); img.src = COMPETITION_LOGO; img.onload = () => resolve(img); img.onerror = () => resolve(null) })
        if(logoImg) {
            const canvas = document.createElement("canvas"); canvas.width = logoImg.width; canvas.height = logoImg.height
            const ctx = canvas.getContext("2d"); ctx.drawImage(logoImg,0,0)
            logoBase64 = canvas.toDataURL("image/png")
        }
    } catch(e) {}

    let iconDataUrl = null
    try {
        const icon = faCircleUser.icon; const [ w, h, , , path ] = icon
        const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64
        const ctx = canvas.getContext('2d'); const scale = 64 / Math.max(w, h); ctx.scale(scale, scale)
        const p = new Path2D(path); ctx.fillStyle = "#1e293b"; ctx.fill(p)
        iconDataUrl = canvas.toDataURL('image/png')
    } catch (e) {}

    for (const divName of divisions) {
         const divData = groups[divName].sort((a, b) => (a.assignedPlace||999) - (b.assignedPlace||999))
         if (!firstPage) doc.addPage(); firstPage = false
         
         if(logoBase64) doc.addImage(logoBase64, 'PNG', 15, 10, 20, 20)
         doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(config.value.title, 40, 18)
         doc.setFontSize(11); doc.text(eventName, 195, 18, { align: 'right' })
         doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text(isOfficial ? "Official Results" : "Unofficial Results", 40, 26)
         
         if (isOfficial) {
             doc.rect(160, 21, 35, 6)
             doc.setFontSize(9); doc.setFont("helvetica", "bold")
             doc.text("Verified Results", 177.5, 24, { align: "center", baseline: "middle" })
         }
         
         doc.line(15, 33, 195, 33)
         doc.setFontSize(10); doc.setFont("helvetica", "bold")
         doc.text(`Event: ${getEventLabel(eventName)}`, 15, 40)
         doc.text(`Division: ${divName}`, 100, 40)
         
         let head = [], body = []
         if (activeView.value === 'speed') {
            head = [['Place', 'Name', 'Team', 'Final Score', 'Remark']]
            body = divData.map(r => [
                r.displayPlace || '', [r.name1,r.name2,r.name3,r.name4].filter(n=>n).join("\n"), r.team,
                ['rejump','scratch','dq'].includes(r.status) ? r.status.toUpperCase() : (r.result_id ? r.finalScore : ''), r.remark||''
            ])
         } else {
            head = [['Place', 'Name', 'Team', 'Final Score', 'Diff', 'Pres', 'Req.El', 'Deduc']]
            body = divData.map(r => {
                const show = (val, fmtFn) => (r.result_id && !['dq','scratch','rejump'].includes(r.status)) ? fmtFn(val) : ''
                return [
                r.displayPlace || '', [r.name1,r.name2,r.name3,r.name4].filter(n=>n).join("\n"), r.team,
                ['rejump','scratch','dq'].includes(r.status) ? r.status.toUpperCase() : (r.result_id ? formatNum(r.finalScore) : ''),
                show(r.difficulty_score, formatNum), show(r.presentation_score, formatPres),
                show(r.re_score, formatRe), show(r.misses, () => formatDed(r))
            ]})
         }
         
         autoTable(doc, {
            head: head, body: body, startY: 45, theme: 'grid',
            styles: { fontSize: 8, cellPadding: 1, valign: 'middle', overflow: 'linebreak', halign: 'center' },
            headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
            columnStyles: activeView.value === 'speed' ? { 1: { halign: 'left', cellWidth: 65 }, 2: { halign: 'left', cellWidth: 40 } } : { 1: { halign: 'left', cellWidth: 55 }, 2: { halign: 'left', cellWidth: 35 } },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 1 && iconDataUrl) {
                    const cell = data.cell; const textHeight = cell.text.length * cell.styles.fontSize * 0.352
                    const y = cell.y + (cell.height - textHeight)/2
                    doc.addImage(iconDataUrl, 'PNG', cell.x + 2, y, 3, 3)
                }
            }
         })
    }
    doc.save(`${isOfficial?'Official':'Unofficial'}_${getEventLabel(eventName)}.pdf`)
    } catch (err) { alert("PDF Export Failed: " + err.message) }
}

const sendAlert = async () => { if(!broadcastMsg.value) return; await setDoc(doc(db, 'broadcasts', 'latest'), { type: 'alert', message: broadcastMsg.value, timestamp: serverTimestamp() }); broadcastMsg.value = '' }
const toggleSystemLock = async () => { await setDoc(doc(db, 'system', 'status'), { locked: !isSystemLocked.value }, { merge: true }) }
const forceRefresh = async () => { if(!confirm("Force reload all?")) return; await setDoc(doc(db, 'broadcasts', 'latest'), { type: 'reload', timestamp: serverTimestamp() }) }
const sendForceLogout = async () => { if(!confirm("LOGOUT ALL JUDGES?")) return; await setDoc(doc(db, 'broadcasts', 'latest'), { type: 'force_logout', timestamp: serverTimestamp() }) }

</script>

<style scoped>
/* DARK THEME - MATCHING HOSTVIEW */
.admin-layout { 
    height: 100vh; /* Fixed height */
    display: flex; 
    flex-direction: column; 
    background-color: #0f172a; 
    color: #f8fafc; 
    font-family: 'Outfit', sans-serif; 
    overflow: hidden; /* Prevent layout expansion */
}

/* HEADER */
.header { 
    padding: 1.5rem 2rem; 
    display: flex; 
    align-items: center; 
    background: #0f172a;
    border-bottom: 1px solid #1e293b;
    box-shadow: none;
    position: relative; 
    gap: 1rem;
}
.brand { 
    display: flex; 
    align-items: center; 
    gap: 1rem; 
    max-width: 35%; /* Prevent overlap with center nav */
}
.brand img { height: 64px; }
.brand h1 { 
    font-size: 1.5rem; 
    font-weight: 800; 
    margin: 0; 
    color: #f8fafc; 
    letter-spacing: -0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* RESPONSIVE HEADER - MATCHING HOSTVIEW */
@media (max-width: 1280px) {
    .header { padding: 1rem 1.5rem; }
    .brand img { height: 48px; }
    .brand h1 { font-size: 1.25rem; }
}

@media (max-width: 1024px) {
    .brand h1 { font-size: 1.1rem; }
    .nav-link { padding: 0.4rem 0.8rem; font-size: 0.85rem; }
}

/* SYSTEM STATUS HEADER */
.system-status-container { display: flex; flex-direction: column; align-items: flex-end; }
.system-status { display: flex; align-items: center; gap: 8px; color: #10b981; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; }
.system-status.is-paused { color: #f59e0b; }

/* PULSE DOT - STATIC VERSION */
.pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
.system-status.is-paused .pulse-dot { background: #f59e0b; }

.time-display { font-family: 'JetBrains Mono', monospace; font-size: 0.9rem; color: #94a3b8; margin-top: 4px; }

/* NAV / COMMAND BAR */
.nav-bar {
    display: flex;
    justify-content: space-between; 
    align-items: center;
    padding: 0.75rem 2rem;
    background: #0f172a;
    border-bottom: 1px solid #334155;
    position: relative;
    z-index: 10;
}

.nav-links {
    display: flex;
    gap: 0.5rem;
    margin-left: auto; 
    margin-right: 1rem;
    background: #1e293b;
    padding: 0.25rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-link {
    background: transparent;
    border: none;
    color: #94a3b8;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
}

.nav-link:hover {
    color: white;
    background: rgba(255,255,255,0.05);
}

.nav-link.active {
    background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
} 
.filters-group { display: flex; align-items: center; gap: 1rem; }
.filter-item { display: flex; align-items: center; gap: 8px; }
.filter-item label { font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
.filter-select { 
    background: #1e293b; 
    border: 1px solid #334155; 
    color: white;
    padding: 0.4rem 0.6rem; 
    border-radius: 6px; 
    font-size: 0.85rem;
    font-weight: 600;
}
.filter-select:focus { border-color: #3b82f6; outline: none; }

.actions-group { margin-left: auto; display: flex; gap: 8px; }
.search-input { 
    background: #1e293b;
    border: 1px solid #334155; 
    color: white;
    padding: 0.5rem 1rem; 
    border-radius: 8px; 
    width: 180px;
}
.search-input::placeholder { color: #64748b; }

.btn-outline { 
    background: #1e293b; 
    border: 1px solid #334155; 
    color: #cbd5e1; 
    padding: 0.5rem 1rem; 
    border-radius: 8px; 
    font-size: 0.85rem; 
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
}
.btn-outline:hover { background: #334155; color: white; border-color: #475569; }

/* TABLE PANEL */
.table-panel { 
    flex: 1; 
    margin: 1.5rem 2rem; 
    background: #1e293b; 
    border-radius: 16px; 
    border: 1px solid #334155; 
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    min-height: 0;
}
.table-scroll-container { flex: 1; overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.data-table th { 
    background: #0f172a; 
    position: sticky; top: 0; padding: 1rem; text-align: left; 
    font-size: 0.75rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;
    border-bottom: 2px solid #334155; z-index: 5;
}
.data-table td { padding: 0.85rem 1rem; border-bottom: 1px solid #334155; font-size: 0.9rem; color: #f1f5f9; }
.data-table tr:hover td { background: #334155; transition: background 0.1s; }

.text-white { color: white !important; }
.text-gray-400 { color: #94a3b8 !important; }
.text-muted { color: #64748b !important; }
.text-indigo-400 { color: #818cf8 !important; }

.badge-status { padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 0.65rem; text-transform: uppercase; }
.badge-rejump { background: transparent; color: #f97316; border: 1px solid #f97316; padding: 3px 10px; font-size: 0.8rem; border-radius: 6px; text-transform: none; }
.badge-scratch { background: #334155; color: #94a3b8; border: 1px solid #475569; }
.badge-dq { background: #7f1d1d; color: #fca5a5; border: 1px solid #fca5a5; }
.badge-live { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

.action-select { 
    background: #0f172a; border: 1px solid #334155; color: #cbd5e1; 
    font-size: 0.75rem; border-radius: 4px; padding: 4px; width: 100%; cursor: pointer;
}
.action-select:hover { border-color: #64748b; }

.footer { padding: 1.5rem 2rem; color: #64748b; font-size: 0.8rem; border-top: 1px solid #334155; background: #0f172a; }

/* INLINE EDITOR */
.inline-editor {
    position: fixed; z-index: 2000; transform: translate(-50%, -50%);
    background: #1e293b; padding: 8px; border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    display: flex; gap: 8px; border: 1px solid #475569;
}
.inline-input {
    background: #0f172a; border: 1px solid #475569; color: white;
    font-size: 1.5rem; font-weight: 800; width: 100px; text-align: center;
    border-radius: 8px; padding: 4px;
}
.btn-xs { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; }
.btn-primary { background: #3b82f6; color: white; }
.btn-xs:not(.btn-primary) { background: #334155; color: #cbd5e1; }

/* MODAL */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: #1e293b; padding: 2rem; border-radius: 16px; width: 450px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); border: 1px solid #334155; }
.modal-input {
    background: #0f172a; border: 1px solid #334155; color: white;
    padding: 8px; border-radius: 6px; width: 100%; font-size: 1.1rem;
}
.modal-input:focus { border-color: #3b82f6; outline: none; }

/* MENU */
.menu-container {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
    padding: 2rem; padding-top: 8vh; animation: fadeIn 0.3s ease;
}
.event-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem; width: 100%; max-width: 1200px;
}
.event-card {
    background: #1e293b; border: 1px solid #334155; border-radius: 12px;
    padding: 2rem 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 0.75rem;
    cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.event-card:hover { transform: translateY(-4px); background: #334155; border-color: #3b82f6; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2); }
.event-code { font-size: 1.5rem; font-weight: 900; color: #facc15; }
.event-name { font-size: 0.9rem; color: #94a3b8; font-weight: 600; line-height: 1.4; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* UTILITIES */
.w-64 { width: 16rem; } .w-48 { width: 12rem; } .w-24 { width: 6rem; }
.text-center { text-align: center !important; } .flex { display: flex; } .flex-col { flex-direction: column; }
.gap-1 { gap: 0.25rem; } .leading-tight { line-height: 1.25; } .ml-1 { margin-left: 0.25rem; }

/* DASHBOARD */
.dashboard-container { flex: 1; display: flex; flex-direction: column; max-width: 1400px; width: 100%; margin: 0 auto; padding: 2rem 3rem; min-height: 0; overflow-y: auto; }
.glass-card {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.3));
    backdrop-filter: blur(24px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 28px; padding: 2rem; position: relative; box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.5);
    display: flex; flex-direction: column; overflow: visible; min-height: 100%;
}
.action-card {
    display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
    padding: 2rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); background: rgba(30, 41, 59, 0.4);
    cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; gap: 1rem;
}
.action-card:hover { transform: translateY(-4px); background: #475569; color: white; }
.icon-circle { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 12px rgba(255,255,255,0.05); }

/* HOST DASHBOARD */
.dashboard-single-card { display: flex; flex: 1; min-height: 0; max-width: 900px; margin: 0 auto; width: 100%; }
.host-dashboard { flex: 1; display: flex; flex-direction: column; background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 0; overflow: hidden; }
.host-header { padding: 1.5rem 2rem; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); }
.host-title { margin: 0; color: white; font-size: 1.25rem; font-weight: 700; }
.host-subtitle { margin: 0; color: #94a3b8; font-size: 0.9rem; }
.live-badge { background: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 6px 12px; border-radius: 99px; font-weight: 800; font-size: 0.75rem; display: flex; align-items: center; gap: 8px; letter-spacing: 1px; }
.dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; }
.host-body { padding: 2rem; display: flex; flex-direction: column; gap: 2rem; overflow-y: auto; }
.section-title { display: block; color: #94a3b8; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; }

.composer-container { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.simple-input { flex: 1; background: white; border: none; border-radius: 8px; padding: 1rem; font-size: 1.1rem; color: #1e293b; font-family: inherit; resize: none; }
.btn-transmit { background: #3b82f6; color: white; border: none; border-radius: 8px; padding: 0 1.5rem; font-weight: 800; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.2s; }
.btn-transmit:hover { background: #2563eb; }
.btn-transmit:disabled { opacity: 0.5; background: #94a3b8; cursor: not-allowed; }

.presets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
.preset-card { background: #334155; border: none; color: white; padding: 1rem; border-radius: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: background 0.2s; }
.preset-card:hover { background: #475569; }
.preset-card.clear { background: rgba(239, 68, 68, 0.1); color: #fca5a5; }
.preset-card.clear:hover { background: rgba(239, 68, 68, 0.2); }
.host-divider { height: 1px; background: rgba(255,255,255,0.05); width: 100%; }

.ops-row-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.ops-card-base { background: #334155; border-radius: 12px; padding: 1rem; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; transition: all 0.2s; min-height: 80px; }
.status-card { justify-content: space-between; padding: 0 1.25rem; }
.status-content { display: flex; flex-direction: column; }
.status-label { font-weight: 700; color: white; font-size: 0.95rem; }
.status-desc { font-size: 0.75rem; color: #94a3b8; }
.toggle-switch-ios { width: 44px; height: 26px; background: #cbd5e1; border-radius: 30px; position: relative; border: none; cursor: pointer; transition: 0.3s; }
.toggle-switch-ios .knob { width: 22px; height: 22px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.toggle-switch-ios.active { background: #ef4444; } .toggle-switch-ios.active .knob { transform: translateX(18px); }

/* EXPORT MODAL */
.export-modal-card { background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border-radius: 24px; padding: 2.5rem; width: 100%; max-width: 420px; text-align: center; display: flex; flex-direction: column; align-items: center; animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes modalPop { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.export-icon-wrapper { width: 64px; height: 64px; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.1); }
.export-modal-card h3 { font-size: 1.5rem; font-weight: 700; color: white; margin: 0 0 0.5rem 0; }
.export-modal-card p { color: #94a3b8; font-size: 0.95rem; margin: 0 0 2rem 0; line-height: 1.5; }
.export-actions { display: grid; grid-template-columns: 1fr; gap: 1rem; width: 100%; margin-bottom: 1.5rem; }
.export-btn { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border-radius: 9999px; border: 1px solid transparent; cursor: pointer; transition: all 0.2s; text-align: left; position: relative; overflow: hidden; }
.export-btn:hover { transform: translateY(-2px); }
.export-btn.unofficial { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.1); color: white; }
.export-btn.unofficial:hover { background: rgba(255,255,255,0.08); }
.export-btn.official { background: linear-gradient(135deg, #facc15 0%, #eab308 100%); box-shadow: 0 4px 12px rgba(250, 204, 21, 0.3); color: #0f172a; border: none; font-weight: 700; }
.btn-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.unofficial .btn-icon { background: rgba(255,255,255,0.1); }
.official .btn-icon { background: rgba(15, 23, 42, 0.1); color: #0f172a; }
.btn-content { display: flex; flex-direction: column; }
.btn-title { font-weight: 600; font-size: 1rem; color: white; }
.official .btn-title { color: #0f172a; font-weight: 800; }
.btn-desc { font-size: 0.8rem; color: rgba(255,255,255,0.6); }
.official .btn-desc { color: rgba(15, 23, 42, 0.7); font-weight: 500; }
.cancel-link { background: none; border: none; color: #64748b; font-weight: 500; font-size: 0.9rem; cursor: pointer; padding: 0.5rem; }
.cancel-link:hover { color: white; text-decoration: underline; }
</style>