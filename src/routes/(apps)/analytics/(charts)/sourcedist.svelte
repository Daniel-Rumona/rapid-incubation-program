<script>
	import { onMount } from "svelte";
	import * as d3 from "d3";

	let width = 600, height = 400;
	let svg;

	// ✅ Sample Data: Applications per Social Media Platform
	const data = [
		{ platform: "Facebook", apps: 120 },
		{ platform: "Instagram", apps: 95 },
		{ platform: "Twitter", apps: 80 },
		{ platform: "LinkedIn", apps: 50 },
		{ platform: "TikTok", apps: 130 },
		{ platform: "Snapchat", apps: 60 }
	];

	onMount(() => {
		// ✅ Set up SVG
		svg = d3.select("#chart")
			.attr("width", width)
			.attr("height", height);

		const margin = { top: 20, right: 30, bottom: 40, left: 120 };
		const chartWidth = width - margin.left - margin.right;
		const chartHeight = height - margin.top - margin.bottom;

		const g = svg.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// ✅ Scales
		const xScale = d3.scaleLinear()
			.domain([0, d3.max(data, d => d.apps)])
			.range([0, chartWidth]);

		const yScale = d3.scaleBand()
			.domain(data.map(d => d.platform))
			.range([0, chartHeight])
			.padding(0.4); // ✅ Adds spacing between bars

		// ✅ Bars with Rounded Edges
		g.selectAll(".bar")
			.data(data)
			.enter()
			.append("rect")
			.attr("class", "bar")
			.attr("y", d => yScale(d.platform))
			.attr("width", d => xScale(d.apps))
			.attr("height", yScale.bandwidth())
			.attr("rx", 10) // ✅ Rounded corners
			// .attr("ry", 10) // ✅ Rounded corners
			.attr("fill", "#007bff") // Blue color
			.on("mouseover", function () { d3.select(this).attr("fill", "#0056b3"); }) // Hover effect
			.on("mouseout", function () { d3.select(this).attr("fill", "#007bff"); });

		// ✅ X Axis
		g.append("g")
			.attr("transform", `translate(0, ${chartHeight})`)
			.call(d3.axisBottom(xScale).ticks(5));

		// ✅ Y Axis
		g.append("g")
			.call(d3.axisLeft(yScale));
	});
</script>

<svg id="chart"></svg>
