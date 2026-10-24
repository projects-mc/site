import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

// The site only serves the PNGs; this keeps each one in step with its .aseprite source. Stale PNGs are re-exported when
// dev or a build starts, and in dev every save in Aseprite re-exports and reloads the page. Without Aseprite installed
// (CI), the committed PNGs are used as they are
const ICONS = 'static/media/icons';

function exportSprite(source: string) {
	execFileSync('aseprite', ['-b', source, '--save-as', source.replace(/\.aseprite$/, '.png')], { stdio: 'ignore' });
}

function aseprite(): Plugin {
	let isMissing = false;
	const tryExport = (source: string) => {
		if (isMissing) return false;
		try {
			exportSprite(source);
			return true;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
			isMissing = true;
			console.warn('aseprite not found: using the PNGs in static/media/icons as they are');
			return false;
		}
	};
	return {
		name: 'aseprite',
		buildStart() {
			for (const file of readdirSync(ICONS)) {
				if (!file.endsWith('.aseprite')) continue;
				const source = join(ICONS, file);
				const png = source.replace(/\.aseprite$/, '.png');
				if (existsSync(png) && statSync(png).mtimeMs < statSync(source).mtimeMs) tryExport(source);
			}
		},
		configureServer(server) {
			server.watcher.add(ICONS);
			const onSave = (path: string) => {
				if (path.endsWith('.aseprite') && tryExport(path)) server.ws.send({ type: 'full-reload' });
			};
			server.watcher.on('change', onSave);
			server.watcher.on('add', onSave);
		}
	};
}

export default defineConfig({
	// A static site (Cloudflare Pages); 404.html makes unknown paths load the app, which handles them
	plugins: [aseprite(), sveltekit({ adapter: adapter({ fallback: '404.html' }) })],
	build: {
		target: 'es2020'
	},
	// bun run test: unit tests next to the code they test (*.test.ts), with a fake browser from src/test-setup.ts
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
		setupFiles: ['src/test-setup.ts']
	}
});
