<script>
	import Modal from '#lib/components/modal.svelte';
	import { api } from '#lib/api';
	import { onDatabasesChanged } from '#lib/session.svelte.js';
	import { formatBytes } from '#lib/format';
	import { enter, crumbs, scriptName, show, editType, validKey } from '#lib/database';
	import { untrack } from 'svelte';

	// A database's variables, a level at a time. Live (backup null): editable, and read again whenever aspen says it
	// changed (a server or another tab wrote to it), so it's never out of date. A backup: read-only
	let { name, backup = null } = $props();
	let readOnly = $derived(backup !== null);

	let prefix = $state('');
	let children = $state([]);
	let more = $state(false);
	let stat = $state(null);
	let error = $state('');

	// The variable being added or edited: { key, type, value, isNew }
	let editing = $state(null);
	let editOpen = $state(false);
	// The variable or list being deleted: { key, list }
	let removing = $state(null);
	let removeOpen = $state(false);

	const keys = (level, after) =>
		readOnly ? api.databaseBackupKeys(name, backup, level, after) : api.databaseKeys(name, level, after);

	async function load() {
		const database = name, from = backup, level = prefix;
		error = '';
		try {
			const [page, info] = await Promise.all([keys(level), readOnly ? null : api.databaseStat(database)]);
			// Something else was opened meanwhile
			if (database !== name || from !== backup || level !== prefix) return;
			children = page.children;
			more = page.more;
			stat = info;
		} catch (e) {
			error = e.message;
		}
	}

	async function loadMore() {
		try {
			const page = await keys(prefix, children.at(-1)?.name);
			children = [...children, ...page.children];
			more = page.more;
		} catch (e) {
			error = e.message;
		}
	}

	function open(level) {
		prefix = level;
		children = [];
		load();
	}

	// Another database or backup: from the top (untracked: opening a level mustn't rerun this)
	$effect(() => {
		name;
		backup;
		untrack(() => open(''));
	});

	// Changes come in bursts (a server writing every tick); read once they settle
	$effect(() => {
		if (readOnly) return;
		let pending;
		const unsubscribe = onDatabasesChanged((changed) => {
			if (changed !== null && changed !== name) return;
			clearTimeout(pending);
			pending = setTimeout(load, 300);
		});
		return () => {
			unsubscribe();
			clearTimeout(pending);
		};
	});

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

	function edit(child) {
		editing = { key: prefix + child.name, type: editType(child.value) ?? 'string', value: child.value?.value ?? '', isNew: false };
		editOpen = true;
	}

	function add() {
		editing = { key: prefix, type: 'string', value: '', isNew: true };
		editOpen = true;
	}

	async function save(e) {
		e.preventDefault();
		const { key, type, value } = editing;
		const typed = type === 'boolean' ? value === true || value === 'true' : type === 'number' ? String(value).trim() : String(value);
		if (!(await attempt(() => api.setDatabaseKey(name, key, type, typed)))) return;
		editOpen = false;
		load();
	}

	function askRemove(key, list) {
		removing = { key, list };
		removeOpen = true;
	}

	async function remove() {
		if (!(await attempt(() => api.deleteDatabaseKey(name, removing.key, removing.list)))) return;
		removeOpen = false;
		load();
	}
</script>

{#if error}<p class="error" role="alert">{error}</p>{/if}
{#if stat}<p>{stat.keys} variable{stat.keys === 1 ? '' : 's'}, {formatBytes(stat.size)}</p>{/if}
<nav class="crumbs" aria-label="Where you are in {name}">
	<button class="link" onclick={() => open('')}>{name}</button>
	{#each crumbs(prefix) as crumb (crumb.prefix)}
		:: <button class="link" onclick={() => open(crumb.prefix)}>{crumb.name}</button>
	{/each}
</nav>
{#if children.length}
	<table>
		<thead><tr><th>Name</th><th>Value</th>{#if !readOnly}<th></th>{/if}</tr></thead>
		<tbody>
			{#each children as child (child.name)}
				<tr>
					<td>
						{#if child.children}
							<button class="link" onclick={() => open(enter(prefix, child.name))}>{child.name}::</button>
						{:else}
							{child.name}
						{/if}
					</td>
					<td><code>{show(child.value)}</code></td>
					{#if !readOnly}
						<td>
							{#if child.value && editType(child.value)}<button onclick={() => edit(child)}>Edit</button>{/if}
							{#if child.value}<button onclick={() => askRemove(prefix + child.name, false)}>Delete</button>{/if}
							{#if child.children}<button onclick={() => askRemove(prefix + child.name, true)}>Delete list</button>{/if}
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
	{#if more}<button onclick={loadMore}>More</button>{/if}
{:else}
	<p>Nothing here.</p>
{/if}
{#if !readOnly}<p><button onclick={add}>Add a variable</button></p>{/if}

<Modal bind:open={editOpen} title={editing?.isNew ? 'Add a variable' : `Edit ${scriptName(name, editing?.key ?? '')}`}>
	{#if editing}
		<form onsubmit={save}>
			{#if editing.isNew}
				<label>Name <input type="text" bind:value={editing.key} required size="30"></label>
				{#if editing.key && !validKey(editing.key)}<p class="error">Parts are separated by :: and can't be empty or contain *.</p>{/if}
			{/if}
			<label>Type
				<select bind:value={editing.type}>
					<option value="string">Text</option>
					<option value="number">Number</option>
					<option value="boolean">True or false</option>
				</select>
			</label>
			{#if editing.type === 'boolean'}
				<label>Value
					<select bind:value={editing.value}>
						<option value={true}>true</option>
						<option value={false}>false</option>
					</select>
				</label>
			{:else}
				<label>Value <input type={editing.type === 'number' ? 'number' : 'text'} step="any" bind:value={editing.value} required></label>
			{/if}
			<p>
				<button disabled={!validKey(editing.key)}>Save</button>
				<button type="button" onclick={() => (editOpen = false)}>Cancel</button>
			</p>
		</form>
	{/if}
</Modal>

<Modal bind:open={removeOpen} title="Delete?">
	{#if removing}
		<p>Deletes <code>{scriptName(name, removing.list ? `${removing.key}::*` : removing.key)}</code> for all of your
			servers.</p>
		<p>
			<button onclick={remove}>Delete</button>
			<button onclick={() => (removeOpen = false)}>Cancel</button>
		</p>
	{/if}
</Modal>

<style>
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

	table {
		border-collapse: collapse;
	}

	td, th {
		padding: 0.2rem 0.6rem;
		text-align: left;
	}
</style>
