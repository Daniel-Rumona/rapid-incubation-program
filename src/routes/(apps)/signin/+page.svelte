<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { auth, db, signInWithEmailAndPassword } from "$lib/firebase";
	import { query, where, getDocs, collection } from "firebase/firestore";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import  {Icons} from "$lib/components/ui/icons";
	import { writable } from 'svelte/store';
	import { slide } from "svelte/transition"; // ✅ Import slide transition
	import GLTFModel from "$lib/components/ui/GLTFModel.svelte";

	const isSliding = writable(false);
	// ✅ Add transition before navigating to signup
	const goToSignup = () => {
		isSliding.set(true); // Start slide effect
		setTimeout(() => {
			goto("/signup"); // Navigate after animation
		}, 500); // Delay for smooth transition
	};
	const isLoading = writable(false); // ✅ Now it's a store

	// Form state
	let email = "";
	let password = "";
	let errorMessage = "";

	const firestoreErrorMessages: Record<string, string> = {
		"auth/claims-too-large": "Your account settings are too large to process. Try reducing custom data.",
		"auth/email-already-exists": "This email is already registered. Try logging in instead.",
		"auth/id-token-expired": "Your session has expired. Please log in again.",
		"auth/id-token-revoked": "Your session has been revoked. Log in again to continue.",
		"auth/insufficient-permission": "You don’t have permission to perform this action. Contact support if needed.",
		"auth/internal-error": "An unexpected error occurred. Please try again later.",
		"auth/invalid-argument": "There was an issue with the data you entered. Please check and try again.",
		"auth/invalid-claims": "The account settings provided are invalid. Contact support.",
		"auth/invalid-continue-uri": "The redirect link is invalid. Please use a valid URL.",
		"auth/invalid-creation-time": "The provided creation date is not formatted correctly.",
		"auth/invalid-credential": "There is a problem with your login credentials. Try again or reset your password.",
		"auth/invalid-disabled-field": "Invalid account status. Please contact support.",
		"auth/invalid-display-name": "The name must be a valid, non-empty text.",
		"auth/invalid-dynamic-link-domain": "The provided link is not configured for this project.",
		"auth/invalid-email": "Please enter a valid email address.",
		"auth/invalid-email-verified": "The email verification status must be true or false.",
		"auth/invalid-hash-algorithm": "Invalid password encryption method.",
		"auth/invalid-hash-block-size": "Invalid password hash settings.",
		"auth/invalid-hash-derived-key-length": "Invalid password encryption settings.",
		"auth/invalid-hash-key": "Invalid security key for password storage.",
		"auth/invalid-hash-memory-cost": "Invalid security settings for password encryption.",
		"auth/invalid-hash-parallelization": "Invalid security settings for password encryption.",
		"auth/invalid-hash-rounds": "Invalid password encryption strength.",
		"auth/invalid-hash-salt-separator": "Invalid password hashing method.",
		"auth/invalid-id-token": "Your login session is invalid. Please log in again.",
		"auth/invalid-last-sign-in-time": "Invalid last login timestamp.",
		"auth/invalid-page-token": "Invalid page request. Please try again.",
		"auth/invalid-password": "Your password must be at least 6 characters long.",
		"auth/invalid-password-hash": "Invalid password format.",
		"auth/invalid-password-salt": "Invalid password security settings.",
		"auth/invalid-phone-number": "Invalid phone number format. Use E.164 format (e.g., +1234567890).",
		"auth/invalid-photo-url": "Invalid profile picture link. Use a proper URL.",
		"auth/invalid-provider-data": "Invalid authentication provider data.",
		"auth/invalid-provider-id": "Invalid login provider selected.",
		"auth/invalid-oauth-responsetype": "Invalid OAuth login settings.",
		"auth/invalid-session-cookie-duration": "Session must last between 5 minutes and 2 weeks.",
		"auth/invalid-uid": "User ID must be a non-empty string with up to 128 characters.",
		"auth/invalid-user-import": "Invalid user data provided.",
		"auth/maximum-user-count-exceeded": "Too many users created at once. Try again later.",
		"auth/missing-android-pkg-name": "Android package name is missing.",
		"auth/missing-continue-uri": "A redirect URL must be provided.",
		"auth/missing-hash-algorithm": "Missing security encryption details for password import.",
		"auth/missing-ios-bundle-id": "Missing iOS bundle ID.",
		"auth/missing-uid": "User ID is required.",
		"auth/missing-oauth-client-secret": "OAuth client secret is required.",
		"auth/operation-not-allowed": "This login method is disabled. Contact support.",
		"auth/phone-number-already-exists": "This phone number is already linked to another account.",
		"auth/project-not-found": "Firebase project not found. Contact support.",
		"auth/reserved-claims": "Some settings are restricted and cannot be used.",
		"auth/session-cookie-expired": "Session expired. Log in again.",
		"auth/session-cookie-revoked": "Session has been revoked. Please log in again.",
		"auth/too-many-requests": "Too many failed attempts. Please wait before trying again.",
		"auth/uid-already-exists": "This user ID is already taken.",
		"auth/unauthorized-continue-uri": "This redirect link is not allowed. Contact support.",
		"auth/user-not-found": "No account found with this email. Please check or sign up.",
	};



	const handleLogin = async () => {
		isLoading.set(true);
		errorMessage = ""; // Reset error message

		try {
			// 🔹 Firebase Authentication
			const userCredential = await signInWithEmailAndPassword(auth, email, password);

			// 🔹 Query Firestore for the user document using email
			const usersCollection = collection(db, "Users");
			const userQuery = query(usersCollection, where("userEmail", "==", email));
			const querySnapshot = await getDocs(userQuery);

			if (!querySnapshot.empty) {
				const userDoc = querySnapshot.docs[0];
				const userData = userDoc.data();
				const userRole = userData.userRole || "user";

				// 🔹 Redirect based on user role
				if (userRole === "admin") {
					goto("/dashboard");
				} else {
					goto("/track-application/tracker");
				}
			} else {
				errorMessage = "User data not found. Contact support.";
			}

		} catch (error) {
			console.error("🔥 Firebase Auth Error:", error);

			// 🔹 Map error codes to friendly messages
			errorMessage = firestoreErrorMessages[error.code] || "An unknown error occurred. Please try again.";

		} finally {
			isLoading.set(false);
		}
	};

</script>

<div class="h-screen w-full lg:grid lg:min-h-[600px] lg:grid-cols-2" transition:slide="{{ x: isSliding ? -500 : 0 }}" >
	<div class="flex items-center justify-center py-12">
		<div class="mx-auto grid w-[350px] gap-6">
			<div class="grid gap-2 text-center">
				<h1 class="text-3xl font-bold">Login</h1>
				<p class="text-muted-foreground text-balance">
					Enter your email below to login to your account
				</p>
			</div>
			<div class="grid gap-4">
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input id="email" type="email" placeholder="m@example.com" bind:value={email} required />
				</div>
				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input id="password" type="password" bind:value={password} required />
					<a href="##" class="mr-auto inline-block text-sm underline">Forgot your password?</a>
				</div>
				<!-- Display Error Message -->
				{#if errorMessage}
					<p class="text-red-500 text-sm text-center">{errorMessage}</p>
				{/if}
				<Button type="button" class="w-full" on:click={handleLogin} disabled={$isLoading}>
					{#if $isLoading}
						<Icons.spinner class="mr-2 h-4 w-4 animate-spin" />
						Signing In...
					{:else}
						Login
					{/if}
				</Button>

			</div>
			<div class="mt-4 text-center text-sm">
				Don&apos;t have an account?
				<a href="##" on:click={goToSignup()} class="underline"> Sign up </a>
			</div>
		</div>
	</div>

	<!-- Background Section -->
	<!-- Right-Side Background Section -->


<!--	<div class="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">-->
<!--		<div-->
<!--			class="absolute inset-0 bg-cover"-->
<!--			style="-->
<!--				background-image:-->
<!--					url(https://images.unsplash.com/photo-1590069261209-f8e9b8642343?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1376&q=80);"-->
<!--		></div>-->
<!--		<div class="relative flex items-center text-lg font-medium">-->
<!--			&lt;!&ndash; ✅ Icon Positioned Absolutely Behind Text &ndash;&gt;-->
<!--			<div class="absolute left-4 top-1/2 -translate-y-1/2 opacity-1">-->
<!--				<img src="/dut-cseri.png" alt="CSE Icon" class="h-16 w-26 object-cover">-->
<!--			</div>--><!-- ✅ Right-Side Background Section -->
	<!-- ✅ Right-Side Background Section with Background Image -->
	<div class="relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r background-img">
		<!-- Header Text -->
		<div class="relative flex items-center text-lg font-medium">
			<div class="absolute left-4 top-4 opacity-90">
				<img src="/dut-cseri.png" alt="CSE Icon" class="h-16 w-26 object-cover">
			</div>
			<span class="relative z-10 ml-60">DUT | CSE Rapid Incubation Program</span>
		</div>

		<!-- ✅ Insert Larger 3D Model Inside the Right-Side Div -->
		<div class="relative flex items-center justify-center h-full">
			<GLTFModel />
		</div>

		<!-- ✅ Powered by Text & Icon (Bottom-Right) -->
		<div class="absolute right-2 bottom-2 text-center">
			<img src="/QuantilytixO.png" alt="Quant Logo" class="h-32 w-[250px] rounded-sm object-contain opacity-90">
		</div>
	</div>
</div>
<style>
    /* ✅ Background Image Instead of Gradient */
    .background-img {
        background: url("/background.jpg") no-repeat center center;
        background-size: cover;
    }
</style>