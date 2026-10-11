<script>
	import { instances } from '#lib/placeholder/instances';
	import { selection, currentInstance } from '#lib/instance.svelte.js';

	let open = $state(false);
	let instance = $derived(currentInstance());
	// Players and memory only mean something while the server is running with someone on it;
	// otherwise their rows are left out
	let showStats = $derived(instance.running && instance.players > 0);
	let toggleHeight = $state(0);
	let area;

	// A click anywhere outside the selector closes its menu
	const onWindowClick = (e) => { if (open && !area.contains(e.target)) open = false; };

	function choose(i) {
		selection.index = i;
		open = false;
	}
</script>

<svelte:window onclick={onWindowClick}/>

<div id="instanceArea" bind:this={area}>
	<!-- Closed sidebar: just the numbers and a status light, in the space the full box keeps -->
	<div class="instanceCompact pixelBox" class:statusOnly={!showStats} aria-hidden="true">
		{#if showStats}
			<span><img src="/media/icons/players.png" alt="" class="noImgStyle">{instance.players}</span>
			<span class:shrunk={instance.memory >= 10}><img src="/media/icons/memory.png" alt="" class="noImgStyle">{instance.memory}%</span>
		{/if}
		<span class="statusLight centered" class:running={instance.running}></span>
		{#if instance.updateAvailable}<img src="/media/icons/update.png" alt="" class="noImgStyle centered">{/if}
	</div>

	<!-- Open sidebar: one box with the instance name (its list opens over the stats), then the stats -->
	<div id="instance" class="pixelBox">
		<button class="instanceToggle" bind:offsetHeight={toggleHeight} onclick={() => open = !open} aria-expanded={open}>
			<span>{instance.name}</span>
			<img src="/media/icons/dropdown-arrow.png" alt="" class="noImgStyle dropdownArrow" class:open>
		</button>

		<div class="instanceBody">
			{#if showStats}
				<div class="instanceStats">
					<span title="Players online">
						<img src="/media/icons/players.png" alt="Players" class="noImgStyle">
						{instance.players}
					</span>
					<span title="Memory usage">
						<img src="/media/icons/memory.png" alt="Memory" class="noImgStyle">
						{instance.memory}%
					</span>
				</div>
			{/if}
			<span class="instanceState" class:running={instance.running}>{instance.running ? 'Running' : 'Stopped'}</span>
			{#if instance.updateAvailable}
				<button class="updateButton"><img src="/media/icons/update.png" alt="" class="noImgStyle">Update</button>
			{/if}
		</div>
	</div>

	<!-- Floats over the stats from just under the name row; the wrapper draws the menu's pixel drop shadow -->
	{#if open}
		<div class="instanceMenu" style="top: calc({toggleHeight}px + var(--pc))">
			<div class="instanceList">
				{#each instances as item, i (item.name)}
					{#if i !== selection.index}
						<button onclick={() => choose(i)}>{item.name}</button>
					{/if}
				{/each}
				<button>
					<img src="/media/icons/new.png" alt="" class="noImgStyle">
					New
				</button>
			</div>
		</div>
	{/if}
</div>
