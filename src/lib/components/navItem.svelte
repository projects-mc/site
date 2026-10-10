<script>
	import { page } from '$app/state';
	let {
		href,
		icon,
		external,
		nolink,
		children
	} = $props();

	let isCurrentPage = $derived(page.url.pathname.startsWith(href));
</script>

<li>
	<a
		href={nolink ? '' : href}
		class:active={isCurrentPage}
		class:nolink={nolink}
		aria-current={isCurrentPage ? 'page' : false}
		target={external ? "_blank" : ''}
		rel={external ? "noopener noreferrer" : ''}
	>
		<img class="noImgStyle" 
			src="/media/icons/{icon}.svg" 
			alt="{href} Header icon"
		/>
		{@render children?.()}
		{#if external}
			<img class="noImgStyle external" src="/media/icons/external.svg" alt="External icon"/>
		{/if}
	</a>
</li>
