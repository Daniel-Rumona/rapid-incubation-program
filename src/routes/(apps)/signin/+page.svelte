<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { auth, db, signInWithEmailAndPassword } from "$lib/firebase";
	import { doc, getDoc, query, where, getDocs, collection } from "firebase/firestore";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Icons } from "$lib/components/ui/icons";
	import { writable } from 'svelte/store';
	import { slide } from "svelte/transition";
	import { Eye, EyeOff } from "lucide-svelte/icons";
	import GLTFModel from "$lib/components/ui/GLTFModel.svelte";

	// ✅ Transitions
	const isSliding = writable(false);
	const isLoading = writable(false);

	// ✅ Show/Hide Password State
	const showPassword = writable(false);

	// ✅ Handle Signup Transition
	const goToSignup = () => {
		isSliding.set(true);
		setTimeout(() => {
			goto("/signup");
		}, 500);
	};

	// ✅ Form State
	let email = "";
	let password = "";
	let errorMessage = "";

	const handleLogin = async () => {
	isLoading.set(true);
	errorMessage = "";

	try {
		// 🔐 Sign in the user
		const userCredential = await signInWithEmailAndPassword(auth, email, password);
		const user = userCredential.user;

		// 🔄 Force refresh the token to get latest claims (important!)
		await user.getIdToken(true);

		// 🔎 Query Firestore for user data
		const userDocRef = doc(db, "Users", user.uid);
const userDocSnap = await getDoc(userDocRef);

if (userDocSnap.exists()) {
	const userRole = userDocSnap.data().userRole || "user";
	goto(userRole === "admin" ? "/dashboard" : "/track-application/tracker");
} else {
	errorMessage = "User data not found. Contact support.";
}

	} catch (error) {
		console.error("🔥 Firebase Auth Error:", error);
		errorMessage = "Invalid credentials. Please try again.";
	} finally {
		isLoading.set(false);
	}
};
</script>

<!-- ✅ Main Login Container -->
<div class="h-screen lg:grid lg:min-h-[600px] lg:grid-cols-2" transition:slide="{{ x: $isSliding ? -500 : 0 }}">
	<!-- ✅ Left Side: Login Form -->
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
				<div class="grid gap-2 relative">
					<Label for="password">Password</Label>
					<Input id="password" type={$showPassword ? "text" : "password"} bind:value={password} required class="pr-10" />
					<button
						type="button"
						class="absolute -right-6 top-6 p-1 text-gray-500 hover:text-gray-700"
						on:click={() => showPassword.set(!$showPassword)}
					>
						{#if $showPassword}
							<EyeOff class="h-5 w-5" />
						{:else}
							<Eye class="h-5 w-5" />
						{/if}
					</button>
					<a href="##" class="mr-auto inline-block text-sm underline">Forgot your password?</a>
				</div>

				<!-- ✅ Error Message -->
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
				<a href="##" on:click={goToSignup} class="underline"> Sign up </a>
			</div>
		</div>
	</div>

	<!-- ✅ Right Side: Background & 3D Model -->
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
