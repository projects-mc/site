<script>
	import { page } from '$app/state';
	let { href, children } = $props();

	let isCurrentPage = $derived(page.url.pathname.startsWith(href));
</script>

<li>
	<a
		{href}
		class:active={isCurrentPage}
		aria-current={isCurrentPage ? 'page' : false}
	>
		{@render children?.()}
	</a>
</li>
