import { initializeApp } from "firebase/app";
import {
	getFirestore, collection, addDoc, updateDoc, doc, getDoc, getDocs, query, orderBy, where
} from "firebase/firestore";
import {
	getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
	signInWithPopup, GoogleAuthProvider
} from "firebase/auth";
import {
	getStorage, ref, uploadBytes, getDownloadURL
} from "firebase/storage";

// 🔹 Firebase Configuration
const firebaseConfig = {
	apiKey: "AIzaSyC-hA_PGMVW6BlsnZLJSUxgd2xQIFVYCvw",
	authDomain: "dut-applications.firebaseapp.com",
	projectId: "dut-applications",
	storageBucket: "dut-applications.firebasestorage.app",
	messagingSenderId: "148483229883",
	appId: "1:148483229883:web:ec9b4c25fad86ff01f019e",
	measurementId: "G-EP7K952RSD"
};

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// 🔹 Google Authentication
const googleProvider = new GoogleAuthProvider();

// 🔹 Function to Sign in with Google
const signInWithGoogle = async () => {
	try {
		const result = await signInWithPopup(auth, googleProvider);
		return result.user;
	} catch (error) {
		console.error("🔥 Google Sign-In Error:", error);
		throw error;
	}
};

// 🔹 Function to Sign Out
const logout = async () => {
	try {
		await signOut(auth);
		console.log("✅ Signed out successfully.");
	} catch (error) {
		console.error("🔥 Sign Out Error:", error);
	}
};

// ✅ Export Firebase utilities
export {
	app, db, auth, storage,
	collection, doc, getDoc, getDocs, updateDoc, addDoc,
	createUserWithEmailAndPassword, signInWithEmailAndPassword,
	where, query, orderBy,
	signOut, onAuthStateChanged,
	ref, uploadBytes, getDownloadURL,
	signInWithPopup, GoogleAuthProvider, signInWithGoogle, logout
};
