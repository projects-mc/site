<script lang="ts">
	import { page } from '$app/state';
	import type { NavItem } from '#lib/config.ts';
	import NavSubitem from '#lib/components/navSubitem.svelte';
	import SmallCaps from '#lib/components/smallCaps.svelte';

	// A sidebar section that only groups pages: its header opens and closes the list instead of linking anywhere.
	// While one of its pages is the current one it stays open and shows as selected
	let { title, route, subitems }: { title: string; route: string; subitems: NonNullable<NavItem["subitems"]> } = $props();
	let hasCurrentPage = $derived(page.url.pathname.startsWith(route + '/'));
	let isToggledOpen = $state(false);
	let open = $derived(hasCurrentPage || isToggledOpen);
</script>

<li class="navGroup" class:open class:current={hasCurrentPage}>
	<button
		class="navGroupToggle"
		onclick={() => { if (!hasCurrentPage) isToggledOpen = !isToggledOpen; }}
		aria-expanded={open}
		aria-disabled={hasCurrentPage}
	>
		<span class="navIcon"><img src="/media/icons/{title.toLowerCase()}.png" alt=""></span>
		<span class="navGroupLabel">
			<p>{title}</p>
			<span class="navIcon"><img src="/media/icons/dropdown-arrow.png" alt="" class="dropdownArrow" class:open></span>
		</span>
	</button>
	<ul>
		{#each subitems as subpage (subpage.route)}
			<NavSubitem href={subpage.route}>
				<p><SmallCaps text={subpage.title}/></p>
			</NavSubitem>
		{/each}
	</ul>
</li>
