<script>
	import * as Select from "$lib/components/ui/select";
	import Geomap from "./(charts)/geomap.svelte";
	import Sourcedist from "./(charts)/sourcedist.svelte";
	import Programdist from "./(charts)/programdist.svelte";
	import Interventionsdist from "./(charts)/interventionsdist.svelte";
	import * as Card from "$lib/components/ui/card";
	import BarChart from "lucide-svelte/icons/bar-chart";
	import PieChart from "lucide-svelte/icons/pie-chart";
	import LineChart from "lucide-svelte/icons/line-chart";

	let selectedChart = "geomap"; // Default chart

	const charts = [
		{ value: "geomap", label: "Geographical Distribution", icon: BarChart },
		{ value: "sourcedist", label: "Source Distribution", icon: LineChart },
		{ value: "programdist", label: "Gender Distribution", icon: PieChart },
		{ value: "interventionsdist", label: "Interventions Distribution", icon: BarChart }
	];
</script>

<div class="space-y-4 p-4">
	<h2 class="text-xl font-bold">Select an Analytical Projection</h2>

	<Select.Root
		selected={selectedChart}
		onSelectedChange={(v) => {
      if (v) selectedChart = v; // ✅ Updates selectedChart on change
    }}
	>
		<Select.Trigger class="w-[320px]">
			<Select.Value placeholder="Select Projection" />
		</Select.Trigger>
		<Select.Content>
			<Select.Group>
				<Select.Label>Charts</Select.Label>
				{#each charts as chart}
					<Select.Item value={chart.value} label={chart.label}>
						<div class="flex items-center gap-2">
							<svelte:component this={chart.icon} class="w-4 h-4" />
							{chart.label}
						</div>
					</Select.Item>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>


	<!-- ✅ Dynamically Render Selected Chart -->
	<Card.Root class="p-4">
		<Card.Content class="flex flex-col items-center space-y-2">
			{#if selectedChart.value === "geomap"}
				<Geomap />
			{:else if selectedChart.value === "sourcedist"}
				<Sourcedist />
			{:else if selectedChart.value === "programdist"}
				<Programdist isDashboard={false} />
			{:else if selectedChart.value === "interventionsdist"}
				<Interventionsdist />
			{/if}
		</Card.Content>
	</Card.Root>

</div>
