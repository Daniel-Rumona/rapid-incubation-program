<script lang="ts">
	import { Separator } from "$lib/components/ui/separator/index.js";

</script>


<div class="hidden space-y-6 p-10 pb-16 md:block">
	<div class="space-y-0.5">
		<h2 class="text-2xl font-bold tracking-tight">Settings</h2>
		<p class="text-muted-foreground">
			Manage your account settings and set preferences.
		</p>
	</div>
	<Separator class="my-6" />
	<div class="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">

		<div class="flex-1 lg:max-w-2xl">
			<slot />
		</div>
	</div>
</div>
