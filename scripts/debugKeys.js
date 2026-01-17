
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function listKeys() {
    console.log("Fetching Access Keys...");
    try {
        const querySnapshot = await getDocs(collection(db, "access_keys"));
        if (querySnapshot.empty) {
            console.log("No keys found!");
        } else {
            console.log("\n--- CURRENT KEYS ---\n");
            querySnapshot.forEach((doc) => {
                console.log(`ID (Password): [${doc.id}] | Role: ${doc.data().role}`);
            });
            console.log("\n--------------------\n");
        }
    } catch (e) {
        console.error("Error fetching keys:", e);
    }
    process.exit();
}

listKeys();
