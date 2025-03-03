<script lang="ts">
	import { writable } from "svelte/store";
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { collection, db, getDocs, updateDoc, query, where, doc } from "$lib/firebase";

	// ✅ Modal state
	export let isOpen: boolean;
	export let application: any; // ✅ Accept application data

	// ✅ State for updating UI
	const isLoading = writable(false);

	// ✅ Function to confirm or add application status
	async function confirmApplication() {
		if (!application) return;

		isLoading.set(true);
		try {
			console.log("📌 Confirming Application:", application.applicationID);

			// ✅ Optimized query: Get the specific user's application directly
			const usersRef = collection(db, "Users");
			const usersSnapshot = await getDocs(usersRef);

			let appDocRef = null;

			for (const userDoc of usersSnapshot.docs) {
				const applicationsRef = collection(db, `Users/${userDoc.id}/Applications`);
				const q = query(applicationsRef, where("applicationID", "==", application.applicationID));
				const querySnapshot = await getDocs(q);

				if (!querySnapshot.empty) {
					const appDoc = querySnapshot.docs[0]; // ✅ Get first matching document
					appDocRef = doc(db, `Users/${userDoc.id}/Applications`, appDoc.id);
					console.log(`✅ Found application in user ${userDoc.id}'s collection.`);
					break;
				}
			}

			if (!appDocRef) {
				isLoading.set(false);
				return;
			}

			// ✅ Ensure `applicationStatus` is set
			const updatedStatus = application.applicationStatus || application.aiRecommendation || "Under Review";
			await updateDoc(appDocRef, { applicationStatus: updatedStatus });

			// ✅ Update local state
			application.applicationStatus = updatedStatus;
		} catch (error) {
			console.error("🔥 Error confirming application:", error);
		} finally {
			isLoading.set(false);
		}
	}

	// ✅ Function to alter application decision
	async function alterApplicationStatus() {
		if (!application) {
			console.error("⚠️ No application selected.");
			return;
		}

		isLoading.set(true);

		try {
			console.log("📌 Attempting to alter application for:", application.applicationID);

			const usersRef = collection(db, "Users");
			const usersSnapshot = await getDocs(usersRef);

			let appDocRef = null;
			let alteredUserEmail = null; // Track the user whose application is being altered

			for (const userDoc of usersSnapshot.docs) {
				const userData = userDoc.data();
				console.log(`🔍 Checking User: ${userDoc.id}, Email: ${userData?.userEmail || "No Email Found"}`);

				const applicationsRef = collection(db, `Users/${userDoc.id}/Applications`);
				const q = query(applicationsRef, where("applicationID", "==", application.applicationID));
				const querySnapshot = await getDocs(q);

				if (!querySnapshot.empty) {
					const appDoc = querySnapshot.docs[0]; // ✅ Get the first matching document
					appDocRef = doc(db, `Users/${userDoc.id}/Applications`, appDoc.id);
					alteredUserEmail = userData?.userEmail || "Unknown Email";
					break;
				}
			}

			if (!appDocRef) {
				console.warn("⚠️ No matching application found in any user collection.");
				isLoading.set(false);
				return;
			}

			// ✅ Ensure the AI recommendation is one of the valid ones
			const validAIRecommendations = ["Accepted", "Rejected", "Accept", "Reject"];
			let currentAIRecommendation = application.aiRecommendation;

			if (!validAIRecommendations.includes(currentAIRecommendation)) {
				console.warn("⚠️ Invalid AI recommendation. Must be 'Accepted', 'Rejected', 'Accept', or 'Reject'.");
				isLoading.set(false);
				return;
			}

			let newAIRecommendation =
    currentAIRecommendation === "Accepted" || currentAIRecommendation === "Accept"
        ? "Rejected"
        : currentAIRecommendation === "Rejected" || currentAIRecommendation === "Reject"
        ? "Accepted"
        : "Awaiting Confirmation"; // Default if unknown



			// ✅ Update Firestore document
			await updateDoc(appDocRef, { applicationStatus: newAIRecommendation });

			// ✅ Update the application locally
			application.applicationStatus = newAIRecommendation;
		} catch (error) {
			console.error("🔥 Error updating AI recommendation:", error);
		} finally {
			isLoading.set(false);
		}
	}

function handleDialogChange(open) {
    isOpen = open;
    if (!open) {
        document.body.style.overflow = ""; // Restore scrollbar when closing
    }
}

</script>

<Dialog open={isOpen} modal={false} on:openChange={handleDialogChange} on:close={() => isOpen = false}>
	<DialogContent class="custom-scrollbar">
		<DialogHeader class="sticky-header">
			<DialogTitle>Application Evaluation</DialogTitle>
			<DialogDescription>Here is the AI-generated recommendation.</DialogDescription>
		</DialogHeader>

		<!-- ✅ Make the content scrollable -->
		<div class="scrollable-content">
			{#if application}
	<div class="space-y-2">
		<p><strong>Application ID:</strong> {application.applicationID}</p>
		<p><strong>Quant-AI Recommendation:</strong> {application.aiRecommendation}</p>
		<p><strong>Quant-AI Score:</strong> {application.aiScore}</p>

		<!-- ✅ Show AI Justification Summary -->
		{#if application.aiJustification?.summary}
			<p><strong>Justification:</strong> {application.aiJustification.summary}</p>
		{:else}
			<p class="text-gray-500">No justification available.</p>
		{/if}
		<!-- ✅ Show Application Status -->
		<p><strong>Current Status:</strong>
			{#if application.applicationStatus}
				<span class="px-2 py-1 rounded bg-gray-200">{application.applicationStatus}</span>
			{:else}
				<span class="px-2 py-1 rounded bg-yellow-200">Awaiting Confirmation</span>
			{/if}
		</p>
	</div>
{:else}
	<p class="text-red-500">No evaluation found for this application.</p>
{/if}

		</div>

		<!-- ✅ Action Buttons -->
		<div class="mt-4 flex gap-3">
			{#if !application.applicationStatus}
				<Button on:click={confirmApplication} class="bg-blue-600 text-white">
					{#if $isLoading} Processing... {:else} Confirm Recommendation {/if}
				</Button>
			{/if}

			{#if application.applicationStatus}
				<Button on:click={alterApplicationStatus} class="bg-red-600 text-white">
					{#if $isLoading} Changing... {:else} Alter Decision {/if}
				</Button>
			{/if}
		</div>
	</DialogContent>
</Dialog>

<style>
/* ✅ Make content inside modal scrollable */
.scrollable-content {
    max-height: 400px; /* Limits height */
    overflow-y: auto;  /* Enables vertical scrolling */
    padding-right: 10px; /* Prevents content from hiding scrollbar */
}

/* ✅ Custom Scrollbar Styling */
.scrollable-content::-webkit-scrollbar {
    width: 8px; /* Set scrollbar width */
}

.scrollable-content::-webkit-scrollbar-track {
    background: #f1f1f1; /* Light gray background */
    border-radius: 10px;
}

.scrollable-content::-webkit-scrollbar-thumb {
    background: #888; /* Darker scrollbar */
    border-radius: 10px;
}

.scrollable-content::-webkit-scrollbar-thumb:hover {
    background: #555; /* Darker on hover */
}

/* ✅ Ensure the modal header remains visible while scrolling */
.sticky-header {
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
    padding-bottom: 10px;
    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
}
</style>
