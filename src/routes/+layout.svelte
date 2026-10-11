<!-- Wraps every page on the site, most important parent layout -->
<script>
	import Header from '#lib/components/header.svelte';
	import Footer from '#lib/components/footer.svelte';
	import { navItems } from '#lib/config';
	import { preloadCode } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/state';
	let { children } = $props();

	// Delays and fadeouts are glitchy atm ;(
	const transitionIn = { duration: 150 };

	// Prefetch all top-level routes for better speed
	onMount(() => {
		const routes = navItems.map((item) => item.route);
		preloadCode(...routes);
	});

</script>
<svelte:head>
	<!-- Top: least important styles | bottom: most important styles -->
	<link rel="stylesheet" href="/css/vars.css"/>
	<link rel="stylesheet" href="/css/header-and-footer.css"/>
	<link rel="stylesheet" href="/css/layout.css"/>
	<link rel="stylesheet" href="/css/typography.css"/>
	<link rel="stylesheet" href="/css/reset.css"/>
	<link rel="stylesheet" href="/css/other.css"/>
</svelte:head>

<!-- Data below is used on every page throughout the site -->

<!-- Recolours every opaque pixel of an icon to the active tab blue -->
<svg width="0" height="0" style="position: absolute" aria-hidden="true">
	<filter id="tintActive">
		<feFlood flood-color="#5e81ac"/>
		<feComposite in2="SourceAlpha" operator="in"/>
	</filter>
</svg>

<div class="layout">
	<Header/>
	{#key page.url.pathname}
		<main tabindex="-1" in:fade|local={transitionIn}>
			<div id="content">
				{@render children?.()}
			</div>
			<Footer/>
		</main>
	{/key}
</div>