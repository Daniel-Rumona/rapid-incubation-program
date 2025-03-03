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

	// ✅ Function to confirm the AI recommendation
	async function confirmApplication() {
		if (!application) return;

		isLoading.set(true);
		try {
			console.log("📌 Confirming Application:", application.applicationID);

			// ✅ Fetch the correct Firestore document reference
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
				console.warn("⚠️ No document found for this application ID.");
				isLoading.set(false);
				return;
			}

			// ✅ Update Firestore with the AI recommendation
			await updateDoc(appDocRef, { applicationStatus: application.aiRecommendation });
			console.log("✅ applicationStatus set to AI Recommendation:", application.aiRecommendation);

			// ✅ Update local state
			application.applicationStatus = application.aiRecommendation;
		} catch (error) {
			console.error("🔥 Error confirming application:", error);
		} finally {
			isLoading.set(// ✅ Function to alter the decision
async function alterApplicationStatus() {
    if (!application) {
        console.error("⚠️ No application selected.");
        return;
    }

    isLoading.set(true);
    try {
        console.log("📌 Attempting to alter application for:", application.applicationID);

        // ✅ Fetch the correct Firestore document reference
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
            console.warn("⚠️ No document found for this application ID.");
            isLoading.set(false);
            return;
        }

        // ✅ Toggle between Accepted & Rejected while handling multiple variations
        let currentStatus = application.applicationStatus;
        let newStatus = ["Accepted", "Accept"].includes(currentStatus) ? "Rejected" : "Accepted";

        console.log(`🔄 Changing application status from ${currentStatus} to ${newStatus}`);

        // ✅ Update Firestore with the new status
        await updateDoc(appDocRef, { applicationStatus: newStatus });
        console.log(`✅ applicationStatus changed to: ${newStatus}`);

        // ✅ Update local state
        application.applicationStatus = newStatus;
    } catch (error) {
        console.error("🔥 Error altering application decision:", error);
    } finally {
        isLoading.set(false);
    }
}

	// ✅ Function to alter the decision
  
	function handleDialogChange(open) {
		isOpen = open;
		if (!open) {
			document.body.style.overflow = ""; // Restore scrollbar when closing
		}
	}
</script>

<Dialog open={isOpen} modal={false} on:openChange={handleDialogChange} on:close={() => isOpen = false}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Application Evaluation</DialogTitle>
			<DialogDescription>Here is the AI-generated recommendation.</DialogDescription>
		</DialogHeader>

		{#if application}
			<div class="space-y-2">
				<p><strong>Application ID:</strong> {application.applicationID}</p>
				<p><strong>Quant-AI Recommendation:</strong> {application.aiRecommendation}</p><p><strong>Quant-AI Score:</strong> {application.aiScore}</p>
<p><strong>Justification:</strong> 
    {#if typeof application.aiJustification === "string"}
        {application.aiJustification}
    {:else if application.aiJustification?.summary}
        {application.aiJustification.summary}
    {:else}
        <span class="text-gray-500">No justification available.</span>
    {/if}
</p>	
				<p><strong>Current Status:</strong>
					{#if application.applicationStatus}
						<span class="px-2 py-1 rounded bg-gray-200">{application.applicationStatus}</span>
					{:else}
						<span class="px-2 py-1 rounded bg-yellow-200">Awaiting Confirmation</span>
					{/if}
				</p>
			</div>

			<div class="mt-4 flex gap-3">
				<!-- ✅ Show Confirm button if status is missing -->
				{#if !application.applicationStatus}
					<Button on:click={confirmApplication} class="bg-blue-600 text-white">
						{#if $isLoading} Processing... {:else} Confirm Recommendation {/if}
					</Button>
				{/if}

				<!-- ✅ Show Alter button if status exists -->
				{#if application.applicationStatus}
					<Button on:click={alterApplicationStatus} class="bg-red-600 text-white">
						{#if $isLoading} Changing... {:else} Alter Decision {/if}
					</Button>
				{/if}
			</div>
		{:else}
			<p class="text-red-500">No evaluation found for this application.</p>
		{/if}
	</DialogContent>
</Dialog>
