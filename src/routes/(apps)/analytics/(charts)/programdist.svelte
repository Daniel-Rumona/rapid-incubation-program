import { onMount } from "svelte";
import * as d3 from "d3";
import { collection, getDocs } from "firebase/firestore";
import { db } from "$lib/firebase";

export let isDashboard = false;

let width, height;
$: {
	width = isDashboard ? 250 : 400;
	height = isDashboard ? 250 : 400;
}

let svg;
let legendData = [];
let genderData = []; // Stores gender distribution

const genderColors = {
	"Male": "deepskyblue",
	"Female": "lightpink"
};

// Fetch gender distribution from Firestore
const fetchGenderDistribution = async () => {
	try {
		console.log("🔍 Fetching gender distribution...");

		const usersRef = collection(db, "Users");
		const usersSnapshot = await getDocs(usersRef);

		let genderCounts = { "Male": 0, "Female": 0, "Other": 0 };

		for (const userDoc of usersSnapshot.docs) {
			const userID = userDoc.id;
			const applicationsRef = collection(db, `Users/${userID}/Applications`);
			const applicationsSnapshot = await getDocs(applicationsRef);

			for (const appDoc of applicationsSnapshot.docs) {
				const appData = appDoc.data();
				const applicantGender = appData.applicantGender;

				if (genderCounts.hasOwnProperty(applicantGender)) {
					genderCounts[applicantGender]++;
				} 
			}
		}

		// Convert gender counts to array format for D3
		genderData = Object.entries(genderCounts).map(([gender, count]) => ({
			gender,
			count
		}));

		console.log("✅ Gender Distribution:", genderData);

		// Update the chart after fetching data
		updateChart(genderData);
	} catch (error) {
		console.error("🔥 Error fetching gender distribution:", error);
	}
};

// Load Data on Mount
onMount(async () => {
	await fetchGenderDistribution();
});

// D3 Pie Chart Logic
const updateChart = (data) => {
	console.log("Updating Chart with Data:", JSON.stringify(data, null, 2));

	const radius = Math.min(width, height) / 2;
	const pie = d3.pie().value(d => d.count);
	const arc = d3.arc().innerRadius(0).outerRadius(radius);

	// Update Legend
	legendData = data.map(d => ({
		label: d.gender,
		color: genderColors[d.gender] || "gray"
	}));

	// Clear previous chart
	d3.select("#pie").selectAll("*").remove();

	// Create new SVG container
	svg = d3.select("#pie")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", `translate(${width / 2}, ${height / 2})`);

	const pieData = pie(data);
	const paths = svg.selectAll("path").data(pieData);

	paths.enter()
		.append("path")
		.attr("d", arc)
		.attr("fill", d => genderColors[d.data.gender] || "gray")
		.attr("stroke", "transparent")
		.attr("stroke-width", 2)
		.merge(paths)
		.transition().duration(750)
		.attr("d", arc);

	paths.exit().remove();

	// Update Legend
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
};
<div style="display: flex; gap: 20px;">
	<svg id="pie"></svg>
	<div id="legend"></div>
</div>
