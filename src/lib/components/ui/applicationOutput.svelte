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

        // ✅ If applicationStatus is missing, set it first
        const updatedStatus = application.applicationStatus || application.aiRecommendation || "Under Review";
        await updateDoc(appDocRef, { applicationStatus: updatedStatus });
        console.log("✅ applicationStatus set to:", updatedStatus);

        // ✅ Update local state
        application.applicationStatus = updatedStatus;
    } catch (error) {
        console.error("🔥 Error confirming application:", error);
    } finally {
        isLoading.set(false);
    }
}

// ✅ Function to alter application decisionconsole.warn("⚠️ No document found for this application ID.");
async function alterApplicationStatus() {
    if (!selectedApplication) {
        console.error("⚠️ No application selected.");
        return;
    }

    isLoading.set(true);

    try {
        console.log("📌 Attempting to alter application for:");
        console.log("   - Application ID:", selectedApplication.applicationID);

        const usersRef = collection(db, "Users");
        const usersSnapshot = await getDocs(usersRef);

        let appDocRef = null;
        let alteredUserEmail = null; // Track the user whose application is being altered
        let currentAIRecommendation = selectedApplication.aiRecommendation;

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            console.log(`🔍 Checking User: ${userDoc.id}, Email: ${userData?.userEmail || "No Email Found"}`);

            const applicationsRef = collection(db, `Users/${userDoc.id}/Applications`);
            const q = query(applicationsRef, where("applicationID", "==", selectedApplication.applicationID));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const appDoc = querySnapshot.docs[0]; // ✅ Get the first matching document
                appDocRef = doc(db, `Users/${userDoc.id}/Applications`, appDoc.id);
                alteredUserEmail = userData?.userEmail || "Unknown Email";

                console.log(`✅ Found Application in User ${userDoc.id}'s Collection`);
                console.log(`   - Altering Application Document ID: ${appDoc.id}`);
                console.log(`   - User Email: ${alteredUserEmail}`);
                console.log(`   - Current AI Recommendation: ${currentAIRecommendation}`);

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
        if (!validAIRecommendations.includes(currentAIRecommendation)) {
            console.warn("⚠️ Invalid AI recommendation. Must be 'Accepted', 'Rejected', 'Accept', or 'Reject'.");
            isLoading.set(false);
            return;
        }

        // ✅ Toggle the AI recommendation
        let newAIRecommendation;
        if (currentAIRecommendation === "Accepted" || currentAIRecommendation === "Accept") {
            newAIRecommendation = "Rejected";
        } else if (currentAIRecommendation === "Rejected" || currentAIRecommendation === "Reject") {
            newAIRecommendation = "Accepted";
        } else {
            console.warn("⚠️ Unexpected AI recommendation encountered.");
            isLoading.set(false);
            return;
        }

        // ✅ Update Firestore document
        await updateDoc(appDocRef, { aiRecommendation: newAIRecommendation });

        console.log(`✅ Successfully Updated AI Recommendation: ${newAIRecommendation}`);
        console.log(`   - Application ID: ${selectedApplication.applicationID}`);
        console.log(`   - User Email: ${alteredUserEmail}`);

        // ✅ Update the selected application locally
        selectedApplication.update(app => ({ ...app, aiRecommendation: newAIRecommendation }));
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
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Application Evaluation</DialogTitle>
			<DialogDescription>Here is the AI-generated recommendation.</DialogDescription>
		</DialogHeader>

		{#if application}
			<div class="space-y-2">
				<p><strong>Application ID:</strong> {application.applicationID}</p>
				<p><strong>Quant-AI Recommendation:</strong> {application.aiRecommendation}</p>
				<p><strong>Quant-AI Score:</strong> {application.aiScore}</p>
				<p><strong>Justification:</strong> {application.aiJustification}</p>
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
