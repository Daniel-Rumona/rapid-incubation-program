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
	<div class="overlay">
		<h1>Welcome to DUT CSE Rapid Incubation Program</h1>
<p>An innovation-driven gateway to entrepreneurial success.</p>
<p>Accelerate your business growth with expert support and resources.</p>


		<div class="form-container">
			<div class="button-group">
				<Button type="button" class="register-btn" on:click={() => navigateWithTransition('/signup')}>Register</Button>
				<span>|</span>
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
        height: 100vh;
        background: url('/background.jpg') center/cover no-repeat;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.5s ease-in-out;
    }

    /* ✅ Fade-Out Effect */
    .fade-out {
        opacity: 0;
    }

    /* ✅ Overlay */
    .overlay {
        background: rgba(0, 0, 0, 0.5);
        padding: 3rem;
        border-radius: 10px;
        text-align: center;
        color: white;
        width: 60%;
        max-width: 1000px;
        position: relative;
    }

    /* ✅ Pseudo-elements for logos */
    .hero-container::before,
    .hero-container::after {
        content: "";
        position: absolute;
        width: 250px;
        height: 120px;
        background-size: contain;
				background-repeat: no-repeat;
        background-position: center;
        border-radius: 5px;
    }

    /* ✅ QuantIcon (Top Left) */
    .hero-container::before {
        background-image: url('/dut-cseri.png');
        top: 20px;
        left: 20px;
    }

    .hero-container::after {
        background-image: url('/QuantilytixO.png');
        bottom: 20px;
        right: 20px;
    }

    /* ✅ Typography */
    h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }

    p {
        margin-bottom: 1rem;
    }

    /* ✅ Form Styling */
    .form-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 1rem;
    }

    .button-group {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 1rem;
    }

    /* ✅ Buttons */
    .register-btn {
        background-color: #4f46e5;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
    }

    .signin-btn {
        background-color: #64748b;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
    }

    .register-btn:hover,
    .signin-btn:hover {
        opacity: 0.9;
    }
</style>
