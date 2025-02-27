<script lang="ts">
	import { scaleBand, scaleTime } from 'd3-scale';
	import { addMinutes, startOfDay } from 'date-fns';
	import { Axis, Chart, Highlight, Points, Svg, Tooltip } from 'layerchart';

	const count = 10;
	const now = startOfDay(new Date());
	let lastStartDate = now;

	// Function to generate a random integer between min and max
	function getRandomInteger(min: number, max: number): number {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	// Generate random consultant session data
	const data = Array.from({ length: count }).map((_, i) => {
		const startDate = addMinutes(lastStartDate, getRandomInteger(0, 60));
		const endDate = addMinutes(startDate, getRandomInteger(0, 60));
		lastStartDate = startDate;
		return {
			name: `Consultant ${i + 1}`,
			startDate,
			endDate
		};
	});
</script>

<div class="h-[400px] p-10 py-5">
	<Chart
		{data}
		x={['startDate', 'endDate']}
		xScale={scaleTime()}
		y="name"
		yScale={scaleBand()}
		padding={{ left: 40, bottom: 36 }}
		tooltip={{ mode: 'bounds' }}
	>
		<Svg>
			<Axis placement="left" grid={{ style: 'stroke-dasharray: 2' }} rule class="text-white" />
			<Axis placement="bottom" class="text-white" />
			<Points class="fill-primary-100 stroke-primary" links={{ class: 'stroke-primary' }} />
			<Highlight area />
			<Highlight points lines axis="x" />
		</Svg>
		<Tooltip.Root let:data>
			<Tooltip.Header class="text-white">{data.name}</Tooltip.Header>
			<Tooltip.List>
				<Tooltip.Item
					label="Start Time"
					value={data.startDate.toLocaleTimeString()}
					class="text-white"
				/>
				<Tooltip.Item
					label="End Time"
					value={data.endDate.toLocaleTimeString()}
					class="text-white"
				/>
			</Tooltip.List>
		</Tooltip.Root>
	</Chart>
</div>
