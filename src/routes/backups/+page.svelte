<script>
	import InstanceHeader from '#lib/components/instanceHeader.svelte';
	import HistoryList from '#lib/components/historyList.svelte';
	import IconButton from '#lib/components/iconButton.svelte';
	import TimeTip from '#lib/components/timeTip.svelte';
	import { currentInstance } from '#lib/instance.svelte.js';

	let instance = $derived(currentInstance());
</script>

<InstanceHeader page="Backups"/>

<HistoryList title="Backups" items={instance.backups} emptyText="No backups yet.">
	{#snippet headerAction()}
		<button>Back up now</button>
		<button>Download current instance</button>
	{/snippet}
	{#snippet label(backup)}
		<TimeTip iso={backup.time}>{backup.name}</TimeTip>
	{/snippet}
	{#snippet rowActions(backup)}
		<IconButton icon="download" label="Download"/>
		<IconButton icon="restore" label="Restore"/>
	{/snippet}
</HistoryList>
