<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	let {
		href,
		icon,
		external,
		children
	} = $props();

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
