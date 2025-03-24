import { writable } from "svelte/store";
import { getFirestore, collection, getDocs} from "firebase/firestore";
import { auth } from "$lib/firebase";

const db = getFirestore();
export const applications = writable([]);

export const fetchAllApplications = async () => {
	try {
		const usersRef = collection(db, "Users");
		const usersSnapshot = await getDocs(usersRef);

		let allApplications = [];

		for (const userDoc of usersSnapshot.docs) {
			const userData = userDoc.data();
			const userID = userDoc.id;

			// 🔹 Skip Admin Users
			if (userData.userRole === "admin") continue;

			// 🔹 Fetch Applications Subcollection
			const applicationsRef = collection(db, `Users/${userID}/Applications`);
			const applicationsSnapshot = await getDocs(applicationsRef);

			applicationsSnapshot.forEach((appDoc) => {
				const appData = appDoc.data();

				allApplications.push({
					...appData,
					userID, // 🔹 Store user ID for reference
					name: userData.userFullName || "Unknown User", // 🔹 Add user name
					email: userData.userEmail || "No Email",
					phone: userData.phone || "No Phone",
					address: userData.address || "No Address",
					city: userData.city || "No City",
					province: userData.province || "No Province",
				});
			});
		}

		// 🔹 Store in Writable Store
		applications.set(allApplications);
	} catch (error) {
		console.error("🔥 Error Fetching Applications:", error);
	}
};
