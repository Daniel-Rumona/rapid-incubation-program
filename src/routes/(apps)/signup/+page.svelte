<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button";
	import { Label } from "$lib/components/ui/label";
	import { Input } from "$lib/components/ui/input";
	import { db, auth, collection, addDoc, createUserWithEmailAndPassword } from "$lib/firebase";
	import { writable } from "svelte/store";
	import { Icons } from "$lib/components/ui/icons";
	import { slide } from "svelte/transition";
	import GLTFModel from "$lib/components/ui/GLTFModel.svelte";

	const isSliding = writable(false);

	// ✅ Navigate to Sign-in with transition
	const goToSignin = () => {
		isSliding.set(true);
		setTimeout(() => {
			goto("/signin");
		}, 500);
	};

	const isLoading = writable(false);
	let errorMessage = writable("");

	// Form Data
	let firstName = "";
	let lastName = "";
	let email = "";
	let password = "";

	const adminEmails = [
    "helperzhou@gmail.com",
    "solomonn@dut.ac.za",
    "brightnessn@dut.ac.za",
    "snelisiweh@dut.ac.za"
];

const showSuccessModal = writable(false); // Controls success modal visibility

const handleSignup = async () => {
    isLoading.set(true);
    errorMessage.set("");
    showSuccessModal.set(false); // Ensure modal is hidden before process starts

    try {
        // ✅ Create User in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ Check if the email is in the admin list
        const isAdmin = adminEmails.includes(email.toLowerCase());

        // ✅ Save User Details in Firestore with role (admin/user)
        const usersCollection = collection(db, "Users");
        await addDoc(usersCollection, {
            userEmail: email,
            userFullName: `${firstName} ${lastName}`,
            userRole: isAdmin ? "admin" : "user", // Assign role based on email
            createdAt: new Date(),
        });

        console.log(`✅ User registered successfully: ${user.email} | Role: ${isAdmin ? "Admin" : "User"}`);

        // ✅ Show success modal before navigating
        showSuccessModal.set(true);

        setTimeout(() => {
            if (isAdmin) {
                goto("/dashboard");
            } else {
                goto("/track-application/tracker");
            }
        }, 2000); // 2-second delay before redirect

    } catch (error) {
        console.error("🔥 Firebase Auth Error:", error);
        errorMessage.set("An unknown error occurred. Please try again.");
    } finally {
        isLoading.set(false);
    }
};
</script>

{#if $showSuccessModal}
	<div class="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
		<div class="bg-white p-6 rounded-lg shadow-lg text-center">
			<h2 class="text-lg font-semibold text-green-600">✅ Registration Successful!</h2>
			<p class="text-gray-700">You will be redirected shortly...</p>
			<Icons.spinner class="mt-3 h-6 w-6 animate-spin text-green-500" />
		</div>
	</div>
{/if}

<div class="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0" transition:slide="{{ x: isSliding ? -500 : 0 }}">
	<!-- 🔹 LEFT SIDE: Background Image & Text -->
	<div class="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r background-img">
		<!-- ✅ Header Text -->
		<div class="relative flex items-center text-lg font-medium">
			<div class="absolute left-4 top-4 opacity-90">
				<img src="/dut-cseri.png" alt="CSE Icon" class="h-16 w-26 object-cover">
			</div>
			<span class="relative z-10 ml-60">DUT | CSE Rapid Incubation Program</span>
		</div>

		<!-- ✅ Insert 3D Model Inside Right Section -->
		<div class="relative flex items-center justify-center h-full">
			<GLTFModel />
		</div>

		<!-- ✅ Powered by Text & Icon (Bottom-Right) -->
		<div class="absolute right-2 bottom-2 text-center">
			<img src="/QuantilytixO.png" alt="Quant Logo" class="h-32 w-[250px] rounded-sm object-contain opacity-90">
		</div>
	</div>

	<!-- 🔹 RIGHT SIDE: SIGN-UP FORM -->
	<div class="lg:p-8">
		<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
			<div class="flex flex-col space-y-2 text-center">
				<h1 class="text-2xl font-semibold tracking-tight">Sign Up</h1>
				<p class="text-muted-foreground text-sm">Enter your information to create an account and be able to apply.</p>
			</div>

			<!-- SIGN-UP FORM -->
			<form on:submit|preventDefault={handleSignup} class="grid gap-4">
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
				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input id="password" type="password" bind:value={password} required />
				</div>

				<!-- 🔹 Display Error Message -->
				{#if $errorMessage}
					<p class="text-red-500 text-sm text-center">⚠️ {$errorMessage}</p>
				{/if}

				<Button type="button" class="w-full" on:click={handleSignup} disabled={$isLoading}>
					{#if $isLoading}
						<Icons.spinner class="mr-2 h-4 w-4 animate-spin" />
						Signing Up...
					{:else}
						Create an account
					{/if}
				</Button>
			</form>

			<!-- Login Link -->
			<div class="mt-4 text-center text-sm">
				Already have an account?
				<a href="##" class="underline" on:click={goToSignin}>Sign In</a>
			</div>

			<!-- Terms & Privacy Notice -->
			<p class="text-muted-foreground px-8 text-center text-sm">
				By clicking continue, you agree to our
				<a href="##" class="hover:text-primary underline underline-offset-4">Terms of Service</a>
				and
				<a href="##" class="hover:text-primary underline underline-offset-4">Privacy Policy</a>.
			</p>
		</div>
	</div>
</div>

<style>
    /* ✅ Background Image Instead of Old Image */
    .background-img {
        background: url("/background.jpg") no-repeat center center;
        background-size: cover;
    }
</style>
