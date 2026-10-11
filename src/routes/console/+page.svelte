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
	let viewer;
</script>

<svelte:head>
	<link rel="stylesheet" href="/css/console.css"/>
</svelte:head>

<InstanceHeader page="Console"/>
<Console {log}/>

<HistoryList title="Logs" items={instance.logs} emptyText="No logs yet.">
	{#snippet range(entry)}
		<!-- The latest log is still being written: "Latest" says enough, no dates -->
		{#if entry.end}<TimeTip iso={entry.start}/> - <TimeTip iso={entry.end}/>{/if}
	{/snippet}
	{#snippet rowActions(entry)}
		<button onclick={() => viewer.open(entry.end ? formatRange(entry.start, entry.end) : 'Latest', log)}>View</button>
	{/snippet}
</HistoryList>

<LogViewer bind:this={viewer}/>
