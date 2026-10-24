<script lang="ts">
	import HistoryList from '#lib/components/historyList.svelte';
	import IconButton from '#lib/components/iconButton.svelte';
	import TimeTip from '#lib/components/timeTip.svelte';
	import Modal from '#lib/components/modal.svelte';
	import DatabaseBrowser from '#lib/components/databaseBrowser.svelte';
	import { api } from '#lib/api.ts';
	import { onDatabaseBackupsChanged } from '#lib/session.svelte.ts';
	import { isoFromUnix, formatBytes } from '#lib/format.ts';

	// One database's backups: made every 2 days when it changed, or by hand; the newest 5 are kept. Each can be looked
	// at, downloaded, restored (servers keep running) or deleted
	let { name }: { name: string } = $props();
	// (By any name aspen sends, in case it learns a new kind)
	const kinds: Record<string, string> = { auto: 'Automatic backup', manual: 'Manual backup', restore: 'Before a restore' };

	interface Row {
		id: string;
		name: string;
		time: string;
		size: string;
	}

	let backups: Row[] = $state([]);
	let busy = $state(false);
	let error = $state('');
	let viewing: Row | null = $state(null);
	let viewOpen = $state(false);
	let restoring: Row | null = $state(null);
	let restoreOpen = $state(false);
	let removing: Row | null = $state(null);
	let removeOpen = $state(false);

	$effect(() => { void load(name); });
	// Made elsewhere (the automatic ones, another tab), or after reconnecting
	$effect(() => onDatabaseBackupsChanged((changed) => { if (changed === null || changed === name) void load(name); }));

	async function load(database: string) {
		const list = await api.databaseBackups(database).catch(() => null);
		if (database !== name || !list) return;
		backups = list.map((backup) => ({
			id: backup.id,
			name: kinds[backup.kind] ?? 'Backup',
			time: isoFromUnix(backup.time),
			size: formatBytes(backup.size)
		}));
	}

	async function change(action: () => Promise<unknown>) {
		busy = true;
		error = '';
		try {
			await action();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
		await load(name);
		busy = false;
	}

	const when = (backup: Row) => new Date(backup.time).toLocaleString();
</script>

<HistoryList title="Database {name}" items={backups} emptyText="No backups yet.">
	{#snippet headerAction()}
		<button disabled={busy} onclick={() => change(() => api.backUpDatabase(name))}>Back up now</button>
	{/snippet}
	{#snippet label(backup: Row)}
		<TimeTip iso={backup.time}>{backup.name}</TimeTip>
	{/snippet}
	{#snippet rowActions(backup: Row)}
		<button onclick={() => { viewing = backup; viewOpen = true; }}>View</button>
		<IconButton icon="download" label="Download" onclick={() => location.assign(api.databaseBackupLink(name, backup.id))}/>
		<IconButton icon="restore" label="Restore" onclick={() => { restoring = backup; restoreOpen = true; }}/>
		<button onclick={() => { removing = backup; removeOpen = true; }} aria-label="Delete">&times;</button>
	{/snippet}
</HistoryList>
{#if error}<p class="error" role="alert">{error}</p>{/if}

<Modal bind:open={viewOpen} title="{name}: {viewing?.name.toLowerCase()} from {viewing ? when(viewing) : ''}">
	{#if viewing}
		<DatabaseBrowser {name} backup={viewing.id}/>
		<p><button onclick={() => (viewOpen = false)}>Close</button></p>
	{/if}
</Modal>

<Modal bind:open={restoreOpen} title="Restore {name}?">
	{#if restoring}
		{@const id = restoring.id}
		<p>Puts back what {name} held on {when(restoring)}. Your servers keep running and use it straight away. What it
			holds now is kept as a backup first, so you can undo this.</p>
		<p>
			<button disabled={busy} onclick={() => { restoreOpen = false; void change(() => api.restoreDatabase(name, id)); }}>Restore</button>
			<button onclick={() => (restoreOpen = false)}>Cancel</button>
		</p>
	{/if}
</Modal>

<Modal bind:open={removeOpen} title="Delete this backup?">
	{#if removing}
		{@const id = removing.id}
		<p>The {removing.name.toLowerCase()} of {name} from {when(removing)}.</p>
		<p>
			<button onclick={() => { removeOpen = false; void change(() => api.deleteDatabaseBackup(name, id)); }}>Delete</button>
			<button onclick={() => (removeOpen = false)}>Cancel</button>
		</p>
	{/if}
</Modal>

<style>
	.error {
		color: var(--red);
	}
</style>
