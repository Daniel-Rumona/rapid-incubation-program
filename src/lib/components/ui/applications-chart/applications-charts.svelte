<script>
	import { onMount } from "svelte";
	import { writable, get } from "svelte/store";
	import { collection, getDocs } from "firebase/firestore";
	import { db } from "$lib/firebase";
	import { Timestamp } from "firebase/firestore";
	import * as d3 from "d3";

	let currentView = "Daily";
	let periodIndex = 0;
	let currentMonth = new Date().toLocaleString("default", { month: "short" });
	let currentYear = new Date().getFullYear();

	let applications = writable([]); // ✅ Ensure applications is an array
	let data = writable({ Daily: [], Weekly: [], Monthly: [] });

	// ✅ Fetch applications from Firebase Firestore
	const fetchApplications = async () => {
		try {
			const usersRef = collection(db, "Users");
			const usersSnapshot = await getDocs(usersRef);
			let allApplications = [];

			for (const userDoc of usersSnapshot.docs) {
				const applicationsRef = collection(db, `Users/${userDoc.id}/Applications`);
				const applicationsSnapshot = await getDocs(applicationsRef);

				applicationsSnapshot.forEach((appDoc) => {
					const appData = appDoc.data();
					if (appData.submittedAt instanceof Timestamp) {
						allApplications.push({ submittedAt: appData.submittedAt.toDate() });
					} else if (appData.submittedAt?.seconds) {
						allApplications.push({ submittedAt: new Date(appData.submittedAt.seconds * 1000) });
					}
				});
			}

			applications.set(allApplications); // ✅ Store applications in Svelte store
			generateData(allApplications);
		} catch (error) {
			console.error("🔥 Error Fetching Applications:", error);
		}
	};

	// ✅ Generate Data for Views (Daily, Weekly, Monthly)
	function generateData(apps = []) {
		if (!Array.isArray(apps)) {
			console.error("🔥 applications is not an array:", apps);
			return;
		}

		let today = new Date();

		// ✅ Daily View (Monday - Friday, move by 7 days)
		let monday = new Date(today);
		monday.setDate(today.getDate() - today.getDay() + 1 + periodIndex * 7);
		let dailyData = Array.from({ length: 5 }, (_, i) => {
	let date = new Date(monday);
	date.setDate(monday.getDate() + i);
	let formattedDate = date.toISOString().split("T")[0];

	return {
		date,
		value: apps.filter((app) => app.submittedAt.toISOString().split("T")[0] === formattedDate).length,
	};
});


		// ✅ Weekly View (Always show Week 1 - 4, move month)
		let newMonth = new Date(today.setMonth(today.getMonth() + periodIndex)).toLocaleString("default", { month: "short" });
		currentMonth = newMonth;
		let weekData = Array.from({ length: 4 }, (_, i) => ({
			week: `Week ${i + 1} (${currentMonth})`,
			value: apps.filter((app) => Math.ceil(app.submittedAt.getDate() / 7) === i + 1).length,
		}));

		// ✅ Monthly View (Jan - Feb with Year, move by years)
		let newYear = currentYear + periodIndex;
		let monthData = Array.from({ length: 12 }, (_, i) => ({
			month: new Date(newYear, i).toLocaleString("default", { month: "short" }),
			value: apps.filter((app) => app.submittedAt.getMonth() === i).length,
		}));

		data.set({ Daily: dailyData, Weekly: weekData, Monthly: monthData });
		drawChart();
	}

	// ✅ Move to Next or Previous Period
	function updatePeriod(direction) {
		if (direction === "next") periodIndex++;
		else periodIndex--;

		generateData(get(applications)); // ✅ Ensure we're passing an array
	}

	// ✅ Draw Chart
	function drawChart() {
		let chartData = get(data)[currentView];

		// Adjust width based on view (Monthly is wider for scrolling)
		let width = currentView === "Monthly" ? 1500 : 1000;
		let height = 400,
			margin = 50;

		let xScale = d3.scaleBand()
			.domain(chartData.map((d) => d.date?.toDateString() || d.week || d.month))
			.range([margin, width - margin])
			.padding(0.2);

		let yScale = d3.scaleLinear()
			.domain([0, d3.max(chartData, (d) => d.value)])
			.range([height - margin, margin]);

		let svg = d3.select("#chart");
		svg.attr("width", width).selectAll("*").remove();

		let tooltip = d3.select("#tooltip");

		svg.selectAll("rect")
    .data(chartData)
    .enter()
    .append("rect")
    .attr("x", d => xScale(d.date?.toDateString() || d.week || d.month))
    .attr("y", d => yScale(d.value))
    .attr("width", xScale.bandwidth() * 0.5) // Keep narrower bars for Monthly
    .attr("height", d => Math.max(5, height - margin - yScale(d.value))) // ✅ Set a minimum height of 5px
    .attr("rx", 8)
    .attr("ry", 8)
    .attr("fill", "#00BFFF")
			.on("mouseover", (event, d) => {
				tooltip
					.style("display", "block")
					.style("left", `${event.pageX + 10}px`)
					.style("top", `${event.pageY - 30}px`)
					.text(`Count: ${Math.round(d.value)}`);
			})
			.on("mouseout", () => {
				tooltip.style("display", "none");
			});

		svg.append("g").attr("transform", `translate(0,${height - margin})`).call(d3.axisBottom(xScale));
	}

	onMount(fetchApplications);
</script>

<!-- UI Layout -->
<div class="tabs">
	<div class="tab {currentView === 'Daily' ? 'active' : ''}" on:click={() => { currentView = "Daily"; drawChart(); }}>Daily</div>
	<div class="tab {currentView === 'Weekly' ? 'active' : ''}" on:click={() => { currentView = "Weekly"; drawChart(); }}>Weekly</div>
	<div class="tab {currentView === 'Monthly' ? 'active' : ''}" on:click={() => { currentView = "Monthly"; drawChart(); }}>Monthly</div>
</div>

<!-- Scrollable Chart -->
<div id="chart-wrapper">
	<div id="chart-container">
		<svg id="chart" width="1000" height="400"></svg>
	</div>
</div>

<!-- Navigation Buttons -->
<div class="button-container">
	<button on:click={() => updatePeriod("prev")}>← Prev Period</button>
	<button on:click={() => updatePeriod("next")}>Next Period →</button>
</div>

<!-- Tooltip -->
<div id="tooltip"></div>

<!-- Styles -->
<style>
    .tabs {
        display: flex;
        justify-content: center;
        /*border-bottom: 2px solid #ddd;*/
        margin-bottom: 10px;
        overflow-x: auto;
        white-space: nowrap;
    }

    .tab {
        padding: 12px 20px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.3s ease-in-out;
    }

    .tab.active {
        color: #007BFF;
        border-bottom: 3px solid #007BFF;
    }
    .button-container {
        text-align: center;
        margin-top: 10px;
    }
    button {
        margin: 5px;
        padding: 10px;
        font-size: 14px;
        background-color: #007BFF;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    button:hover {
        background-color: #0056b3;
    }

    #chart-wrapper {
        width: 100%;
        overflow-x: auto;
        white-space: nowrap;
        touch-action: pan-x;
    }

    #tooltip {
        position: absolute;
        display: none;
        background: black;
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 14px;
    }
</style>
