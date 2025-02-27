<script lang="ts">
	import { page } from "$app/stores";
	import { siteConfig } from "$lib/config/site.js";
	import { cn } from "$lib/utils.js";
</script>

<div class="mr-4 hidden md:flex">
	<a href="/dashboard" class="mr-6 flex items-center space-x-2">
		<span class="hidden font-bold xl:inline-block">
			{siteConfig.name}
		</span>
	</a>
	<nav class="flex items-center gap-6 text-sm">
		<a
			href="/dashboard"
			class={cn(
				"hover:text-foreground/80 transition-colors",
				$page.url.pathname === "/dashboard"
					? "text-foreground"
					: "text-foreground/60"
			)}
		>
			Dashboard
		</a>
		<a
			href="/applications"
			class={cn(
				"hover:text-foreground/80 transition-colors",
				$page.url.pathname.startsWith("/applications")
					? "text-foreground"
					: "text-foreground/60"
			)}
		>
			Applications
		</a>
		<a
			href="/programs"
			class={cn(
				"hover:text-foreground/80 transition-colors",
				$page.url.pathname.startsWith("/programs") ? "text-foreground" : "text-foreground/60"
			)}
		>
			Programs
		</a>
		<a
			href="/analytics"
			class={cn(
				"hover:text-foreground/80 transition-colors",
				$page.url.pathname.startsWith("/analytics") ? "text-foreground" : "text-foreground/60"
			)}
		>
			Analytics
		</a>
		<a
			href="/settings"
			class={cn(
				"hover:text-foreground/80 transition-colors",
				$page.url.pathname.startsWith("/colors") ? "text-foreground" : "text-foreground/60"
			)}
		>
			Settings
		</a>
	</nav>
</div>
