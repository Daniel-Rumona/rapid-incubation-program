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
	import { Separator } from '$lib/components/ui/separator';
	import { applications, fetchAllApplications } from "../(data)/applications";
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { writable, get } from 'svelte/store';
	import { collection, db, doc, getDocs, updateDoc, query,where } from "$lib/firebase"; // Firestore for updating status
	import  {Icons} from "$lib/components/ui/icons/index";
	import * as XLSX from "xlsx"; // ✅ Import xlsx for Excel export

	function exportAllApplications() {
	const allApps = get(applications); // Get all applications from the store

	if (!allApps || allApps.length === 0) {
		alert("⚠️ No applications found.");
		return;
	}

	// ✅ Map data into rows (with headers)
	const headers = Object.keys(allApps[0]);
	const rows = allApps.map(app => headers.map(h => app[h] ?? "")); // Handle missing values

	// ✅ Build worksheet and workbook
	const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, "All_Applications");

	// ✅ Export as Excel file
	XLSX.writeFile(workbook, "All_Applications.xlsx");
}


	const isLoading = writable(false); // ✅ Now it's a store

	// Stores
	let acceptedApplications = writable(0);
	let rejectedApplications = writable(0);
	let weeklyApplications = writable(0);
	let monthlyApplications = writable(0);

	// Stores
	let isModalOpen = writable(false);
	let isStatusModalOpen = writable(false);
	let selectedFilter = "All";
	let selectedApplication = writable(null);
	let newStatus = writable(""); // Store for selected new status

	// 🔹 Fetch Applications on Load
	onMount(async () => {
		isLoading.set(true);
		await fetchAllApplications();
		await fetchApplicationMetrics();
		isLoading.set(false);
	});

	// 🔹 Filter Logic
	$: filteredApplications = $applications.filter(app =>
		selectedFilter === "All" || app.applicationStatus === selectedFilter
	);

	function formatDate(timestamp) {
		if (!timestamp) return "N/A";

		let date;
		if (timestamp.seconds) {
			date = new Date(timestamp.seconds * 1000);  // Firestore Timestamp
		} else {
			date = new Date(timestamp);  // ISO string
		}

		return date.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	}

	// 🔹 Select Application
	function selectApplication(app) {
		selectedApplication.set(app);
	}



	function openRecommendationModal(app) {
		if (!app) {
			console.warn("⚠️ No valid application selected.");
			return;
		}

		// ✅ Close the modal first to force a reset
		isModalOpen.set(false);

		setTimeout(() => {
			// ✅ Make sure we're setting a fresh copy of the application
			selectedApplication.set({ ...app });

			isModalOpen.set(true);
		}, 10);
	}


	async function refreshApplicationStatus(applicationID) {
		try {
			const usersRef = collection(db, "Users");
			const usersSnapshot = await getDocs(usersRef);

			for (const userDoc of usersSnapshot.docs) {
				const applicationsRef = collection(db, `Users/${userDoc.id}/Applications`);
				const q = query(applicationsRef, where("applicationID", "==", applicationID));
				const querySnapshot = await getDocs(q);

				if (!querySnapshot.empty) {
					const appDoc = querySnapshot.docs[0];
					const updatedApp = appDoc.data();

					// ✅ Update the selected application with new data
					selectedApplication.set(updatedApp);
					return;
				}
			}

			console.warn("⚠️ Application ID not found in Firestore.");
		} catch (error) {
			console.error("🔥 Error refreshing application status:", error);
		}
	}
	function closeRecommendationModal() {
		isModalOpen.set(false);

		setTimeout(async () => {
			// ✅ Restore scrolling when modal is fully closed
			if (!get(isModalOpen)) {
				document.body.style.overflow = "";
			}

			const app = get(selectedApplication);
			if (app) {
				await refreshApplicationStatus(app.applicationID);
			}
		}, 300); // Small delay ensures smooth closing
	}



	// Update Status in Firestore

	async function fetchApplicationMetrics() {
	try {
		const usersRef = collection(db, "Users");
		const usersSnapshot = await getDocs(usersRef);
		const today = new Date();

		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(today.getDate() - 7);

		const currentMonth = today.getMonth();
		const currentYear = today.getFullYear();

		let acceptedCount = 0;
		let rejectedCount = 0;
		let weekCount = 0;
		let monthCount = 0;

		// Parallelize fetching all user applications
		const appSnapshots = await Promise.all(
			usersSnapshot.docs.map(async (userDoc) => {
				const appsRef = collection(db, `Users/${userDoc.id}/Applications`);
				const snapshot = await getDocs(appsRef);
				return snapshot.docs.map(doc => doc.data());
			})
		);

		// Flatten all application arrays into one
		const allApplications = appSnapshots.flat();

		// Loop through each app to count metrics
		for (const appData of allApplications) {
			if (appData.applicationStatus === "Accepted") acceptedCount++;
			if (appData.applicationStatus === "Rejected") rejectedCount++;

			if (appData.submittedAt) {
				let submittedDate = appData.submittedAt.seconds
					? new Date(appData.submittedAt.seconds * 1000)
					: new Date(appData.submittedAt);

				if (submittedDate >= sevenDaysAgo) {
					weekCount++;
				}

				if (
					submittedDate.getFullYear() === currentYear &&
					submittedDate.getMonth() === currentMonth
				) {
					monthCount++;
				}
			}
		}

		// Update the stores
		acceptedApplications.set(acceptedCount);
		rejectedApplications.set(rejectedCount);
		weeklyApplications.set(weekCount);
		monthlyApplications.set(monthCount);
	} catch (error) {
		console.error("🔥 Error Fetching Application Metrics:", error);
	}
}

	async function downloadUserDocuments() {
		const app = get(selectedApplication);

		if (!app || !app.documents || app.documents.length === 0) {
			alert("⚠️ No documents available for this application.");
			return;
		}

		try {
			console.log("📥 Downloading Documents for:", app.applicationID);

			// Loop through document URLs and trigger downloads
			app.documents.forEach((docUrl) => {
				const link = document.createElement("a");
				link.href = docUrl;
				link.target = "_blank"; // Open in new tab
				link.download = docUrl.split("/").pop(); // Use the filename from the URL
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			});
		} catch (error) {
			console.error("🔥 Error downloading documents:", error);
			alert("❌ Error downloading documents. Please try again.");
		}
	}

</script>

<div class="flex min-h-screen w-full flex-col">
	<div class="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
		{#if $isLoading}
			<div class="flex min-h-[60vh] w-full items-center justify-center">
				<svg class="animate-spin h-10 w-10 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
				</svg>
				<span class="ml-3 text-muted-foreground text-sm">Loading applications...</span>
			</div>
		{:else}
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
										<DropdownMenu.CheckboxItem checked={selectedFilter === 'Rejected'} on:click={() => selectedFilter = "Rejected"}>Rejected</DropdownMenu.CheckboxItem>
										<DropdownMenu.CheckboxItem checked={selectedFilter === 'All'} on:click={() => selectedFilter = "All"}>All</DropdownMenu.CheckboxItem>
									</DropdownMenu.Content>
								</DropdownMenu.Root>

								<Button size="sm" variant="outline" class="h-7 gap-1 text-sm" on:click={exportAllApplication}>
									<File class="h-3.5 w-3.5" />
									<span class="sr-only sm:not-sr-only">Export All</span>
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
												<Table.Head class="hidden md:table-cell">Program</Table.Head>
												<Table.Head class="text-right">Action</Table.Head>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{#each filteredApplications as app}
												<Table.Row class="cursor-pointer hover:bg-accent" on:click={() => selectApplication(app)}>
													<Table.Cell>
														<div class="font-medium">{app.name}</div>
														<div class="hidden text-sm text-muted-foreground md:inline">{app.email}</div>
													</Table.Cell>
													<Table.Cell class="hidden sm:table-cell">{app.natureOfBusiness}</Table.Cell>
													<Table.Cell class="hidden sm:table-cell">
														<Badge class={`text-xs ${app.applicationStatus === "Accepted"
																	? "bg-blue-100 text-blue-700"
																	: app.applicationStatus === "Rejected"
																	? "bg-red-100 text-red-700"
																	: "bg-gray-100 text-gray-700"
														}`}>
															{app.applicationStatus || "Awaiting Confirmation"}
														</Badge>
													</Table.Cell>
													<Table.Cell class="hidden sm:table-cell">{app.programName}</Table.Cell>
													<Table.Cell>
														<!-- ✅ Open Modal with Selected Application -->
														<Button size="sm" variant="outline" on:click={(e) => { e.stopPropagation(); openRecommendationModal(app); }}>
															Check Recommendation
														</Button>
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
								<Button size="sm" variant="outline" class="h-8 gap-1" on:click={downloadUserDocuments}>
									<File class="h-3.5 w-3.5" /> Download User Documents
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
										<span class="text-muted-foreground"> Business Description </span>
										<span class=text-[8px]>{$selectedApplication?.businessDescription}</span>
									</li>
									<li class="flex items-center justify-between">
										<span class="text-muted-foreground"> Growth Rate</span>
										<span>{$selectedApplication?.growthRate}</span>
									</li>
									<li class="flex items-center justify-between">
										<span class="text-muted-foreground"> Previous Year Revenue </span>
										<span>{$selectedApplication?.revenueFor2024}</span>
									</li>
									<li class="flex items-center justify-between">
										<span class="text-muted-foreground">Total Past Four Months Turnover </span>
										<span> {(
											(parseFloat($selectedApplication?.revenueForMonth1 || "0")) +
											(parseFloat($selectedApplication?.revenueForMonth2 || "0")) +
											(parseFloat($selectedApplication?.revenueForMonth3 || "0")) +
											(parseFloat($selectedApplication?.revenueForMonth4 || "0"))
										).toFixed(0)}</span>
									</li>
									<li class="flex items-center justify-between">
										<span class="text-muted-foreground">Last Year Number Of Workers</span>
										<span>{$selectedApplication?.employeesFor2024}</span>
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

				</div>
				<!-- ✅ Only one Recommendation Modal -->
				<RecommendationModal
					isOpen={$isModalOpen}
					application={$selectedApplication}
					on:close={closeRecommendationModal}
				/>

			</main>
			{/if}
			</div>
			</div>

