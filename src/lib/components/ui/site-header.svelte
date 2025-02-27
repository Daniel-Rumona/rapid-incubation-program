<script lang="ts">
	import {
		CommandMenu,
		MainNav,
		MobileNav,
	} from "$lib/components/ui/index.js";
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import ModeSwitch from '$lib/components/ui/mode-switch/mode-switch.svelte';
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import Search from 'lucide-svelte/icons/search-code';
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input';
	import { auth } from "$lib/firebase"; // Import Firebase Auth
	import { signOut } from "firebase/auth";
	import {goto} from "$app/navigation"
	import { get } from 'svelte/store';
	import { writable } from 'svelte/store';
	import { getAuth, onAuthStateChanged } from "firebase/auth";
	import { db } from "$lib/firebase";
	import { collection, getDocs, query, where } from "firebase/firestore";
	import { onMount } from 'svelte';
	import { data, fetchPrograms } from '../../../routes/(apps)/programs/(data)/programs';

	const loggedInUser = writable<{ fullName: string; email: string } | null>(null);

	async function fetchUserData(email: string) {
		try {
			console.log("📌 Fetching Firestore data for:", email);
			const usersRef = collection(db, "Users");
			const q = query(usersRef, where("userEmail", "==", email));
			const querySnapshot = await getDocs(q);

			if (!querySnapshot.empty) {
				const userData = querySnapshot.docs[0].data();
				console.log("✅ Found user in Firestore:", userData);
				loggedInUser.set({ fullName: userData.userFullName, email: userData.userEmail });
				console.log("✅ Logged In User:", get(loggedInUser)?.fullName);
			} else {
				console.warn("⚠️ No user found in Firestore.");
				loggedInUser.set(null);
			}
		} catch (error) {
			console.error("🔥 Error fetching Firestore user data:", error);
		}
	}

	onMount(async () => {
		console.log("🔹 Component mounted. Checking authentication...");
		await fetchPrograms();
		data.subscribe((value) => {
			console.log("✅ Programs in UI:", value);
		});

		onAuthStateChanged(auth, async (user) => {
			console.log("🔹 Auth state changed:", user);
			if (user && user.email) {
				console.log("✅ Authenticated user detected:", user.email);
				await fetchUserData(user.email);
			} else {
				console.warn("⚠️ No authenticated user found.");
				loggedInUser.set(null);
			}
		});
	});
	// Handle Logout
	const handleLogout = async () => {
		try {
			await signOut(auth);
			goto("/signin"); // Redirect after logout
		} catch (error) {
			console.error("Logout error:", error);
		}
	};
	function getUserInitials(name?: string): string {
		return name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";
	}

</script>

<header
	class="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur"
>
	<div class="container flex h-14 max-w-screen-2xl items-center">
		<MainNav />
		<MobileNav />
		<div class="flex flex-1 items-center justify-between space-x-2 md:justify-end">
			<div class="w-full flex-1 md:w-auto md:flex-none">
				<CommandMenu />
			</div>
			<div class="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
				<form class="ml-auto flex-1 sm:flex-initial">
					<div class="relative">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search programs..."
							class="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
						/>
					</div>
				</form>
				<DropdownMenu.Root>
					<ModeSwitch />
					<DropdownMenu.Trigger asChild let:builder>
						<Button builders={[builder]} variant="ghost" class="relative h-8 w-8 rounded-full">
							<Avatar.Root class="h-9 w-9">
								<Avatar.Fallback>{getUserInitials($loggedInUser?.fullName || "John Doe")}</Avatar.Fallback>
							</Avatar.Root>
							<span class="sr-only">Toggle user menu</span>
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Label>My Account</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>Settings</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item on:click={handleLogout}>Logout</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>
	</div>
</header>
