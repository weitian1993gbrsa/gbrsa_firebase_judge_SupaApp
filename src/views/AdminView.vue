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

    <!-- COMMAND BAR -->
    <template v-if="activeView !== 'broadcast' && activeView !== 'importer'">
    <nav class="nav-bar">
      <!-- LEFT: FILTERS -->
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

      <!-- RIGHT: ACTIONS -->
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

    <!-- MENU STATE -->
    <div v-if="!filterEvent" class="menu-container">
        <div class="event-grid">
            <button v-for="e in distinctEvents" :key="e" @click="filterEvent = e" class="event-card">
                <span class="event-code">{{ e }}</span>
                <span class="event-name">{{ getEventLabel(e) }}</span>
            </button>
        </div>
    </div>

    <!-- DATA TABLE -->
    <div v-else class="glass-panel table-panel">
        <div class="table-scroll-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="text-center" style="width: 5%;">Place</th>
                        <th class="text-center" style="width: 7%;">Entry</th>
                        <th style="width: 20%;">Name</th>
                        <th style="width: 12%;">Team</th>
                        
                        <!-- Dynamic Columns based on View -->
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
                        
                        <!-- Place -->
                        <td class="text-center font-bold text-white">{{ row.displayPlace || '-' }}</td>

                        <!-- Entry -->
                        <td class="font-mono text-gray-400 font-bold text-center">{{ row.entry_code }}</td>
                        
                        <!-- Name -->
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
                        
                        <!-- Team -->
                        <td class="text-muted">{{ row.team }}</td>
                        
                        <!-- Speed Columns -->
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

                        <!-- Freestyle Columns -->
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

                        <!-- Actions -->
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

    <!-- PANEL: DASHBOARD / BROADCAST -->
    <div v-show="activeView === 'broadcast'" class="dashboard-container px-8 pt-2 pb-8">

        <div class="dashboard-single-card">
            <div class="glass-card host-dashboard">
                
                <!-- HEADER -->
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
                    <!-- ANNOUNCEMENTS -->
                    <div class="host-section">
                        <label class="section-title">📢 Live Announcement</label>
                        
                         <!-- COMPOSER -->
                         <div class="composer-container">
                            <textarea v-model="broadcastMsg" rows="3" 
                                placeholder="Type a message to all screens..." 
                                class="simple-input"></textarea>
                            
                             <button @click="sendAlert" class="btn-transmit" :disabled="!broadcastMsg">
                                <span>SEND NOW</span>
                                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                            </button>
                         </div>
                         
                         <!-- PRESETS -->
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
                             <!-- 1. LOCK -->
                            <div class="ops-card-base status-card">
                                <div class="status-content">
                                    <div class="status-label">System Lock</div>
                                    <div class="status-desc">{{ isSystemLocked ? 'Locked' : 'Unlocked' }}</div>
                                </div>
                                <button @click="toggleSystemLock" class="toggle-switch-ios" :class="{ 'active': isSystemLocked }">
                                    <div class="knob"></div>
                                </button>
                            </div>

                            <!-- 2. REFRESH -->
                             <button @click="forceRefresh" class="ops-card-base action-card blue">
                                <div class="icon-circle">
                                     <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                </div>
                                <span>Refresh Devices</span>
                            </button>

                            <!-- 3. LOGOUT -->
                <div class="action-card red" @click="sendForceLogout">
                    <div class="icon-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </div>
                    <span>Force Logout</span>
                </div>

                            <!-- 4. WIPE -->
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


    <!-- PANEL: IMPORTER -->
    <div v-if="activeView === 'importer'" class="dashboard-container px-8 pt-2 pb-8">
        <SystemImporter />
    </div>

    <footer class="footer flex justify-between items-center px-6">
        <span>© 2026 GBRSA</span>
        <span class="text-xs text-gray-500">Designed and Developed by Rynns TENG</span>
    </footer>

    <!-- INLINE EDITOR (SPEED) -->
    <div class="inline-editor" v-if="editState.active" :style="{ top: editState.y + 'px', left: editState.x + 'px' }">
        <input ref="scoreInput" type="number" v-model="editState.val" @keyup.enter="saveInline" @keyup.esc="closeInline" @click="$event.target.select()" class="inline-input" placeholder="000">
        <button @click="saveInline" class="btn-xs btn-primary"><span class="icon">✓</span></button>
        <button @click="closeInline" class="btn-xs"><span class="icon">✕</span></button>
    </div>

    <!-- FREESTYLE EDITOR MODAL -->
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

    <!-- EXPORT MODAL -->
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
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, query, where, orderBy, getDocs, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { COMPETITION_LOGO, SPEED_EVENTS, FREESTYLE_EVENTS } from '../constants'
import { faCircleUser } from '@fortawesome/free-solid-svg-icons'
import { useConfig } from '../composables/useConfig'

const { config, getEventLabel } = useConfig()

const SystemImporter = defineAsyncComponent(() => import('../components/SystemImporter.vue'))

// --- STATE ---
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

// Watchers
watch(activeView, () => {
    filterEvent.value = ''
    filterDivision.value = ''
    filterHeat.value = ''
    searchQuery.value = ''
})

// --- REALTIME FETCH ---
let unsubs = []

const setupListeners = () => {
    // 1. Cleanup old listeners
    unsubs.forEach(u => u())
    unsubs = []

    // 2. Define Filters & Smart Listening
    const isLive = !!filterEvent.value
    realtimeStatus.value = isLive

    if (!isLive) {
        // MENU MODE: Clear Data & Stop Listening
        console.log("[Admin] Mode: MENU (Waiting for Selection)")
        participants.value = []
        resultsSpeed.value = []
        resultsFreestyle.value = []
        return
    }

    // LIVE MODE (Filtered)
    console.log("[Admin] Mode: LIVE (Focused on " + filterEvent.value + ")")
    
    // MIGRATE: collectionGroup('entries')
    // We listen to Entries FILTERED (Saving 90% of reads)
    let qP = query(collectionGroup(db, 'entries'), where("event", "==", filterEvent.value))
    
    // We listen to Results GLOBALLY (Unfiltered) because results don't have 'event' field
    // This is a trade-off: We save on Entries, but pay for Results.
    // Since we are in "Live Mode" (Focused), this is acceptable to ensure data appears.
    let qS = collection(db, 'results_speed')
    let qF = collection(db, 'results_freestyle')

    unsubs.push(onSnapshot(qP, snap => {
        participants.value = snap.docs.map(d => ({ ...d.data(), id: d.id, _path: d.ref.path }))
    }, err => console.error("Snapshot Error", err)))

    unsubs.push(onSnapshot(qS, snap => {
        // PERFORMANCE: Filter locally immediately to avoid giant array in memory if possible?
        // Note: Firestore SDK still reads all documents cost-wise, but we can't filter server-side without index/schema change.
        resultsSpeed.value = snap.docs.map(d => ({ ...d.data(), id: d.id }))
    }))

    unsubs.push(onSnapshot(qF, snap => {
        resultsFreestyle.value = snap.docs.map(d => ({ ...d.data(), id: d.id }))
    }))
}

const fetchMetadata = async () => {
   // Legacy: No longer used for global fetch.
   // Kept empty or removed to prevent accidental usage.
}

onMounted(() => {
    // Clock
    const updateClock = () => {
        const now = new Date()
        const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const time = now.toLocaleTimeString('en-US', { hour12: false })
        currentTime.value = `${date} ${time}`
    }
    updateClock()
    setInterval(updateClock, 1000)

    // System Lock Listener
    systemUnsub = onSnapshot(doc(db, 'participants', '0'), s => {
        if (s.exists()) {
            isSystemLocked.value = s.data().station === 'LOCKED'
        }
    })
})

onUnmounted(() => {
    unsubs.forEach(u => u())
    if (systemUnsub) systemUnsub()
})

// Navigation Handler
const switchView = (view) => {
    // Always reset to menu when clicking navigation
    filterEvent.value = ''
    filterDivision.value = ''
    filterHeat.value = ''
    searchQuery.value = ''
    
    // Change View
    activeView.value = view
    
    // Force listener refresh (effectively stops listening since filterEvent is empty)
    setupListeners()
}

// Trigger listener rebuild when filters change (Smart Live)
watch(filterEvent, () => {
    setupListeners()
})

// Custom Refresh Button
const fetchAll = () => {
    setupListeners()
}

// COMPUTED: Consolidate data automatically
const fullData = computed(() => {
    return participants.value.map(p => {
        // Basic fields
        const row = {
            entry_code: p.id,
            _path: p._path, // Persist path for actions
            name: [p.name1, p.name2, p.name3, p.name4].filter(n=>n).join(', '),
            team: p.team || '-',
            event: p.event,
            heat: p.heat,
            station: p.station,
            status: p.status || 'normal',
            division: p.division,
            timestamp: 0,
            
            // Raw participant data for PDF export (names)
            name1: p.name1,
            name2: p.name2,
            name3: p.name3,
            name4: p.name4
        }

        if (activeView.value === 'speed') {
            const res = resultsSpeed.value.find(r => r.entry_code === p.id)
            if (res) {
                row.score = res.score
                row.remark = res.remark
                row.false_start = res.false_start // New
                row.timestamp = res.created_at?.seconds || 0
                row.result_id = res.id
            } else if (p.status === 'rejump' || p.status === 'scratch') {
                // Legacy: Sanitize Scratched/Rejumped
                row.score = null
                row.false_start = false
            }
        } else {
             // Freestyle specific
             // Legacy: Find 'admin' override or consolidated view. 
             // In this Vue app, we assume resultsFreestyle contains the "Master" record if we are in Admin View.
             // If we were using the View, we'd do that, but here we query the collection directly.
             // Freestyle specific
             // We must aggregate ALL result documents for this entry_code
             // RELAXED CHECK: Use String conversion to handle mismatched types (string vs number)
             const allRes = resultsFreestyle.value.filter(r => String(r.entry_code) === String(p.id))
             
             // DEBUG LOG
             if (allRes.length > 0) {
                 console.log(`[Admin] Found ${allRes.length} results for ${p.id}`, allRes)
             } else {
                 // Check if maybe there's a type mismatch?
                 const looseMatch = resultsFreestyle.value.filter(r => String(r.entry_code) == String(p.id))
                 if (looseMatch.length > 0) console.warn(`[Admin] Type Mismatch for ${p.id}?`, looseMatch)
             }

             if (allRes.length > 0) {
                 // Initialize Aggregator
                 const merged = {
                    difficulty_score: null,
                    presentation_score: null,
                    re_score: null,
                    misses: null,
                    breaks: null,
                    space_violation: null,
                    remark: '',
                    created_at: null,
                    result_ids: []
                 }
                 
                 // Check for Admin Override first
                 const adminRes = allRes.find(r => r.judge_type === 'admin')
                 if (adminRes) {
                     // Admin Override exists - use it exclusively for values
                     merged.result_ids.push(adminRes.id)
                     merged.created_at = adminRes.created_at
                     merged.remark = adminRes.remark
                     merged.difficulty_score = adminRes.difficulty_score || 0
                     merged.presentation_score = adminRes.presentation_score || 0
                     merged.re_score = adminRes.re_score || 0 // Stored as MISSES in Admin Doc
                     merged.misses = adminRes.misses || 0
                     merged.breaks = adminRes.breaks || 0
                     merged.space_violation = adminRes.space_violation || 0
                     // Final score is already calculated in admin doc usually, but valid to recalc
                 } else {
                     // Standard Aggregation (Supports Consolidated & Legacy)
                     allRes.forEach(r => {
                         merged.result_ids.push(r.id)
                         
                     // Check for Consolidated Data (Nested Keys)
                         if (r.technical) {
                             merged.misses = r.technical.misses || 0
                             merged.breaks = r.technical.breaks || 0
                             merged.space_violation = r.technical.space_violation || 0
                         }
                         if (r.difficulty) {
                             merged.difficulty_score = r.difficulty.score || 0
                             if (r.difficulty.dq) merged.difficulty_dq = true // NEW: Capture DQ
                         }
                         if (r.presentation) {
                             merged.presentation_score = r.presentation.score || 0
                         }
                         if (r.re) {
                             // RE Score in DB is COMPLETED count or calc score. 
                             // New view saves 'score' as integer 0-12.
                             // Legacy view saved count? Let's check logic:
                             // In new ReView: score: Math.floor(values.power) + ... => This is a COUNT of completed.
                             // So new 'score' is actually 'completed count'.
                             // Wait, logic here says: merged.re_score = 12 - val.
                             // So if r.re.score is 12 (all done), re_score (missing) = 0.
                             // Correct.
                             const val = Number(r.re.score)
                             merged.re_score = !isNaN(val) ? (12 - val) : 12;
                         }

                         // Legacy / Single-Doc Fallback
                         if (r.created_at && (!merged.created_at || r.created_at > merged.created_at)) {
                             merged.created_at = r.created_at
                         }
                         if (r.remark) merged.remark = r.remark 
                         
                         // Skip legacy checks if we found consolidated data for that type?
                         // It's safer to just run both. If consolidated doc exists, it likely won't have judge_type field top level.
    
                         if (r.judge_type === 'difficulty') {
                             merged.difficulty_score = r.score || 0
                         } else if (r.judge_type === 'presentation') {
                             merged.presentation_score = r.score || 0
                         } else if (r.judge_type === 're') {
                             const val = Number(r.score)
                             merged.re_score = !isNaN(val) ? (12 - val) : 12; 
                         } else if (r.judge_type === 'technical') {
                             merged.misses = r.misses || 0
                             merged.breaks = r.breaks || 0
                             merged.space_violation = r.space_violation || 0
                         }
                     })
                 }
                 
                 // Assign to row
                 // DISPLAY ANY DATA WE HAVE (Even partial)
                 row.difficulty_score = merged.difficulty_score
                 row.difficulty_dq = merged.difficulty_dq // NEW: Assign DQ status
                 
                 // AUTO-DQ Logic: If Diff is DQ, Final is DQ
                 if (merged.difficulty_dq) {
                     row.status = 'dq'
                     merged.presentation_score = null
                     merged.re_score = null
                     merged.misses = null
                     merged.breaks = null
                     merged.space_violation = null
                 }

                 row.presentation_score = merged.presentation_score
                 row.re_score = merged.re_score 
                 row.misses = merged.misses
                 row.breaks = merged.breaks
                 row.space_violation = merged.space_violation
                 row.created_at = merged.created_at
                 row.timestamp = merged.created_at?.seconds || 0
                 row.result_id = merged.result_ids[0] 
                 row.remark = merged.remark
                 
                 // Explicitly calculate Final Score for display if possible
                 // Using the helper logic
                 if (!row.finalScore) {
                     row.finalScore = calculateScore(row)
                 }
                 
                 console.log(`[Admin] Final Merged for ${p.id}:`, merged) 
             }
             
             if (p.status === 'rejump' || p.status === 'scratch') {
                  row.finalScore = null
             }
        }
        return row
    })
})


// --- COMPUTED ---
// We need distinct values for filters
// Helper to get minimum entry code for a value
const getMinEntry = (val, field) => {
    const match = fullData.value.find(p => p[field] === val)
    return match ? String(match.entry_code) : '99999'
}

const distinctEvents = computed(() => {
    return activeView.value === 'speed' ? config.value.speedEvents : config.value.freestyleEvents
})

const distinctHeats = computed(() => [...new Set(fullData.value.map(p => p.heat))].filter(h => h && h !== '0' && h !== 0).sort((a,b)=>Number(a)-Number(b)))

const distinctDivisions = computed(() => {
    // 1. Get all unique divisions from DATA
    let list = [...new Set(fullData.value.map(p => p.division))].filter(d => d && d !== 'SYSTEM')
    
    // 2. If Config exists, use it to SORT (and include any explicit config divisions even if no data?)
    // Actually, usually we only want to filter what exists. 
    // But maybe the user wants to see the option even if no participants yet?
    // Let's stick to showing what's in data + what's in config, merged.
    
    const configDivs = config.value.divisions || []
    
    // Merge unique
    list = [...new Set([...configDivs, ...list])]
    
    // 3. Sort
    return list.sort((a,b) => {
        const idxA = configDivs.indexOf(a)
        const idxB = configDivs.indexOf(b)
        
        // If both in config, sort by config order
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        
        // If A in config (and B not), A comes first
        if (idxA !== -1) return -1
        
        // If B in config (and A not), B comes first
        if (idxB !== -1) return 1
        
        // Fallback: Numeric/Alpha sort
        return String(a).localeCompare(String(b), undefined, { numeric: true })
    })
})

// Helper for Ranking & Export
const calculateScore = (row) => {
    const D = Number(row.difficulty_score) || 0
    const rawP = Number(row.presentation_score) || 0; const P = rawP * 0.05
    
    const reMisses = Number(row.re_score)||0; const Q = Math.max(0, 1 - (reMisses * 0.025))
    
    const rawMisses = Number(row.misses)||0
    const rawBreaks = Number(row.breaks)||0
    const rawViolations = Number(row.space_violation)||0
    
    const m = (0.05 * Math.min(rawMisses, 1)) + (0.075 * Math.max(0, Math.min(rawMisses - 1, 1))) + (0.10 * Math.max(0, rawMisses - 2));
    const b = rawBreaks * 0.05;
    const v = rawViolations * 0.05;
    const M = Math.max(0, 1 - (m + b + v));
    
    const R = D * (1 + P) * Q * M
    return Math.trunc(R * 100) / 100
}

const sortedData = computed(() => {
    let data = fullData.value

    // 1. FILTER
    // Filter by active view (speed/freestyle events)
    data = data.filter(r => {
        const isFreestyleEvent = ['SRIF','SRPF','SRTF','DDIF','DDPF','DDTF'].includes(r.event)
        // Also exclude SYSTEM rows
        if (r.entry_code === '0' || r.entry_code === 0 || r.name === 'SYSTEM') return false;
        
        return (activeView.value === 'speed' && !isFreestyleEvent) || (activeView.value === 'freestyle' && isFreestyleEvent)
    })

    if (filterEvent.value) data = data.filter(d => d.event === filterEvent.value)
    if (filterDivision.value) data = data.filter(d => d.division === filterDivision.value)
    if (filterHeat.value) data = data.filter(d => String(d.heat) === String(filterHeat.value))
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        data = data.filter(d => 
            String(d.entry_code).toLowerCase().includes(q) || 
            String(d.name).toLowerCase().includes(q) ||
            String(d.team).toLowerCase().includes(q)
        )
    }

    // 2. CALCULATE RANKS (Grouped by Event + Division)
    // We must calculate ranks for EVERY group, then flatten.
    const groups = {}
    data.forEach(r => {
        const key = `${r.event}|${r.division}`
        if (!groups[key]) groups[key] = []
        groups[key].push(r)
    })

    const allProcessed = []
    Object.keys(groups).forEach(key => {
        const groupData = groups[key]
        
        // Helper to get score for ranking
        const getRankVal = (row) => {
            if (activeView.value === 'freestyle') return calculateScore(row); // Use helper
            // Speed: Deduct 10 for False Start
            let s = Number(row.score) || 0
            if (row.false_start === true || String(row.false_start).toLowerCase() === 'yes') s -= 10
            return s
        }
        
         // Store Final Score for rendering
        groupData.forEach(row => { row.finalScore = getRankVal(row) })

        const hasValidScore = (row) => {
            if (row.status === 'scratch' || row.status === 'dq' || row.status === 'rejump') return false
            if (activeView.value === 'freestyle') return (Number(row.difficulty_score) || 0) > 0
            return row.score != null && row.score !== ''
        }

        const toRank = groupData.filter(r => hasValidScore(r))
        const noRank = groupData.filter(r => !hasValidScore(r))

        toRank.sort((a,b) => getRankVal(b) - getRankVal(a))

        let lastScore = null
        let lastPlace = 0
        toRank.forEach((row, index) => {
            const score = getRankVal(row)
            if (score !== lastScore) lastPlace = index + 1
            row.assignedPlace = lastPlace // Numeric rank for sorting
            lastScore = score
        })
        
        // TIE HANDLER
        const placeCounts = {}
        toRank.forEach(r => placeCounts[r.assignedPlace] = (placeCounts[r.assignedPlace] || 0) + 1)
        
        toRank.forEach(r => {
            if (placeCounts[r.assignedPlace] > 1) {
                r.displayPlace = `${r.assignedPlace} T`
            } else {
                r.displayPlace = r.assignedPlace
            }
        })
        
        noRank.forEach(r => { 
            r.assignedPlace = 99999
            r.displayPlace = '-' 
        })
        
        allProcessed.push(...toRank, ...noRank)
    })

    data = allProcessed

    // 3. FINAL SORT FOR DISPLAY
    // If Filtered by Event & Division (Leaderboard Mode)
    if (filterEvent.value && filterDivision.value && !filterHeat.value) {
         data.sort((a, b) => {
            // Rank First
            const pA = a.assignedPlace
            const pB = b.assignedPlace
            if (pA !== pB) return pA - pB

            // Unranked Tiering: DQ (1) < Scratch (2)
            const getStatWeight = (s) => (s === 'dq' ? 1 : (s === 'scratch' ? 2 : 0))
            const wA = getStatWeight(a.status)
            const wB = getStatWeight(b.status)
            if (wA !== wB) return wA - wB
            
            // Numeric Entry Code Sort
            return String(a.entry_code).localeCompare(String(b.entry_code), undefined, { numeric: true })
         })
    } else {
        // Browsing Mode: Entry > Event > Division
        data.sort((a,b) => {
             // Numeric Entry Code Sort
             const entrySort = String(a.entry_code).localeCompare(String(b.entry_code), undefined, { numeric: true })
             if (entrySort !== 0) return entrySort
             
             if (a.event !== b.event) return String(a.event||"").localeCompare(String(b.event||""))
             if (a.division !== b.division) return String(a.division||"").localeCompare(String(b.division||""))
             return (Number(a.heat)||0) - (Number(b.heat)||0)
        })
    }

    return data
})

// --- ACTIONS ---
const handleAction = async (row, action, event) => {
    // Reset the dropdown visually immediately
    if (event && event.target) {
        // Find the 'correct' value to show based on current row status
        // If action was edit_score, status didn't change yet.
        // If action was reset, status WILL change, but we can set it to 'normal' speculatively or let Vue update? 
        // Vue's :selected handles re-render, but manual change confuses it.
        // Best approach: Blur it to lose focus, and set value back to binding.
        event.target.value = row.status || 'normal'
        event.target.blur()
    }

    if (action === 'edit_score') {
        openInlineEdit(row, activeView.value)
        return
    }

    // if (!confirm(`Are you sure you want to set status to ${action.toUpperCase()} for ${row.entry_code}?`)) return

    try {
        // Update Participant Status
        const statusUpdate = { status: action === 'reset' ? 'normal' : action }
        
        // If resetting or rejumping, we must also reset the individual judge flags
        if (action === 'reset' || action === 'rejump') {
            statusUpdate.status_difficulty = false
            statusUpdate.status_technical = false
            statusUpdate.status_presentation = false
            statusUpdate.status_re = false
        }

        // Use stored path (since it can be in any station subcollection)
        await updateDoc(doc(db, row._path), statusUpdate)
        
        // If Rejump/Reset -> Wipe Result
        if (['rejump', 'reset', 'dq'].includes(action)) {
             const coll = activeView.value === 'speed' ? 'results_speed' : 'results_freestyle'
             // Find result doc to delete
             const q = query(collection(db, coll), where("entry_code", "==", row.entry_code))
             const snap = await getDocs(q)
             const batch = writeBatch(db)
             snap.forEach(doc => batch.delete(doc.ref))
             
             // ALSO WIPE LIVE BOARD IF IT EXISTS
             const sId = String(row.station || '')
             if (sId) {
                batch.delete(doc(db, 'live_scores', sId))
             }

             await batch.commit()
        }
    } catch(err) {
        alert("Error: " + err.message)
    }
}

    async function exportTeamResults() {
        console.log("[Admin] Team Export started...");
        const eventName = filterEvent.value;
        const divName = filterDivision.value;

        if (!eventName) {
            alert("Please select an Event first.");
            return;
        }
        
        // Use fullData because live logic already has integrated names/scores
        let sourceData = fullData.value;

        // 1. Filter by current selection (limited by Event/Div)
        let filtered = sourceData.filter(r => r.event === eventName);
        if (divName) {
            filtered = filtered.filter(r => r.division === divName);
        }

        if (filtered.length === 0) {
            alert("No data found for this selection.");
            return;
        }

        // 2. Group by Team
        const groupsByTeam = {};
        filtered.forEach(r => {
            const team = r.team || "Independent / Unknown";
            if (!groupsByTeam[team]) groupsByTeam[team] = [];
            groupsByTeam[team].push(r);
        });

        // 3. Sub-sort within each team group
        const teamNames = Object.keys(groupsByTeam).sort();
        teamNames.forEach(team => {
            groupsByTeam[team].sort((a, b) => (a.division || "").localeCompare(b.division || ""));
        });

        // 4. Generate PDF
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text("TEAM SUMMARY RESULTS", 105, 20, { align: "center" });
        doc.setFontSize(14);
        doc.text(`${eventName} • ${divName || "All Divisions"}`, 105, 30, { align: "center" });
        doc.line(15, 35, 195, 35);

        let y = 45;
        teamNames.forEach((team, idx) => {
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(70, 51, 245);
            doc.text(`TEAM: ${team}`, 15, y);
            y += 8;
            doc.setTextColor(0);

            groupsByTeam[team].forEach(r => {
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                
                // Name construction
                const names = [r.name1, r.name2, r.name3, r.name4].filter(n => n).join(", ") || r.name;
                
                doc.text(`• ${names}`, 20, y);
                doc.text(`${r.division}`, 120, y);
                
                // Calculate score if missing (helper usually available or logic inline)
                // Calculate score if missing
                 let score = r.finalScore;
                 if(score == null) {
                     if (activeView.value === 'freestyle') score = calculateScore(r)
                     else {
                         score = r.score
                         if (r.false_start === true || String(r.false_start).toLowerCase() === 'yes') {
                             score = (Number(score)||0) - 10
                         }
                     }
                 }

                doc.setFont("helvetica", "bold");
                doc.text(`Score: ${parseFloat(score || 0).toFixed(2)}`, 170, y);
                y += 6;
                if (y > 275) { doc.addPage(); y = 20; }
            });
            y += 8;
        });

        doc.save(`${eventName}_Team_Results.pdf`);
    }

const wipeAllData = async () => {
    if(!confirm("DANGER: You are about to DELETE ALL SCORES permanently.\n\nThis action CANNOT BE UNDONE.\n\nAre you sure?")) return

    const pass = prompt("To confirm, type 'DELETE':")
    // Legacy quirk: asks for DELETE but expects 123
    if (pass !== "123") {
        alert("Wipe cancelled. Incorrect confirmation code.")
        return
    }

    // Wipe Results Collections
    try {
        const batch1 = writeBatch(db)
        const sSnap = await getDocs(collection(db, 'results_speed'))
        sSnap.forEach(doc => batch1.delete(doc.ref))
        await batch1.commit()

        const batch2 = writeBatch(db)
        const fSnap = await getDocs(collection(db, 'results_freestyle'))
        fSnap.forEach(doc => batch2.delete(doc.ref))
        await batch2.commit()
        
        // Reset Participants
        // LEGACY: Force reset ALL participants to 'normal' (remove 'scratch', 'rejump', 'dq', 'done', etc.)
        // MIGRATE: Use collectionGroup to find all entries in all stations
        const pSnap = await getDocs(collectionGroup(db, "entries"))
        const batch3 = writeBatch(db)
        let count = 0
        pSnap.forEach(doc => {
             // Only update if not already normal to save writes? No, force it to be safe.
             batch3.update(doc.ref, { 
                 status: 'normal',
                 status_difficulty: false,
                 status_technical: false,
                 status_presentation: false,
                 status_re: false
             })
             count++
             if (count >= 490) { // Safety for batch limit (500)
                 // In a real app we'd handle multiple batches, but for this event size 500 is likely enough.
                 // If > 500, we'd need loop management.
             }
        })
        await batch3.commit()

        // Broadcast
        await setDoc(doc(db, "broadcasts", "latest"), {
            type: 'wipe_all',
            timestamp: serverTimestamp()
        })

        alert("System Cleaned. All results wiped & Clients reset.")
        window.location.reload()
    } catch(err) {
        alert("Wipe Failed: " + err.message)
    }
}

// --- INLINE EDIT (Variable Logic) ---
const openInlineEdit = (row, type, event) => {
    if (type === 'freestyle') {
        openFreestyleEditor(row)
        return
    }

    // Speed: Simple input
    editState.active = true
    editState.row = row
    editState.type = type
    editState.val = row.score || ''

    // Position (Mock placement, ideally event target relative)
    if (event && event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect()
        // Center the editor on the center of the clicked cell
        editState.x = rect.left + (rect.width / 2)
        editState.y = rect.top + (rect.height / 2)
    } else {
        // Fallback or Action Menu Trigger
        editState.x = window.innerWidth / 2
        editState.y = window.innerHeight / 2
    }
    
    nextTick(() => {
        if(scoreInput.value) {
            scoreInput.value.focus()
            scoreInput.value.select()
        }
    })
}

const closeInline = () => { editState.active = false; editState.row = null }
const saveInline = async () => {
    if(!editState.row) return
    const val = Number(editState.val) // 0 is valid, but maybe we want to allow null?
    if(isNaN(val)) return alert("Invalid number")
    if(val > 999) return alert("Score limit exceeded (max 3 digits)")

    try {
        if (editState.row.result_id) {
             await updateDoc(doc(db, 'results_speed', editState.row.result_id), { score: val })
        } else {
             await addDoc(collection(db, 'results_speed'), { 
                entry_code: editState.row.entry_code,
                score: val,
                judge_key: 'admin',
                created_at: serverTimestamp()
             })
        }
        closeInline()
    } catch(e) {
        alert(e.message)
    }
}

// --- FREESTYLE EDITOR MODAL ---
const fsEditState = reactive({ active: false, row: null, diff: 0, pres: 0, re: 0, miss: 0, break: 0, space: 0 })

const openFreestyleEditor = (row) => {
    fsEditState.row = row
    fsEditState.diff = row.difficulty_score || 0
    fsEditState.pres = row.presentation_score || 0
    fsEditState.re = row.re_score || 0
    fsEditState.miss = row.misses || 0
    fsEditState.break = row.breaks || 0
    fsEditState.space = row.space_violation || 0
    fsEditState.active = true
}

const closeFreestyleEditor = () => { fsEditState.active = false; fsEditState.row = null }

const saveFreestyleEditor = async () => {
    if (!fsEditState.row) return
    
    // Recalculate Score logic locally to verify
    // R = D * (1 + P) * Q * M
    const D = Number(fsEditState.diff) || 0
    const rawP = Number(fsEditState.pres) || 0; const P = rawP * 0.05
    
    const reMisses = Number(fsEditState.re)||0; const Q = Math.max(0, 1 - (reMisses * 0.025))
    
    const rawMisses = Number(fsEditState.miss)||0
    const rawBreaks = Number(fsEditState.break)||0
    const rawViolations = Number(fsEditState.space)||0
    
    const m = (0.05 * Math.min(rawMisses, 1)) + (0.075 * Math.max(0, Math.min(rawMisses - 1, 1))) + (0.10 * Math.max(0, rawMisses - 2));
    const b = rawBreaks * 0.05;
    const v = rawViolations * 0.05;
    const M = Math.max(0, 1 - (m + b + v));
    
    const R = D * (1 + P) * Q * M
    const finalScore = Math.trunc(R * 100) / 100 // Truncate 2 decimals

    const payload = {
        difficulty_score: D,
        presentation_score: rawP,
        re_score: reMisses, // Admin doc stores MISSES directly
        misses: rawMisses,
        breaks: rawBreaks,
        space_violation: rawViolations,
        score: finalScore,
        judge_type: 'admin', // Force Admin Type
        entry_code: fsEditState.row.entry_code,
        judge_key: 'admin'
    }
    
    try {
        // Find existing ADMIN record for this entry
        const q = query(
            collection(db, 'results_freestyle'), 
            where('entry_code', '==', fsEditState.row.entry_code),
            where('judge_type', '==', 'admin'),
            limit(1)
        )
        const snap = await getDocs(q)
        
        if (!snap.empty) {
             // Overwrite existing Admin Doc
             await updateDoc(doc(db, 'results_freestyle', snap.docs[0].id), payload)
        } else {
             // Create New Admin Doc
             await addDoc(collection(db, 'results_freestyle'), {
                 ...payload,
                 created_at: serverTimestamp()
             })
        }
        closeFreestyleEditor()
    } catch(e) {
        alert("Save failed: " + e.message)
    }
}

// Helpers

const formatDed = (r) => {
    if (!r) return ''
    if (r.misses == null || r.misses === undefined) return ''
    const rawMisses = parseFloat(r.misses) || 0
    const rawBreaks = parseFloat(r.breaks) || 0
    const rawViolations = parseFloat(r.space_violation) || 0

    // M: Deduction Factor
    const m = (0.05 * Math.min(rawMisses, 1)) +
        (0.075 * Math.max(0, Math.min(rawMisses - 1, 1))) +
        (0.10 * Math.max(0, rawMisses - 2));

    const b = rawBreaks * 0.05;
    const v = rawViolations * 0.05;

    const M = Math.max(0, 1 - (m + b + v));

    return M.toFixed(2)
}

const formatNum = (v) => (v !== null && v !== undefined && v !== '') ? Number(v).toFixed(2) : ''
const formatPres = (v) => (v !== null && v !== undefined && v !== '') ? (Math.trunc((1 + (Number(v) * 0.05)) * 100) / 100).toFixed(2) : ''
const formatRe = (v) => (v !== null && v !== undefined && v !== '') ? (Math.trunc(Math.max(0, 1 - (Number(v) * 0.025)) * 100) / 100).toFixed(2) : ''

// --- EXPORT PDF ---


// --- EXPORT PDF ---
const exportModalOpen = ref(false)

const openExportModal = () => {
    if (!filterEvent.value) return alert("Please select an Event first.")
    exportModalOpen.value = true
}

const closeExportModal = () => { exportModalOpen.value = false }



const exportPDF = async (isOfficial = false) => {
    try {
    closeExportModal()
    const doc = new jsPDF()
    // Using centralized config from constants.js
    
    // Get Data for this Event, grouped by Division (Order determined by filter dropdown which is sorted!)
    const eventName = filterEvent.value
    const data = sortedData.value // SortedData ALREADY filtered by event if selected, but safeguard:
        .filter(r => r.event === eventName)

    if (data.length === 0) return alert("No data to export.")

    // Group
    const groups = {}
    data.forEach(r => {
        if(!groups[r.division]) groups[r.division] = []
        groups[r.division].push(r)
    })

    // Sort Divisions (Using same logic as dropdown - Alpha/Gender/Age)
    // For now we use the keys of groups which are seemingly random or insertion order. 
    // Ideally we iterate `distinctDivisions` and pick those that exist.
    const divisions = distinctDivisions.value.filter(d => groups[d])
    
    let firstPage = true
    
    // Load Logo
    let logoBase64 = null
    let logoRatio = 1
    try {
        const logoImg = await new Promise((resolve) => {
            const img = new Image()
            img.src = COMPETITION_LOGO
            img.onload = () => resolve(img)
            img.onerror = () => resolve(null)
        })
        if(logoImg) {
            const canvas = document.createElement("canvas")
            canvas.width = logoImg.width; canvas.height = logoImg.height
            const ctx = canvas.getContext("2d"); ctx.drawImage(logoImg,0,0)
            logoBase64 = canvas.toDataURL("image/png")
            // Calc Aspect Ratio
            if (logoImg.height > 0) logoRatio = logoImg.width / logoImg.height
        }
    } catch(e) { console.warn("Logo load failed",e) }

    // Generate Icon Data URL (Once)
    let iconDataUrl = null
    try {
        const icon = faCircleUser.icon
        const [ w, h, , , path ] = icon
        const canvas = document.createElement('canvas')
        canvas.width = 64; canvas.height = 64
        const ctx = canvas.getContext('2d')
        const scale = 64 / Math.max(w, h)
        ctx.scale(scale, scale)
        const p = new Path2D(path)
        ctx.fillStyle = "#1e293b" // Match Header Color (Slate-800)
        ctx.fill(p)
        iconDataUrl = canvas.toDataURL('image/png')
    } catch (e) { console.warn("Icon gen failed", e) }

    for (const divName of divisions) {
         // Ensure rows are sorted by Rank (Place) for the PDF
         const divData = groups[divName].sort((a, b) => {
            const pA = a.assignedPlace || 99999
            const pB = b.assignedPlace || 99999
            if (pA !== pB) return pA - pB

            // Tiering: DQ < Scratch
            const getStatWeight = (s) => (s === 'dq' ? 1 : (s === 'scratch' ? 2 : 0))
            const wA = getStatWeight(a.status)
            const wB = getStatWeight(b.status)
            if (wA !== wB) return wA - wB
            
            return String(a.entry_code).localeCompare(String(b.entry_code), undefined, { numeric: true })
         })
         
         if (!firstPage) doc.addPage()
         firstPage = false
         
         // HEADER
         if(logoBase64) {
             // Fit within Box 20x20
             let w = 20; let h = 20;
             if (logoRatio > 1) { h = 20 / logoRatio } // Wider
             else { w = 20 * logoRatio } // Taller
             doc.addImage(logoBase64, 'PNG', 15, 10, w, h)
         }
         doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(config.value.title, 40, 18)
         doc.setFontSize(11); doc.text(eventName, 195, 18, { align: 'right' })
         
         doc.setFontSize(10); doc.setFont("helvetica", "normal")
         doc.text(isOfficial ? "Official Results" : "Unofficial Results", 40, 26)
         
         if (isOfficial) {
             doc.rect(160, 21, 35, 6)
             doc.setFontSize(9); doc.setFont("helvetica", "bold")
             // X=177.5 (Center of 160+35), Y=24 (Center of 21+6)
             doc.text("Verified Results", 177.5, 24, { align: "center", baseline: "middle" })
         }
         
         doc.line(15, 33, 195, 33)
         doc.setFontSize(10); doc.setFont("helvetica", "bold")
         doc.text(`Event: ${getEventLabel(eventName)}`, 15, 40)
         doc.text(`Division: ${divName}`, 100, 40)
         
         // TABLE
         let head = []
         let body = []
         
         if (activeView.value === 'speed') {
            // REMOVED 'False Start' column as requested
            head = [['Place', 'Name', 'Team', 'Final Score', 'Remark']]
            body = divData.map(r => {
                // Logic: If no specific status (scratch/dq/rejump) and score is missing/null/0 (if 0 is invalid?), leave blank
                // Actually 0 might be a valid score. We should check if result exists.
                // In our data model, if no result, score is undefined or null.
                
                let scoreDisplay = ''
                let placeDisplay = r.displayPlace || ''

                if (r.status === 'scratch') scoreDisplay = 'SCRATCH'
                else if (r.status === 'dq') scoreDisplay = 'DQ'
                else if (r.status === 'rejump') scoreDisplay = 'RE-JUMP'
                else if (r.result_id) scoreDisplay = r.finalScore // Only show score if result exists (avoids 0 from ranking logic)

                // If scoreDisplay is still empty string, it means no result. Clear place too.
                if (scoreDisplay === '') placeDisplay = ''
                
                return [
                placeDisplay,
                [r.name1,r.name2,r.name3,r.name4].filter(n=>n).join("\n"),
                r.team,
                scoreDisplay, // Show ONLY final score (deducted)
                r.remark || ''
            ]})
         } else {
            head = [['Place', 'Name', 'Team', 'Final Score', 'Diff', 'Pres', 'Req.El', 'Deduc']]
            body = divData.map(r => {
                let scoreDisplay = ''
                let placeDisplay = r.displayPlace || ''

                if (r.status === 'scratch') scoreDisplay = 'SCRATCH'
                else if (r.status === 'dq') scoreDisplay = 'DQ'
                else if (r.status === 'rejump') scoreDisplay = 'RE-JUMP'
                else if (r.result_id) scoreDisplay = formatNum(r.finalScore)

                // If scoreDisplay is still empty string, it means no result. Clear place too.
                if (scoreDisplay === '') placeDisplay = ''

                // Only show sub-scores if result exists (using result_id check for consistency)
                const show = (val, fmtFn) => (r.result_id && !['dq','scratch','rejump'].includes(r.status)) ? fmtFn(val) : ''

                return [
                placeDisplay,
                [r.name1,r.name2,r.name3,r.name4].filter(n=>n).join("\n"),
                r.team,
                scoreDisplay,
                show(r.difficulty_score, formatNum),
                show(r.presentation_score, formatPres),
                show(r.re_score, formatRe),
                show(r.misses, () => formatDed(r)), // formatDed uses whole row, but logic inside relies on properties
            ]})
         }
         
         autoTable(doc, {
            head: head,
            body: body,
            startY: 45,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 1, valign: 'middle', overflow: 'linebreak', halign: 'center', textColor: [0, 0, 0] },
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
            rowPageBreak: 'avoid',
            columnStyles: activeView.value === 'speed' ? {
                0: { cellWidth: 12 }, // Place
                1: { halign: 'left', cellWidth: 65, cellPadding: { top: 1, right: 1, bottom: 1, left: 6 } }, // Name (Extra left padding for icon)
                2: { halign: 'left', cellWidth: 40 }, // Team
                3: { cellWidth: 25 }, // Final Score
            } : {
                0: { cellWidth: 12 }, // Place
                1: { halign: 'left', cellWidth: 55, cellPadding: { top: 1, right: 1, bottom: 1, left: 6 } }, // Name (Extra left padding for icon)
                2: { halign: 'left', cellWidth: 35 }, // Team
                3: { cellWidth: 18 }, // Final Score
                4: { cellWidth: 14 }, // Diff
                5: { cellWidth: 14 }, // Pres
                6: { cellWidth: 14 }, // Req.El
                7: { cellWidth: 14 }, // Ded
            },
            didDrawCell: (data) => {
                // Hook to draw custom icon in the Name column (index 1) which may have multiple lines
                if (data.section === 'body' && data.column.index === 1 && iconDataUrl) {
                    const doc = data.doc;
                    const cell = data.cell;
                    
                    // Retrieve original data to know REAL names (ignoring line wrapping)
                    const rowData = divData[data.row.index];
                    if (!rowData) return;

                    const rawNames = [rowData.name1, rowData.name2, rowData.name3, rowData.name4].filter(n => n && n.trim());
                    if (rawNames.length === 0) return;

                    // Calculate Dimensions
                    const fontSizePt = cell.styles.fontSize;
                    // FIX: Set font size on doc so splitTextToSize uses correct metrics
                    doc.setFontSize(fontSizePt);
                    // AutoTable uses default helvetica/normal usually unless overridden, but let's sync if possible
                    // Note: cell.styles.font might be 'helvetica', fontStyle 'normal'
                    // Safety check if styles exist
                    if(cell.styles.font) {
                       try { doc.setFont(cell.styles.font, cell.styles.fontStyle) } catch(e){}
                    }

                    const lineHeightFactor = doc.getLineHeightFactor();
                    const lineHeightMm = fontSizePt * lineHeightFactor * 0.352778; // 1pt = 0.3528mm
                    const iconSize = 3; 

                    // Available Width for Text (Cell Width - Padding)
                    // We defined padding: left=6, right=1. 
                    // Column width is defined in columnStyles (65 for speed, 55 for freestyle)
                    // It's safer to use cell.width - padding
                    const paddingLeft = cell.padding('left'); 
                    const paddingRight = cell.padding('right');
                    const textWidth = cell.width - paddingLeft - paddingRight;

                    // Calculate Vertical Start (Middle Alignment)
                    const totalRenderedLines = cell.text.length;
                    const contentHeight = totalRenderedLines * lineHeightMm;
                    const startY = cell.y + (cell.height - contentHeight) / 2;

                    let currentNameIndex = 0;

                    cell.text.forEach((line, i) => {
                        if (currentNameIndex >= rawNames.length) return;

                        const cleanLine = String(line).trim();
                        if (!cleanLine) return; // Skip empty lines

                        const targetName = String(rawNames[currentNameIndex]).trim();
                        
                        // CHECK: Does this line look like the START of the current expected name?
                        // We use startsWith because the line might be the WHOLE name or just the FIRST PART (wrapped).
                        // We verify length to avoid matching very short fragments falsely if possible, but startsWith is usually enough.
                        // Case insensitive just to be safe, though usually casing is preserved.
                        if (targetName.toLowerCase().startsWith(cleanLine.toLowerCase())) {
                            
                            // It's a MATCH! This line is the start of the new name.
                            // Draw Icon
                            const lineMidY = startY + (i * lineHeightMm) + (lineHeightMm / 2);
                            const iconY = lineMidY - (iconSize / 2);
                            doc.addImage(iconDataUrl, 'PNG', cell.x + 2, iconY, iconSize, iconSize);

                            // Advance to next name
                            currentNameIndex++;
                        }
                        // If NO match, we assume this 'line' is a wrapped continuation of the PREVIOUS name.
                        // We do nothing, and keep 'currentNameIndex' same to wait for the next real name start.
                    });
                }
            },
            didParseCell: (data) => {
                if (data.section === 'body') {
                    // Place styling
                    if (data.column.index === 0) {
                         // Parse "1 T" -> 1
                         const rankStr = String(data.cell.text[0])
                         const rankVal = parseInt(rankStr)
                         
                         // Bold Top 5
                         if (rankVal <= 5) data.cell.styles.fontStyle = 'bold'
                         
                         if (rankVal === 1) data.cell.styles.fillColor = [255, 215, 0] // Gold
                         else if (rankVal === 2) data.cell.styles.fillColor = [192, 192, 192] // Silver
                         else if (rankVal >= 3 && rankVal <= 5) data.cell.styles.fillColor = [205, 127, 50] // Bronze (3-5)
                    }
                    // Status Styling (Red for DQ/Scratch)
                    if (data.column.index === 3) { // Final Score Column
                        const val = data.cell.text[0]
                        if (val === 'RE-JUMP') {
                            data.cell.styles.textColor = [249, 115, 22] // Orange
                            data.cell.styles.fontStyle = 'bold'
                        }
                    }
                }
            }
         })
    }
    
    // Filename: [Official/Unofficial]_[Full Event Name]
    const fullEventName = getEventLabel(eventName)
    const status = isOfficial ? 'Official' : 'Unofficial'
    doc.save(`${status}_${fullEventName}.pdf`)
    
    } catch (err) {
        console.error(err)
        alert("PDF Export Failed: " + err.message)
    }
}

// --- BROADCAST ---
const sendAlert = async () => {
    if(!broadcastMsg.value) return
    await setDoc(doc(db, 'broadcasts', 'latest'), {
        type: 'alert',
        message: broadcastMsg.value,
        timestamp: serverTimestamp()
    })
    broadcastMsg.value = ''
}

const forceRefresh = async () => {
    if(!confirm("Force reload all stations?")) return
    await setDoc(doc(db, 'broadcasts', 'latest'), {
        type: 'reload',
        timestamp: serverTimestamp()
    })
}

const sendForceLogout = async () => {
    if(!confirm("🚨 FORCE LOGOUT ALL JUDGES?\n\nActive judges will see a warning and be logged out after their next submission.")) return
    await setDoc(doc(db, 'broadcasts', 'latest'), {
        type: 'force_logout',
        timestamp: serverTimestamp()
    })
}




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

/* REMOVED height: auto to maintain fixed viewport on tablets */
/* @media (max-width: 1024px) {
    .admin-layout {
        height: auto;
        min-height: 100vh;
        overflow: auto;
    }
} */

/* HEADER */

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
/* NAV / COMMAND BAR - Updated to Pill Design */
.nav-bar {
    display: flex;
    justify-content: space-between; /* Spread filters and actions */
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
    margin-left: auto; /* Push to right */
    margin-right: 1rem; /* Space before status */
    
    /* PILL CONTAINER */
    background: #1e293b;
    padding: 0.25rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-link {
    background: transparent;
    border: none;
    color: #94a3b8;
    padding: 0.5rem 1rem; /* Button padding */
    border-radius: 999px; /* Pill buttons */
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
    min-height: 0; /* Crucial for scrolling inside flex container */
}
.table-scroll-container { flex: 1; overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.data-table th { 
    background: #0f172a; 
    position: sticky; 
    top: 0; 
    padding: 1rem; 
    text-align: left; 
    font-size: 0.75rem; 
    color: #94a3b8; 
    font-weight: 800; 
    text-transform: uppercase;
    border-bottom: 2px solid #334155;
    z-index: 5;
}
.data-table td { padding: 0.85rem 1rem; border-bottom: 1px solid #334155; font-size: 0.9rem; color: #f1f5f9; }
.data-table tr:hover td { background: #334155; transition: background 0.1s; }

.text-white { color: white !important; }
.text-gray-400 { color: #94a3b8 !important; }
.text-muted { color: #64748b !important; }
.text-indigo-400 { color: #818cf8 !important; }

.badge-status { padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 0.65rem; text-transform: uppercase; }
.badge-rejump { 
    background: transparent; 
    color: #f97316; /* Orange-500 */
    border: 1px solid #f97316; 
    text-transform: none; /* Override uppercase */
    padding: 3px 10px;
    font-size: 0.8rem;
    border-radius: 6px;
}
.badge-scratch { background: #334155; color: #94a3b8; border: 1px solid #475569; }
.badge-dq { background: #7f1d1d; color: #fca5a5; border: 1px solid #fca5a5; }

/* Actions Select */
.action-select { 
    background: #0f172a; 
    border: 1px solid #334155; 
    color: #cbd5e1; 
    font-size: 0.75rem; 
    border-radius: 4px; 
    padding: 4px; 
    width: 100%;
    cursor: pointer;
}
.action-select:hover { border-color: #64748b; }

.footer { padding: 1.5rem 2rem; color: #64748b; font-size: 0.8rem; border-top: 1px solid #334155; background: #0f172a; }

/* INLINE EDITOR & MODALS */
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

/* MENU STYLES */
.menu-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start; /* Move up */
    padding: 2rem;
    padding-top: 8vh; /* Push down slightly from very top, but higher than center */
    animation: fadeIn 0.3s ease;
}

.menu-title {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 2rem;
    color: #f1f5f9;
    text-transform: uppercase;
    letter-spacing: -1px;
    text-align: center;
}

.event-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
    width: 100%;
    max-width: 1200px;
}

.event-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0.75rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.event-card:hover {
    transform: translateY(-4px);
    background: #334155;
    border-color: #3b82f6;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
}

.event-card:active {
    transform: translateY(0);
}

.event-code {
    font-size: 1.5rem;
    font-weight: 900;
    color: #facc15;
}

.event-name {
    font-size: 0.9rem;
    color: #94a3b8;
    font-weight: 600;
    line-height: 1.4;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* UTILITIES */
.w-64 { width: 16rem; }
.w-48 { width: 12rem; }
.w-24 { width: 6rem; }
.text-center { text-align: center !important; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.gap-1 { gap: 0.25rem; }
.leading-tight { line-height: 1.25; }
.ml-1 { margin-left: 0.25rem; }

/* BOUTIQUE DASHBOARD REDESIGN */
.dashboard-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: 2rem 3rem;
    min-height: 0; /* Important for flex child */
    overflow-y: auto; /* Enable scrolling */
}

.dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Equal width */
    /* Removed grid-template-rows: 1fr to allow content to define height */
    gap: 2rem;
    flex: 1;
    min-height: 0;
    align-items: start; /* Align to top so they don't stretch unnecessarily if one is short */
}

.dashboard-col {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

@media (max-width: 1100px) {
    .dashboard-grid { grid-template-columns: 1fr; }
    
    /* Responsive Header: Unlock absolute centering */
    .nav-links {
        position: static;
        transform: none;
        left: auto;
        margin: 0 1rem;
        gap: 1rem;
    }
    
    .header {
        gap: 1rem;
    }
    
    .brand {
        max-width: none;
        flex-shrink: 1; /* Allow brand to shrink */
    }
    
    .brand h1 {
        font-size: 1.1rem; /* Smaller title */
        white-space: normal; /* Allow wrapping if really needed */
        overflow: visible;
    }
    
    /* Stack Security Grid on smaller tablets */
    .security-grid {
        grid-template-columns: 1fr;
    }
}

.glass-card {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.3));
    backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 28px;
    padding: 2rem;
    position: relative;
    box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: visible; /* Allow content to flow out if needed, though usually contained */
    min-height: 100%; /* Allow growth, but ensure at least full height of grid cell */
}

.glass-card:hover { 
    border-color: rgba(255, 255, 255, 0.15);
}

.glass-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top left, rgba(255,255,255,0.03), transparent 70%);
    pointer-events: none;
}


/* LAUNCHPAD SECURITY GRID */
.security-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    height: 100%;
}

.action-card {
    display: flex;
    flex-direction: column;
    align-items: center; /* Centered */
    justify-content: center;
    text-align: center; /* Centered text */
    padding: 2rem;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.05);
    background: rgba(30, 41, 59, 0.4);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    gap: 1rem;
}

@media (hover: hover) {
    .action-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        background: #475569; color: white;
    }
    .action-card:hover .icon-circle { background: rgba(255,255,255,0.15); }

    /* COLORS */
    .action-card.blue:hover { border-color: #3b82f6; }
    .action-card.blue:hover .icon-circle { color: #3b82f6; background: rgba(59, 130, 246, 0.2); }

    .action-card.orange:hover { border-color: #f97316; }
    .action-card.orange:hover .icon-circle { color: #f97316; background: rgba(249, 115, 22, 0.2); }

    .action-card.red:hover { 
        background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: white; 
    }
    .action-card.red:hover .icon-circle { background: #ef4444; color: white; }
}

.action-card:active { transform: scale(0.98); filter: brightness(1.1); }

.status-indicator {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    box-shadow: 0 0 10px currentColor;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
}

.icon-circle {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 12px rgba(255,255,255,0.05);
}

.status-icon-large {
    position: absolute;
    right: 0;
    top: -10px;
    opacity: 0.1;
    filter: drop-shadow(0 0 20px currentColor);
}

.status-section {
    border-color: rgba(255, 255, 255, 0.05);
}

.dashboard-textarea {
    width: 100%;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 1.75rem;
    color: white;
    font-size: 1.15rem;
    line-height: 1.7;
    resize: none;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: inset 0 4px 12px rgba(0,0,0,0.3);
}

.dashboard-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    background: rgba(15, 23, 42, 0.5);
    box-shadow: inset 0 4px 12px rgba(0,0,0,0.3);
}

.tag-btn {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    padding: 8px 16px; /* Reduced Padding */
    border-radius: 100px;
    font-size: 0.9rem; /* Slightly smaller font */
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
}

.quick-tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 1.5rem; /* Reduced Gap */
    margin-top: 1.5rem; /* Reduced Top Margin */
    margin-bottom: 1rem; /* Reduced Bottom Margin */
}

/* SIMPLIFIED HOST DASHBOARD */
.dashboard-single-card {
    display: flex; flex: 1; min-height: 0;
    max-width: 900px; margin: 0 auto; width: 100%;
}
.host-dashboard {
    flex: 1; display: flex; flex-direction: column;
    background: #1e293b; /* Solid slate-800 for clarity */
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 0; overflow: hidden;
}

.host-header {
    padding: 1.5rem 2rem;
    background: rgba(0,0,0,0.2);
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}
.host-title { margin: 0; color: white; font-size: 1.25rem; font-weight: 700; }
.host-subtitle { margin: 0; color: #94a3b8; font-size: 0.9rem; }

.live-badge {
    background: rgba(34, 197, 94, 0.1); color: #22c55e;
    padding: 6px 12px; border-radius: 99px; font-weight: 800; font-size: 0.75rem;
    display: flex; align-items: center; gap: 8px; letter-spacing: 1px;
}
.dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; }

.host-body { padding: 2rem; display: flex; flex-direction: column; gap: 2rem; overflow-y: auto; }
.section-title {
    display: block; color: #94a3b8; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;
    margin-bottom: 1rem;
}

/* COMPOSER */
.composer-container {
    display: flex; gap: 1rem; margin-bottom: 1.5rem;
}
.simple-input {
    flex: 1; background: white; border: none; border-radius: 8px;
    padding: 1rem; font-size: 1.1rem; color: #1e293b;
    font-family: inherit; resize: none;
}
.simple-input:focus { outline: 2px solid #3b82f6; }

.btn-transmit {
    background: #3b82f6; color: white; border: none; border-radius: 8px;
    padding: 0 1.5rem; font-weight: 800; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    transition: all 0.2s;
}
.btn-transmit:hover { background: #2563eb; }
.btn-transmit:disabled { opacity: 0.5; background: #94a3b8; cursor: not-allowed; }

/* PRESETS */
.presets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
.preset-card {
    background: #334155; border: none; color: white;
    padding: 1rem; border-radius: 12px;
    display: flex; align-items: center; gap: 10px;
    cursor: pointer; font-weight: 600; font-size: 0.9rem;
    transition: background 0.2s;
}
.preset-card:hover { background: #475569; }
.preset-card .emoji { font-size: 1.4rem; }
.preset-card.clear { background: rgba(239, 68, 68, 0.1); color: #fca5a5; }
.preset-card.clear:hover { background: rgba(239, 68, 68, 0.2); }

.host-divider { height: 1px; background: rgba(255,255,255,0.05); width: 100%; }


/* OPS ROW 4-COL */
.ops-row-4 { 
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
}

.ops-card-base {
    background: #334155; border-radius: 12px;
    padding: 1rem; border: 1px solid rgba(255,255,255,0.05);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; min-height: 80px;
}

/* 1. STATUS CARD (Lock) */
.status-card {
    justify-content: space-between; padding: 0 1.25rem;
}
.status-content { display: flex; flex-direction: column; }
.status-label { font-weight: 700; color: white; font-size: 0.95rem; }
.status-desc { font-size: 0.75rem; color: #94a3b8; }

.toggle-switch-ios {
    width: 44px; height: 26px; background: #cbd5e1; border-radius: 30px;
    position: relative; border: none; cursor: pointer; transition: 0.3s;
}
.toggle-switch-ios .knob {
    width: 22px; height: 22px; background: white; border-radius: 50%;
    position: absolute; top: 2px; left: 2px; transition: 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.toggle-switch-ios.active { background: #ef4444; }
.toggle-switch-ios.active .knob { transform: translateX(18px); }


/* ACTION CARDS (Refresh, Logout, Wipe) */
.action-card {
    flex-direction: column; gap: 8px; cursor: pointer; color: #cbd5e1; font-weight: 600; font-size: 0.85rem;
}
.action-card:hover { background: #475569; color: white; transform: translateY(-2px); }

.action-card .icon-circle {
    width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.05);
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
}
.action-card:hover .icon-circle { background: rgba(255,255,255,0.15); }

/* COLORS */
.action-card.blue:hover { border-color: #3b82f6; }
.action-card.blue:hover .icon-circle { color: #3b82f6; background: rgba(59, 130, 246, 0.2); }

.action-card.orange:hover { border-color: #f97316; }
.action-card.orange:hover .icon-circle { color: #f97316; background: rgba(249, 115, 22, 0.2); }

.action-card.red {
    border-color: rgba(239, 68, 68, 0.2); color: #fca5a5;
    background: rgba(239, 68, 68, 0.05);
}
.action-card.red:hover { 
    background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: white; 
}
.action-card.red:hover .icon-circle { background: #ef4444; color: white; }


@media (max-width: 900px) {
    .ops-row-4 { grid-template-columns: 1fr 1fr; }
}

.tag-btn:hover {
    border-color: rgba(255, 255, 255, 0.3);
}

.primary-action {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border: none;
    padding: 1.25rem 2rem;
    border-radius: 20px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
}


.primary-action:disabled { opacity: 0.3; cursor: not-allowed; pointer-events: none; }

.secondary-action {
    background: rgba(255, 255, 255, 0.05);
    color: #f1f5f9;
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 1.25rem 2rem;
    border-radius: 20px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.3s;
}

.secondary-action:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.3);
}

.pulse-ring {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    position: relative;
}

.status-toggle-btn {
    padding: 1.5rem;
    border-radius: 24px;
    font-weight: 900;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    cursor: pointer;
    border: 2px solid transparent;
}

.btn-lock {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
    border-color: rgba(239, 68, 68, 0.2);
}

.btn-lock:hover {
    background: #ef4444;
    color: white;
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 15px 30px -8px rgba(239, 68, 68, 0.6);
}

.btn-unlock {
    background: rgba(16, 185, 129, 0.1);
    color: #34d399;
    border-color: rgba(16, 185, 129, 0.2);
}

.btn-unlock:hover {
    background: #10b981;
    color: white;
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 15px 30px -8px rgba(16, 185, 129, 0.6);
}

.status-icon {
    position: absolute;
    right: 2rem;
    top: 2rem;
    opacity: 0.1;
    filter: drop-shadow(0 0 15px currentColor);
}

.security-action-btn {
    background: rgba(15, 23, 42, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 1.5rem;
    border-radius: 20px;
    cursor: pointer;
    text-align: left;
}

.security-action-btn:hover {
    background: rgba(239, 68, 68, 0.05);
    border-color: rgba(239, 68, 68, 0.3);
}
.ml-2 { margin-left: 0.5rem; }
.bg-green-500 { background-color: #22c55e; }
.bg-slate-800 { background-color: #1e293b; }
.border-slate-600 { border-color: #475569; }
.rounded { border-radius: 0.25rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.w-full { width: 100%; }

/* EXPORT MODAL STYLES */
.export-modal-card {
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border-radius: 24px;
    padding: 2.5rem;
    width: 100%;
    max-width: 420px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalPop {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

.export-icon-wrapper {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

.export-modal-card h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.025em;
}

.export-modal-card p {
    color: #94a3b8;
    font-size: 0.95rem;
    margin: 0 0 2rem 0;
    line-height: 1.5;
}

.export-actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    width: 100%;
    margin-bottom: 1.5rem;
}

.export-btn {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-radius: 9999px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    position: relative;
    overflow: hidden;
}

.export-btn:hover {
    transform: translateY(-2px);
}

.export-btn:active {
    transform: translateY(0);
}

.export-btn.unofficial {
    background: rgba(255,255,255,0.03);
    border-color: rgba(255,255,255,0.1);
    color: white;
}

.export-btn.unofficial:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.2);
}

.export-btn.official {
    background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
    box-shadow: 0 4px 12px rgba(250, 204, 21, 0.3);
    color: #0f172a;
    border: none;
    font-weight: 700;
}

.export-btn.official:hover {
    box-shadow: 0 8px 16px rgba(250, 204, 21, 0.4);
    filter: brightness(1.05);
}

.btn-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.unofficial .btn-icon {
    background: rgba(255,255,255,0.1);
}

.official .btn-icon {
    background: rgba(15, 23, 42, 0.1);
    color: #0f172a;
}

.btn-content {
    display: flex;
    flex-direction: column;
}

.btn-title {
    font-weight: 600;
    font-size: 1rem;
    color: white;
}

.official .btn-title {
    color: #0f172a;
    font-weight: 800;
}

.btn-desc {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.6);
}

.official .btn-desc {
    color: rgba(15, 23, 42, 0.7);
    font-weight: 500;
}

.cancel-link {
    background: none;
    border: none;
    color: #64748b;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: color 0.2s;
    padding: 0.5rem;
}

.cancel-link:hover {
    color: white;
    text-decoration: underline;
}
</style>
