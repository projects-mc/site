<!-- Wraps every page on the site, most important parent layout -->
<script>
	import Header from '#lib/components/header.svelte';
	import Footer from '#lib/components/footer.svelte';
	import { navItems } from '#lib/config';
	import { session, currentInstance, refresh } from '#lib/session.svelte.js';
	import { preloadCode } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/state';
	let { children } = $props();

	// Delays and fadeouts are glitchy atm ;(
	const transitionIn = { duration: 150 };

	// Pages about one instance need a login and an instance; the rest (home, login, legal) don't
	const instancePages = navItems.map((item) => item.route);
	let needsInstance = $derived(instancePages.some((route) => page.url.pathname.startsWith(route)));

	onMount(() => {
		// Prefetch all top-level routes for better speed
		preloadCode(...instancePages);
		refresh();
		// Keeps state, players and memory current; skipped while the tab is hidden
		const timer = setInterval(() => { if (!document.hidden) refresh(); }, 5000);
		return () => clearInterval(timer);
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
				{#if !needsInstance}
					{@render children?.()}
				{:else if !session.loaded}
					<p>Loading...</p>
				{:else if !session.user}
					<h1>Log in</h1>
					<p>Join <code>playboardmc.com</code> in Minecraft and type <code>/dashboard</code> in the lobby.</p>
				{:else if !currentInstance()}
					<h1>No servers yet</h1>
					<p>Make one with <b>New</b> in the server box on the left.</p>
				{:else}
					{@render children?.()}
				{/if}
			</div>
			<Footer/>
		</main>
	{/key}
</div>
