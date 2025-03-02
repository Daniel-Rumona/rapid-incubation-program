<script lang="ts">
	import House from "lucide-svelte/icons/house";
	import Package from "lucide-svelte/icons/package";
	import Package2 from "lucide-svelte/icons/package-2";
	import PanelLeft from "lucide-svelte/icons/panel-left";
	import Search from "lucide-svelte/icons/search";
	import Activity from 'lucide-svelte/icons/activity';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Users from 'lucide-svelte/icons/user-check';
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Sheet from "$lib/components/ui/sheet/index.js";
	import { auth } from "$lib/firebase"; // Import Firebase Auth
	import { signOut } from "firebase/auth";
	import { goto } from "$app/navigation";
	import ApplicationsTable from "./(components)/applicationsTable.svelte"
	import { get } from 'svelte/store';
	import { writable } from 'svelte/store';
	import { onAuthStateChanged } from "firebase/auth";
	import { db } from "$lib/firebase";
	import { collection, getDocs, query, where } from "firebase/firestore";
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';
	import { page } from '$app/stores';

	const loggedInUser = writable<{ fullName: string; email: string } | null>(null);

	// Track if user has applications
	const hasApplications = writable<boolean | null>(null);
	const isLoading = writable(true); // Added loading state to avoid default view before Firestore response
	// Store dashboard metrics
	const totalApplications = writable(0);
	const rejectedApplications = writable(0);
	const underReviewApplications = writable(0);

	async function fetchUserData() {
	const user = auth.currentUser;
	if (!user) return;

	try {
		const userRef = doc(db, "Users", user.uid); // ✅ Use UID
		const userSnap = await getDoc(userRef);

		if (userSnap.exists()) {
			const userData = userSnap.data();
			loggedInUser.set({ fullName: userData.userFullName, email: userData.userEmail });
		} else {
			console.warn("⚠️ No user found in Firestore.");
			loggedInUser.set(null);
		}
	} catch (error) {
		console.error("🔥 Error fetching Firestore user data:", error);
	}
}

	async function getUserIdByEmail(email: string) {
		try {
			const usersRef = collection(db, "Users");
			const q = query(usersRef, where("userEmail", "==", email));
			const querySnapshot = await getDocs(q);

			if (!querySnapshot.empty) {
				return querySnapshot.docs[0].id; // Return Firestore document ID
			}
			return null;
		} catch (error) {
			console.error("🔥 Error fetching user ID:", error);
			return null;
		}
	}

	async function fetchUserApplications() {
	try {
		const user = auth.currentUser;
		if (!user) {
			hasApplications.set(false);
			isLoading.set(false);
			return;
		}

		const userId = user.uid; // ✅ Directly use UID
		console.log("📌 Using UID for Firestore queries:", userId);

		const applicationsRef = collection(db, `Users/${userId}/Applications`);
		const querySnapshot = await getDocs(applicationsRef);

		if (!querySnapshot.empty) {
			const applications = querySnapshot.docs.map((doc) => doc.data());

			totalApplications.set(applications.length);
			rejectedApplications.set(applications.filter(app => app.aiResponse === "Rejected").length);
			underReviewApplications.set(applications.filter(app => app.status === "Under Review").length);

			console.log(`✅ Total: ${applications.length}, Rejected: ${rejectedApplications}, Under Review: ${underReviewApplications}`);
			hasApplications.set(true);
		} else {
			console.warn("⚠️ No applications found.");
			hasApplications.set(false);
		}
	} catch (error) {
		console.error("🔥 Error fetching applications:", error);
		hasApplications.set(false);
	} finally {
		isLoading.set(false);
	}
}


	onMount(() => {
		onAuthStateChanged(auth, async (user) => {
	if (user) {
		loggedInUser.set({ fullName: user.displayName || "User", email: user.email });
		await fetchUserData();
		await fetchUserApplications(); 
	} else {
		loggedInUser.set(null);
		hasApplications.set(null);
		isLoading.set(false);
	}
});

	});

	function redirectToPrograms() {
		goto("/track-application/tracker/programs");
	}
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

{#if $isLoading}
	<div class="flex justify-center items-center min-h-screen ">
		<svg class="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
		</svg>
		<p class="ml-2 text-gray-700 text-lg">Getting Everything Ready...</p>
	</div>
{:else}
	<div class="bg-muted/40 flex min-h-screen w-full flex-col">
	<div class="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
		<header
			class="bg-background sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6"
		>
			<Sheet.Root>
				<Sheet.Trigger asChild let:builder>
					<Button builders={[builder]} size="icon" variant="outline" class="sm:hidden">
						<PanelLeft class="h-5 w-5" />
						<span class="sr-only">Toggle Menu</span>
					</Button>
				</Sheet.Trigger>
				<Sheet.Content side="left" class="sm:max-w-xs">
					<nav class="grid gap-6 text-lg font-medium">
						<a
							href="##"
							class="bg-primary text-primary-foreground group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold md:text-base"
						>
							<Package2 class="h-5 w-5 transition-all group-hover:scale-110" />
							<span class="sr-only">DUT CSE Rapid Incubation Programm Applications</span>
						</a>
						<a
							href="/track-application/tracker"
							class={cn(
		"hover:text-foreground flex items-center gap-4 px-2.5",
		$page.url.pathname === "/track-application/tracker"
			? "text-foreground"
			: "text-muted-foreground"
	)}

						>
							<House class="h-5 w-5" />
							Dashboard
						</a>
						<a href="/track-application/tracker/programs"
							 class={cn(
		"hover:text-foreground flex items-center gap-4 px-2.5",
		$page.url.pathname === "/track-application/tracker/programs"
			? "text-foreground"
			: "text-muted-foreground"
	)}>
							<Package class="h-5 w-5" />
							Programs
						</a>
					</nav>
				</Sheet.Content>
			</Sheet.Root>
			<Breadcrumb.Root class="hidden md:flex">
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link href="##">Dashboard</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
				</Breadcrumb.List>
			</Breadcrumb.Root>
			<div class="relative ml-auto flex-1 md:grow-0">
				<Search class="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
				<Input
					type="search"
					placeholder="Search..."
					class="bg-background w-full rounded-lg pl-8 md:w-[200px] lg:w-[336px]"
				/>
			</div>
			<DropdownMenu.Root>
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
					<DropdownMenu.Item on:click={handleLogout}>Logout</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</header>
		<main class="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
			{#if $hasApplications === false}
			<div class="flex flex-col items-center justify-center h-[450px] w-full p-6 rounded-lg shadow-lg">
					<h2 class="text-lg font-bold text-white">No Applications Found</h2>
					<p class="text-sm text-gray-500">You have not applied for any program yet.</p>
					<Button class="mt-4 bg-blue-600 hover:bg-accent text-white px-4 py-2 rounded-md" on:click={redirectToPrograms}>
						View Available Programs
					</Button>
				</div>
			{:else}
				<div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
					<!-- ✅ Total Applications -->
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Total Applications</Card.Title>
							<CreditCard class="h-4 w-4 text-muted-foreground" />
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">{$totalApplications}</div>
							<p class="text-xs text-muted-foreground">Total applications submitted</p>
						</Card.Content>
					</Card.Root>

					<!-- ✅ Rejected Applications -->
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Rejected Applications</Card.Title>
							<Activity class="h-4 w-4 text-muted-foreground" />
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">{$rejectedApplications}</div>
							<p class="text-xs text-muted-foreground">Applications not approved</p>
						</Card.Content>
					</Card.Root>

					<!-- ✅ Applications Under Review -->
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Under Review</Card.Title>
							<Users class="h-4 w-4 text-muted-foreground" />
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">{$underReviewApplications}</div>
							<p class="text-xs text-muted-foreground">Applications currently being reviewed</p>
						</Card.Content>
					</Card.Root>
				</div>
				<ApplicationsTable/>
			{/if}


		</main>
	</div>
</div>
{/if}
