<script lang="ts">
	import InstanceHeader from '#lib/components/instanceHeader.svelte';
	import HistoryList from '#lib/components/historyList.svelte';
	import IconButton from '#lib/components/iconButton.svelte';
	import TimeTip from '#lib/components/timeTip.svelte';
	import DatabaseBackups from '#lib/components/databaseBackups.svelte';
	import { currentInstance, act, can, onBackupsChanged, onDatabasesChanged } from '#lib/session.svelte.ts';
	import { api } from '#lib/api.ts';
	import { isoFromUnix, formatBytes } from '#lib/format.ts';
	import type { DatabaseInfo } from '#lib/types.ts';

	let name = $derived(currentInstance()?.name ?? '');
	let stopped = $derived(currentInstance()?.phase === 'stopped');
	// A server following a git branch has its history there: no new backups, the last ones expire after a week
	let followsGit = $derived(currentInstance()?.git);
	let maySee = $derived(can('backups'));
	interface Row {
		id: string;
		name: string;
		time: string;
		size: string;
	}
	let backups: Row[] = $state([]);
	let busy = $state(false);
	// The player's databases, each with its own backups below the server's
	let databases: DatabaseInfo[] = $state([]);
	const loadDatabases = async () => { databases = (await api.databases().catch(() => null))?.databases ?? databases; };
	$effect(() => { void loadDatabases(); });
	$effect(() => onDatabasesChanged((changed) => { if (changed === null) void loadDatabases(); }));

	$effect(() => {
		if (name && maySee) void load(name);
	});
	// A backup made elsewhere (the automatic one when the server stops, another tab) shows up straight away
	$effect(() =>
		onBackupsChanged((instance) => {
			if (instance === name) void load(instance);
		})
	);

	async function load(instance: string) {
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
	async function change(action: () => Promise<unknown>) {
		busy = true;
		await act(action);
		if (name) await load(name);
		busy = false;
	}

	function restore(backup: Row) {
		if (!name) return;
		if (!stopped) return alert('Stop the server before restoring a backup.');
		if (confirm(`Replace ${name}'s files with the ${backup.name.toLowerCase()} from ${new Date(backup.time).toLocaleString()}?`))
			void change(() => api.restore(name, backup.id));
	}

	function remove(backup: Row) {
		if (!name) return;
		if (confirm(`Delete this ${backup.name.toLowerCase()}?`)) void change(() => api.deleteBackup(name, backup.id));
	}
</script>

<InstanceHeader page="Backups"/>

{#if followsGit}
	<p>This server follows a git branch, which keeps its history, so it gets no new backups. Backups are deleted after
		7 days.</p>
{:else}
	<p>A backup is made automatically every time the server stops, and kept for 7 days.</p>
{/if}
{#if maySee}
	<HistoryList title="Backups" items={backups} emptyText="No backups yet.">
		{#snippet headerAction()}
			{#if !followsGit && can('backups.create')}
				<button disabled={busy} onclick={() => change(() => api.backUp(name))}>Back up now</button>
			{/if}
			{#if can('files.download')}
				<button onclick={() => location.assign(api.downloadLink(name))}>Download current files</button>
			{/if}
		{/snippet}
		{#snippet label(backup: Row)}
			<TimeTip iso={backup.time}>{backup.name}</TimeTip>
		{/snippet}
		{#snippet rowActions(backup: Row)}
			{#if can('backups.download')}
				<IconButton icon="download" label="Download" onclick={() => location.assign(api.backupLink(name, backup.id))}/>
			{/if}
			{#if can('backups.restore')}
				<IconButton icon="restore" label="Restore" onclick={() => restore(backup)}/>
			{/if}
			{#if can('backups.delete')}
				<button onclick={() => remove(backup)} aria-label="Delete">&times;</button>
			{/if}
		{/snippet}
	</HistoryList>
{:else}
	<p>The owner hasn't let you see this server's backups.</p>
	{#if can('files.download')}
		<p><button onclick={() => location.assign(api.downloadLink(name))}>Download current files</button></p>
	{/if}
{/if}

{#if databases.length}
	<h2>Databases</h2>
	<p>Each database is backed up every 2 days when it changed; the newest 5 backups are kept.</p>
	{#each databases as database (database.name)}
		<DatabaseBackups name={database.name}/>
	{/each}
{/if}
