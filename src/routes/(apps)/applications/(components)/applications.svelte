<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Copy from 'lucide-svelte/icons/copy';
	import { onMount } from "svelte";
	import File from 'lucide-svelte/icons/file';

	import ListFilter from 'lucide-svelte/icons/list-filter';

	import Truck from 'lucide-svelte/icons/recycle';

	import { Badge } from '$lib/components/ui/badge';
	import RecommendationModal from '$lib/components/ui/applicationOutput.svelte'

	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Dialog from '$lib/components/ui/dialog';

	import * as Pagination from '$lib/components/ui/pagination';
	import { Progress } from '$lib/components/ui/progress';
	import { Separator } from '$lib/components/ui/separator';
	import { applications, fetchAllApplications } from "../(data)/applications";
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { writable, get } from 'svelte/store';
	import { collection, db, doc, getDocs, updateDoc, query,where } from "$lib/firebase"; // Firestore for updating status
	import  {Icons} from "$lib/components/ui/icons/index";
	const isLoading = writable(false); // ✅ Now it's a store

	// Stores
	let acceptedApplications = writable(0);
	let rejectedApplications = writable(0);
	let weeklyApplications = writable(0);
	let monthlyApplications = writable(0);

	// Fetch Applications Data from Firestore
	onMount(async () => {
		await fetchApplicationMetrics();
	});

	// Stores
	let isModalOpen = writable(false);
	let isStatusModalOpen = writable(false);
	let selectedFilter = "All";
	let selectedApplication = writable(null);
	let newStatus = writable(""); // Store for selected new status

	// 🔹 Fetch Applications on Load
	onMount(async () => {
		await fetchAllApplications();
		applications.subscribe((apps) => {
			console.log("📌 Loaded Applications:", apps);
		});
	});

	// 🔹 Filter Logic
	$: filteredApplications = $applications.filter(app =>
		selectedFilter === "All" || app.status === selectedFilter
	);
	function formatDate(timestamp) {
		if (!timestamp) return "N/A"; // Handle missing values

		const date = new Date(timestamp.seconds * 1000); // Convert Firestore timestamp to JS Date
		return date.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	}
	// 🔹 Select Application
	function selectApplication(app) {
		selectedApplication.set(app);
		console.log("✅ Selected Application:", get(selectedApplication)?.businessName); // Debugging log
	}

	function openRecommendationModal() {
		const app = get(selectedApplication);

		if (app?.applicationID) {
			console.log("📌 Opening Modal for Application ID:", app.applicationID);

			// Ensure we reset the state before opening
			isModalOpen.set(false);
			setTimeout(() => isModalOpen.set(true), 10); // Small delay to allow Svelte reactivity to process the change
		} else {
			console.warn("⚠️ No valid application selected");
		}
	}


	// Open Status Change Modal
	function openStatusModal() {
		const app = get(selectedApplication);

		if (app?.applicationStatus) {
			newStatus.set(app.applicationStatus); // Preload current status

			// 🔹 Reset modal state before opening
			isStatusModalOpen.set(false);
			setTimeout(() => isStatusModalOpen.set(true), 10); // 🔥 Add delay for reactivity
		}
	}

	// Close Modals
	function closeModal() {
		isModalOpen.set(false);
		isStatusModalOpen.set(false);
	}

	// Update Status in Firestore
	async function updateApplicationStatus() {
		isLoading.set(true);
		const app = get(selectedApplication);
		const updatedStatus = get(newStatus);

		if (!app || !updatedStatus) {
			console.warn("⚠️ No application or status selected!");
			isLoading.set(false);
			return;
		}

		try {
			console.log(`📌 Searching for application with ID: ${app.applicationID}`);

			// 🔹 Step 1: Search all Users for the application with matching applicationID
			const usersRef = collection(db, "Users");
			const usersSnapshot = await getDocs(usersRef);

			let appDocRef = null;

			for (const userDoc of usersSnapshot.docs) {
				const applicationsRef = collection(db, `Users/${userDoc.id}/Applications`);
				const q = query(applicationsRef, where("applicationID", "==", app.applicationID));
				const querySnapshot = await getDocs(q);

				if (!querySnapshot.empty) {
					const appDoc = querySnapshot.docs[0]; // Get first matching document
					appDocRef = doc(db, `Users/${userDoc.id}/Applications`, appDoc.id); // 🔥 Use the real document ID
					console.log(`✅ Found application in user ${userDoc.id}'s collection.`);
					break; // Exit loop once we find the application
				}
			}

			// 🔹 Step 2: If no document found, log warning
			if (!appDocRef) {
				console.warn("⚠️ No document found for this application ID.");
				isLoading.set(false);
				return;
			}

			// 🔹 Step 3: Update the application status
			await updateDoc(appDocRef, { applicationStatus: updatedStatus });
			console.log(`✅ Status updated to "${updatedStatus}" for Application ID: ${app.applicationID}`);

			// 🔹 Step 4: Update the local store
			selectedApplication.set({ ...get(selectedApplication), applicationStatus: updatedStatus });

			// 🔹 Step 5: Close the modal with delay to reset modal state properly
			isStatusModalOpen.set(false);
			setTimeout(() => isStatusModalOpen.set(false), 10);
		} catch (error) {
			console.error("🔥 Error updating application status:", error);
		} finally {
			isLoading.set(false);
		}
	}
	async function fetchApplicationMetrics() {
		try {
			const usersRef = collection(db, "Users");
			const usersSnapshot = await getDocs(usersRef);
			const today = new Date();
			const startOfWeek = new Date(today);
			startOfWeek.setDate(today.getDate() - today.getDay()); // Start of the week
			const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // Start of the month

			let acceptedCount = 0;
			let rejectedCount = 0;
			let weekCount = 0;
			let monthCount = 0;

			for (const userDoc of usersSnapshot.docs) {
				const applicationsRef = collection(db, `Users/${userDoc.id}/Applications`);
				const applicationsSnapshot = await getDocs(applicationsRef);

				applicationsSnapshot.forEach((appDoc) => {
					const appData = appDoc.data();
					if (appData.applicationStatus === "Accepted") acceptedCount++;
					if (appData.applicationStatus === "Rejected") rejectedCount++;

					const submittedDate = new Date(appData.submittedAt.seconds * 1000);
					if (submittedDate >= startOfWeek) weekCount++;
					if (submittedDate >= startOfMonth) monthCount++;
				});
			}

			acceptedApplications.set(acceptedCount);
			rejectedApplications.set(rejectedCount);
			weeklyApplications.set(weekCount);
			monthlyApplications.set(monthCount);
		} catch (error) {
			console.error("🔥 Error Fetching Application Metrics:", error);
		}
	}
</script>

<div class="flex min-h-screen w-full flex-col">
	<div class="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
		<main
			class="grid flex-1 items-start gap-3 p-2 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3"
		>
			<div class="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
				<div
					class="flex flex-row gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4"
				>
					<Card.Root class="flex flex-col items-center gap-4 p-2 sm:col-span-2">
						<Card.Header class="text-center">
							<Card.Title>All Applications</Card.Title>
						</Card.Header>
						<div class="flex flex-row gap-2 p-1">
							<Card.Root>
								<Card.Header class="pb-2 text-center">
									<Card.Description>Accepted</Card.Description>
									<Card.Title class="text-4xl">{$acceptedApplications}</Card.Title>
								</Card.Header>
							</Card.Root>
							<Card.Root>
								<Card.Header class="pb-2 text-center">
									<Card.Description>Rejected</Card.Description>
									<Card.Title class="text-4xl">{$rejectedApplications}</Card.Title>
								</Card.Header>
							</Card.Root>
						</div>
					</Card.Root>
					<Card.Root>
						<Card.Header class="pb-2">
							<Card.Description>This Week</Card.Description>
							<Card.Title class="text-4xl">{$weeklyApplications}</Card.Title>
						</Card.Header>
					</Card.Root>
					<Card.Root>
						<Card.Header class="pb-2">
							<Card.Description>This Month</Card.Description>
							<Card.Title class="text-3xl">{$monthlyApplications}</Card.Title>
						</Card.Header>
					</Card.Root>
				</div>
				<Tabs.Root value="week">
					<div class="flex items-center">
						<Tabs.List>
							<Tabs.Trigger value="day">Day</Tabs.Trigger>
							<Tabs.Trigger value="week">Week</Tabs.Trigger>
							<Tabs.Trigger value="month">Month</Tabs.Trigger>
						</Tabs.List>
						<div class="ml-auto flex items-center gap-2">
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
									<DropdownMenu.CheckboxItem checked={selectedFilter === 'Declined'} on:click={() => selectedFilter = "Declined"}>Declined</DropdownMenu.CheckboxItem>
									<DropdownMenu.CheckboxItem checked={selectedFilter === 'All'} on:click={() => selectedFilter = "All"}>All</DropdownMenu.CheckboxItem>
								</DropdownMenu.Content>
							</DropdownMenu.Root>

							<Button size="sm" variant="outline" class="h-7 gap-1 text-sm">
								<File class="h-3.5 w-3.5" />
								<span class="sr-only sm:not-sr-only">Export</span>
							</Button>
						</div>
					</div>
					<Tabs.Content value="week">
						<Card.Root>
							<Card.Header class="mb-2 px-7">
								<Card.Title>Applications</Card.Title>
								<Card.Description>Recent Applications.</Card.Description>
							</Card.Header>
							<Card.Content>
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head>Applicant</Table.Head>
											<Table.Head class="hidden sm:table-cell">Sector</Table.Head>
											<Table.Head class="hidden sm:table-cell">Status</Table.Head>
											<Table.Head class="hidden md:table-cell">Date</Table.Head>
											<Table.Head class="text-right">Program</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each filteredApplications as app}
											<Table.Row  class="{$selectedApplication?.name === app.name ? 'bg-accent' : ''} cursor-pointer hover:bg-accent " on:click={() => selectApplication(app)} >
												<Table.Cell>
													<div class="font-medium">{app.name}</div>
													<div class="hidden text-sm text-muted-foreground md:inline">{app.email}</div>
												</Table.Cell>
												<Table.Cell class="hidden sm:table-cell">{app.natureOfBusiness}</Table.Cell>
												<Table.Cell class="hidden sm:table-cell">
													<Badge class={`text-xs ${
app.applicationStatus === "Accepted"
			? "bg-blue-100 text-blue-700"
			: app.applicationStatus === "Rejected"
			? "bg-red-100 text-red-700"
			: "bg-gray-100 text-gray-700"
	}`} variant={app.applicationStatus === "Accepted" ? "secondary" : "outline"}>
														{app.applicationStatus}
													</Badge>
												</Table.Cell>
												<Table.Cell class="hidden md:table-cell">
													{new Date(app.submittedAt.seconds * 1000).toISOString().split("T")[0]}
												</Table.Cell>

												<Table.Cell class="hidden sm:table-cell">{app.programName}</Table.Cell>
												<Table.Cell>
													<Button size="sm" variant='outline' on:click={() => openRecommendationModal()}>Recommendation</Button>
													<RecommendationModal
														isOpen={$isModalOpen} application={$selectedApplication} on:close={() => isModalOpen.set(false)}
													/>
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							</Card.Content>
						</Card.Root>
					</Tabs.Content>
				</Tabs.Root>
			</div>
			<div>
				<Card.Root class="overflow-hidden">
					<Card.Header class="flex flex-row items-start bg-muted/50">
						<div class="grid gap-0.5">
							<Card.Title class="group flex items-center gap-2 text-lg">
								{$selectedApplication?.applicationID}
								<Button
									size="icon"
									variant="outline"
									class="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
								>
									<Copy class="h-3 w-3" />
									<span class="sr-only">Copy Application ID</span>
								</Button>
							</Card.Title>
							<Card.Description class="mb-2">
								Date: {formatDate($selectedApplication?.submittedAt)}
							</Card.Description>
						</div>
						<div class="ml-auto flex items-center gap-1">
							<Button size="sm" variant="outline" class="h-8 gap-1" on:click={openStatusModal}>
								<Truck class="h-3.5 w-3.5" /> Change Status
							</Button>
						</div>
					</Card.Header>
					<Card.Content class="p-6 text-sm">
						<div class="grid gap-3">
							<div class="font-semibold">Business Details</div>
							<ul class="grid gap-3">
								<li class="flex items-center justify-between">
									<span class="text-muted-foreground"> Business Name </span>
									<span>{$selectedApplication?.businessName}</span>
								</li>
								<li class="flex items-center justify-between">
									<span class="text-muted-foreground"> Sector </span>
									<span>{$selectedApplication?.natureOfBusiness}</span>
								</li>
								<li class="flex items-center justify-between">
									<span class="text-muted-foreground"> Growth Rate</span>
									<span>{$selectedApplication?.growthRate}</span>
								</li>
								<li class="flex items-center justify-between">
									<span class="text-muted-foreground"> Previous Year Revenue </span>
									<span>{$selectedApplication?.revenueFor2024}</span>
								</li>
								<li class="flex flex-col">
	<span class="text-muted-foreground font-semibold mb-2">Past Four Months Overview</span>
	<table class="w-full border border-gray-300 text-sm">
		<thead>
			<tr class="bg-gray-100">
				<th class="border border-gray-300 p-2 text-left">Month</th>
				<th class="border border-gray-300 p-2 text-left">Revenue</th>
				<th class="border border-gray-300 p-2 text-left">Employees</th>
			</tr>
		</thead>
		<tbody>
			{#each [1, 2, 3, 4] as month}
				<tr class="border-b border-gray-300">
					<td class="border border-gray-300 p-2">Month {month}</td>
					<td class="border border-gray-300 p-2">{$selectedApplication?.[`revenueForMonth${month}`] || "N/A"}</td>
					<td class="border border-gray-300 p-2">{$selectedApplication?.[`employeesForMonth${month}`] || "N/A"}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</li>

							</ul>
							<div class="font-semibold">Top Interventions</div>
							<ul class="grid gap-3">
								{#if $selectedApplication?.interventions}
									{#each Object.entries($selectedApplication.interventions) as [key, value]}
										{#if Array.isArray(value) && value.length > 0}
											<li class="flex items-center justify-between">
												<span class="text-muted-foreground">🔹 {key} ({value.length})</span>
											</li>
										{/if}
									{/each}
								{:else}
									<li class="text-muted-foreground">No interventions available.</li>
								{/if}
							</ul>

							<Separator class="my-4" />
							<div class="grid gap-3">
								<div class="font-semibold">Applicant Information</div>
								<dl class="grid gap-3">
									<div class="flex items-center justify-between">
										<dt class="text-muted-foreground">Applicant</dt>
										<dd>{$selectedApplication?.name}</dd>
									</div>
									<div class="flex items-center justify-between">
										<dt class="text-muted-foreground">Email</dt>
										<dd>
											<a href="mailto:">{$selectedApplication?.email}</a>
										</dd>
									</div>
									<div class="flex items-center justify-between">
										<dt class="text-muted-foreground">Phone</dt>
										<dd>
											<a href="tel:">{$selectedApplication?.phoneNumber}</a>
										</dd>
									</div>
								</dl>
							</div>
							<Separator class="my-4" />
							<div class="grid grid-cols-2 gap-4">
								<div class="grid gap-3">
									<div class="font-semibold">Address Information</div>
									<address class="grid gap-0.5 not-italic text-muted-foreground">
										<span>{$selectedApplication?.name}</span>
										<span>{$selectedApplication?.businessAddress}</span>
									</address>
								</div>
							</div>
						</div></Card.Content
					>
					<Card.Footer class="bApplication-t flex flex-row items-center bg-muted/50 px-6 py-3">
						<div class="text-xs text-muted-foreground">
							Updated <time dateTime="2023-11-23">November 23, 2023</time>
						</div>
						<Pagination.Root count={10} class="ml-auto mr-0 w-auto">
							<Pagination.Content>
								<Pagination.Item>
									<Button size="icon" variant="outline" class="h-6 w-6">
										<ChevronLeft class="h-3.5 w-3.5" />
										<span class="sr-only">Previous Application</span>
									</Button>
								</Pagination.Item>
								<Pagination.Item>
									<Button size="icon" variant="outline" class="h-6 w-6">
										<ChevronRight class="h-3.5 w-3.5" />
										<span class="sr-only">Next Application</span>
									</Button>
								</Pagination.Item>
							</Pagination.Content>
						</Pagination.Root>
					</Card.Footer>
				</Card.Root>
				<!-- Status Change Modal -->
				<Dialog.Root open={$isStatusModalOpen} on:close={closeModal}>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Change Application Status</Dialog.Title>
						</Dialog.Header>

						<div class="space-y-2">
							<p><strong>Current Status:</strong> {$selectedApplication?.applicationStatus}</p>
							<label for="status">Select New Status:</label>
							<select id="status" bind:value={$newStatus} class="border rounded p-2 w-full">
								<option value="Accepted">Accepted</option>
								<option value="Rejected">Rejected</option>
							</select>
						</div>
						<Button type="button" class="w-full" on:click={updateApplicationStatus} disabled={$isLoading}>
							{#if $isLoading}
								<Icons.spinner class="mr-2 h-4 w-4 animate-spin" />
								Making Update...
							{:else}
								Save Change
							{/if}
						</Button>
					</Dialog.Content>
				</Dialog.Root>
			</div>
		</main>
	</div>
</div>
