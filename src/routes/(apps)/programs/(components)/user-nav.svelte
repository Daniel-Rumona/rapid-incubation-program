<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { get } from "svelte/store";

	function getUserInitials(name: string): string {
		return name
			? name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
			: "?";
	}


	export let loggedInUser: { fullName: string; email: string } | null;

	// ✅ Ensure reactivity with a reactive variable
	let reactiveUser = loggedInUser;

	$: reactiveUser = loggedInUser;

	console.log("✅ Reactive User in UserNav:", get(reactiveUser));

</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Button variant="ghost" class="relative h-8 w-8 rounded-full">
			<Avatar.Root class="h-9 w-9">
				<Avatar.Fallback>{getUserInitials(get(reactiveUser)?.fullName || "John Doe")}</Avatar.Fallback>
			</Avatar.Root>
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56" align="end">
		<DropdownMenu.Label class="font-normal">
			<div class="flex flex-col space-y-1">
				<p class="text-sm font-medium leading-none">{get(reactiveUser)?.fullName || "Guest"}</p>
				<p class="text-muted-foreground text-xs leading-none">{get(reactiveUser)?.email || "No email"}</p>
			</div>
		</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.Group>
			<DropdownMenu.Item>
				Add New
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
