import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			out: 'build',
			precompress: false
		}),
		alias: {
			"$lib": "./src/lib", // ✅ Fix alias to match your structure
			"$routes": "./src/routes",
			"$components": "./src/lib/components"
		}
	}
};

export default config;
