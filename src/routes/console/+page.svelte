<script>
	import InstanceHeader from '#lib/components/instanceHeader.svelte';
	import Console from '#lib/components/console.svelte';
	import HistoryList from '#lib/components/historyList.svelte';
	import TimeTip from '#lib/components/timeTip.svelte';
	import LogViewer from '#lib/components/logViewer.svelte';
	import { currentInstance } from '#lib/instance.svelte.js';
	import { formatRange } from '#lib/format';
	import log from '#lib/placeholder/console-log.txt?raw';

	let instance = $derived(currentInstance());
	// The newest log is "Latest" while the server is still writing it, "Last" once it has stopped
	let newestLabel = $derived(instance.running ? 'Latest' : 'Last');
	let viewer;
</script>

<svelte:head>
	<link rel="stylesheet" href="/css/console.css"/>
</svelte:head>

<InstanceHeader page="Console"/>
<Console {log} running={instance.running}/>

<HistoryList title="Logs" items={instance.logs} emptyText="No logs yet.">
	{#snippet label(entry, isNewest)}
		{isNewest ? newestLabel : entry.age}
	{/snippet}
	{#snippet range(entry)}
		<!-- The newest log has no end yet: its label says enough, no dates -->
		{#if entry.end}<TimeTip iso={entry.start}/> - <TimeTip iso={entry.end}/>{/if}
	{/snippet}
	{#snippet rowActions(entry)}
		<button onclick={() => viewer.open(entry.end ? formatRange(entry.start, entry.end) : newestLabel, log)}>View</button>
	{/snippet}
</HistoryList>

<LogViewer bind:this={viewer}/>
