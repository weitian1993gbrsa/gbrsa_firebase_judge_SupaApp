<template>
  <div class="key-manager-layout">
    <header class="header">
      <div class="brand">
        <div class="brand-text">
          <h1>Access Key Manager</h1>
        </div>
      </div>
      <div class="nav-links">
          <router-link to="/admin" class="nav-link">← Back to Admin Panel</router-link>
      </div>
    </header>

    <div class="dashboard-container px-8 pt-8 pb-8">
        <div class="glass-card" style="max-width: 1000px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 class="host-title">Access Keys</h3>
                <button @click="openKeyModal()" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
                   + Add Key
                </button>
            </div>

            <div class="table-scroll-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 25%;">Code (Password)</th>
                        <th style="width: 15%;">Role</th>
                        <th style="width: 10%;">Station</th>
                        <th style="width: 20%;">Event</th>
                        <th style="width: 15%;">Type</th>
                        <th style="width: 15%; text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="k in keysList" :key="k.id">
                        <td class="font-mono font-bold text-white">{{ k.id }}</td>
                        <td>
                            <span :class="{
                                'badge-status badge-live': k.role === 'judge',
                                'badge-status badge-dq': k.role === 'admin'
                            }">{{ k.role.toUpperCase() }}</span>
                        </td>
                        <td>{{ k.station || '-' }}</td>
                        <td>{{ k.event || '-' }}</td>
                        <td>{{ k.judgeType || '-' }}</td>
                        <td class="text-center">
                            <button @click="deleteKey(k.id)" class="btn-xs" style="color: #ef4444;" title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
            </div>
        </div>
    </div>

    <!-- KEY MODAL -->
    <div class="modal-overlay" v-if="keyModal.open" @click.self="keyModal.open = false">
        <div class="modal-card">
            <h3>{{ keyModal.isEdit ? 'Edit Key' : 'Add New Key' }}</h3>
            
            <div class="form-group mb-4">
                <label>Access Code (Password)</label>
                <input v-model="keyModal.id" class="modal-input" placeholder="e.g. secret123" :disabled="keyModal.isEdit">
                <small v-if="!keyModal.isEdit" style="color: #64748b;">This cannot be changed later.</small>
            </div>

            <div class="form-group mb-4">
                <label>Role</label>
                <select v-model="keyModal.role" class="modal-input">
                    <option value="judge">Judge</option>
                    <option value="admin">Admin</option>
                    <option value="importer">Importer</option>
                    <option value="tester">Tester</option>
                    <option value="live_board">Live Board</option>
                </select>
            </div>

            <!-- JUDGE FIELDS -->
            <template v-if="keyModal.role === 'judge'">
                <div class="form-group mb-4">
                    <label>Station (Lane)</label>
                    <input v-model="keyModal.station" type="number" class="modal-input">
                </div>
                <div class="form-group mb-4">
                    <label>Event Type</label>
                    <select v-model="keyModal.event" class="modal-input">
                        <option value="speed">Speed</option>
                        <option value="freestyle">Freestyle</option>
                    </select>
                </div>
                <div class="form-group mb-4" v-if="keyModal.event === 'freestyle'">
                    <label>Judge Type</label>
                     <select v-model="keyModal.judgeType" class="modal-input">
                        <option value="difficulty">Difficulty</option>
                        <option value="presentation">Presentation</option>
                        <option value="technical">Technical</option>
                        <option value="re">Req. Elements</option>
                    </select>
                </div>
            </template>

            <div class="modal-actions mt-6">
                <button @click="keyModal.open = false" class="btn-outline">Cancel</button>
                <button @click="saveKey" class="btn-primary" :disabled="!keyModal.id">Save Key</button>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'

const keysList = ref([])
const keyModal = reactive({ open: false, isEdit: false, id: '', role: 'judge', station: 1, event: 'speed', judgeType: 'difficulty' })
let unsub = null

onMounted(() => {
    unsub = onSnapshot(collection(db, 'access_keys'), snap => {
        keysList.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }, err => console.error("Keys Error", err))
})

onUnmounted(() => {
    if (unsub) unsub()
})

const openKeyModal = () => {
    Object.assign(keyModal, { open: true, isEdit: false, id: '', role: 'judge', station: 1, event: 'speed', judgeType: 'difficulty' })
}

const saveKey = async () => {
    if (!keyModal.id) return
    
    const docId = keyModal.id.trim()
    const data = {
        role: keyModal.role,
        updated_at: serverTimestamp()
    }
    
    if (keyModal.role === 'judge') {
        data.station = Number(keyModal.station)
        data.event = keyModal.event
        if (keyModal.event === 'freestyle') data.judgeType = keyModal.judgeType
    }

    try {
        await setDoc(doc(db, 'access_keys', docId), data)
        keyModal.open = false
    } catch(e) {
        alert("Error saving key: " + e.message)
    }
}

const deleteKey = async (id) => {
    if(!confirm(`Delete access key "${id}"?`)) return
    try {
        await deleteDoc(doc(db, 'access_keys', id))
    } catch(e) {
        alert("Error deleting: " + e.message)
    }
}
</script>

<style scoped>
.key-manager-layout {
    height: 100vh;
    background-color: #0f172a;
    color: #f1f5f9;
    overflow-y: auto;
}
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255,255,255,0.1);
}
.brand h1 { margin: 0; font-size: 1.25rem; }
.nav-link { color: #94a3b8; text-decoration: none; font-weight: 600; cursor: pointer; }
.nav-link:hover { color: #fff; }

.glass-card {
    background: rgba(30, 41, 59, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 2rem;
}

.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; padding: 12px; color: #94a3b8; font-size: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.95rem; }

.badge-status { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
.badge-live { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.badge-dq { background: rgba(239, 68, 68, 0.2); color: #f87171; }

.btn-primary { background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; transition: 0.2s; }
.btn-primary:hover { background: #2563eb; }
.btn-outline { background: transparent; border: 1px solid #475569; color: #cbd5e1; border-radius: 8px; padding: 8px 16px; cursor: pointer; }
.btn-outline:hover { border-color: #94a3b8; color: #fff; }
.btn-xs { background: transparent; border: none; cursor: pointer; padding: 4px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card { background: #1e293b; padding: 2rem; border-radius: 16px; width: 100%; max-width: 500px; border: 1px solid #334155; }
.modal-input { width: 100%; padding: 10px; background: #0f172a; border: 1px solid #334155; color: white; border-radius: 8px; margin-top: 4px; }
.form-group label { font-size: 0.85rem; color: #94a3b8; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; }
</style>
