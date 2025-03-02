<script lang="ts">
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button";
	import { Label } from "$lib/components/ui/label";
	import { Input } from "$lib/components/ui/input";
	import { db, auth, collection, addDoc, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "$lib/firebase";
	import { doc, setDoc } from "firebase/firestore";
	import { writable } from "svelte/store";
	import { Eye, EyeOff } from "lucide-svelte/icons";
	import { Icons } from "$lib/components/ui/icons";
	import { slide } from "svelte/transition";
	import GLTFModel from "$lib/components/ui/GLTFModel.svelte";

	// ✅ Transitions
	const isSliding = writable(false);
	const isLoading = writable(false);
	const errorMessage = writable("");

	// ✅ Show/Hide Password State
	const showPassword = writable(false);
	const showConfirmPassword = writable(false);

	// ✅ Handle Sign-in Navigation
	const goToSignin = () => {
		isSliding.set(true);
		setTimeout(() => {
			goto("/signin");
		}, 500);
	};

	// ✅ Form State
	let firstName = "";
	let lastName = "";
	let email = "";
	let password = "";
	let confirmPassword = "";

	// ✅ Firebase Authentication Error Messages
	const authErrors: Record<string, string> = {
		"auth/email-already-in-use": "This email is already registered. Try logging in.",
		"auth/invalid-email": "Invalid email format. Please enter a valid email.",
		"auth/weak-password": "Password should be at least 6 characters long.",
		"auth/network-request-failed": "Network error. Check your internet connection.",
	};

	// ✅ List of Admin Emails
	const adminEmails = [
		"helperzhou@gmail.com",
		"solomonn@dut.ac.za",
		"brightnessn@dut.ac.za",
		"snelisiweh@dut.ac.za"
	];

	const handleSignup = async () => {
		isLoading.set(true);
		errorMessage.set("");

		// Check if passwords match
		if (password !== confirmPassword) {
			errorMessage.set("Passwords do not match!");
			isLoading.set(false);
			return;
		}

		try {
			// ✅ Create User in Firebase Authentication
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;

			// ✅ Determine User Role
			const userRole = adminEmails.includes(email) ? "admin" : "user"; // Assign role based on email

			// ✅ Save User Details in Firestore
			const userRef = doc(db, "Users", user.uid); 
			await setDoc(userRef, {
					userEmail: user.email,
					userFullName: `${firstName} ${lastName}`,
					userRole: userRole,
					createdAt: new Date(),
					});
			// ✅ Clear Form Fields After Signup
			firstName = "";
			lastName = "";
			email = "";
			password = "";
			confirmPassword = "";

			// ✅ Redirect based on user role
			goto(userRole === "admin" ? "/dashboard" : "/track-application/tracker");

		} catch (error) {
			console.error("🔥 Firebase Auth Error:", error);
			errorMessage.set(authErrors[error.code] || "An unknown error occurred. Please try again.");
		} finally {
			isLoading.set(false);
		}
	};

	// ✅ Handle Google Signup
	const handleGoogleSignup = async () => {
	const provider = new GoogleAuthProvider();
	try {
		const result = await signInWithPopup(auth, provider);
		const user = result.user;

		// ✅ Store user using UID in Firestore
		const userRef = doc(db, "Users", user.uid);
		await setDoc(userRef, {
			userEmail: user.email,
			userFullName: user.displayName,
			userRole: "user",
			createdAt: new Date(),
		}, { merge: true });

		console.log("✅ Google Signup Successful:", user.email);
		goto("/track-application/tracker"); // Redirect to dashboard

	} catch (error) {
		console.error("🔥 Google Signup Error:", error);
		errorMessage.set("Google sign-up failed. Try again.");
	}
};
</script>

<!-- ✅ Signup Page Layout -->
<div class="h-screen lg:grid lg:min-h-[600px] lg:grid-cols-2" transition:slide="{{ x: $isSliding ? -500 : 0 }}">
	<!-- 🔹 LEFT SIDE: Background & Branding -->
	<div class="relative hidden flex flex-col items-center justify-center p-10 text-white lg:flex dark:border-r background-img">
		<!-- ✅ Logos -->
		<div class="absolute top-4 left-4 opacity-90">
			<img src="/dut-cseri.png" alt="DUT CSE Logo" class="logo-left">
		</div>
		<div class="absolute bottom-4 right-4 opacity-90">
			<img src="/QuantilytixO.png" alt="Quant Logo" class="logo-right">
		</div>

		<!-- ✅ Centered 3D Model -->
		<div class="relative flex items-center justify-center h-full w-full">
			<GLTFModel class="max-w-[80%] mx-auto" />
		</div>

	</div>

	<!-- 🔹 RIGHT SIDE: SIGN-UP FORM -->
	<div class="flex items-center justify-center p-6 w-full">
		<div class="w-full max-w-md">
			<div class="text-center">
				<h1 class="text-2xl font-semibold">Sign Up</h1>
				<p class="text-sm text-gray-600">Enter your information to create an account to be able to apply.</p>
			</div>

			<!-- SIGN-UP FORM -->
			<form on:submit|preventDefault={handleSignup} class="grid gap-4 mt-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label for="first-name">First name</Label>
						<Input id="first-name" bind:value={firstName} placeholder="John" required />
					</div>
					<div class="grid gap-2">
						<Label for="last-name">Last name</Label>
						<Input id="last-name" bind:value={lastName} placeholder="Doe" required />
					</div>
				</div>
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input id="email" type="email" bind:value={email} placeholder="m@example.com" required />
				</div>
				<div class="grid gap-2 relative">
					<Label for="password">Password</Label>
					<Input id="password" type={$showPassword ? "text" : "password"} bind:value={password} required />
					<button
						type="button"
						class="absolute -right-7 top-6 p-1"
						on:click={() => showPassword.set(!$showPassword)}
					>
						{#if $showPassword}
							<EyeOff class="h-5 w-5" />
						{:else}
							<Eye class="h-5 w-5" />
						{/if}
					</button>
				</div>

				<div class="grid gap-2 relative">
					<Label for="confirm-password">Confirm Password</Label>
					<Input id="confirm-password" type={$showConfirmPassword ? "text" : "password"} bind:value={confirmPassword} required />
					<button
						type="button"
						class="absolute -right-7 top-6 p-1"
						on:click={() => showConfirmPassword.set(!$showConfirmPassword)}
					>
						{#if $showConfirmPassword}
							<EyeOff class="h-5 w-5" />
						{:else}
							<Eye class="h-5 w-5" />
						{/if}
					</button>
				</div>



				<!-- 🔹 Display Error Message -->
				{#if $errorMessage}
					<p class="text-red-500 text-sm text-center">⚠️ {$errorMessage}</p>
				{/if}

				<Button type="submit" class="w-full" disabled={$isLoading}>
					{#if $isLoading}
						<Icons.spinner class="mr-2 h-4 w-4 animate-spin" />
						Signing Up...
					{:else}
						Create an account
					{/if}
				</Button>

				<!-- ✅ Google Sign-Up Button -->
				<Button type="button" class="w-full mt-2 bg-red-500 hover:bg-red-600" on:click={handleGoogleSignup}>
					<Icons.google class="mr-2 h-5 w-5" />
					Sign Up with Google
				</Button>
				<div class="mt-4 text-center text-sm">
					Already have an account?
					<a href="##" on:click={goToSignin()} class="underline"> Sign in </a>
				</div>
			</form>
		</div>
	</div>
</div>
<style>
    /* ✅ Background Image */
    .background-img {
        background: url("/background.jpg") no-repeat center center;
        background-size: cover;
    }

    /* ✅ Logos - Scaled Responsively */
    .logo-left, .logo-right {
        width: clamp(80px, 15vw, 200px);
        height: auto;
        object-fit: contain;
    }

    /* ✅ Mobile Responsiveness */
    @media (max-width: 768px) {
        .background-img {
            background-size: contain;
            background-repeat: no-repeat;
        }
    }
</style>
