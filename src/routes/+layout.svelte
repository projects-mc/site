<!-- Wraps every page on the site, most important parent layout -->
<script>
	import Header from '#lib/components/header.svelte';
	import Footer from '#lib/components/footer.svelte';
	import Home from '#lib/components/home.svelte';
	import { navItems } from '#lib/config';
	import { session, currentInstance, refresh, restore } from '#lib/session.svelte.js';
	import { preloadCode } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	let { children } = $props();

	// Pages about one instance need a login and an instance; the rest (home, login, legal) don't
	const instancePages = navItems.map((item) => item.route);
	let needsInstance = $derived(instancePages.some((route) => page.url.pathname.startsWith(route)));

	// Logged out, every page but these shows the homepage; the homepage itself never has the sidebar
	const publicPages = ['/login', '/privacy', '/terms'];
	let loggedOut = $derived(session.loaded && !session.user);
	let isHome = $derived(page.url.pathname === '/');
	let showHome = $derived(isHome || (loggedOut && !publicPages.some((route) => page.url.pathname.startsWith(route))));
	let noSidebar = $derived(isHome || loggedOut);

	// app.html guesses logged-out from the stored token before the first paint; keep that class right once the session
	// is actually known (logging in, or a token the server no longer accepts)
	$effect(() => {
		if (session.loaded) document.documentElement.classList.toggle('loggedOut', loggedOut);
	});

	onMount(() => {
		// Prefetch all top-level routes for better speed
		preloadCode(...instancePages);
		restore();
		refresh();
		// aspen pushes state, players and memory while the live connection is up; without it, poll (and reconnect).
		// Skipped while the tab is hidden
		const timer = setInterval(() => { if (!document.hidden && !session.live) refresh(); }, 5000);
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

<div class="layout" class:noSidebar>
	{#if !noSidebar}
		<Header/>
	{/if}
	{#key page.url.pathname}
		<main tabindex="-1">
			<div id="content">
				{#if showHome}
					<Home/>
				{:else if !needsInstance}
					{@render children?.()}
				{:else if !session.loaded}
					<!-- Blank until the session is known; only the prerendered HTML and a first-ever login sit here -->
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
