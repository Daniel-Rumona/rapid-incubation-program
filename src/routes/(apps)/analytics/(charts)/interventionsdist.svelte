<script>
	import { collection, getDocs } from "firebase/firestore";
	import { db } from "$lib/firebase";
	import { writable } from "svelte/store";
import { tick } from 'svelte'

	let isLoading = writable(true);
	let interventionData = [];

$: if (!$isLoading && interventionData.length > 0) {
	tick().then(() => {
		renderChart(interventionData);
	});
}


	import { onMount } from "svelte";
	import * as d3 from "d3";

	let width = 1000, height = 400;
	let svg;
function renderChart(data) {
	console.log("🎨 Rendering chart with data:", data);

	const svgEl = document.getElementById("chart");
	if (!svgEl) {
		console.error("❌ SVG #chart not found in DOM");
		return;
	}

	const tooltip = d3.select("#tooltip");

	// Clear any existing elements inside the chart
	d3.select("#chart").selectAll("*").remove();

	const margin = { top: 20, right: 30, bottom: 100, left: 50 };
	const chartWidth = width - margin.left - margin.right;
	const chartHeight = height - margin.top - margin.bottom;

	const svg = d3.select("#chart")
		.attr("width", width)
		.attr("height", height)
		.style("background", "#f9f9f9"); // Add background to see chart area

	const g = svg.append("g")
		.attr("transform", `translate(${margin.left},${margin.top})`);

	const xScale = d3.scaleBand()
		.domain(data.map(d => d.intervention))
		.range([0, chartWidth])
		.padding(0.4);

	const yMax = d3.max(data, d => d.value) || 10;
	const yScale = d3.scaleLinear()
		.domain([0, yMax])
		.range([chartHeight, 0]);

	console.log("📐 xScale domain:", xScale.domain());
	console.log("📐 yScale domain:", yScale.domain());

	const colorScale = d3.scaleOrdinal()
		.domain(data.map(d => d.intervention))
		.range(d3.schemeTableau10);

	// Test bar to prove rendering works
	g.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", 100)
		.attr("height", 100)
		.attr("fill", "red");

	// Bars
	const bars = g.selectAll(".bar")
		.data(data);

	console.log("📊 Data size:", data.length);
	console.log("📦 Bar selection size:", bars.size());

	bars.enter()
		.append("rect")
		.attr("class", "bar")
		.attr("x", d => {
			const x = xScale(d.intervention);
			console.log("🔹 x pos for", d.intervention, "→", x);
			return x;
		})
		.attr("y", d => {
			const y = yScale(d.value);
			console.log("🔹 y pos for", d.intervention, "→", y);
			return y;
		})
		.attr("width", xScale.bandwidth())
		.attr("height", d => {
			const h = chartHeight - yScale(d.value);
			console.log("🔹 height for", d.intervention, "→", h);
			return h;
		})
		.attr("rx", 4)
		.attr("fill", d => colorScale(d.intervention))
		.on("mouseover", function (event, d) {
			d3.select(this).attr("opacity", 0.8);
			tooltip
				.style("display", "block")
				.style("opacity", 1)
				.html(`<strong>${d.intervention}</strong>: ${d.value}`);
		})
		.on("mousemove", function (event) {
			tooltip
				.style("left", event.pageX + 10 + "px")
				.style("top", event.pageY - 28 + "px");
		})
		.on("mouseout", function () {
			d3.select(this).attr("opacity", 1);
			tooltip
				.style("opacity", 0)
				.style("display", "none");
		});

	// Y Axis
	g.append("g").call(d3.axisLeft(yScale).ticks(5));

	// X Axis
	g.append("g")
		.attr("transform", `translate(0, ${chartHeight})`)
		.call(d3.axisBottom(xScale))
		.selectAll("text")
		.attr("transform", "rotate(-40)")
		.style("text-anchor", "end");
}

	onMount(async () => {
	isLoading.set(true);
	console.log("📦 Fetching users from Firestore...");

	const usersRef = collection(db, "Users");
	const usersSnapshot = await getDocs(usersRef);

	console.log(`✅ Found ${usersSnapshot.size} users`);

	const interventionCounts = {};

	for (const userDoc of usersSnapshot.docs) {
		console.log(`👤 Processing user: ${userDoc.id}`);

		const applicationsRef = collection(db, `Users/${userDoc.id}/Applications`);
		const appsSnapshot = await getDocs(applicationsRef);

		console.log(`   🗂️ Found ${appsSnapshot.size} applications`);

		for (const appDoc of appsSnapshot.docs) {
			const appData = appDoc.data();
			const interventions = appData.interventions;

			if (interventions && typeof interventions === 'object') {
				console.log("   ➕ Found interventions:", interventions);

				for (const [category, subItems] of Object.entries(interventions)) {
					if (Array.isArray(subItems)) {
						for (const sub of subItems) {
							const key = sub.trim();
							interventionCounts[key] = (interventionCounts[key] || 0) + 1;
						}
					}
				}
			}
		}
	}

	interventionData = Object.entries(interventionCounts).map(([intervention, value]) => ({
		intervention,
		value
	}));

	console.log("📊 Final interventionData:", interventionData);

	interventionData.sort((a, b) => b.value - a.value);

	isLoading.set(false);
});


</script>

{#if $isLoading}
	<div class="flex items-center justify-center min-h-[300px] w-full">
		<svg class="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
		</svg>
		<span class="ml-3 text-muted-foreground">Loading interventions...</span>
	</div>
{:else}
	<svg id="chart" style="min-height: 400px; width: 100%; display: block;"></svg>
<div id="tooltip" style="
	position: absolute;
	pointer-events: none;
	background-color: rgba(0, 0, 0, 0.75);
	color: white;
	padding: 6px 10px;
	border-radius: 4px;
	font-size: 12px;
	display: none;
	z-index: 999;
transition: opacity 0.15s ease;
opacity: 0;

"></div>

{/if}

