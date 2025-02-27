<script lang="ts">
	import { z } from "zod";
	import { tick } from "svelte";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { get, writable } from "svelte/store";

	// Form Schema
	const profileFormSchema = z.object({
		username: z
			.string()
			.min(2, "Username must be at least 2 characters.")
			.max(30, "Username must not be longer than 30 characters"),
		email: z.string().email("Please enter a valid email"),
		bio: z.string().min(4).max(160),
		urls: z.array(z.string().url()).default([]),
	});

	// Reactive form state
	let username = writable("");
	let email = writable("");
	let password = writable("admin123");


	function handleSubmit(event: Event) {
		event.preventDefault();
		const formData = {
			username: get(username),
			email: get(email),
			password: get(password),

		};

		// Validate against schema
		const validation = profileFormSchema.safeParse(formData);

		if (!validation.success) {
			console.error("Validation failed", validation.error.errors);
		} else {
			console.log("✅ Form submitted successfully:", validation.data);
		}
	}
</script>

<form method="POST" class="space-y-8 items-center" id="profile-form" on:submit={handleSubmit}>
	<div>
		<label for="username">Username</label>
		<Input id="username" placeholder="@shadcn" bind:value={$username} required />
		<p class="text-muted">This is your public display name. It can be your real name or a pseudonym.</p>
	</div><div>
	<label for="username">Email</label>
	<Input id="username" placeholder="email" bind:value={$email} required />
	<p class="text-muted">This is your email to access platform. It must be your real email.</p>
</div>
	<div>
		<label for="username">Password</label>
		<Input id="username" placeholder="password" bind:value={$password} required />
		<p class="text-muted">This is your email to access platform. It must be unique and at least 6 character long.</p>
	</div>


	<Button type="submit">Update profile</Button>
</form>

