<template>
    <div class="key-manager-container">
        <!-- HEADER / ACTIONS -->
        <div class="km-header">
            <div>
                <h3>Access Keys (Manage)</h3>
                <p class="text-muted">Manage login codes for judges & staff</p>
            </div>
            <button @click="openKeyModal()" class="btn-primary">
                + Add Key
            </button>
        </div>

        <!-- TABLE -->
        <div class="table-scroll-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 25%;">Code</th>
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
                            <button @click="openQR(k.id)" class="btn-xs" style="color: #cbd5e1; margin-right: 8px;" title="Show QR">
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4h-4v-2h4v-2h2m0-4h2m-6-11h2m-6 0H8m4 11v2m-6 0h2m-6-11h2m-6 0H4m8 11v2M4 4h16v16H4V4z" />
                                </svg>
                            </button>
                            <button @click="editKey(k)" class="btn-xs" style="color: #3b82f6; margin-right: 8px;" title="Edit">
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button @click="deleteKey(k.id)" class="btn-xs" style="color: #ef4444;" title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </td>
                    </tr>
                     <tr v-if="keysList.length === 0">
                        <td colspan="6" class="text-center text-muted p-4">No keys found. Add one to get started.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- KEY MODAL -->
        <div class="modal-overlay" v-if="keyModal.open" @click.self="keyModal.open = false">
            <div class="modal-card">
                <h3>{{ keyModal.isEdit ? 'Edit Key' : 'Add New Key' }}</h3>
                
                <div class="form-group mb-4">
                    <label>Access Code (Password)</label>
                    <input v-model="keyModal.id" class="modal-input" placeholder="e.g. secret123">
                    <small v-if="keyModal.isEdit" style="color: #fbbf24;">Note: changing this will rename the key.</small>
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

        <!-- GENERATED QR MODAL -->
        <div class="modal-overlay" v-if="qrModal.open" @click.self="qrModal.open = false">
            <div class="modal-card" style="text-align: center;">
                <h3>Login QR Code</h3>
                <p class="text-muted" style="margin-bottom: 1.5rem;">For: <span class="text-blue-400 font-bold font-mono">{{ qrModal.keyId }}</span></p>
                
                <div class="qr-display-box">
                    <img :src="qrModal.img" v-if="qrModal.img" style="width: 250px; height: 250px; border-radius: 8px;">
                </div>
                
                <p class="text-muted" style="margin-top: 1rem; font-size: 0.8rem;">To use: Scan with the Login Page Scanner.</p>

                <div class="modal-actions" style="justify-content: center; margin-top: 1.5rem; gap: 1rem;">
                    <button @click="qrModal.open = false" class="btn-outline">Close</button>
                    <button @click="renewKey" class="btn-outline text-red" style="border-color: #ef4444; color: #f87171;">
                        <span style="margin-right:0.5rem">↻</span> Renew Code
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import QRCode from 'qrcode'

const keysList = ref([])
const keyModal = reactive({ open: false, isEdit: false, id: '', originalId: '', role: 'judge', station: 1, event: 'speed', judgeType: 'difficulty' })
const qrModal = reactive({ open: false, keyId: '', img: '' })

let unsub = null

onMounted(() => {
    unsub = onSnapshot(collection(db, 'access_keys'), snap => {
        keysList.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }, err => console.error("Keys Error", err))
})

onUnmounted(() => {
    if (unsub) unsub()
})

// QR LOGIC
const openQR = async (keyId) => {
    qrModal.keyId = keyId
    qrModal.img = ''
    qrModal.open = true
    
    // 1. Encode Key (Base64)
    // We use btoa() for simple Base64. 
    // Format: "MTIz"
    let encoded = ''
    try {
        encoded = btoa(keyId)
    } catch(e) { 
        console.error("Encoding failed", e) 
        encoded = keyId // Fallback to raw if logic fails
    }

    // 2. Generate QR
    try {
        const url = await QRCode.toDataURL(encoded, { 
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        })
        qrModal.img = url
    } catch (err) {
        console.error(err)
        alert("QR Generation Failed")
        qrModal.open = false
    }
}


const openKeyModal = () => {
    Object.assign(keyModal, { open: true, isEdit: false, id: '', originalId: '', role: 'judge', station: 1, event: 'speed', judgeType: 'difficulty' })
}

const generateRandomKey = (length = 6) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

const renewKey = async () => {
    const oldId = qrModal.keyId
    if (!oldId) return

    if (!confirm(`Are you sure you want to INVALIDATE the key "${oldId}" and generate a NEW one?\n\nThe old QR code will stop working immediately.`)) return

    // 1. Find the current key data
    const keyData = keysList.value.find(k => k.id === oldId)
    if (!keyData) {
        alert("Error: Could not find key data.")
        return
    }

    // 2. Generate New ID (With Collision Check)
    let newId = generateRandomKey()
    let attempts = 0
    let isUnique = false
    
    while (!isUnique && attempts < 5) {
        const checkRef = doc(db, 'access_keys', newId)
        const snap = await getDoc(checkRef)
        if (!snap.exists()) {
            isUnique = true
        } else {
            console.warn(`Collision detected for generated key ${newId}. Retrying...`)
            newId = generateRandomKey()
            attempts++
        }
    }

    if (!isUnique) {
        alert("Error: Could not generate a unique key after multiple attempts. Please try again.")
        return
    }
    
    // 3. Prepare Data (Copy existing fields)
    const newHeaderData = {
        role: keyData.role,
        updated_at: serverTimestamp(),
        // Optional properties depending on role
        ...(keyData.station && { station: keyData.station }),
        ...(keyData.event && { event: keyData.event }),
        ...(keyData.judgeType && { judgeType: keyData.judgeType })
    }

    try {
        // 4. Create New & Delete Old
        // We do this sequentially. Ideally a batch or transaction, but this is simple enough.
        await setDoc(doc(db, 'access_keys', newId), newHeaderData)
        await deleteDoc(doc(db, 'access_keys', oldId))

        // 5. Update UI
        // keyModal is for the Edit form, we are in qrModal. 
        // We just need to refresh the QR view with the new ID.
        await openQR(newId)
        
        // Show success toast or small alert? Maybe just the visual update is enough.
        // The openQR call will update the modal title and image.
        
    } catch(e) {
        console.error(e)
        alert("Failed to renew key: " + e.message)
    }
}

const editKey = (k) => {
    Object.assign(keyModal, { 
        open: true, 
        isEdit: true, 
        id: k.id, 
        originalId: k.id, // Track original ID for renaming
        role: k.role, 
        station: k.station || 1, 
        event: k.event || 'speed', 
        judgeType: k.judgeType || 'difficulty' 
    })
}

const saveKey = async () => {
    if (!keyModal.id) return
    
    const newId = keyModal.id.trim()
    const headerData = {
        role: keyModal.role,
        updated_at: serverTimestamp()
    }
    
    if (keyModal.role === 'judge') {
        headerData.station = Number(keyModal.station)
        headerData.event = keyModal.event
        if (keyModal.event === 'freestyle') headerData.judgeType = keyModal.judgeType
    }

    try {
        // If editing and ID changed, we must delete the old one and create new
        if (keyModal.isEdit && newId !== keyModal.originalId) {
             const confirmRename = confirm(`Changing Access Code from "${keyModal.originalId}" to "${newId}". Continue?`)
             if (!confirmRename) return

             // 1. Create New
             await setDoc(doc(db, 'access_keys', newId), headerData)
             // 2. Delete Old
             await deleteDoc(doc(db, 'access_keys', keyModal.originalId))
        } else {
             // Standard Update / Create
             await setDoc(doc(db, 'access_keys', newId), headerData)
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
</script>

<style scoped>
.km-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;
    padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.km-header h3 { font-size: 1.25rem; font-weight: 800; color: white; margin: 0; }
.text-muted { color: #94a3b8; font-size: 0.85rem; margin-top: 2px; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; padding: 12px; color: #94a3b8; font-size: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.95rem; }

.badge-status { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
.badge-live { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.badge-dq { background: rgba(239, 68, 68, 0.2); color: #f87171; }

.btn-primary { 
    background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; 
    padding: 8px 16px; font-weight: 600;
}
.btn-primary:hover { background: #2563eb; }

.btn-xs { background: transparent; border: none; cursor: pointer; padding: 4px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-card { background: #1e293b; padding: 2rem; border-radius: 16px; width: 100%; max-width: 500px; border: 1px solid #334155; }
.modal-input { width: 100%; padding: 10px; background: #0f172a; border: 1px solid #334155; color: white; border-radius: 8px; margin-top: 4px; }
.form-group label { font-size: 0.85rem; color: #94a3b8; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; }
.btn-outline { background: transparent; border: 1px solid #475569; color: #cbd5e1; border-radius: 8px; padding: 8px 16px; cursor: pointer; }

.qr-display-box {
    background: white; padding: 1rem; border-radius: 12px; display: inline-block;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
}
.text-blue-400 { color: #60a5fa; }
.font-mono { font-family: monospace; }
.full-width { width: 100%; }

.table-scroll-container {
    max-height: 400px; overflow-y: auto;
}
</style>
