<script>
	import Title from '#lib/components/title.svelte';
	import Modal from '#lib/components/modal.svelte';
	import DatabaseBrowser from '#lib/components/databaseBrowser.svelte';
	import { api } from '#lib/api';
	import { onDatabasesChanged } from '#lib/session.svelte.js';
	import { formatBytes } from '#lib/format';
	import { scriptName, validName } from '#lib/database';
	import { onMount } from 'svelte';

	// The player's databases, one of them open in the browser below. Read again when one is created or deleted
	// (here, in another tab, or in game)
	let databases = $state([]);
	let max = $state(0);
	let maxSize = $state(0);
	let error = $state('');
	let selected = $state('');

	let creating = $state(false);
	let newName = $state('');
	let deleting = $state(false);
	let typedName = $state('');

	async function attempt(action) {
		error = '';
		try {
			await action();
			return true;
		} catch (e) {
			error = e.message;
			return false;
		}
	}

	async function loadList() {
		await attempt(async () => ({ databases, max, maxSize } = await api.databases()));
		if (selected && !databases.some((d) => d.name === selected)) selected = '';
	}

	onMount(() => {
		loadList();
		return onDatabasesChanged((name) => { if (name === null) loadList(); });
	});

	async function create(e) {
		e.preventDefault();
		const name = newName.trim();
		if (!(await attempt(() => api.createDatabase(name)))) return;
		creating = false;
		await loadList();
		selected = name;
	}

	async function removeDatabase(e) {
		e.preventDefault();
		if (!(await attempt(() => api.deleteDatabase(selected)))) return;
		deleting = false;
		selected = '';
		await loadList();
	}
</script>

<Title name="Databases"/>
<p>A database holds variables that all of your servers share: <code>{'{stats::coins}'}</code> is the variable
	<code>coins</code> in your database <code>stats</code>. A new database reaches running servers when they restart.
	Backups are on the Backups page.</p>
{#if error}<p class="error" role="alert">{error}</p>{/if}

{#if databases.length}
	<ul class="databases">
		{#each databases as database (database.name)}
			<li class:selected={database.name === selected}>
				<button class="link" onclick={() => (selected = database.name)}><b>{database.name}</b></button>
				{formatBytes(database.size)} of {formatBytes(maxSize)}
				<button onclick={() => location.assign(api.databaseDownloadLink(database.name))}>Download</button>
			</li>
		{/each}
	</ul>
{:else}
	<p>You have no databases yet.</p>
{/if}
{#if databases.length < max}
	<p><button onclick={() => { creating = true; newName = ''; }}>New database</button> You can have {max}.</p>
{/if}

{#if selected}
	<h2>{selected}</h2>
	<DatabaseBrowser name={selected}/>
	<p><button onclick={() => { deleting = true; typedName = ''; }}>Delete {selected}</button></p>
{/if}

<Modal bind:open={creating} title="New database">
	<form onsubmit={create}>
		<p>Scripts use it as <code>{scriptName(newName.trim() || 'name', '...')}</code>. It can't be renamed later.</p>
		<label>Name <input type="text" bind:value={newName} maxlength="32" required></label>
		{#if newName && !validName(newName.trim())}
			<p class="error">{'Up to 32 characters, without / \\ % { } * : " and not starting with _ - . or a space.'}</p>
		{/if}
		<p>
			<button disabled={!validName(newName.trim())}>Create</button>
			<button type="button" onclick={() => (creating = false)}>Cancel</button>
		</p>
	</form>
</Modal>

<Modal bind:open={deleting} title="Delete {selected}?">
	<form onsubmit={removeDatabase}>
		<p>This deletes every variable in it and all of its backups, for all of your servers, for good. Type its name to
			confirm.</p>
		<label>Name <input type="text" bind:value={typedName} required></label>
		<p>
			<button disabled={typedName !== selected}>Delete</button>
			<button type="button" onclick={() => (deleting = false)}>Cancel</button>
		</p>
	</form>
</Modal>

<style>
	.databases li.selected b {
		text-decoration: underline;
	}

	button.link {
		background: none;
		border: none;
		padding: 0;
		color: var(--blue4);
		cursor: pointer;
	}

	.error {
		color: var(--red);
	}
</style>
