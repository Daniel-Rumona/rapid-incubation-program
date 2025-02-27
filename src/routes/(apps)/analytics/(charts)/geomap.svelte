<script>
	import { onMount } from "svelte";
	import * as d3 from "d3";
	import zaData from "../(data)/za.json";  // ✅ Import JSON directly

	let width = 800, height = 600;
	let svg, tooltip;
	let geojson = null;

	// ✅ South Africa Applications Data
	const applicationsData = {
		"Eastern Cape": 5000,
		"Free State": 3200,
		"Gauteng": 15000,
		"KwaZulu-Natal": 12000,
		"Limpopo": 6200,
		"Mpumalanga": 4800,
		"North West": 4100,
		"Northern Cape": 2500,
		"Western Cape": 8900
	};

	onMount(() => {
		geojson = zaData;

		// ✅ Setup SVG
		svg = d3.select("#map").attr("width", width).attr("height", height);
		tooltip = d3.select("#tooltip");

		// ✅ Projection
		const projection = d3.geoMercator()
			.center([24, -30])
			.scale(1500)
			.translate([width / 2, height / 2]);

		const path = d3.geoPath().projection(projection);

		// ✅ Color Scale (Interpolates from light to dark based on applications)
		const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
			.domain([d3.min(Object.values(applicationsData)), d3.max(Object.values(applicationsData))]);

		// ✅ Draw Provinces
		svg.selectAll("path")
			.data(geojson.features)
			.enter()
			.append("path")
			.attr("d", path)
			.attr("fill", d => {
				const provinceName = d.properties.name || d.properties.province || "Unknown";
				return colorScale(applicationsData[provinceName] || 0);
			})
			.attr("stroke", "#000")
			.attr("stroke-width", 1)
			.on("mouseover", function (event, d) {
				const provinceName = d.properties.name || d.properties.province || "Unknown";
				const applications = applicationsData[provinceName] || "N/A";

				d3.select(this).attr("fill", "orange");

				tooltip.style("display", "block")
					.html(`<b>${provinceName}</b><br>Applications: ${applications}`)
					.style("left", (event.pageX + 10) + "px")
					.style("top", (event.pageY - 10) + "px");
			})
			.on("mouseout", function (event, d) {
				const provinceName = d.properties.name || d.properties.province || "Unknown";
				d3.select(this).attr("fill", colorScale(applicationsData[provinceName] || 0));
				tooltip.style("display", "none");
			});

		// ✅ Add Color Scale Legend (At the Top)
		const legendWidth = 300, legendHeight = 20;
		const legendSvg = d3.select("#legend")
			.attr("width", legendWidth)
			.attr("height", 50);

		const legendScale = d3.scaleLinear()
			.domain([d3.min(Object.values(applicationsData)), d3.max(Object.values(applicationsData))])
			.range([0, legendWidth]);

		const legendAxis = d3.axisBottom(legendScale)
			.ticks(5)
			.tickSize(5);

		const gradient = legendSvg.append("defs")
			.append("linearGradient")
			.attr("id", "legend-gradient")
			.attr("x1", "0%").attr("x2", "100%")
			.attr("y1", "0%").attr("y2", "0%");

		gradient.selectAll("stop")
			.data(d3.range(0, 1.1, 0.2))
			.enter()
			.append("stop")
			.attr("offset", d => `${d * 100}%`)
			.attr("stop-color", d => d3.interpolateYlGnBu(d));

		legendSvg.append("rect")
			.attr("width", legendWidth)
			.attr("height", legendHeight)
			.style("fill", "url(#legend-gradient)");

		legendSvg.append("g")
			.attr("transform", `translate(0, ${legendHeight})`)
			.call(legendAxis);
	});
</script>

<!-- ✅ Arrange Legend Above the Map -->
<div style="display: flex; flex-direction: column-reverse; align-items: center; gap: 10px;">
	<svg id="legend"></svg> <!-- ✅ Legend is now above -->
	<svg id="map"></svg>
</div>

<div id="tooltip" style="
  position: absolute;
  background: black;
  color: white;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 8px;
  display: none;">
</div>
