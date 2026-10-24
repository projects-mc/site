<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import type { Pathname } from '#lib/config.ts';
	let {
		href,
		icon,
		external = false,
		children
	}: { href: Pathname; icon: string; external?: boolean; children: Snippet } = $props();

	let isCurrentPage = $derived(page.url.pathname.startsWith(href));
</script>

<li>
	<a
		href={resolve(href)}
		class:active={isCurrentPage}
		aria-current={isCurrentPage ? 'page' : false}
		target={external ? "_blank" : ''}
		rel={external ? "noopener noreferrer" : ''}
	>
		<span class="navIcon"><img
			src="/media/icons/{icon}.png"
			alt=""
		/></span>
		{@render children?.()}
		{#if external}
			<img class="external" src="/media/icons/external.svg" alt="External icon"/>
		{/if}
	</a>
</li>
