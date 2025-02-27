import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        port: process.env.PORT ? Number(process.env.PORT) : 3000, // Use Azure's assigned port
        host: '0.0.0.0', // Required for external access
    }
});
