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
	
	<img src="/favicon.png" alt="AmazinAxel logo" id="logoicon">
	<a href="/" class="site-title">AmazinAxel</a>
	<img src="/media/icons/expand.svg" alt="Expand sidebar" id="expandbtn">

	<div class="navItems">
		<ul>
			{#each navItems as navitem}
				{#if typeof navitem.subitems == 'undefined'}
					<NavItem href={navitem.route} icon={navitem.icon}>
						<p>{navitem.title}</p>
					</NavItem>
				{:else}
					<NavItem href={navitem.route} icon={navitem.icon} nolink>
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
		<ul>
			<!-- Bottom Navbar -->
			<NavItem href="https://journal.amazinaxel.com" icon="journal" external><p>Journal</p></NavItem>
		</ul>
	</div>	
</nav>
<div id="unexpandParent">
	<img src="/media/icons/expand.svg" alt="Un-expand sidebar" id="unexpandbtn">
</div>