<script lang="ts">
	import House from "lucide-svelte/icons/house";
	import Package from "lucide-svelte/icons/package";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { page } from "$app/stores";
	import { cn } from '$lib/utils';
</script>

<aside class="bg-background fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r sm:flex">
	<nav class="flex flex-col items-center gap-4 px-2 sm:py-5">
		<Tooltip.Root>
			<Tooltip.Trigger asChild let:builder>
				<a
					href="/track-application/tracker/"
					class={cn(
		"hover:text-foreground flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8",
		$page.url.pathname === "/track-application/tracker"
			? "bg-accent text-accent-foreground"
			: "text-foreground/60"
	)}
					use:builder.action
					{...builder}
				>
					<House class="h-5 w-5" />
					<span class="sr-only">Dashboard</span>
				</a>
			</Tooltip.Trigger>
			<Tooltip.Content side="right">Dashboard</Tooltip.Content>
		</Tooltip.Root>

		<Tooltip.Root>
			<Tooltip.Trigger asChild let:builder>
				<a
					href="/track-application/tracker/programs"
					class={cn(
		"hover:text-foreground flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8",
		$page.url.pathname === "/track-application/tracker/programs"
			? "bg-accent text-accent-foreground"
			: "text-foreground/60"
	)}
					use:builder.action
					{...builder}
				>
					<Package class="h-5 w-5" />
					<span class="sr-only">Programs</span>
				</a>
			</Tooltip.Trigger>
			<Tooltip.Content side="right">Programs</Tooltip.Content>
		</Tooltip.Root>
	</nav>
</aside>

<div class="bg-background relative flex min-h-screen flex-col" id="page" data-vaul-drawer-wrapper>
	<slot />
</div>
