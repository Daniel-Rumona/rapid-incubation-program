<script lang="ts">
	import MobileLink from "./mobile-link.svelte";
	import { Icons } from "$lib/components/ui/icons/index";
	import * as Sheet from "$lib/components/ui/sheet/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { docsConfig } from "$lib/config/docs.js";
	import { siteConfig } from "$lib/config/site.js";

	let open = false;
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="ghost"
			class="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
		>
			<Icons.Hamburger class="h-5 w-5" />
			<span class="sr-only">Toggle Menu</span>
		</Button>
	</Sheet.Trigger>
	<Sheet.Content side="left" class="pr-0">
		<MobileLink href="/" class="flex items-center" bind:open>
			<Icons.logo class="mr-2 h-4 w-4" />
			<span class="font-bold">{siteConfig.name}</span>
		</MobileLink>
		<ScrollArea orientation="both" class="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
			<div class="flex flex-col space-y-3">
				{#each docsConfig.mainNav as navItem, index (navItem + index.toString())}
					{#if navItem.href}
						<MobileLink href={navItem.href} bind:open class="text-foreground">
							{navItem.title}
						</MobileLink>
					{/if}
				{/each}
			</div>
		</ScrollArea>
	</Sheet.Content>
</Sheet.Root>
