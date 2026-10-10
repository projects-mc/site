import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	try {
		return {
			pageContent: (await import(`#lib/components/tool-pages/${params.tools}.svelte`)).default
		};
	} catch (err) {
		error(404, 'Not Found');
	}
};
