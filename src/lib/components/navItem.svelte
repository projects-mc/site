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
		<img class="noImgStyle" 
			src="/media/icons/{icon}.png" 
			alt=""
		/>
		{@render children?.()}
		{#if external}
			<img class="noImgStyle external" src="/media/icons/external.svg" alt="External icon"/>
		{/if}
	</a>
</li>
