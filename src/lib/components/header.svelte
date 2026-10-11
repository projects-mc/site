<script>
	import { preventDefault } from 'svelte/legacy';

	import { navItems } from '#lib/config';
	import NavItem from '#lib/components/navItem.svelte';
	import NavSubitem from '#lib/components/navSubitem.svelte';

	const focusMainContent = () => { document.querySelector("main").focus(); }
</script>

<nav>
	<a onclick={preventDefault(focusMainContent)} id="skipToContent" href="#content">
		Skip to content
	</a>

	<a href="/" id="logo">
		<img src="/media/icons/playboard.png" alt="Playboard logo" class="noImgStyle">
		<img src="/media/icons/player-placeholder.png" alt="Player head" id="playerhead" class="noImgStyle">
	</a>
	<!-- <img src="/media/icons/expand.svg" alt="Expand sidebar" id="expandbtn"> -->

	<div class="navItems">
		<ul>
			{#each navItems as navitem}
				{#if typeof navitem.subitems == 'undefined'}
					<NavItem href={navitem.route} icon={navitem.title.toLowerCase()}>
						<p>{navitem.title}</p>
					</NavItem>
				{:else}
					<NavItem href={navitem.route} icon={navitem.title.toLowerCase()} nolink>
						<p>{navitem.title}</p>
					</NavItem>
					<ul>
						{#each navitem.subitems as subpage}
						<NavSubitem href="{navitem.route}/{subpage.route}">
							<p>{subpage.title}</p>
						</NavSubitem>
						{/each}
					</ul>
				{/if}
			{/each}
		</ul>
		<!-- <ul> -->
			<!-- Bottom Navbar -->
			<!-- <NavItem href="https://example.com" icon="test" external><p>test</p></NavItem> -->
		<!-- </ul> -->
	</div>
</nav>
<!-- <div id="unexpandParent"> -->
	<!-- <img src="/media/icons/expand.svg" alt="Un-expand sidebar" id="unexpandbtn"> -->
<!-- </div> -->
