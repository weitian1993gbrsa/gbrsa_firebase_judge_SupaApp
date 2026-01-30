<template>
  <div class="key-manager-layout">
    <header class="header">
      <div class="brand">
        <div class="brand-text">
          <h1>Access Key Manager</h1>
        </div>
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
                        <th style="width: 5%;"></th>
                        <th style="width: 20%;">Code</th>
                        <th style="width: 15%;">Role</th>
                        <th style="width: 10%;">Station</th>
                        <th style="width: 15%;">Event</th>
                        <th style="width: 15%;">Type</th>
                        <th style="width: 20%; text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody class="drag-container">
                    <tr 
                        v-for="(k, index) in keysList" 
                        :key="k.id"
                        draggable="true"
                        @dragstart="onDragStart($event, index)"
                        @dragover.prevent="onDragOver($event)"
                        @drop="onDrop($event, index)"
                        class="draggable-row"
                        :class="{ 'is-dragging': dragIndex === index }"
                    >
                        <td class="drag-handle" title="Drag to reorder">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="opacity: 0.5;">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                            </svg>
                        </td>

                        <td class="font-mono font-bold text-white">{{ k.id }}</td>
                        <td>
                            <span :class="{
                                'badge-status badge-live': k.role === 'judge',
                                'badge-status badge-dq': k.role === 'admin' || k.role === 'super_admin'
                            }">{{ k.role.toUpperCase() }}</span>
                        </td>
                        <td>{{ k.station || '-' }}</td>
                        <td>{{ k.event || '-' }}</td>
                        <td>{{ k.judgeType || '-' }}</td>
                        <td class="text-center">
                            <div class="action-buttons">
                                <button @click="showQr(k)" class="btn-xs btn-icon-blue" title="Show QR">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zm-6 0H6.4M7 16h.4M16 16h.4M6 12h.4M12 12h.4M12 16h.4M16 12h.4M6 8h.4M12 8h.4M16 8h.4M7 8h.4M7 12h.4M7 4h.4M6.4 4H6m1.2 0h.4M12 4h.4M16.4 4H16m1.2 0h.4M6 16h.4M16 16h.4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </button>
                                <button @click="editKey(k)" class="btn-xs btn-icon-yellow" title="Edit">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                                <button @click="deleteKey(k.id)" class="btn-xs btn-icon-red" title="Delete">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            </div>
        </div>
    </div>

    <div class="modal-overlay" v-if="keyModal.open" @click.self="keyModal.open = false">
        <div class="modal-card">
            <h3>{{ keyModal.isEdit ? 'Edit Key' : 'Add New Key' }}</h3>
            
            <div class="form-group mb-4">
                <label>Access Code (Password)</label>
                <input v-model="keyModal.id" class="modal-input" placeholder="e.g. secret123">
                <small v-if="keyModal.isEdit" style="color: #f59e0b;">⚠ Changing this will create a new key and delete the old one.</small>
            </div>

            <div class="form-group mb-4">
                <label>Role</label>
                <select v-model="keyModal.role" class="modal-input">
                    <option value="judge">Judge</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="importer">Importer</option>
                    <option value="tester">Tester</option>
                    <option value="live_board">Live Board</option>
                </select>
            </div>

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

    <div class="modal-overlay" v-if="qrModal.open" @click.self="qrModal.open = false">
        <div class="modal-card" style="max-width: 350px; text-align: center;">
            <h3 style="margin-bottom: 1rem;">Login QR Code</h3>
            
            <div style="background: white; padding: 1rem; border-radius: 12px; display: inline-block;">
                <img :src="qrModal.url" alt="QR Code" style="width: 200px; height: 200px;" />
            </div>
            
            <p class="font-mono mt-4" style="font-size: 1.2rem; font-weight: bold; color: #facc15;">{{ qrModal.code }}</p>
            <p class="text-sm text-gray-400">Scan this at the login screen</p>

            <div class="mt-6">
                 <button @click="qrModal.open = false" class="btn-primary w-full">Close</button>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore'
import QRCode from 'qrcode' 

const keysList = ref([])
// Added originalId to track renames
const keyModal = reactive({ open: false, isEdit: false, id: '', originalId: '', role: 'judge', station: 1, event: 'speed', judgeType: 'difficulty' })
const qrModal = reactive({ open: false, url: '', code: '' })
const dragIndex = ref(null)

let unsub = null

onMounted(() => {
    // FIXED: Removed orderBy('sort_order') from query so keys without it still show up
    const q = collection(db, 'access_keys')
    
    unsub = onSnapshot(q, snap => {
        let list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        
        // Client-side Sorting
        list.sort((a, b) => {
            // 1. If both have sort_order, use it
            if (a.sort_order !== undefined && b.sort_order !== undefined) {
                return a.sort_order - b.sort_order
            }
            // 2. If only one has sort_order, prioritize it (optional, or push to bottom)
            if (a.sort_order !== undefined) return -1
            if (b.sort_order !== undefined) return 1
            
            // 3. Fallback: Sort alphabetically by ID
            return a.id.localeCompare(b.id)
        })
        
        keysList.value = list
    }, err => console.error("Keys Error", err))
})

onUnmounted(() => {
    if (unsub) unsub()
})

// --- ACTIONS ---

const openKeyModal = () => {
    Object.assign(keyModal, { 
        open: true, 
        isEdit: false, 
        id: '', 
        originalId: '',
        role: 'judge', 
        station: 1, 
        event: 'speed', 
        judgeType: 'difficulty' 
    })
}

const editKey = (key) => {
    Object.assign(keyModal, {
        open: true,
        isEdit: true,
        id: key.id,
        originalId: key.id, // Track original
        role: key.role,
        station: key.station || 1,
        event: key.event || 'speed',
        judgeType: key.judgeType || 'difficulty'
    })
}

const saveKey = async () => {
    if (!keyModal.id) return
    
    const newId = keyModal.id.trim()
    
    const data = {
        role: keyModal.role,
        updated_at: serverTimestamp()
    }
    
    if (keyModal.role === 'judge') {
        data.station = Number(keyModal.station)
        data.event = keyModal.event
        if (keyModal.event === 'freestyle') data.judgeType = keyModal.judgeType
    } else {
        data.station = null
        data.event = null
        data.judgeType = null
    }

    // Set default sort order if new (append to end)
    if (!keyModal.isEdit) {
        data.sort_order = keysList.value.length
    }

    try {
        // CHECK: Rename?
        if (keyModal.isEdit && newId !== keyModal.originalId) {
            // 1. Create NEW doc (Preserve old sort_order)
            const oldKeyData = keysList.value.find(k => k.id === keyModal.originalId)
            if (oldKeyData && oldKeyData.sort_order !== undefined) {
                data.sort_order = oldKeyData.sort_order
            }
            
            await setDoc(doc(db, 'access_keys', newId), data)
            
            // 2. Delete OLD doc
            await deleteDoc(doc(db, 'access_keys', keyModal.originalId))
        } else {
            // Normal update or Insert
            await setDoc(doc(db, 'access_keys', newId), data, { merge: true })
        }

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

const showQr = async (key) => {
    try {
        const url = await QRCode.toDataURL(key.id, { 
            width: 300, 
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
        })
        qrModal.url = url
        qrModal.code = key.id
        qrModal.open = true
    } catch (err) {
        alert("Failed to generate QR: " + err.message)
    }
}

// --- DRAG & DROP ---

const onDragStart = (e, index) => {
    dragIndex.value = index
    e.dataTransfer.effectAllowed = 'move'
    // Optional: set transparent drag image if needed
}

const onDragOver = (e) => {
    e.dataTransfer.dropEffect = 'move'
}

const onDrop = async (e, dropIndex) => {
    const startIndex = dragIndex.value
    if (startIndex === null || startIndex === dropIndex) return

    // Reorder locally
    const movedItem = keysList.value[startIndex]
    const list = [...keysList.value]
    list.splice(startIndex, 1)
    list.splice(dropIndex, 0, movedItem)
    keysList.value = list // Optimistic update
    dragIndex.value = null

    // Save Order to Firestore
    const batch = writeBatch(db)
    list.forEach((k, idx) => {
        const ref = doc(db, 'access_keys', k.id)
        // Only update if index actually changed to save writes, but updating all is safer for consistency
        batch.update(ref, { sort_order: idx })
    })

    try {
        await batch.commit()
    } catch(err) {
        console.error("Reorder failed", err)
        alert("Failed to save new order")
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

/* DRAG & DROP STYLES */
.draggable-row { cursor: default; transition: background 0.2s, transform 0.2s; }
.draggable-row.is-dragging { opacity: 0.5; background: rgba(59, 130, 246, 0.2); }
.drag-handle { cursor: grab; text-align: center; }
.drag-handle:active { cursor: grabbing; }

.action-buttons { display: flex; justify-content: center; gap: 8px; }

.badge-status { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
.badge-live { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.badge-dq { background: rgba(239, 68, 68, 0.2); color: #f87171; }

.btn-primary { background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; transition: 0.2s; }
.btn-primary:hover { background: #2563eb; }
.btn-outline { background: transparent; border: 1px solid #475569; color: #cbd5e1; border-radius: 8px; padding: 8px 16px; cursor: pointer; }
.btn-outline:hover { border-color: #94a3b8; color: #fff; }

.btn-xs { 
    width: 32px; height: 32px; 
    border: none; border-radius: 6px; 
    cursor: pointer; 
    display: flex; align-items: center; justify-content: center; 
    transition: all 0.2s;
}

.btn-icon-blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.btn-icon-blue:hover { background: #3b82f6; color: white; }
.btn-icon-yellow { background: rgba(234, 179, 8, 0.2); color: #facc15; }
.btn-icon-yellow:hover { background: #eab308; color: white; }
.btn-icon-red { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.btn-icon-red:hover { background: #ef4444; color: white; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card { background: #1e293b; padding: 2rem; border-radius: 16px; width: 100%; max-width: 500px; border: 1px solid #334155; position: relative; }
.modal-input { width: 100%; padding: 10px; background: #0f172a; border: 1px solid #334155; color: white; border-radius: 8px; margin-top: 4px; }
.form-group label { font-size: 0.85rem; color: #94a3b8; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; }
.w-full { width: 100%; }
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }
</style>