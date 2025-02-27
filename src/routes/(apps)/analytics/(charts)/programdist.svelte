<script lang="ts">
	import { onMount } from "svelte";
	import * as d3 from "d3";
	import { collection, getDocs, query, where } from "firebase/firestore";
	import { db } from "$lib/firebase";

	export let isDashboard = false;

	let width, height;
	$: {
		width = isDashboard ? 250 : 400;
		height = isDashboard ? 250 : 400;
	}

	let svg;
	let isDrilldown = false;
	let selectedProgram = null;
	let legendData = [];

	// ✅ Stores the dynamically fetched program data
	let programData = [];

	// ✅ Stores drilldown data
	let acceptanceData = {};

	// ✅ Custom Colors for Pie & Legend
	const customColors = {
		"Incubation": "deepskyblue",
		"Ideation": "lightgreen",
		"Accepted": "deepskyblue",
		"Declined": "crimson"
	};

	// Fetch Applications and Match with Program Category
	const fetchProgramApplications = async () => {
		try {
			console.log("🔍 Fetching program applications...");

			// Step 1: Fetch All Users
			const usersRef = collection(db, "Users");
			const usersSnapshot = await getDocs(usersRef);

			let categoryCounts = { "Incubation": 0, "Ideation": 0 };
			let categoryStatusCounts = { "Incubation": { Accepted: 0, Declined: 0 }, "Ideation": { Accepted: 0, Declined: 0 } };

			for (const userDoc of usersSnapshot.docs) {
				const userID = userDoc.id;
				const applicationsRef = collection(db, `Users/${userID}/Applications`);
				const applicationsSnapshot = await getDocs(applicationsRef);

				for (const appDoc of applicationsSnapshot.docs) {
					const appData = appDoc.data();
					const { programID, aiResponse } = appData;

					// Step 2: Find Matching Program Category
					const programQuery = query(collection(db, "Programs"), where("programID", "==", programID));
					const programSnapshot = await getDocs(programQuery);

					if (!programSnapshot.empty) {
						const programData = programSnapshot.docs[0].data();
						const programCategory = programData.programCategory; // "Incubation" or "Ideation"

						if (programCategory in categoryCounts) {
							categoryCounts[programCategory]++;

							// Count Accepted/Declined applications
							if (aiResponse === "Accepted") {
								categoryStatusCounts[programCategory].Accepted++;
							} else if (aiResponse === "Declined") {
								categoryStatusCounts[programCategory].Declined++;
							}
						}
					}
				}
			}

			// Step 3: Update Chart Data
			programData = [
				{ program: "Incubation", applications: categoryCounts["Incubation"] },
				{ program: "Ideation", applications: categoryCounts["Ideation"] }
			];

			acceptanceData = {
				"Incubation": [
					{ program: "Accepted", applications: categoryStatusCounts["Incubation"].Accepted },
					{ program: "Declined", applications: categoryStatusCounts["Incubation"].Declined }
				],
				"Ideation": [
					{ program: "Accepted", applications: categoryStatusCounts["Ideation"].Accepted },
					{ program: "Declined", applications: categoryStatusCounts["Ideation"].Declined }
				]
			};

			console.log("✅ Program Data:", programData);
			console.log("✅ Acceptance Data:", acceptanceData);

			// Update the chart after fetching data
			updateChart(programData, false);
		} catch (error) {
			console.error("🔥 Error fetching applications:", error);
		}
	};

	// ✅ Load Data on Mount
	onMount(async () => {
		await fetchProgramApplications();
	});

	// ✅ D3 Pie Chart Logic
	const updateChart = (data, isDrill) => {
		isDrilldown = isDrill;
		console.log("Updating Chart with Data:", JSON.stringify(data, null, 2));

		const radius = Math.min(width, height) / 2;
		const innerRadius = radius * 0.5;
		const pie = d3.pie().value(d => d.applications);
		const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius);

		// ✅ Ensure Selected View
		if (!isDrilldown) {
			console.log("Main View Selected");
		} else {
			console.log("Drilldown View Selected for:", selectedProgram);
		}

		// ✅ Update Legend
		legendData = data.map(d => ({
			label: d.program,
			color: customColors[d.program] || "gray"
		}));

		// ✅ Update Pie Chart
		const pieData = pie(data);
		svg = d3.select("#pie")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", `translate(${width / 2}, ${height / 2})`);

		const paths = svg.selectAll("path").data(pieData);

		paths.enter()
			.append("path")
			.attr("d", arc)
			.attr("fill", d => customColors[d.data.program] || "gray")
			.attr("stroke", "transparent")
			.attr("stroke-width", 2)
			.on("click", function (event, d) {  // ✅ Drilldown logic
				if (!isDrilldown) {
					selectedProgram = d.data.program;
					updateChart(acceptanceData[selectedProgram], true);
				}
			})
			.merge(paths)
			.transition().duration(750)
			.attr("d", arc)
			.attr("fill", d => customColors[d.data.program] || "gray");

		paths.exit().remove();

		// ✅ Update Legend
		const legend = d3.select("#legend").selectAll(".legend-item").data(legendData);

		legend.enter()
			.append("div")
			.attr("class", "legend-item")
			.style("display", "flex")
			.style("align-items", "center")
			.style("gap", "8px")
			.style("margin-bottom", "5px")
			.merge(legend)
			.html(d => `<div style="width: 12px; height: 12px; background-color: ${d.color};"></div> <span>${d.label}</span>`);

		legend.exit().remove();

		// ✅ Center Circle for Reset
		svg.append("circle")
			.attr("r", innerRadius * 0.9)
			.attr("fill", "transparent")
			.on("click", () => {
				console.log("Resetting to Main View");
				updateChart(programData, false);
			});
	};
</script>
<div style="display: flex; gap: 20px;">
	<svg id="pie"></svg>
	<div id="legend"></div>
</div>
