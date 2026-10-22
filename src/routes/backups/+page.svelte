<script>
	import InstanceHeader from '#lib/components/instanceHeader.svelte';
	import HistoryList from '#lib/components/historyList.svelte';
	import IconButton from '#lib/components/iconButton.svelte';
	import TimeTip from '#lib/components/timeTip.svelte';
	import DatabaseBackups from '#lib/components/databaseBackups.svelte';
	import { currentInstance, act, onBackupsChanged, onDatabasesChanged } from '#lib/session.svelte.js';
	import { api } from '#lib/api';
	import { isoFromUnix, formatBytes } from '#lib/format';

	let name = $derived(currentInstance()?.name);
	let stopped = $derived(currentInstance()?.phase === 'stopped');
	let backups = $state([]);
	let busy = $state(false);
	// The player's databases, each with its own backups below the server's
	let databases = $state([]);
	const loadDatabases = async () => { databases = (await api.databases().catch(() => null))?.databases ?? databases; };
	$effect(() => { loadDatabases(); });
	$effect(() => onDatabasesChanged((changed) => { if (changed === null) loadDatabases(); }));

	$effect(() => { load(name); });
	// A backup made elsewhere (the automatic one when the server stops, another tab) shows up straight away
	$effect(() => onBackupsChanged((instance) => { if (instance === name) load(name); }));

	async function load(instance) {
		const list = await api.backups(instance).catch(() => []);
		if (instance !== name) return;
		backups = list.map((backup) => ({
			id: backup.id,
			name: backup.kind === 'auto' ? 'Automatic backup' : 'Manual backup',
			time: isoFromUnix(backup.time),
			size: formatBytes(backup.size)
		}));
	}

	// Runs an action that changes the backups, then shows the new list
	async function change(action) {
		busy = true;
		await act(action);
		await load(name);
		busy = false;
	}

	function restore(backup) {
		if (!stopped) return alert('Stop the server before restoring a backup.');
		if (confirm(`Replace ${name}'s files with the ${backup.name.toLowerCase()} from ${new Date(backup.time).toLocaleString()}?`))
			change(() => api.restore(name, backup.id));
	}

	function remove(backup) {
		if (confirm(`Delete this ${backup.name.toLowerCase()}?`)) change(() => api.deleteBackup(name, backup.id));
	}
</script>

<InstanceHeader page="Backups"/>

<p>A backup is made automatically every time the server stops.</p>
<HistoryList title="Backups" items={backups} emptyText="No backups yet.">
	{#snippet headerAction()}
		<button disabled={busy} onclick={() => change(() => api.backUp(name))}>Back up now</button>
		<button onclick={() => location.assign(api.downloadLink(name))}>Download current files</button>
	{/snippet}
	{#snippet label(backup)}
		<TimeTip iso={backup.time}>{backup.name}</TimeTip>
	{/snippet}
	{#snippet rowActions(backup)}
		<IconButton icon="download" label="Download" onclick={() => location.assign(api.backupLink(name, backup.id))}/>
		<IconButton icon="restore" label="Restore" onclick={() => restore(backup)}/>
		<button onclick={() => remove(backup)} aria-label="Delete">&times;</button>
	{/snippet}
</HistoryList>

{#if databases.length}
	<h2>Databases</h2>
	<p>Each database is backed up every 2 days when it changed; the newest 5 backups are kept.</p>
	{#each databases as database (database.name)}
		<DatabaseBackups name={database.name}/>
	{/each}
{/if}
