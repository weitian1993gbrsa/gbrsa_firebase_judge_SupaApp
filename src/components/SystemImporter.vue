<template>
    <div class="importer-grid">
        <!-- DATA IMPORTER CARD -->
        <div class="glass-card">
            <div class="card-header">
                <div class="icon-box blue">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                </div>
                <div>
                    <h2>Data Importer</h2>
                    <p class="text-muted">Upload Participants CSV</p>
                </div>
            </div>
            
            <div class="drop-zone" @click="$refs.fileInput.click()" :class="{ 'has-file': parsedData.length > 0 }">
                <input type="file" ref="fileInput" @change="handleFile" accept=".csv" style="display:none;" />
                <div class="icon-cloud">
                     <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="text-blue-500 op-50"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                </div>
                <p class="drop-text" v-if="parsedData.length === 0">Drag & Drop or <span class="highlight">Click to Select CSV</span></p>
                <div v-else>
                    <p class="drop-text text-white">Ready to Import</p>
                    <p class="text-blue-400 font-bold text-xl">{{ parsedData.length }} Participants</p>
                </div>
            </div>

            <div v-if="parsedData.length > 0" class="actions-row">
                <button class="btn-primary full-width" @click="performUpload" :disabled="isUploading">
                    {{ isUploading ? 'Uploading...' : 'Confirm Upload' }}
                </button>
                <button class="btn-outline full-width" @click="parsedData = []">Clear</button>
            </div>

            <div v-if="status" class="status-msg" :class="{ error: status.includes('Error'), success: status.includes('Success') }">
                {{ status }}
            </div>
        </div>

        <!-- CONFIGURATION CARD -->
        <div class="glass-card">
            <div class="card-header">
                <div class="icon-box purple">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div>
                    <h2>Competition Config</h2>
                    <p class="text-muted">Upload Config.csv</p>
                </div>
            </div>
            
            <div class="drop-zone" @click="$refs.configFile.click()" :class="{ 'has-file': parsedConfig }">
                <input type="file" ref="configFile" @change="handleConfigFile" accept=".csv" style="display:none;" />
                <div class="icon-cloud">
                     <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="text-purple-500 op-50"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <p class="drop-text" v-if="!parsedConfig">Upload <span class="highlight purple">Config.csv</span></p>
                <div v-else>
                     <p class="drop-text text-white">Config Loaded</p>
                     <p class="text-purple-400 font-bold text-lg">{{ parsedConfig.title }}</p>
                </div>
            </div>

            <div v-if="parsedConfig" class="actions-row">
                <button class="btn-primary full-width purple-btn" @click="uploadConfig" :disabled="isUploading">
                    {{ isUploading ? 'Saving...' : 'Update Config' }}
                </button>
                <button class="btn-outline full-width" @click="parsedConfig = null">Cancel</button>
            </div>

            <div v-if="configStatus" class="status-msg" :class="{ error: configStatus.includes('Error') || configStatus.includes('Warning'), success: configStatus.includes('Success') || configStatus.includes('Parsed') }">
                {{ configStatus }}
            </div>
        </div>

        <!-- DANGER ZONE CARD -->
        <div class="glass-card danger-card">
            <div class="card-header">
                <div class="icon-box red">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </div>
                <div>
                    <h2 class="text-red-400">Danger Zone</h2>
                    <p class="text-muted">Clear Database</p>
                </div>
            </div>
            
            <div class="danger-content">
                 <p class="text-gray-400 text-sm mb-4">This action will permanently delete all participant records. This cannot be undone.</p>
                 <button class="btn-danger full-width" @click="wipeDatabase" :disabled="isUploading">
                    <span class="icon">🔥</span> WIPE ALL DATA
                 </button>
            </div>
        </div>
        <!-- KEY MANAGER CARD (Full Width) -->
        <div class="glass-card" style="grid-column: 1 / -1;">
             <KeyManager />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import Papa from 'papaparse'
import { db } from '../firebase'
import { collection, writeBatch, doc, getDocs, collectionGroup, setDoc } from 'firebase/firestore'
import KeyManager from './KeyManager.vue'
import { useImporter } from '../composables/useImporter'

const { 
    status, 
    isUploading, 
    parsedData, 
    handleFile: processFile, 
    performUpload, 
    wipeDatabase 
} = useImporter()

const handleFile = (event) => {
    const file = event.target.files[0]
    if (file) processFile(file)
}

// CONFIG STATE
const configStatus = ref('')
const parsedConfig = ref(null)

// --- CONFIG HANDLER ---
const handleConfigFile = (event) => {
    const file = event.target.files[0]
    if (!file) return
    configStatus.value = "Parsing Config..."
    
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            console.log("Config Raw:", results.data)
            processConfig(results.data)
        }
    })
}

const processConfig = (rows) => {
    const newConfig = {
        title: '',
        speedEvents: [],
        freestyleEvents: [],
        divisions: [],
        eventLabels: {}
    }

    let foundTitle = false

    rows.forEach(row => {
        const type = (row.Type || row.type || '').trim().toLowerCase()
        const key = (row.Key || row.key || '').trim()
        const label = (row.Label || row.label || '').trim()
        const cat = (row.Category || row.category || '').trim().toLowerCase()

        if (!type || !key) return

        if (type === 'title') {
            newConfig.title = label
            foundTitle = true
        }
        else if (type === 'event') {
            if (cat.includes('speed')) {
                newConfig.speedEvents.push(key)
            } else {
                newConfig.freestyleEvents.push(key)
            }
            newConfig.eventLabels[key] = label
        }
        else if (type === 'division') {
            newConfig.divisions.push(key) 
        }
    })

    if (!foundTitle) configStatus.value = "⚠️ Warning: No 'Title' row found."
    else configStatus.value = `✅ Parsed: ${newConfig.speedEvents.length + newConfig.freestyleEvents.length} Events, ${newConfig.divisions.length} Divisions.`
    
    parsedConfig.value = newConfig
}

const uploadConfig = async () => {
    if (!parsedConfig.value) return
    isUploading.value = true
    configStatus.value = "Saving Configuration..."

    try {
        await setDoc(doc(db, 'system', 'config'), parsedConfig.value)
        configStatus.value = "✅ Configuration Updated Successfully!"
        setTimeout(() => { parsedConfig.value = null; configStatus.value = '' }, 3000)
    } catch (err) {
        configStatus.value = "Error: " + err.message
    } finally {
        isUploading.value = false
    }
}
</script>

<style scoped>
.importer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    align-items: stretch;
}

/* DARK GLASS CARD */
.glass-card {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.3));
    backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 2rem;
    box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    transition: transform 0.3s ease;
}

.glass-card:hover { border-color: rgba(255, 255, 255, 0.15); }

/* HEADER */
.card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    margin-bottom: 0.5rem;
}
.card-header h2 { font-size: 1.25rem; font-weight: 800; color: white; margin: 0; }

.icon-box {
    width: 48px; height: 48px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
}
.icon-box.blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.icon-box.purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
.icon-box.red { background: rgba(239, 68, 68, 0.15); color: #f87171; }

.text-muted { color: #94a3b8; font-size: 0.85rem; margin-top: 2px; }

/* DROP ZONE */
.drop-zone {
    border: 2px dashed rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 1rem;
    text-align: center;
    transition: all 0.2s;
    cursor: pointer;
    background: rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
}
.drop-zone:hover { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
.drop-zone.has-file { border-style: solid; border-color: #10b981; background: rgba(16, 185, 129, 0.05); }

.icon-cloud svg { width: 36px; height: 36px; opacity: 0.5; margin-bottom: 0px; transition: all 0.3s; }
.drop-zone:hover .icon-cloud svg { opacity: 1; transform: scale(1.1); }

.drop-text { font-size: 1rem; font-weight: 600; color: #64748b; margin: 0; }
.highlight { color: #3b82f6; font-weight: 700; }
.highlight.purple { color: #c084fc; }
.text-white { color: white; }

/* ACTIONS */
.actions-row { display: flex; gap: 1rem; animation: slideDown 0.3s ease; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.full-width { flex: 1; }

.btn-primary { 
    background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; 
    padding: 0.85rem; border-radius: 12px; font-weight: 700; cursor: pointer; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px;
    transition: all 0.2s;
}
.btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.purple-btn { background: linear-gradient(135deg, #a855f7, #7e22ce); }

.btn-outline { 
    background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1;
    padding: 0.85rem; border-radius: 12px; font-weight: 600; cursor: pointer;
}
.btn-outline:hover { border-color: white; color: white; background: rgba(255,255,255,0.05); }

.btn-danger {
    background: rgba(220, 38, 38, 0.2); color: #f87171; border: 1px solid rgba(220, 38, 38, 0.4);
    padding: 1rem; width: 100%; border-radius: 12px; font-weight: 800; cursor: pointer; text-transform: uppercase;
    transition: all 0.2s;
}
.btn-danger:hover { background: #dc2626; color: white; border-color: #dc2626; box-shadow: 0 0 20px rgba(220, 38, 38, 0.4); }

/* STATUS */
.status-msg { 
    padding: 1rem; border-radius: 12px; font-weight: 600; font-size: 0.9rem; text-align: center;
    border: 1px solid transparent;
}
.status-msg.success { background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.3); }
.status-msg.error { background: rgba(239, 68, 68, 0.2); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }

/* UTILS */
.text-red-400 { color: #f87171; }
.text-gray-400 { color: #9ca3af; }
.op-50 { opacity: 0.5; }
.mb-4 { margin-bottom: 1rem; }
.text-xl { font-size: 1.5rem; }
.text-lg { font-size: 1.25rem; }
.font-bold { font-weight: 700; }
</style>
