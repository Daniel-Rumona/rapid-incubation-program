<script>
	import { onMount } from "svelte";
	import * as d3 from "d3";

	let width = 1000, height = 400;
	let svg;

	// ✅ Mock Data: Interventions Distribution
	const data = [
		{ intervention: "Financial Support", value: 120 },
		{ intervention: "Market Access", value: 95 },
		{ intervention: "Technical Training", value: 80 },
		{ intervention: "Regulatory Compliance", value: 50 },
		{ intervention: "Infrastructure Support", value: 130 },
		{ intervention: "Mentorship & Coaching", value: 60 }
	];

	const colorScale = d3.scaleOrdinal()
		.domain(data.map(d => d.intervention))
		.range(["#4CAF50", "#FF9800", "#2196F3", "#E91E63", "#9C27B0", "#FFC107"]); // Different colors for interventions

	onMount(() => {
		// ✅ Set up SVG
		svg = d3.select("#chart")
			.attr("width", width)
			.attr("height", height);

		const margin = { top: 20, right: 30, bottom: 50, left: 50 };
		const chartWidth = width - margin.left - margin.right;
		const chartHeight = height - margin.top - margin.bottom;

		const g = svg.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// ✅ Scales
		const xScale = d3.scaleBand()
			.domain(data.map(d => d.intervention))
			.range([0, chartWidth])
			.padding(0.4); // Adds spacing between bars

		const yScale = d3.scaleLinear()
			.domain([0, d3.max(data, d => d.value)])
			.range([chartHeight, 0]);

		// ✅ Bars with Colors & Rounded Edges
		g.selectAll(".bar")
			.data(data)
			.enter()
			.append("rect")
			.attr("class", "bar")
			.attr("x", d => xScale(d.intervention))
			.attr("y", d => yScale(d.value))
			.attr("width", xScale.bandwidth())
			.attr("height", d => chartHeight - yScale(d.value))
			.attr("rx", 5) // Rounded corners
			.attr("fill", d => colorScale(d.intervention))
			.on("mouseover", function (event, d) { d3.select(this).attr("opacity", 0.8); })
			.on("mouseout", function (event, d) { d3.select(this).attr("opacity", 1); });

		// ✅ Y Axis
		g.append("g")
			.call(d3.axisLeft(yScale).ticks(5));

		// ✅ Legend
		const legend = svg.append("g")
			.attr("transform", `translate(${width - 120}, ${margin.top})`); // Adjust this value

		legend.selectAll("rect")
			.data(data)
			.enter()
			.append("rect")
			.attr("x", 0)
			.attr("y", (d, i) => i * 20)
			.attr("width", 12)
			.attr("height", 12)
			.attr("fill", d => colorScale(d.intervention));

		legend.selectAll("text")
			.data(data)
			.enter()
			.append("text")
			.attr("x", 20)
			.attr("y", (d, i) => i * 20 + 10)
			.attr("font-size", "12px")
			.attr("fill", "#333")
			.text(d => d.intervention);
	});
</script>

<svg id="chart"></svg>
