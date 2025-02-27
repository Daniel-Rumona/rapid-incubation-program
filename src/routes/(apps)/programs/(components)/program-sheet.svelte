<script lang="ts">
	import * as Sheet from "$lib/components/ui/sheet/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { selectedProgram } from "../(data)/selectedProgram";
	import { writable, get } from "svelte/store";
	import { labels } from "../(data)/data.js"; // Import available labels

	// Get the selected program and create a writable copy
	let programCopy = writable({ ...get(selectedProgram) });

	// Function to save changes
	function saveChanges() {
		selectedProgram.set(get(programCopy)); // Update the store with the edited values
		closeSheet(); // Close the sheet after saving
	}

	// Function to close the sheet and reset selectedProgram
	function closeSheet() {
		selectedProgram.set(null); // Reset selected program
	}
</script>

{#if $selectedProgram}
	<Sheet.Root open={true}> <!-- Ensures the sheet always opens when selectedProgram is not null -->
		<Sheet.Content side="right">
			<Sheet.Header>
				<Sheet.Title>Edit Program</Sheet.Title>
				<Sheet.Description>Update the program details below.</Sheet.Description>

				<!-- Ensure Close Button Resets selectedProgram -->
				<Sheet.Close on:click={closeSheet} />
			</Sheet.Header>

			<!-- Editable Form -->
			<div class="grid gap-4 py-4">
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="title" class="text-right">Title</Label>
					<input id="title" bind:value={$programCopy.title} class="col-span-3 border p-2 rounded" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="status" class="text-right">Status</Label>
					<select id="status" bind:value={$programCopy.status} class="col-span-3 border p-2 rounded">
						<option value="backlog">Backlog</option>
						<option value="todo">To Do</option>
						<option value="in progress">In Progress</option>
						<option value="done">Done</option>
						<option value="canceled">Canceled</option>
					</select>
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="category" class="text-right">Category</Label>
					<select id="category" bind:value={$programCopy.label} class="col-span-3 border p-2 rounded">
						{#each labels as label}
							<option value={label.value}>{label.label}</option>
						{/each}
					</select>
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="priority" class="text-right">Priority</Label>
					<select id="priority" bind:value={$programCopy.priority} class="col-span-3 border p-2 rounded">
						<option value="low">Low</option>
						<option value="medium">Medium</option>
						<option value="high">High</option>
					</select>
				</div>
			</div>

			<!-- Save & Cancel Buttons -->
			<Sheet.Footer>
				<Button on:click={saveChanges} class="mr-2">Save Changes</Button>
				<Button variant="secondary" on:click={closeSheet}>Cancel</Button>
			</Sheet.Footer>
		</Sheet.Content>
	</Sheet.Root>
{/if}
