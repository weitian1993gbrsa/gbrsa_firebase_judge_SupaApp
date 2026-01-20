import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collectionGroup, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAhHloO2GrXk6STzPYtjrUlA9e1uwyKDAo",
    authDomain: "gbrsa-supa-app.firebaseapp.com",
    projectId: "gbrsa-supa-app",
    storageBucket: "gbrsa-supa-app.firebasestorage.app",
    messagingSenderId: "10882186294",
    appId: "1:10882186294:web:ff97f046bf1a9af20d2c97",
    measurementId: "G-H2TYVQCHTY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verify() {
    console.log("--- Verifying Firestore Data ---\n");

    console.log("--- Checking Globally for ANY Entries ---\n");

    // We use collectionGroup without where filter to see if anything at all exists
    const q = query(collectionGroup(db, 'entries'));
    const snap = await getDocs(q);

    if (snap.empty) {
        console.log("❌ NO ENTRIES FOUND ANYWHERE in Firestore.");
        console.log("This suggests the upload failed or was not performed.");
    } else {
        console.log(`✅ Found ${snap.size} entries total.`);
        console.log("Sample Data (First 3):");
        let count = 0;
        snap.forEach(docSnap => {
            if (count < 3) {
                const data = docSnap.data();
                console.log(`- Path: ${docSnap.ref.path}`);
                console.log(`  Names: ${data.name1} | ${data.name2} | ${data.name3} | ${data.name4}`);
                console.log(`  Event: ${data.event}, Station: ${data.station}, Heat: ${data.heat}`);
            }
            count++;
        });
    }
}

verify().catch(console.error);
