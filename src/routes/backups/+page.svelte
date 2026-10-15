<script>
	import InstanceHeader from '#lib/components/instanceHeader.svelte';
	import HistoryList from '#lib/components/historyList.svelte';
	import IconButton from '#lib/components/iconButton.svelte';
	import TimeTip from '#lib/components/timeTip.svelte';
	import { currentInstance, act } from '#lib/session.svelte.js';
	import { api } from '#lib/api';
	import { isoFromUnix, formatBytes } from '#lib/format';

	let name = $derived(currentInstance()?.name);
	let stopped = $derived(currentInstance()?.phase === 'stopped');
	let backups = $state([]);
	let busy = $state(false);

	$effect(() => { load(name); });

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
