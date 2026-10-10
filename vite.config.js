import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';

/** @type {import('vite').UserConfig} */
const config = {
	// Auto-builds error pages
	plugins: [sveltekit({ adapter: adapter({ fallback: '404.html' }) })],
	build: {
		target: 'es2020'
	},
	
	terserOptions: {
		compress: {
			hoist_funs: true, // Reduce computation in loops
			drop_console: true, // Remove console spam
			drop_debugger: true // Remove debugger statements
		}
	}
};

export default config;
