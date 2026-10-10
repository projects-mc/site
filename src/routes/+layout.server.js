import { error } from '@sveltejs/kit';

// Make all pages statically pre-render at build time
export const prerender = true;

// Client-side routing for page transitions and link prefetching
export const csr = true;

export const load = async () => {
	try {
		return {
			date: new Date().toLocaleString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',

				hour: 'numeric',
				minute: 'numeric',
				hour12: true,
				timeZoneName: 'short'
			})
		};
	} catch (err) {
		error(500, err);
	}
};
