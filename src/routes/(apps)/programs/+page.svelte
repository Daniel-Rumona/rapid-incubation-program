<script lang="ts">
	import { onMount } from "svelte";
	import UserNav from "./(components)/user-nav.svelte";
	import ProgramSheet from "./(components)/program-sheet.svelte";
	import { selectedProgram } from "./(data)/selectedProgram";
	import { data, fetchPrograms } from "./(data)/programs";
	import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "$lib/components/ui/table";
	import { statuses, priorities } from "./(data)/data";
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import MoreVertical from "svelte-radix/DotsHorizontal.svelte";
	import ListFilter from 'lucide-svelte/icons/list-filter';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { writable } from 'svelte/store';
	import { getAuth, onAuthStateChanged } from "firebase/auth";
	import { db } from "$lib/firebase";
	import { collection, getDocs, query, where } from "firebase/firestore";
	import { get } from "svelte/store";

	const auth = getAuth();
	const loggedInUser = writable<{ fullName: string; email: string } | null>(null);
	const filterValue = writable("");
	let selectedFilter = "All";

	function getStatusIcon(status: string) {
		const statusObj = statuses.find(s => s.value === status.toLowerCase());
		return statusObj ? statusObj.icon : null;
	}

	function getPriorityIcon(priority: string) {
		const priorityObj = priorities.find(p => p.value === priority.toLowerCase());
		return priorityObj ? priorityObj.icon : null;
	}

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
				console.log("✅ Logged In User:", get(loggedInUser));
			} else {
				console.warn("⚠️ No user found in Firestore.");
				loggedInUser.set(null);
			}
		} catch (error) {
			console.error("🔥 Error fetching Firestore user data:", error);
		}
	}

	onMount(() => {
	console.log("🔹 Component mounted. Waiting for Firebase auth...");

	onAuthStateChanged(auth, async (user) => {
		console.log("🔹 Auth state changed:", user);

		if (user && user.email) {
			console.log("✅ Authenticated user detected:", user.email);

			// 🔁 Refresh token to ensure fresh claims (especially for admin access)
			await user.getIdToken(true);

			await fetchUserData(user.email);
			await fetchPrograms(); // ✅ Now fetch programs AFTER auth is ready
		} else {
			console.warn("⚠️ No authenticated user found.");
			loggedInUser.set(null);
		}
	});
});

</script>

<div class="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
	<div class="flex items-center justify-between space-y-2">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Manage Programs</h2>
			<p class="text-muted-foreground">Here's a list of the available programs.</p>
		</div>
		<div class="flex items-center space-x-2">
			{#if $selectedProgram}
				<ProgramSheet />
			{/if}
			<UserNav {loggedInUser} />
		</div>
	</div>

	<div class="flex flex-row space-x-2">
		<Input
			placeholder="Filter programs..."
			class="h-8 w-[150px] lg:w-[250px]"
			type="search"
			bind:value={$filterValue}
		/>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button variant="outline" size="sm" class="h-7 gap-1 text-sm" builders={[builder]}>
					<ListFilter class="h-3.5 w-3.5" />
					<span class="sr-only sm:not-sr-only">Filter</span>
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Label>Filter by</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.CheckboxItem checked={selectedFilter === 'Accepted'} on:click={() => selectedFilter = "Accepted"}>Accepted</DropdownMenu.CheckboxItem>
				<DropdownMenu.CheckboxItem checked={selectedFilter === 'Declined'} on:click={() => selectedFilter = "Accepted"}>Declined</DropdownMenu.CheckboxItem>
				<DropdownMenu.CheckboxItem checked={selectedFilter === 'All'} on:click={() => selectedFilter = "Accepted"}>All</DropdownMenu.CheckboxItem>
			</DropdownMenu.Content>
		</DropdownMenu.Root>

	</div>

	<Table>
		<TableHeader>
			<TableRow>
				<TableHead>Program ID</TableHead>
				<TableHead>Title</TableHead>
				<TableHead>Status</TableHead>
				<TableHead>Priority</TableHead>
				<TableHead>Actions</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each $data as program}
				<TableRow>
					<TableCell>{program.programID}</TableCell>
					<TableCell>{program.title}</TableCell>
					<TableCell>
						{#if getStatusIcon(program.status)}
							{#await getStatusIcon(program.status) then Icon}
								<Icon class="inline-block h-5 w-5 mr-2" />
							{/await}
						{/if}
						{program.status
							.split(" ")
							.map(word => word.charAt(0).toUpperCase() + word.slice(1))
							.join(" ")}
					</TableCell>
					<TableCell>
						{#if getPriorityIcon(program.priority)}
							{#await getPriorityIcon(program.priority) then Icon}
								<Icon class="inline-block h-5 w-5 mr-2" />
							{/await}
						{/if}
						{program.priority.charAt(0).toUpperCase() + program.priority.slice(1)}
					</TableCell>
					<TableCell>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								<button class="p-2 rounded-md hover:bg-accent/100">
									<MoreVertical class="h-5 w-5" />
								</button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end">
								<DropdownMenu.Label>Perform Action</DropdownMenu.Label>
								<DropdownMenu.Separator />
								<DropdownMenu.CheckboxItem  on:click={() => selectedFilter = "Accepted"}>Edit</DropdownMenu.CheckboxItem>
								<DropdownMenu.CheckboxItem  on:click={() => selectedFilter = "Accepted"}>Delete</DropdownMenu.CheckboxItem>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
