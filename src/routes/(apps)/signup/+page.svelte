<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { auth, db, createUserWithEmailAndPassword } from "$lib/firebase";
    import { query, where, getDocs, collection, addDoc } from "firebase/firestore";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Icons } from "$lib/components/ui/icons";
    import { writable } from 'svelte/store';
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
    const errorMessage = writable("");

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

    const firestoreErrorMessages: Record<string, string> = {
        "auth/email-already-in-use": "This email is already in use. Please try signing in instead.",
        "auth/invalid-email": "The email address is invalid. Please enter a valid email.",
        "auth/weak-password": "Password is too weak. Please use a stronger password (at least 6 characters).",
        "auth/network-request-failed": "Network error. Please check your internet connection.",
        "auth/operation-not-allowed": "Signup is currently disabled. Please contact support.",
        "auth/missing-password": "Please enter a password.",
        "auth/internal-error": "An unexpected error occurred. Please try again later.",
        "auth/too-many-requests": "Too many attempts. Please wait before trying again.",
    };

    const showSuccessModal = writable(false);

    const handleSignup = async () => {
        isLoading.set(true);
        errorMessage.set("");
        showSuccessModal.set(false);

        try {
            // ✅ Create User in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // ✅ Check if email is an admin
            const isAdmin = adminEmails.includes(email.toLowerCase());

            // ✅ Save User Details in Firestore
            const usersCollection = collection(db, "Users");
            await addDoc(usersCollection, {
                userEmail: email,
                userFullName: `${firstName} ${lastName}`,
                userRole: isAdmin ? "admin" : "user",
                createdAt: new Date(),
            });

            console.log(`✅ User registered: ${user.email} | Role: ${isAdmin ? "Admin" : "User"}`);

            // ✅ Show success modal before redirecting
            showSuccessModal.set(true);

            setTimeout(() => {
                goto(isAdmin ? "/dashboard" : "/track-application/tracker");
            }, 2000); // 2-second delay before redirect

        } catch (error) {
            console.error("🔥 Firebase Auth Error:", error);
            errorMessage.set(firestoreErrorMessages[error.code] || "An unknown error occurred. Please try again.");
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
    <!-- Left Side: Background Image & Text -->
    <div class="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r background-img">
        <!-- Header Text -->
        <div class="relative flex items-center text-lg font-medium">
            <div class="absolute left-4 top-4 opacity-90">
                <img src="/dut-cseri.png" alt="CSE Icon" class="h-16 w-26 object-cover">
            </div>
            <span class="relative z-10 ml-60">DUT | CSE Rapid Incubation Program</span>
        </div>

        <!-- 3D Model -->
        <div class="relative flex items-center justify-center h-full">
            <GLTFModel />
        </div>

        <!-- Powered by Logo -->
        <div class="absolute right-2 bottom-2 text-center">
            <img src="/QuantilytixO.png" alt="Quant Logo" class="h-32 w-[250px] rounded-sm object-contain opacity-90">
        </div>
    </div>

    <!-- Right Side: Signup Form -->
    <div class="lg:p-8">
        <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div class="flex flex-col space-y-2 text-center">
                <h1 class="text-2xl font-semibold tracking-tight">Sign Up</h1>
                <p class="text-muted-foreground text-sm">Enter your details to create an account.</p>
            </div>

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

                <!-- Display Error Message -->
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
        </div>
    </div>
</div>

<style>
    /* ✅ Background Image */
    .background-img {
        background: url("/background.jpg") no-repeat center center;
        background-size: cover;
    }
</style>
