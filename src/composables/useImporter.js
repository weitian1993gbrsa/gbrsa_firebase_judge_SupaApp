import { ref } from 'vue'
import Papa from 'papaparse'
import { db } from '../firebase'
import { collection, writeBatch, doc, getDocs, getDoc, collectionGroup, setDoc, query, limit } from 'firebase/firestore'

export function useImporter() {
    const status = ref('')
    const isUploading = ref(false)
    const parsedData = ref([])
    const progress = ref({ current: 0, total: 0 })

    const handleFile = (file, callback) => {
        if (!file) return
        status.value = "Parsing CSV..."
        progress.value = { current: 0, total: 0 }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                console.log("Parsed raw:", results.data)
                const mapped = results.data.map(mapParticipant).filter(p => p.entry_code)
                parsedData.value = mapped
                status.value = `Parsed ${mapped.length} participants. Ready to upload.`
                if (callback) callback(mapped)
            },
            error: (err) => {
                status.value = "Parsing Error: " + err.message
            }
        })
    }

    const mapParticipant = (item) => {
        // Handle entry_code variants
        const entry_code = String(item.entry || item.ENTRY || item.entry_code || item.id || item.ID || "").trim()

        // --- NAME MAPPING ---
        let names = []
        const rawName = item.name || item.NAME || ""

        if (rawName) {
            names = rawName.split(/[\n\r\t,;]+/).map(n => n.trim()).filter(n => n)
        } else {
            names = [
                item.name1 || item.NAME1 || "",
                item.name2 || item.NAME2 || "",
                item.name3 || item.NAME3 || "",
                item.name4 || item.NAME4 || ""
            ].map(n => n.trim()).filter(n => n)
        }

        return {
            entry_code,
            name1: names[0] || "",
            name2: names[1] || "",
            name3: names[2] || "",
            name4: names[3] || "",
            team: (item.team || item.TEAM || "").trim(),
            state: (item.state || item.STATE || "").trim(),
            station: String(item.station || item.STATION || "1").trim(),
            event: (item.event || item.EVENT || "").trim(),
            heat: String(item.heat || item.HEAT || "1").trim(),
            division: (item.division || item.DIVISION || "").trim(),
            status: (item.status || item.STATUS || "normal").trim(),

            // --- THIS WAS MISSING ---
            time: (item.time || item.Time || item.TIME || item.Schedule || item.schedule || item["Start Time"] || "").trim()
        }
    }

    const performUpload = async () => {
        if (parsedData.value.length === 0) return
        isUploading.value = true
        status.value = "Starting Upload..."
        progress.value = { current: 0, total: parsedData.value.length }

        const batchSize = 400
        const chunks = []
        for (let i = 0; i < parsedData.value.length; i += batchSize) {
            chunks.push(parsedData.value.slice(i, i + batchSize))
        }

        try {
            let count = 0
            for (const chunk of chunks) {
                const batch = writeBatch(db)
                chunk.forEach(p => {
                    const sId = p.station || "1"
                    const ref = doc(db, "competition", sId, "entries", p.entry_code)
                    batch.set(ref, p)
                })
                await batch.commit()
                count += chunk.length
                progress.value.current = count
                status.value = `Uploaded ${count} / ${parsedData.value.length} records...`
            }

            // Verification Step
            status.value = "Verifying data on server..."
            const sample = parsedData.value[0]
            if (sample) {
                const sId = sample.station || "1"
                const checkRef = doc(db, "competition", sId, "entries", sample.entry_code)
                const snap = await getDocFromCacheOrServer(checkRef)

                if (!snap.exists()) {
                    throw new Error("Upload appeared successful, but server verification failed. Data not found.")
                }
            }

            status.value = `✅ Success! Uploaded ${count} records. Verified.`
            setTimeout(() => { parsedData.value = [] }, 2000)

        } catch (err) {
            console.error(err)
            status.value = "Upload Error: " + err.message
        } finally {
            isUploading.value = false
        }
    }

    async function getDocFromCacheOrServer(ref) {
        try {
            return await getDocs(query(collection(db, '_dummy_'), limit(1))).then(() => getDoc(ref))
                .catch(() => getDoc(ref))
        } catch (e) {
            return await getDoc(ref)
        }
    }

    const wipeDatabase = async () => {
        if (!confirm("DANGER: This will delete ALL participants from Firebase. Are you sure?")) return
        isUploading.value = true
        status.value = "Scanning database..."

        try {
            const querySnapshot = await getDocs(collectionGroup(db, "entries"))
            const total = querySnapshot.size

            if (total === 0) {
                status.value = "Database is already empty."
                isUploading.value = false
                return
            }

            status.value = `Found ${total} records. Deleting...`

            const batchSize = 400
            const docs = querySnapshot.docs
            const batches = []

            for (let i = 0; i < total; i += batchSize) {
                const chunk = docs.slice(i, i + batchSize)
                const batch = writeBatch(db)
                chunk.forEach(doc => batch.delete(doc.ref))
                batches.push(batch.commit())
            }

            await Promise.all(batches)
            status.value = `✅ Successfully wiped ${total} records.`
        } catch (err) {
            console.error(err)
            status.value = "Wipe Error: " + err.message
        } finally {
            isUploading.value = false
        }
    }

    return {
        status,
        isUploading,
        parsedData,
        progress,
        handleFile,
        performUpload,
        wipeDatabase
    }
}