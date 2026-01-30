<template>
  <div class="key-manager-layout">
    <header class="view-header">
      <div class="header-content">
        <h1 class="page-title">Access Key Manager</h1>
        <p class="page-subtitle">Manage system access, roles, and lanes.</p>
      </div>
    </header>

    <div class="dashboard-container">
      <div class="glass-panel">
        
        <div class="panel-toolbar">
          <div class="toolbar-left">
            <h3 class="panel-title">Active Keys</h3>
            <button @click="nukeStations" class="btn-nuke" title="Kick everyone out of stations">
              <span>☢ Reset Stations</span>
            </button>
          </div>

          <button @click="openKeyModal()" class="btn-add">
            <span class="icon-plus">+</span>
            <span class="btn-label">New Key</span>
          </button>
        </div>

        <div class="list-header">
          <div class="col col-handle"></div>
          <div class="col col-code">Code</div>
          <div class="col col-role">Role</div>
          <div class="col col-info">Details</div> <div class="col col-actions">Actions</div>
        </div>

        <div class="list-body">
          <TransitionGroup name="list" tag="div" class="drag-container">
            <div 
              v-for="(k, index) in keysList" 
              :key="k.id"
              class="list-row"
              :class="{ 'is-dragging': dragIndex === index }"
              draggable="true"
              @dragstart="onDragStart($event, index)"
              @dragover.prevent="onDragOver($event)"
              @drop="onDrop($event, index)"
            >
              <div class="col col-handle" title="Hold to drag">
                <div class="drag-grip">
                  <span></span><span></span><span></span>
                </div>
              </div>

              <div class="col col-code">
                <span class="code-pill">{{ k.id }}</span>
              </div>

              <div class="col col-role">
                <span class="role-badge" :class="getRoleClass(k.role)">
                  {{ formatRole(k.role) }}
                </span>
              </div>

              <div class="col col-info">
                <div v-if="k.role === 'judge'" class="info-tags">
                  <span class="tag-station">St. {{ k.station }}</span>
                  <span class="tag-event">{{ k.event }}</span>
                  <span class="tag-type">{{ k.judgeType }}</span>
                </div>
                <span v-else class="text-muted">—</span>
              </div>

              <div class="col col-actions">
                <button @click="forceKeyReset(k)" class="action-btn btn-reset" title="Force Reset Status">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                </button>

                <button @click="showQr(k)" class="action-btn btn-qr" title="Show QR">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                </button>
                <button @click="editKey(k)" class="action-btn btn-edit" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button @click="deleteKey(k.id)" class="action-btn btn-delete" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          </TransitionGroup>
          
          <div v-if="keysList.length === 0" class="empty-state">
            <p>No keys found. Click "New Key" to start.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" v-if="keyModal.open" @click.self="keyModal.open = false">
      <div class="modal-window">
        <div class="modal-header">
          <h3>{{ keyModal.isEdit ? 'Edit Access Key' : 'Create Access Key' }}</h3>
          <button class="btn-close" @click="keyModal.open = false">×</button>
        </div>
        
        <div class="modal-body">
          <div class="input-group">
            <label>Access Code</label>
            <input v-model="keyModal.id" type="text" placeholder="e.g. Judge1" class="form-input">
            <p v-if="keyModal.isEdit" class="input-hint">⚠ Changing this creates a new key entry.</p>
          </div>

          <div class="input-group">
            <label>Role</label>
            <select v-model="keyModal.role" class="form-select">
              <option value="judge">Judge (Station)</option>
              <option value="admin">Administrator</option>
              <option value="super_admin">Super Admin</option>
              <option value="importer">Data Importer</option>
              <option value="tester">Tester</option>
              <option value="practice">Practice Mode</option>
              <option value="live_board">Live Scoreboard</option>
            </select>
          </div>

          <div v-if="keyModal.role === 'judge'" class="grid-2">
            <div class="input-group">
              <label>Station No.</label>
              <input v-model="keyModal.station" type="number" class="form-input">
            </div>
            <div class="input-group">
              <label>Event</label>
              <select v-model="keyModal.event" class="form-select">
                <option value="speed">Speed</option>
                <option value="freestyle">Freestyle</option>
              </select>
            </div>
            <div class="input-group full-width" v-if="keyModal.event === 'freestyle'">
              <label>Judge Type</label>
              <select v-model="keyModal.judgeType" class="form-select">
                <option value="difficulty">Difficulty</option>
                <option value="presentation">Presentation</option>
                <option value="technical">Technical</option>
                <option value="re">Req. Elements</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-text" @click="keyModal.open = false">Cancel</button>
          <button class="btn-primary" @click="saveKey" :disabled="!keyModal.id">Save Changes</button>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" v-if="qrModal.open" @click.self="qrModal.open = false">
      <div class="modal-window qr-window">
        <h3>Login QR Code</h3>
        <div class="qr-display">
          <img :src="qrModal.url" alt="QR Code" />
        </div>
        <div class="qr-code-label">{{ qrModal.code }}</div>
        <button class="btn-primary full-width" @click="qrModal.open = false">Done</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
// ADDED: getDocs, updateDoc
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, serverTimestamp, getDocs, updateDoc } from 'firebase/firestore'
import QRCode from 'qrcode' 

const keysList = ref([])
const keyModal = reactive({ open: false, isEdit: false, id: '', originalId: '', role: 'judge', station: 1, event: 'speed', judgeType: 'difficulty' })
const qrModal = reactive({ open: false, url: '', code: '' })
const dragIndex = ref(null)
let unsub = null

// --- UTILS ---
const formatRole = (r) => {
  const map = { 'super_admin': 'Super Admin', 'live_board': 'Live Board', 'practice': 'Practice Mode' }
  return map[r] || r.charAt(0).toUpperCase() + r.slice(1)
}

const getRoleClass = (r) => {
  if (r === 'judge') return 'role-judge'
  if (r === 'admin' || r === 'super_admin') return 'role-admin'
  if (r === 'live_board') return 'role-live'
  return 'role-gray'
}

// --- NEW TWEAK FUNCTIONS ---
const nukeStations = async () => {
  if (!confirm("☢ NUCLEAR OPTION ☢\n\nThis will KICK ALL USERS out of every station immediately.\nAre you sure?")) return;
  try {
    const batch = writeBatch(db);
    const snaps = await getDocs(collection(db, 'station_locks'));
    if (snaps.empty) { alert("No active stations."); return; }
    snaps.forEach(d => batch.delete(d.ref));
    await batch.commit();
    alert("Stations cleared!");
  } catch(e) { alert(e.message); }
}

const forceKeyReset = async (k) => {
  if (!confirm(`Force reset key "${k.id}"? This clears its active status.`)) return;
  try {
    await updateDoc(doc(db, 'access_keys', k.id), {
      is_active: false,
      current_session: null,
      last_active: null
    });
    alert(`Key ${k.id} reset.`);
  } catch(e) { alert(e.message); }
}

// --- DATA & DRAG LOGIC ---
onMounted(() => {
    unsub = onSnapshot(collection(db, 'access_keys'), snap => {
        let list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => {
            if (a.sort_order !== undefined && b.sort_order !== undefined) return a.sort_order - b.sort_order
            return a.id.localeCompare(b.id)
        })
        keysList.value = list
    })
})
onUnmounted(() => { if (unsub) unsub() })

// Actions
const openKeyModal = () => Object.assign(keyModal, { open: true, isEdit: false, id: '', originalId: '', role: 'judge', station: 1, event: 'speed', judgeType: 'difficulty' })
const editKey = (k) => Object.assign(keyModal, { open: true, isEdit: true, id: k.id, originalId: k.id, ...k })

const saveKey = async () => {
    if (!keyModal.id) return
    const newId = keyModal.id.trim()
    const data = { role: keyModal.role, updated_at: serverTimestamp() }
    if (keyModal.role === 'judge') {
        data.station = Number(keyModal.station); data.event = keyModal.event
        if (keyModal.event === 'freestyle') data.judgeType = keyModal.judgeType
    } else { data.station = null; data.event = null; data.judgeType = null }
    if (!keyModal.isEdit) data.sort_order = keysList.value.length

    try {
        if (keyModal.isEdit && newId !== keyModal.originalId) {
            const old = keysList.value.find(k => k.id === keyModal.originalId)
            if (old?.sort_order !== undefined) data.sort_order = old.sort_order
            await setDoc(doc(db, 'access_keys', newId), data)
            await deleteDoc(doc(db, 'access_keys', keyModal.originalId))
        } else {
            await setDoc(doc(db, 'access_keys', newId), data, { merge: true })
        }
        keyModal.open = false
    } catch(e) { alert(e.message) }
}

const deleteKey = async (id) => { if(confirm(`Delete ${id}?`)) await deleteDoc(doc(db, 'access_keys', id)) }

const showQr = async (k) => {
    qrModal.url = await QRCode.toDataURL(k.id, { width: 300, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
    qrModal.code = k.id; qrModal.open = true
}

// Drag
const onDragStart = (e, i) => { dragIndex.value = i; e.dataTransfer.effectAllowed = 'move' }
const onDragOver = (e) => { e.dataTransfer.dropEffect = 'move' }
const onDrop = async (e, dropI) => {
    const startI = dragIndex.value
    if (startI === null || startI === dropI) return
    const moved = keysList.value[startI]
    const list = [...keysList.value]
    list.splice(startI, 1); list.splice(dropI, 0, moved)
    keysList.value = list; dragIndex.value = null
    const batch = writeBatch(db)
    list.forEach((k, i) => batch.update(doc(db, 'access_keys', k.id), { sort_order: i }))
    await batch.commit()
}
</script>

<style scoped>
/* --- LAYOUT & BASE --- */
.key-manager-layout {
  height: 100vh;
  background-color: #0f172a; /* Slate 900 */
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

.view-header {
  padding: 1.5rem 2rem;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  flex-shrink: 0;
}
.page-title { margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px; }
.page-subtitle { margin: 0.25rem 0 0; color: #94a3b8; font-size: 0.9rem; }

.dashboard-container {
  flex: 1;
  padding: 2rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* --- GLASS PANEL --- */
.glass-panel {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}

.panel-toolbar {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.02);
}
.toolbar-left { display: flex; gap: 1rem; align-items: center; }
.panel-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: #e2e8f0; }

.btn-add {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}
.btn-add:hover { background: #2563eb; transform: translateY(-1px); }
.icon-plus { font-size: 1.2rem; line-height: 1; }

.btn-nuke {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-nuke:hover { background: #ef4444; color: white; }

/* --- LIST LAYOUT --- */
.list-header {
  display: flex;
  padding: 0.75rem 1.5rem;
  background: rgba(15, 23, 42, 0.5);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.list-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.list-row {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.02);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}
.list-row:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
.list-row.is-dragging { opacity: 0.5; border: 1px dashed #3b82f6; }

/* COLUMNS */
.col { padding: 0 0.5rem; }
.col-handle { width: 40px; display: flex; justify-content: center; cursor: grab; opacity: 0.4; }
.col-handle:hover { opacity: 1; }
.col-code { width: 25%; }
.col-role { width: 20%; }
.col-info { flex: 1; }
.col-actions { width: 180px; display: flex; justify-content: flex-end; gap: 0.5rem; }

/* ELEMENTS */
.drag-grip span { display: block; width: 4px; height: 4px; background: currentColor; margin: 2px 0; border-radius: 50%; }

.code-pill {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  background: rgba(0,0,0,0.3);
  padding: 4px 8px;
  border-radius: 4px;
  color: #facc15;
  border: 1px solid rgba(250, 204, 21, 0.2);
}

.role-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
.role-judge { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.role-admin { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.role-live { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.role-gray { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }

.info-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tag-station, .tag-event, .tag-type { 
  font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.05); color: #cbd5e1;
}

.action-btn {
  width: 34px; height: 34px;
  border: none; border-radius: 8px;
  background: rgba(255,255,255,0.05);
  color: #94a3b8;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.action-btn:hover { background: #3b82f6; color: white; }
.btn-delete:hover { background: #ef4444; }
.btn-reset:hover { background: #f59e0b; color: white; }

/* --- RESPONSIVE MOBILE --- */
@media (max-width: 768px) {
  .view-header { padding: 1rem; }
  .dashboard-container { padding: 1rem; }
  
  .list-header { display: none; }
  
  .list-row {
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem;
    position: relative;
    gap: 0.75rem;
  }

  .col { width: 100%; padding: 0; }
  .col-handle { position: absolute; top: 1rem; right: 1rem; width: auto; height: auto; }
  .drag-grip { transform: rotate(90deg); }
  .col-code { margin-bottom: 0.25rem; }
  .code-pill { font-size: 1.1rem; }
  .col-role { display: flex; align-items: center; }
  
  .col-actions {
    width: 100%; margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.05);
    justify-content: space-between;
  }
  .action-btn { width: 22%; height: 40px; }
}

/* --- MODALS --- */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.8);
  backdrop-filter: blur(4px); z-index: 50;
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.modal-window {
  background: #1e293b;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  width: 100%; max-width: 450px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
  display: flex; flex-direction: column;
}
.modal-header {
  padding: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex; justify-content: space-between; align-items: center;
}
.modal-header h3 { margin: 0; font-size: 1.1rem; color: white; }
.btn-close { background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; }

.modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

.input-group label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.4rem; }
.form-input, .form-select {
  width: 100%; background: #0f172a; border: 1px solid #334155;
  color: white; padding: 0.75rem; border-radius: 8px; font-size: 1rem;
}
.form-input:focus, .form-select:focus { outline: 2px solid #3b82f6; border-color: transparent; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.full-width { grid-column: span 2; }
.input-hint { font-size: 0.8rem; color: #f59e0b; margin: 0.25rem 0 0; }

.modal-footer {
  padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.05);
  display: flex; justify-content: flex-end; gap: 1rem;
}
.btn-text { background: none; border: none; color: #94a3b8; cursor: pointer; font-weight: 600; }
.btn-primary { background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* QR Styles */
.qr-window { text-align: center; padding: 2rem; max-width: 350px; }
.qr-display { background: white; padding: 1rem; border-radius: 12px; margin: 1rem auto; display: inline-block; }
.qr-display img { width: 200px; height: 200px; display: block; }
.qr-code-label { font-family: monospace; font-size: 1.25rem; font-weight: 700; color: #facc15; margin-bottom: 1.5rem; }
.full-width { width: 100%; }
</style>