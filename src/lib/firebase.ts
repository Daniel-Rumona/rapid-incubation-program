import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, doc, getDoc, getDocs, query, orderBy, where } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


const firebaseConfig = {
	apiKey: "AIzaSyC-hA_PGMVW6BlsnZLJSUxgd2xQIFVYCvw",
	authDomain: "dut-applications.firebaseapp.com",
	projectId: "dut-applications",
	storageBucket: "dut-applications.firebasestorage.app",
	messagingSenderId: "148483229883",
	appId: "1:148483229883:web:ec9b4c25fad86ff01f019e",
	measurementId: "G-EP7K952RSD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // 🔹 Add Storage Support

export { db, auth, collection, doc, getDoc, getDocs, updateDoc, addDoc, createUserWithEmailAndPassword, signInWithEmailAndPassword, storage, where, ref, uploadBytes, getDownloadURL, orderBy, query, signOut, onAuthStateChanged };



