import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';

/** @type {import('vite').UserConfig} */
const config = {
	// A static site (Cloudflare Pages); 404.html makes unknown paths load the app, which handles them
	plugins: [sveltekit({ adapter: adapter({ fallback: '404.html' }) })],
	build: {
		target: 'es2020'
	}
};

export default config;
