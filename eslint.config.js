import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';

export default [
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{ ignores: ['build/', '.svelte-kit/'] }
];
