<script lang="ts">
	import { onMount } from "svelte";
import { writable, get } from "svelte/store";  // ✅ Correct import
	import { collection, getDocs } from "firebase/firestore";
	import { scaleLinear } from "d3-scale";
	import { db } from "$lib/firebase";

	// 🔹 Props
	export let isDashboard: boolean = false;

	// 🔹 Writable Stores
	let applications = writable([]);
	let groupedData = writable([]);
	let currentView = writable("daily"); // "daily", "weekly", "monthly"
	let currentIndex = writable(0);

	// 🔹 Chart Dimensions (Adjust for Dashboard Mode)
	const padding = { top: 20, right: 15, bottom: 40, left: 45 };
	let width = isDashboard ? 250 : 1200;
	let height = isDashboard ? 250 : 400;

	// 🔹 Fetch applications from Firestore
	const fetchApplications = async () => {
		try {
			console.log("🔍 Fetching applications...");
			const usersRef = collection(db, "Users");
			const usersSnapshot = await getDocs(usersRef);

			let allApplications = [];

			for (const userDoc of usersSnapshot.docs) {
				const applicationsRef = collection(db, `Users/${userDoc.id}/Applications`);
				const applicationsSnapshot = await getDocs(applicationsRef);

				applicationsSnapshot.forEach((appDoc) => {
					const appData = appDoc.data();
					if (appData.submittedAt?.seconds) {
						allApplications.push({
							submittedAt: new Date(appData.submittedAt.seconds * 1000), // Convert Firestore timestamp
						});
					}
				});
			}

			// Store applications
			applications.set(allApplications);
			console.log("✅ Applications Loaded:", allApplications);
			groupApplications("daily"); // Default to daily view
		} catch (error) {
			console.error("🔥 Error Fetching Applications:", error);
		}
	};

	// 🔹 Group applications by daily, weekly, or monthly
	const groupApplications = (view) => {
		currentView.set(view);
		let allApps = get(applications);

		let grouped = [];
		let dateMap = new Map();

		allApps.forEach(({ submittedAt }) => {
			let key;

			if (view === "daily") {
				key = submittedAt.toISOString().split("T")[0]; // YYYY-MM-DD
			} else if (view === "weekly") {
				let startOfWeek = new Date(submittedAt);
				startOfWeek.setDate(submittedAt.getDate() - submittedAt.getDay()); // Get first day of week (Sunday)
				key = startOfWeek.toISOString().split("T")[0];
			} else if (view === "monthly") {
				key = `${submittedAt.getFullYear()}-${(submittedAt.getMonth() + 1)
					.toString()
					.padStart(2, "0")}`;
			}

			dateMap.set(key, (dateMap.get(key) || 0) + 1);
		});

		grouped = Array.from(dateMap.entries()).map(([name, total]) => ({
			name,
			total,
		}));

		// Sort by date ascending
		grouped.sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

		// Paginate (Dashboard Mode: Only Show Latest 7 Entries)
		let pageSize = isDashboard ? 7 : view === "daily" ? 30 : view === "weekly" ? 10 : 6;
		groupedData.set(grouped.slice(get(currentIndex) * pageSize, (get(currentIndex) + 1) * pageSize));

		console.log("📊 Grouped Data:", grouped);
	};

	// 🔹 Navigation (Next & Previous)
	const nextPeriod = () => {
		currentIndex.update((idx) => idx + 1);
		groupApplications(get(currentView));
	};

	const prevPeriod = () => {
		currentIndex.update((idx) => Math.max(idx - 1, 0));
		groupApplications(get(currentView));
	};

	// 🔹 Chart Scales
	$: xScale = scaleLinear()
		.domain([0, get(groupedData).length])
		.range([padding.left, width - padding.right]);

	$: yScale = scaleLinear()
		.domain([0, Math.max(...get(groupedData).map((d) => d.total), 10)])
		.range([height - padding.bottom, padding.top]);

	$: innerWidth = width - (padding.left + padding.right);
	$: barWidth = innerWidth / get(groupedData).length - 5;

	// 🔹 Load Data on Mount
	onMount(fetchApplications);
</script>

<!-- 🔹 Controls (Hide in Dashboard Mode) -->
{#if !isDashboard}
	<div class="controls">
		<button on:click={() => groupApplications("daily")}>Daily</button>
		<button on:click={() => groupApplications("weekly")}>Weekly</button>
		<button on:click={() => groupApplications("monthly")}>Monthly</button>
	</div>

	<!-- 🔹 Navigation -->
	<div class="nav">
		<button on:click={prevPeriod} disabled={$currentIndex === 0}>← Previous</button>
		<span>Viewing {$currentView} data</span>
		<button on:click={nextPeriod}>Next →</button>
	</div>
{/if}

<!-- 🔹 Scrollable Chart Container -->
<div class="chart-container">
	<div class="chart">
		<svg width={width} height={height}>
			<!-- Y-Axis -->
			<g class="axis y-axis">
				{#each [0, Math.max(...$groupedData.map((d) => d.total), 10)] as tick}
					<g transform="translate(0, {yScale(tick)})">
						<text stroke="none" font-size="12" fill="#888888" text-anchor="end" x="40" y="-4">
							<tspan>{tick}</tspan>
						</text>
					</g>
				{/each}
			</g>

			<!-- X-Axis -->
			<g class="axis x-axis">
				{#each $groupedData as point, i}
					<g transform="translate({xScale(i)}, {height - padding.bottom})">
						<text stroke="none" font-size="12" fill="#888888" text-anchor="middle" x={barWidth / 2} y="15">
							<tspan>{point.name}</tspan>
						</text>
					</g>
				{/each}
			</g>

			<!-- Bars -->
			<g>
				{#each $groupedData as point, i}
					<rect
						x={xScale(i)}
						y={yScale(point.total)}
						width={barWidth}
						height={yScale(0) - yScale(point.total)}
						fill="deepskyblue"
						rx="4"
						ry="4"
					/>
				{/each}
			</g>
		</svg>
	</div>
</div>

<style>
    .controls {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
    }
    .nav {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
    }
    .chart-container {
        overflow-x: auto;
        width: 100%;
        padding-bottom: 10px;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
    .chart-container::-webkit-scrollbar {
        display: none;
    }
    .chart {
        display: inline-block;
    }
    .axis text {
        font-size: 12px;
    }
</style>
