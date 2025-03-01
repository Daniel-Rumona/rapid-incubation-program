<script lang="ts">
	import House from "lucide-svelte/icons/house";
	import ListFilter from "lucide-svelte/icons/list-filter";
	import Package from "lucide-svelte/icons/package";
	import Package2 from "lucide-svelte/icons/package-2";
	import PanelLeft from "lucide-svelte/icons/panel-left";
	import Search from "lucide-svelte/icons/search";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { Badge } from "$lib/components/ui/badge";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb";
	import { Button } from "$lib/components/ui/button";
	import * as Card from "$lib/components/ui/card";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { Input } from "$lib/components/ui/input";
	import * as Sheet from "$lib/components/ui/sheet";
	import * as Table from "$lib/components/ui/table";
	import * as Tabs from "$lib/components/ui/tabs";
	import { auth, db } from "$lib/firebase";
	import { collection, getDocs, query, where } from "firebase/firestore";
	import { writable } from "svelte/store";
	import { onMount } from "svelte";
	import { onAuthStateChanged, signOut } from 'firebase/auth';
	import { goto } from "$app/navigation";
	import { cn } from '$lib/utils';
	import { page } from "$app/stores";

	const loggedInUser = writable<{ fullName: string; email: string } | null>(null);

	let selectedCategoryFilter = "All"; // Default category filter
	let selectedStatusFilter = "All";   // Default status filter
	let selectedTab = "all"; // Default status tab


	// Modal state
	let showModal = writable(false);
	let modalContent = writable({ justification: "", score: 0 });

	const openModal = (justification, score) => {
		modalContent.set({ justification, score });
		showModal.set(true);
	};

	const closeModal = () => {
		showModal.set(false);
	};
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


	let programs = writable([]);
	let filteredProgramms = writable([]);

	// ✅ Fetch Firestore User ID using Email
	async function getUserIdByEmail(email) {
		try {
			console.log("📌 Searching Firestore for user with email:", email);
			const usersRef = collection(db, "Users");
			const q = query(usersRef, where("userEmail", "==", email));
			const querySnapshot = await getDocs(q);

			if (!querySnapshot.empty) {
				const userId = querySnapshot.docs[0].id;
				console.log("✅ Found Firestore User ID:", userId);
				return userId;
			} else {
				console.warn("⚠️ No Firestore user found with email:", email);
				return null;
			}
		} catch (error) {
			console.error("🔥 Error fetching Firestore user ID:", error);
			return null;
		}
	}

	// ✅ Fetch User Applications
	async function fetchUserApplications(userId) {
		try {
			const applicationsRef = collection(db, `Users/${userId}/Applications`);
			const querySnapshot = await getDocs(applicationsRef);
			const now = new Date();

			let applications = querySnapshot.docs.map(doc => {
				let appData = doc.data();

				// ✅ Convert `submittedAt` properly
				if (appData.submittedAt) {
					if (typeof appData.submittedAt === "string") {
						appData.submittedAt = new Date(appData.submittedAt); // ✅ Convert ISO string
					} else if (appData.submittedAt.toDate) {
						appData.submittedAt = appData.submittedAt.toDate(); // ✅ Convert Firestore Timestamp
					} else {
						console.warn("⚠️ submittedAt field is missing or invalid for:", appData);
						appData.submittedAt = "N/A"; // ✅ Default to "N/A"
					}
				} else {
					appData.submittedAt = "N/A"; // ✅ Default if missing
				}

				// ✅ Set Status Logic
				const timeDiff = appData.submittedAt !== "N/A"
					? (now.getTime() - appData.submittedAt.getTime()) / (1000 * 60 * 60)
					: 9999;

				appData.status = timeDiff <= 48 ? "Under Review" : appData.aiRecommendation || "Pending";

				return appData;
			});

			return applications;
		} catch (error) {
			console.error("🔥 Error fetching user applications:", error);
			return [];
		}
	}


	// ✅ Fetch Programms & Cross-Reference Applications
	async function fetchProgramms() {
		try {
			console.log("📌 [FETCH STARTED] Fetching programs from Firestore...");

			const programsRef = collection(db, "Programs");
			const querySnapshot = await getDocs(programsRef);
			let fetchedProgramms = querySnapshot.docs.map(doc => ({
				...doc.data(),
				id: doc.id,
				status: "Not Applied",
			}));

			console.log(`✅ [FETCH COMPLETE] Total Programs Fetched: ${fetchedProgramms.length}`);

			const user = auth.currentUser;
			if (user) {
				console.log(`📌 [USER DETECTED] Fetching applications for: ${user.email}`);

				const userId = await getUserIdByEmail(user.email);
				if (userId) {
					console.log(`✅ [USER ID FOUND] Firestore User ID: ${userId}`);

					const userApplications = await fetchUserApplications(userId);
					console.log(`📌 [USER APPLICATIONS] Found ${userApplications.length} applications`);

					// ✅ Update Programs with Correct Status
					fetchedProgramms = fetchedProgramms.map(program => {
						const appliedProgramm = userApplications.find(app => app.programID === program.programID);
						return {
							...program,
							status: appliedProgramm ? appliedProgramm.status : "Not Applied", // ✅ Now shows correct status
							aiResponse: appliedProgramm ? appliedProgramm.aiJustification : null, // ✅ Store AI Response for modal
							aiScore: appliedProgramm ? appliedProgramm.aiScore : null
						};
					});


					console.log("✅ [PROGRAMS UPDATED] Programs with application statuses:", fetchedProgramms);
				} else {
					console.warn("⚠️ [NO USER ID] User ID not found. Skipping application check.");
				}
			} else {
				console.warn("⚠️ [NO USER] No authenticated user detected. Showing all programs as 'Not Applied'.");
			}

			programs.set(fetchedProgramms);
			filterProgramms();
		} catch (error) {
			console.error("🔥 [ERROR] Fetching programs failed:", error);
		}
	}

	// ✅ Apply Filters
	function filterProgramms() {
		programs.subscribe(allProgramms => {
			const filtered = allProgramms.filter(program =>
				(selectedCategoryFilter === "All" || program.programCategory === selectedCategoryFilter) &&
				(selectedStatusFilter === "All" || program.status === selectedStatusFilter)
			);
			console.log("✅ Filtered programs:", filtered);
			filteredProgramms.set(filtered);
		});
	}

	// ✅ Run on Page Load
	onAuthStateChanged(auth, async (user) => {
		if (user?.email) {
			let fullName = user.displayName || "User"; // Default if displayName is missing
			const usersRef = collection(db, "Users");
			const q = query(usersRef, where("userEmail", "==", user.email));
			const querySnapshot = await getDocs(q);

			if (!querySnapshot.empty) {
				fullName = querySnapshot.docs[0].data().userFullName || fullName; // ✅ Prefer Firestore name if available
			}

			loggedInUser.set({ fullName, email: user.email });
			await fetchProgramms();
		} else {
			loggedInUser.set(null);
		}
	});
</script>
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
		$page.url.pathname === "/track-application/tracker" ? "text-foreground" : "text-muted-foreground"
	)}
						>
						<House class="h-5 w-5" />
							Dashboard
						</a>
						<a
							href="/track-application/tracker/programs"
							class={cn(
		"hover:text-foreground flex items-center gap-4 px-2.5",
		$page.url.pathname === "/track-application/tracker/programs" ? "text-foreground" : "text-muted-foreground"
	)}
						>
						<Package class="h-5 w-5" />
							Programms
						</a>
					</nav>
				</Sheet.Content>
			</Sheet.Root>
			<Breadcrumb.Root class="hidden md:flex">
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link href="/track-application/tracker">Dashboard</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
					<Breadcrumb.Item>
						<Breadcrumb.Link href="##">Programms</Breadcrumb.Link>
					</Breadcrumb.Item>


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
			<Tabs.Root bind:value={selectedTab}>
				<div class="flex items-center">
					<div class="ml-auto flex items-center gap-2">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger asChild let:builder>
								<Button
									builders={[builder]}
									variant="outline"
									size="sm"
									class="h-8 gap-1"
								>
									<ListFilter class="h-3.5 w-3.5" />
									<span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Filter Programms By Status
            </span>
								</Button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end">
								<DropdownMenu.Label>Filter by Status</DropdownMenu.Label>
								<DropdownMenu.Separator />
								<DropdownMenu.CheckboxItem checked={selectedStatusFilter === "All"} on:click={() => { selectedStatusFilter = "All"; filterProgramms(); }}>All</DropdownMenu.CheckboxItem>
								<DropdownMenu.CheckboxItem checked={selectedStatusFilter === "Not Applied"} on:click={() => { selectedStatusFilter = "Not Applied"; filterProgramms(); }}>Not Applied</DropdownMenu.CheckboxItem>
								<DropdownMenu.CheckboxItem checked={selectedStatusFilter === "Under Review"} on:click={() => { selectedStatusFilter = "Under Review"; filterProgramms(); }}>Under Review</DropdownMenu.CheckboxItem>
								<DropdownMenu.CheckboxItem checked={selectedStatusFilter === "Rejected"} on:click={() => { selectedStatusFilter = "Rejected"; filterProgramms(); }}>Rejected</DropdownMenu.CheckboxItem>
								<DropdownMenu.CheckboxItem checked={selectedStatusFilter === "Accepted"} on:click={() => { selectedStatusFilter = "Accepted"; filterProgramms(); }}>Accepted</DropdownMenu.CheckboxItem>
							</DropdownMenu.Content>
						</DropdownMenu.Root>

						<DropdownMenu.Root>
							<DropdownMenu.Trigger asChild let:builder>
								<Button
									builders={[builder]}
									variant="outline"
									size="sm"
									class="h-8 gap-1"
								>
									<ListFilter class="h-3.5 w-3.5" />
									<span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Filter by Category
            </span>
								</Button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end">
								<DropdownMenu.Label>Filter by Category</DropdownMenu.Label>
								<DropdownMenu.Separator />
								<DropdownMenu.CheckboxItem checked={selectedCategoryFilter === "All"} on:click={() => { selectedCategoryFilter = "All"; filterProgramms(); }}>All</DropdownMenu.CheckboxItem>
								<DropdownMenu.CheckboxItem checked={selectedCategoryFilter === "Ideation"} on:click={() => { selectedCategoryFilter = "Ideation"; filterProgramms(); }}>Ideation</DropdownMenu.CheckboxItem>
								<DropdownMenu.CheckboxItem checked={selectedCategoryFilter === "Incubation"} on:click={() => { selectedCategoryFilter = "Incubation"; filterProgramms(); }}>Incubation</DropdownMenu.CheckboxItem>
							</DropdownMenu.Content>
						</DropdownMenu.Root>

					</div>
				</div>
				<Tabs.Content value={selectedTab}>
					<Card.Root
						data-x-chunk-name="dashboard-06-chunk-0"
						data-x-chunk-description="A list of programs in a table with actions. Each row has an image, name, status, price, total sales, created at and actions."
					>
						<Card.Header>
							<Card.Title>Programms</Card.Title>
						</Card.Header>
						<Card.Content>
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head>Name</Table.Head>
										<Table.Head>Category</Table.Head>
										<Table.Head>Status</Table.Head>
										<Table.Head>Action</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each $filteredProgramms as program}
										<Table.Row>
											<Table.Cell>{program.programName}</Table.Cell>
											<Table.Cell>{program.programCategory}</Table.Cell>
											<Table.Cell>
												<Badge class="text-xs" variant={program.status === "Accepted" ? "secondary" : "outline"}>
													{program.status}
												</Badge>
											</Table.Cell>
											<Table.Cell>
												{#if program.status === "Not Applied"}
													<Button
														size="sm"
														on:click={() => goto(`/application-form?programID=${encodeURIComponent(program.programID)}&programName=${encodeURIComponent(program.programName)}&programCategory=${encodeURIComponent(program.programCategory)}`)}
													>
														Apply
													</Button>
												{:else if program.status !== "Under Review"}
													<Button size="sm" variant="outline" on:click={() => openModal(program.aiResponse, program.aiScore)}>
														Check Reply
													</Button>
												{:else}
													<Button size="sm" variant="outline" disabled>
														Check Reply
													</Button>
												{/if}
											</Table.Cell>

										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</main>
	</div>
	{#if $showModal}
		<div class="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
			<div class="bg-white p-6 rounded-lg shadow-lg text-center w-1/3">
				<h2 class="text-xl font-semibold mb-2">AI Evaluation</h2>
				<p class="mb-4 text-gray-600"><strong>Justification:</strong> {$modalContent.justification}</p>
				<p class="mb-4 text-gray-600"><strong>AI Score:</strong> {$modalContent.score}</p>
				<Button on:click={closeModal} class="bg-red-500 text-white px-4 py-2 rounded">
					Close
				</Button>
			</div>
		</div>
	{/if}
</div>
