<template>
  <div class="layout">
    <header class="header">
      <div class="brand">
        <div class="brand-text">
          <h1>System Importer</h1>
        </div>
      </div>

    </header>

    <div class="panel">
        <div class="alert-box">
            <h2>Data Importer</h2>
            <p class="text-muted text-sm mb-4">Upload your Participants CSV to populate Firebase.</p>
            
            <div class="drop-zone" @click="$refs.fileInput.click()">
                <input type="file" ref="fileInput" @change="handleFile" accept=".csv" style="display:none;" />
                <div class="icon-cloud">☁️</div>
                <p class="drop-text">Drag & Drop or <span class="highlight">Click to Select CSV</span></p>
            </div>

            <div v-if="parsedData.length > 0" class="actions-row">
                <p class="info-text">Ready: {{ parsedData.length }} Participants</p>
                <div class="btn-group">
                    <button class="btn btn-primary" @click="performUpload" :disabled="isUploading">
                        {{ isUploading ? 'Uploading...' : `Confirm Upload` }}
                    </button>
                    <button class="btn btn-outline" @click="parsedData = []">Clear</button>
                </div>
            </div>

            <div v-if="status" class="status-msg" :class="{ error: status.includes('Error'), success: status.includes('Success') }">
                {{ status }}
            </div>
        </div>

        <!-- CONFIGURATION IMPORTER -->
        <div class="alert-box config-box">
            <h2>Competition Config</h2>
            <p class="text-muted text-sm mb-4">Upload <b>Config.csv</b> to update Title, Events, and Divisions.</p>
            
            <div class="drop-zone" @click="$refs.configFile.click()">
                <input type="file" ref="configFile" @change="handleConfigFile" accept=".csv" style="display:none;" />
                <div class="icon-cloud">⚙️</div>
                <p class="drop-text">Upload <span class="highlight">Config.csv</span></p>
            </div>

            <div v-if="parsedConfig" class="actions-row">
                <p class="info-text">Ready: {{ parsedConfig.title }}</p>
                <div class="btn-group">
                    <button class="btn btn-primary" @click="uploadConfig" :disabled="isUploading">
                        {{ isUploading ? 'Saving...' : `Update Config` }}
                    </button>
                    <button class="btn btn-outline" @click="parsedConfig = null">Cancel</button>
                </div>
            </div>

            <div v-if="configStatus" class="status-msg" :class="{ error: configStatus.includes('Error') || configStatus.includes('Warning'), success: configStatus.includes('Success') || configStatus.includes('Parsed') }">
                {{ configStatus }}
            </div>
        </div>

        <div class="alert-box danger-box">
            <h2 class="text-red-500">Danger Zone</h2>
            <p class="text-muted text-sm mb-4">Clear all participant records from the database.</p>
            <button class="btn btn-danger" @click="wipeDatabase" :disabled="isUploading">🔥 WIPE ALL PARTICIPANTS</button>
        </div>
    </div>
    

  </div>
</template>

<script setup>
import { ref } from 'vue'
import Papa from 'papaparse'
import { db } from '../firebase'
import { collection, writeBatch, doc, getDocs, collectionGroup, setDoc } from 'firebase/firestore'
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
    // Schema: Type, Key, Label, Category
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
            newConfig.title = label // Key is ignored for title usually, or 'main'
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
            newConfig.divisions.push(key) // We store keys. Label could be used for display if we have a map.
            // If we want labels for divisions later, we'd need a map. For now just list.
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
/* LEGACY DESIGN SYSTEM */
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
  color: #0f172a;
  font-family: 'Outfit', sans-serif;
}

/* Header */
.header {
  height: 64px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}
.brand h1 { font-size: 1.25rem; font-weight: 700; margin: 0; color: #0f172a; }

.system-status-container { display: flex; flex-direction: column; align-items: flex-end; }
.system-status { display: flex; align-items: center; gap: 8px; color: #10b981; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; }
.pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2); animation: pulse 2s infinite; }
@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
.admin-link { color: #64748b; font-size: 0.75rem; font-weight: 600; text-decoration: none; margin-top: 4px; }
.admin-link:hover { color: #0f172a; }

.panel {
  flex: 1;
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.alert-box {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 32px;
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
}
.alert-box h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: #0f172a; }

.drop-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
  background: #f8fafc;
  margin-bottom: 1.5rem;
}
.drop-zone:hover { border-color: #94a3b8; background: #f1f5f9; }
.icon-cloud { font-size: 48px; display: block; margin-bottom: 8px; }
.drop-text { font-size: 1.1rem; font-weight: 600; color: #334155; }
.highlight { color: #3b82f6; }

.actions-row { display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
.info-text { font-weight: 700; color: #10b981; margin: 0; }
.btn-group { display: flex; gap: 1rem; }

.status-msg { margin-top: 1rem; padding: 1rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; }
.status-msg.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.status-msg.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

.danger-box { border-color: #fecaca; background: #fef2f2; }
.text-red-500 { color: #dc2626; }

.btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 0.9rem; transition: background 0.2s; }
.btn-primary { background: #3b82f6; color: white; }
.btn-primary:hover { background: #2563eb; }
.btn-outline { background: white; border: 1px solid #e2e8f0; color: #475569; }
.btn-outline:hover { background: #f8fafc; color: #0f172a; }
.btn-danger { background: #dc2626; color: white; width: 100%; font-weight: 700; }
.btn-danger:hover { background: #b91c1c; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.footer { text-align: center; padding: 1.5rem; color: #94a3b8; font-size: 0.8rem; }

.mb-4 { margin-bottom: 1rem; }
.text-muted { color: #64748b; }
.text-sm { font-size: 0.9rem; }

/* RESPONSIVE LAYOUT */
/* PC: Side-by-side layout for main importers */
@media (min-width: 1024px) {
    .panel {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        max-width: 1200px; /* Expand max width for grid */
    }
    .alert-box { margin-bottom: 0; height: 100%; display: flex; flex-direction: column; }
    .drop-zone { flex: 1; display: flex; flex-direction: column; justify-content: center; } /* Fill height */
    
    /* Danger Zone spans full width */
    .danger-box { grid-column: 1 / -1; margin-top: 8px; height: auto; }
}

/* TABLET: Reduced padding */
@media (max-width: 1023px) {
    .panel { padding: 32px; max-width: 800px; }
}

/* MOBILE: Stacked \u0026 Compact */
@media (max-width: 640px) {
    .header { padding: 0 16px; height: 56px; }
    .brand h1 { font-size: 1.1rem; }
    .system-status span { display: none; } /* Hide text on small mobile */
    
    .panel { padding: 16px; display: block; } /* Stacked */
    .alert-box { padding: 20px; border-radius: 12px; margin-bottom: 16px; }
    
    .drop-zone { padding: 24px; margin-bottom: 1rem; }
    .icon-cloud { font-size: 32px; }
    .drop-text { font-size: 1rem; }
    
    .actions-row { padding: 1rem; }
    .btn-group { flex-direction: column; gap: 8px; }
    .btn { width: 100%; padding: 0.75rem; }
    
    .danger-box h2 { font-size: 1.25rem; }
}
</style>
