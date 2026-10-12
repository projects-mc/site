<script>
	import { page } from '$app/state';
	import NavSubitem from '#lib/components/navSubitem.svelte';
	import SmallCaps from '#lib/components/smallCaps.svelte';

	// A sidebar section that only groups pages: its header opens and closes the list instead of linking anywhere.
	// While one of its pages is the current one it stays open and shows as selected
	let { title, route, subitems } = $props();
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
		<img src="/media/icons/{title.toLowerCase()}.png" alt="" class="noImgStyle">
		<span class="navGroupLabel">
			<p>{title}</p>
			<img src="/media/icons/dropdown-arrow.png" alt="" class="noImgStyle dropdownArrow" class:open>
		</span>
	</button>
	<ul>
		{#each subitems as subpage}
			<NavSubitem href="{route}/{subpage.route}">
				<p><SmallCaps text={subpage.title}/></p>
			</NavSubitem>
		{/each}
	</ul>
</li>
