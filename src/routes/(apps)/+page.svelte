<script lang="ts">
	import { goto } from "$app/navigation";
	import { Button } from '$lib/components/ui/button';
	import { writable } from 'svelte/store';

	let fadeOut = writable(false);

	function navigateWithTransition(url: string) {
		fadeOut.set(true); // Start fade-out animation
		setTimeout(() => {
			goto(url); // Navigate after animation
		}, 500); // Match transition duration
	}
</script>

<div class="hero-container" class:fade-out={$fadeOut}>
	<!-- Logos -->
	<img src="/dut-cseri.png" alt="DUT CSE Logo" class="logo logo-left">
	<img src="/QuantilytixO.png" alt="Quantilytix Logo" class="logo logo-right">

	<!-- Main Content -->
	<div class="overlay">
		<h1>Applications are now closed</h1>
		<p>Thank you for your interest in the DUT CSE Rapid Incubation Program.</p>
		<p>If you've already applied, you can still sign in to manage your application.</p>
		<div class="form-container">
			<div class="button-group">
				<Button type="button" class="signin-btn" on:click={() => navigateWithTransition('/signin')}>Sign-in</Button>
			</div>
		</div>
	</div>
</div>

<style>
    /* ✅ Hero Section */
    .hero-container {
        position: relative;
        width: 100%;
        min-height: 100vh;
        background: url('/background.jpg') center/cover no-repeat;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.5s ease-in-out;
        padding: 20px;
    }

    /* ✅ Fade-Out Effect */
    .fade-out {
        opacity: 0;
    }

    /* ✅ Overlay */
    .overlay {
        background: rgba(0, 0, 0, 0.6);
        padding: 2rem;
        border-radius: 10px;
        text-align: center;
        color: white;
        width: 90%;
        max-width: 800px;
    }

    /* ✅ Responsive Typography */
    h1 {
        font-size: clamp(1.5rem, 5vw, 2.5rem);
        margin-bottom: 1rem;
    }

    p {
        font-size: clamp(1rem, 4vw, 1.2rem);
        margin-bottom: 1rem;
    }

    /* ✅ Logos */
    .logo {
        position: absolute;
        max-width: 30%;
        height: auto;
        object-fit: contain;
    }

    /* Left Logo */
    .logo-left {
        top: 20px;
        left: 20px;
        width: clamp(100px, 15vw, 200px);
    }

    /* Right Logo */
    .logo-right {
        bottom: 20px;
        right: 20px;
        width: clamp(100px, 15vw, 200px);
    }

    /* ✅ Form Styling */
    .form-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 1rem;
    }

    /* ✅ Button Group (Always Side by Side) */
    .button-group {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: nowrap;
    }

    .separator {
        font-size: 1.5rem;
        color: white;
    }

    /* ✅ Buttons */
    .register-btn, .signin-btn {
        background-color: #4f46e5;
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.3s ease-in-out;
        min-width: 120px;
        min-height: 44px;
    }

    .signin-btn {
        background-color: #64748b;
    }

    .register-btn:hover,
    .signin-btn:hover {
        transform: scale(1.05);
    }

    /* ✅ Responsive Design */
    @media (max-width: 768px) {
        .overlay {
            width: 95%;
            padding: 1.5rem;
        }

        /* Keep buttons side by side even on small screens */
        .button-group {
            flex-direction: row;
            justify-content: center;
            gap: 10px;
        }

        /* Scale logos for mobile */
        .logo {
            max-width: 25%;
        }

        .logo-left {
            left: 10px;
            width: clamp(80px, 12vw, 150px);
        }

        .logo-right {
            right: 10px;
            width: clamp(80px, 12vw, 150px);
        }
    }
</style>
