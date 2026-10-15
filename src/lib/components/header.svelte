<script>
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';

	import { navItems } from '#lib/config';
	import NavItem from '#lib/components/navItem.svelte';
	import NavGroup from '#lib/components/navGroup.svelte';
	import InstanceSelector from '#lib/components/instanceSelector.svelte';
	import { session } from '#lib/session.svelte.js';

	const focusMainContent = (e) => {
		e.preventDefault();
		document.querySelector("main").focus();
	};

	// Pinning keeps the sidebar open and pushes the page content over; remembered across visits
	let pinned = $state(false);
	let pinHovered = $state(false);
	let pinIcon = $derived(pinned ? (pinHovered ? 'pin-pinned-hover' : 'pin-pinned') : (pinHovered ? 'pin-unpinned-hover' : 'pin-unpinned'));

	onMount(() => { pinned = localStorage.getItem('sidebarPinned') === 'true'; });

	function togglePin() {
		pinned = !pinned;
		localStorage.setItem('sidebarPinned', pinned);
	}
</script>

<nav class:pinned>
	<a onclick={focusMainContent} id="skipToContent" href="#content">
		Skip to content
	</a>

	<div id="sidebarTop">
		<a href={resolve('/')} id="logo">
			<img src="/media/icons/playboard.png" alt="Playboard logo" class="noImgStyle">
		</a>
		<div id="playerhead">
			<!-- The player's own face (8x8) once logged in -->
			<img
				src={session.user ? `https://mc-heads.net/avatar/${session.user.id}/8` : '/media/icons/player-head.png'}
				alt={session.user ? `${session.user.name}'s head` : ''}
				class="noImgStyle"
			>
		</div>
	</div>

	<InstanceSelector/>

	<div class="navItems">
		<ul>
			{#each navItems as navitem (navitem.route)}
				{#if typeof navitem.subitems == 'undefined'}
					<NavItem href={navitem.route} icon={navitem.title.toLowerCase()}>
						<p>{navitem.title}</p>
					</NavItem>
				{:else}
					<NavGroup title={navitem.title} route={navitem.route} subitems={navitem.subitems}/>
				{/if}
			{/each}
		</ul>
	</div>

	<!-- Pins the sidebar open; bottom right corner, only while the sidebar is open -->
	<button
		id="pin"
		onclick={togglePin}
		onmouseenter={() => pinHovered = true}
		onmouseleave={() => pinHovered = false}
		aria-pressed={pinned}
		aria-label={pinned ? 'Unpin sidebar' : 'Pin sidebar'}
	>
		<img src="/media/icons/{pinIcon}.png" alt="" class="noImgStyle">
	</button>
</nav>
