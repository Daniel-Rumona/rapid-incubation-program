import { writable } from "svelte/store";
import { db, collection, getDocs } from "$lib/firebase";

// ✅ Use `const` since this is not reassigned
const programs = writable([]);

// ✅ Function to fetch programs
export const fetchPrograms = async () => {
	try {
		console.log("Fetching programs from Firestore...");
		const programsRef = collection(db, "Programs");
		const querySnapshot = await getDocs(programsRef);

		let programList = [];
		querySnapshot.forEach((doc) => {
			const data = doc.data();
			programList.push({
				id: doc.id,
				title: data.programName, // ✅ Matches Firestore
				status: data.programStatus.toLowerCase(),
				priority: data.programPriority.toLowerCase() ,
				label: data.programLabel.toLowerCase(),
				programID: data.programID,
				budget: data.programBudget,
			});
		});

		// ✅ Update store & log the result
		programs.set(programList);
		console.log("✅ Programs Fetched:", programList);
	} catch (error) {
		console.error("🔥 Error fetching programs:", error);
	}
};

// ✅ Export `const data` to fix ESLint warning
export const data = programs;
