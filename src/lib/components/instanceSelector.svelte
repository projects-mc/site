<script lang="ts">
	import { api } from '#lib/api.ts';
	import { session, currentInstance, select, act, can } from '#lib/session.svelte.ts';
	import { checkout } from '#lib/git.ts';

	let open = $state(false);
	let instance = $derived(currentInstance());
	let running = $derived(instance?.phase === 'running');
	let memory = $derived(instance?.memoryMax ? Math.round((instance.memory / instance.memoryMax) * 100) : 0);
	// Players and memory only mean something while the server is running with someone on it;
	// otherwise their rows are left out
	let showStats = $derived(running && (instance?.players ?? 0) > 0);
	let toggleHeight = $state(0);
	let area: HTMLElement | undefined = $state();

	// A click anywhere outside the selector closes its menu
	const onWindowClick = (e: MouseEvent) => {
		if (open && !area?.contains(e.target as Node)) open = false;
	};

	function choose(name: string) {
		select(name);
		open = false;
	}

	// The branch is checked (on demand: aspen only checks running servers by itself) once per selected server, which
	// sets gitUpdate in the instance list
	let checked = '';
	$effect(() => {
		if (instance?.git && instance.name !== checked && can('git')) {
			checked = instance.name;
			api.git(instance.name).catch(() => {});
		}
	});

	let updating = $state(false);
	async function update() {
		updating = true;
		const name = instance?.name;
		if (name) await act(() => checkout(name, null));
		updating = false;
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
			<span><img src="/media/icons/players.png" alt="">{instance?.players}</span>
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
				<span class="instanceState" class:running>{instance.phase.charAt(0).toUpperCase() + instance.phase.slice(1)}</span>
				{#if instance.gitUpdate && can('git.update')}
					<button class="updateButton" onclick={update} disabled={updating} title="Pull the branch's new commit{running ? ' and reload the scripts it changed' : ''}">
						<img src="/media/icons/update.png" alt="">{updating ? 'Updating...' : 'Update'}
					</button>
				{/if}
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
