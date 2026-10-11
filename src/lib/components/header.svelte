<script>
	import { preventDefault } from 'svelte/legacy';
	import { onMount } from 'svelte';

	import { navItems } from '#lib/config';
	import NavItem from '#lib/components/navItem.svelte';
	import NavGroup from '#lib/components/navGroup.svelte';
	import InstanceSelector from '#lib/components/instanceSelector.svelte';

	const focusMainContent = () => { document.querySelector("main").focus(); }

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
	<a onclick={preventDefault(focusMainContent)} id="skipToContent" href="#content">
		Skip to content
	</a>

	<div id="sidebarTop">
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
		<a href="/" id="logo">
			<img src="/media/icons/playboard.png" alt="Playboard logo" class="noImgStyle">
		</a>
		<div id="playerhead">
			<img src="/media/icons/player-head.png" alt="AmazinAxel's head" class="noImgStyle">
			<img src="/media/icons/dropdown-arrow.png" alt="" class="noImgStyle dropdownArrow">
		</div>
	</div>

	<InstanceSelector/>

	<div class="navItems">
		<ul>
			{#each navItems as navitem}
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
</nav>
