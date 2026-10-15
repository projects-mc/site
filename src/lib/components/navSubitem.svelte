<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	let { href, children } = $props();

	let isCurrentPage = $derived(page.url.pathname.startsWith(href));
</script>

<li>
	<a
		href={resolve(href)}
		class:active={isCurrentPage}
		aria-current={isCurrentPage ? 'page' : false}
	>
		{@render children?.()}
	</a>
</li>
