
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

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
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
