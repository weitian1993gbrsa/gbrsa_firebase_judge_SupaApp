import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth"; //

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
const storage = getStorage(app);
const auth = getAuth(app); // Re-initialize Auth

// AUTO-LOGIN: Assigns a silent User ID to the device.
// This prevents permission errors and stabilizes connections.
signInAnonymously(auth).catch((error) => {
    console.error("Auth Error (Did you enable Anonymous in Console?):", error);
});

export { db, storage, auth };
