<script>
	import { api } from '#lib/api';
	import { session, currentInstance, select, act } from '#lib/session.svelte.js';

	let open = $state(false);
	let instance = $derived(currentInstance());
	let running = $derived(instance?.phase === 'running');
	let memory = $derived(instance ? Math.round((instance.memory / instance.memoryMax) * 100) : 0);
	// Players and memory only mean something while the server is running with someone on it;
	// otherwise their rows are left out
	let showStats = $derived(running && instance.players > 0);
	let toggleHeight = $state(0);
	let area;

	// A click anywhere outside the selector closes its menu
	const onWindowClick = (e) => { if (open && !area.contains(e.target)) open = false; };

	function choose(name) {
		select(name);
		open = false;
	}

	async function create() {
		open = false;
		const name = prompt('Name for the new server (3-16 letters, digits and dashes):')?.trim().toLowerCase();
		if (!name) return;
		await act(() => api.create(name));
		if (session.instances.some((i) => i.name === name)) select(name);
	}
</script>

<svelte:window onclick={onWindowClick}/>

{#if session.user}
<div id="instanceArea" bind:this={area}>
	<!-- Closed sidebar: just the numbers and a status light, in the space the full box keeps -->
	<div class="instanceCompact pixelBox" class:statusOnly={!showStats} aria-hidden="true">
		{#if showStats}
			<span><img src="/media/icons/players.png" alt="">{instance.players}</span>
			<span><img src="/media/icons/memory.png" alt="">{memory}%</span>
		{/if}
		<span class="statusLight" class:running></span>
	</div>

	<!-- Open sidebar: one box with the instance name (its list opens over the stats), then the stats -->
	<div id="instance" class="pixelBox">
		<button class="instanceToggle" bind:offsetHeight={toggleHeight} onclick={() => open = !open} aria-expanded={open}>
			<span>{instance?.name ?? 'No servers'}</span>
			<img src="/media/icons/dropdown-arrow.png" alt="" class="dropdownArrow" class:open>
		</button>

		{#if instance}
			<div class="instanceBody">
				{#if showStats}
					<div class="instanceStats">
						<span title="Players online">
							<img src="/media/icons/players.png" alt="Players">
							{instance.players}
						</span>
						<span title="Memory usage">
							<img src="/media/icons/memory.png" alt="Memory">
							{memory}%
						</span>
					</div>
				{/if}
				<span class="instanceState" class:running>{instance.phase[0].toUpperCase() + instance.phase.slice(1)}</span>
			</div>
		{/if}
	</div>

	<!-- Floats over the stats from just under the name row; the wrapper draws the menu's pixel drop shadow -->
	{#if open}
		<div class="instanceMenu" style="top: calc({toggleHeight}px + var(--pc))">
			<div class="instanceList">
				{#each session.instances as item (item.name)}
					{#if item.name !== instance?.name}
						<button onclick={() => choose(item.name)}>{item.name}</button>
					{/if}
				{/each}
				<button onclick={create}>
					<img src="/media/icons/new.png" alt="">
					New
				</button>
			</div>
		</div>
	{/if}
</div>
{/if}
