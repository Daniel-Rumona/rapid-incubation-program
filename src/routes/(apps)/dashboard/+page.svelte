<script lang="ts">
	import Activity from 'lucide-svelte/icons/activity';
	import ArrowUpRight from 'lucide-svelte/icons/arrow-up-right';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Users from 'lucide-svelte/icons/user-check';

	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import ApplicationsCharts from '$lib/components/ui/applications-chart/applications-charts.svelte';
	import Programdist from "../analytics/(charts)/programdist.svelte";

	import { writable } from 'svelte/store';
	import { collection, getDocs } from "firebase/firestore";
	import { db } from "$lib/firebase";

	// ✅ Writable stores for dashboard metrics
	const totalApplications = writable<number>(0);
	const totalRevenue = writable<number>(0);
	const averageCompanyAge = writable<number>(0);
	const averageOwnerAge = writable<number>(0);

	// Fetch all applications from Firestore
	// ✅ Fetch all applications from Firestore
	const fetchAllApplications = async () => {
		try {
			const usersRef = collection(db, "Users");
			const usersSnapshot = await getDocs(usersRef);

			let totalApps = 0;
			let totalRevenueSum = 0;
			let companyAgeSum = 0;
			let ownerAgeSum = 0;
			let companyAgeCount = 0;
			let ownerAgeCount = 0;

			for (const userDoc of usersSnapshot.docs) {
				const userID = userDoc.id;

				// 🔹 Reference Applications Subcollection
				const applicationsRef = collection(db, `Users/${userID}/Applications`);
				const applicationsSnapshot = await getDocs(applicationsRef);

				applicationsSnapshot.forEach((appDoc) => {
					const appData = appDoc.data();
					totalApps++;

					// 🔹 Total Revenue Calculation (Ensure it's a valid number)
					if (appData.revenueFor2024 && !isNaN(parseFloat(appData.revenueFor2024))) {
						totalRevenueSum += parseFloat(appData.revenueFor2024);
					}

					// 🔹 Company Age Calculation (Years of Trading)
					if (appData.yearsOfTrading && !isNaN(parseInt(appData.yearsOfTrading))) {
						companyAgeSum += parseInt(appData.yearsOfTrading);
						companyAgeCount++;
					}

					// 🔹 Owner Age Calculation
					if (appData.applicantAge && !isNaN(parseInt(appData.applicantAge))) {
						ownerAgeSum += parseInt(appData.applicantAge);
						ownerAgeCount++;
					}
				});
			}

			// ✅ Update Writable Stores
			totalApplications.set(totalApps);
			totalRevenue.set(totalRevenueSum);
			averageCompanyAge.set(companyAgeCount ? parseFloat((companyAgeSum / companyAgeCount).toFixed(1)) : 0);
			averageOwnerAge.set(ownerAgeCount ? parseFloat((ownerAgeSum / ownerAgeCount).toFixed(1)) : 0);

		} catch (error) {
			console.error("🔥 Error Fetching Applications:", error);
		}
	};

	// Fetch applications on component mount
	fetchAllApplications();
</script>

<div class="flex min-h-screen w-full flex-col">
	<main class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
		<div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Applications</Card.Title>
					<Users class="h-4 w-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{$totalApplications}</div>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Total Revenue</Card.Title>
					<DollarSign class="h-4 w-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">R{$totalRevenue.toLocaleString()}</div>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Average Company Age</Card.Title>
					<CreditCard class="h-4 w-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{$averageCompanyAge} Years</div>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Average Owner Age</Card.Title>
					<Activity class="h-4 w-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{$averageOwnerAge} Years</div>
				</Card.Content>
			</Card.Root>
		</div>
		<div class="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
			<Card.Root class=" xl:col-span-2">
				<Card.Header class="flex flex-row items-center">
					<div class="mb-2 grid gap-2">
						<Card.Title>Applications</Card.Title>
						<Card.Description>Recent applications to the program.</Card.Description>
					</div>
					<Button href="/applications" size="sm" class="ml-auto gap-1">
						View All
						<ArrowUpRight class="h-4 w-4" />
					</Button>
				</Card.Header>
				<ApplicationsCharts />
			</Card.Root>
			<Card.Root>
				<Card.Header class="flex flex-row items-center">
					<div class="mb-2 grid gap-2">
						<Card.Title>Program Applications</Card.Title>
						<Card.Description>Distribution of applications per program.</Card.Description>
					</div>
					<Button href="/analytics" size="sm" class="ml-auto gap-1">
						View All
						<ArrowUpRight class="h-4 w-4" />
					</Button>
				</Card.Header>
				<div class="flex flex-row p-4 justify-center items-center mt-2">
					<Programdist isDashboard={true} />
				</div>
			</Card.Root>
		</div>
	</main>
</div>

