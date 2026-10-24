import svelte from 'eslint-plugin-svelte';
import ts from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig(
	...ts.configs.strictTypeChecked,
	...svelte.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				tsconfigRootDir: import.meta.dirname
			}
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: { parserOptions: { parser: ts.parser } }
	},
	{
		rules: {
			// Event handlers are often one-line arrows around a call
			'@typescript-eslint/no-confusing-void-expression': 'off',
			'@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }]
		}
	},
	{
		files: ['**/*.svelte'],
		rules: {
			// Runes ($state, $derived) change behind the compiler's back, so its narrowing calls live checks unnecessary
			'@typescript-eslint/no-unnecessary-condition': 'off'
		}
	},
	{ ignores: ['build/', '.svelte-kit/'] }
);
