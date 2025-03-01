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
import { getFunctions } from "firebase/functions";

let firebaseApp: any = null;
let firebaseConfig: any = null;
let db: any = null;
let auth: any = null;
let storage: any = null; // 🔥 Declare storage globally

// ✅ Function to fetch Firebase Config from Secure API Route
async function fetchFirebaseConfig() {
	if (!firebaseConfig) {
		const res = await fetch("/api/firebase-config");
		firebaseConfig = await res.json();
	}
	return firebaseConfig;
}

// ✅ Async function to initialize Firebase securely
async function initializeFirebase() {
	if (!firebaseApp) {
		const config = await fetchFirebaseConfig();
		firebaseApp = initializeApp(config);
		db = getFirestore(firebaseApp); 
		auth = getAuth(firebaseApp);
		storage = getStorage(firebaseApp); // 🔥 Initialize Storage
	}
	return firebaseApp;
}

// ✅ Initialize Firebase & Export services
export const getFirebaseApp = async () => {
	const app = await initializeFirebase();
	return app;
};

export const getFirestoreDB = async () => {
	if (!db) {
		await initializeFirebase(); 
	}
	return db;
};

export const getFirebaseAuth = async () => {
	if (!auth) {
		await initializeFirebase();
	}
	return auth;
};

export const getFirebaseStorage = async () => {
	if (!storage) {
		await initializeFirebase();
	}
	return storage;
};

export const getFirebaseFunctions = async () => {
	const app = await initializeFirebase();
	return getFunctions(app, "us-central1");
};

// ✅ Google Authentication Provider
const googleProvider = new GoogleAuthProvider();

// ✅ Function to Sign in with Google
export const signInWithGoogle = async () => {
	const auth = await getFirebaseAuth();
	try {
		const result = await signInWithPopup(auth, googleProvider);
		return result.user;
	} catch (error) {
		console.error("🔥 Google Sign-In Error:", error);
		throw error;
	}
};

// ✅ Function to Sign Out
export const logout = async () => {
	const auth = await getFirebaseAuth();
	try {
		await signOut(auth);
		console.log("✅ Signed out successfully.");
	} catch (error) {
		console.error("🔥 Sign Out Error:", error);
	}
};

// ✅ Firestore Functions
export const addToCollection = async (collectionName: string, data: any) => {
	const db = await getFirestoreDB();
	return addDoc(collection(db, collectionName), data);
};

export const getCollection = async (collectionName: string) => {
	const db = await getFirestoreDB();
	const colRef = collection(db, collectionName);
	const snapshot = await getDocs(colRef);
	return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// ✅ 🔥 Export `db`, `auth`, and `storage` directly to fix import errors
export { db, auth, storage };

// ✅ Export Common Firebase Functions
export {
	collection, doc, getDoc, getDocs, updateDoc, addDoc,
	createUserWithEmailAndPassword, signInWithEmailAndPassword,
	where, query, orderBy,
	signOut, onAuthStateChanged,
	ref, uploadBytes, getDownloadURL,
	signInWithPopup, GoogleAuthProvider
};
