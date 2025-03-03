<script lang="ts">
	import { onMount } from "svelte";
	import { writable } from "svelte/store";
	import { auth, db } from "$lib/firebase";
	import { collection, getDocs, query, where } from "firebase/firestore";
	import * as Avatar from "$lib/components/ui/avatar/index";

	// Store applications
	let applications = writable([]);

	// ✅ Function to fetch Firestore User ID using Email
	const getUserIdByEmail = async (email) => {
		try {
			console.log("📌 Searching for Firestore user with email:", email);
			const usersRef = collection(db, "Users");
			const q = query(usersRef, where("userEmail", "==", email));
			const querySnapshot = await getDocs(q);

			if (!querySnapshot.empty) {
				const userId = querySnapshot.docs[0].id; // First matching document ID
				console.log("✅ Found Firestore User ID:", userId);
				return userId;
			} else {
				console.warn("⚠️ No Firestore user found with email:", email);
				return null;
			}
		} catch (error) {
			console.error("🔥 Error fetching Firestore user ID:", error);
			return null;
		}
	};

	// ✅ Function to fetch applications
	const fetchApplications = async () => {
		try {
			const user = auth.currentUser;
			if (!user) {
				console.error("⚠️ User not logged in!");
				return;
			}

			console.log("📌 Logged-in user email:", user.email);
			const userId = await getUserIdByEmail(user.email);
			if (!userId) {
				console.warn("⚠️ User ID not found in Firestore.");
				return;
			}

			// 🔹 Reference Applications Collection
			console.log("📌 Fetching applications for user ID:", userId);
			const applicationsRef = collection(db, `Users/${userId}/Applications`);
			const querySnapshot = await getDocs(applicationsRef);

			// 🔹 Process Data
			let appList = [];
			querySnapshot.forEach((doc) => {
				appList.push({ id: doc.id, ...doc.data() });
			});

			console.log("✅ Applications fetched:", appList);
			applications.set(appList);
		} catch (error) {
			console.error("🔥 Error fetching applications:", error);
		}
	};

	// ✅ Fetch data on component mount
	onMount(fetchApplications);
</script>

<!-- 🔹 Dynamic Application List -->
<div class="space-y-8">
	<h2>Applications List</h2>
	{#each $applications as app}
		<div class="flex items-center">
			<Avatar.Root class="h-9 w-9 mr-5 cursor-pointer">
				<Avatar.Fallback>{app.businessName[0]}</Avatar.Fallback>
			</Avatar.Root>
			<div class="grid grid-cols-4 gap-6 items-center p-2 border-b cursor-pointer hover:bg-accent">
				<!-- Program Information -->
				<div class="space-y-1">
					<p class="text-sm font-medium leading-none">{app.programName}</p>
					<p class="text-muted-foreground text-sm">{app.programCategory}</p>
				</div>

				<!-- Business Information -->
				<div class="space-y-1">
					<p class="text-sm font-medium leading-none">{app.businessName}</p>
					<p class="text-muted-foreground text-sm">{app.natureOfBusiness}</p>
				</div>

				<!-- Status with Badge Styling -->
					<div class="text-center">
					{#if app.submittedAt}
						{#if (new Date().getTime() - new Date(app.submittedAt.seconds * 1000).getTime()) / (1000 * 60 * 60) >= 48}
							<!-- ✅ Show Status ONLY After 48 Hours -->
							<span
								class="px-3 py-1 text-sm font-medium rounded-lg cursor-pointer"
								class:accepted={app.applicationStatus === "Accepted"}
								class:under-review={app.applicationStatus === "Under Review"}
								class:rejected={app.applicationStatus === "Rejected"}
							>
								{app.applicationStatus || "Awaiting Confirmation"}
							</span>
						{:else}
							<!-- ✅ Hide Status (Show "Under Review" Placeholder) -->
							<span class="px-3 py-1 text-sm font-medium rounded-lg under-review">
								Under Review
							</span>
						{/if}
					{:else}
						<span class="px-3 py-1 text-sm font-medium rounded-lg bg-gray-300">No Submission Time</span>
					{/if}
				</div>
				


				<!-- Submission Date -->
				<div class="text-sm text-gray-500 text-right">
					Submitted: {new Date(app.submittedAt.seconds * 1000).toLocaleDateString()}
				</div>
			</div>

		</div>
	{/each}
</div>
<style>
            .accepted {
                background-color: #d1e7ff; /* Light Blue */
                color: #0b6cbf;
            }

            .under-review {
                background-color: #ffe5b4; /* Light Orange */
                color: #b35a00;
            }

            .rejected {
                background-color: #ffcccc; /* Light Red */
                color: #bf0b0b;
            }
				</style>
