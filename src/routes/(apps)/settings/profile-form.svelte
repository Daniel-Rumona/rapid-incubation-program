<script lang="ts">
	import { writable, get } from "svelte/store";
	import { onMount } from "svelte";
	import { auth, db } from "$lib/firebase";
	import { query, where, getDocs, collection, updateDoc, doc } from "firebase/firestore";
	import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Eye, EyeOff } from "lucide-svelte/icons";

	// 🔹 Store for user data
	let username = writable("");
	let email = writable("");
	let newPassword = writable("");
	let confirmPassword = writable("");
	let userDocId = writable(""); // Store Firestore document ID

	// 🔹 Show/Hide Password Toggle
	let showPassword = writable(false);
	let showConfirmPassword = writable(false);

	// 🔹 Fetch User Details from Firestore using `userEmail`
	onMount(async () => {
		const user = auth.currentUser;
		if (user) {
			const userEmail = user.email;
			email.set(userEmail || "");

			// Query Firestore using `userEmail`
			const usersCollection = collection(db, "Users");
			const userQuery = query(usersCollection, where("userEmail", "==", userEmail));
			const querySnapshot = await getDocs(userQuery);

			if (!querySnapshot.empty) {
				const userDoc = querySnapshot.docs[0];
				userDocId.set(userDoc.id); // Save Firestore document ID
				const userData = userDoc.data();

				// Set user details in the form
				username.set(userData.username || "");
			} else {
				console.error("⚠️ No user found in Firestore!");
			}
		} else {
			console.error("⚠️ No authenticated user!");
		}
	});

	// 🔹 Handle Profile Update
	const updateProfile = async (event: Event) => {
		event.preventDefault();

		const user = auth.currentUser;
		if (!user) {
			alert("❌ You need to be logged in to update your profile.");
			return;
		}

		const updatedData = {
			username: get(username),
		};

		try {
			const docId = get(userDocId);
			if (!docId) {
				alert("⚠️ User record not found in Firestore!");
				return;
			}

			const userRef = doc(db, "Users", docId);
			await updateDoc(userRef, updatedData);
			alert("✅ Profile updated successfully!");
		} catch (error) {
			console.error("🔥 Error updating profile:", error);
			alert("❌ Failed to update profile. Try again.");
		}
	};

	// 🔹 Handle Password Change
	const changePassword = async () => {
		const user = auth.currentUser;
		if (!user) {
			alert("❌ You must be logged in to change your password.");
			return;
		}

		if (get(newPassword).length < 6) {
			alert("⚠️ Password must be at least 6 characters long.");
			return;
		}

		if (get(newPassword) !== get(confirmPassword)) {
			alert("❌ Passwords do not match.");
			return;
		}

		try {
			await updatePassword(user, get(newPassword));
			alert("✅ Password updated successfully!");
			newPassword.set("");
			confirmPassword.set("");
		} catch (error: any) {
			if (error.code === "auth/requires-recent-login") {
				// Re-authenticate the user
				const emailCredential = EmailAuthProvider.credential(user.email!, prompt("⚠️ Re-enter your current password:") || "");
				await reauthenticateWithCredential(user, emailCredential);

				// Try updating the password again
				await updatePassword(user, get(newPassword));
				alert("✅ Password updated after re-authentication!");
			} else {
				console.error("🔥 Error updating password:", error);
				alert("❌ Failed to update password. Try again.");
			}
		}
	};
</script>

<!-- ✅ Centered & Responsive Profile Form -->

	<form class="space-y-8 items-center" on:submit={updateProfile}>
		<!-- Email Field (Pre-filled & non-editable) -->
		<div>
			<label for="email" class="block font-medium">Email</label>
			<Input id="email" type="email" bind:value={$email} disabled class="w-full mt-1 cursor-not-allowed" />
			<p class="text-sm text-gray-500">Your email cannot be changed.</p>
		</div>

		<!-- Password Change Section -->
		<div class="mt-6 border-t pt-4">
			<h3 class="text-lg font-semibold">Change Password</h3>

			<!-- New Password -->
			<div class="relative mt-2">
				<label for="new-password" class="block font-medium">New Password</label>
				<div class="relative">
					<Input id="new-password" type={$showPassword ? "text" : "password"} bind:value={$newPassword} class="w-full pr-10 mt-1" />
					<button type="button" class="absolute -right-8 top-2 p-1 text-gray-500 hover:text-gray-700" on:click={() => showPassword.set(!$showPassword)}>
						{#if $showPassword}
							<EyeOff class="h-5 w-5" />
						{:else}
							<Eye class="h-5 w-5" />
						{/if}
					</button>
				</div>
				<p class="text-sm text-gray-500">Minimum 6 characters.</p>
			</div>

			<!-- Confirm New Password -->
			<div class="relative mt-4">
				<label for="confirm-password" class="block font-medium">Confirm New Password</label>
				<div class="relative">
					<Input id="confirm-password" type={$showConfirmPassword ? "text" : "password"} bind:value={$confirmPassword} class="w-full pr-10 mt-1" />
					<button type="button" class="absolute -right-8 top-2 p-1 text-gray-500 hover:text-gray-700" on:click={() => showConfirmPassword.set(!$showConfirmPassword)}>
						{#if $showConfirmPassword}
							<EyeOff class="h-5 w-5" />
						{:else}
							<Eye class="h-5 w-5" />
						{/if}
					</button>
				</div>
			</div>

			<!-- Change Password Button -->
			<Button type="button" class="w-full mt-3 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition" on:click={changePassword}>
				Update Password
			</Button>
		</div>

		<!-- Update Profile Button -->
		<Button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">Update Profile</Button>
	</form>


