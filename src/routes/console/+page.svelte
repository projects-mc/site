<script>
	import InstanceHeader from '#lib/components/instanceHeader.svelte';
	import Console from '#lib/components/console.svelte';
	import HistoryList from '#lib/components/historyList.svelte';
	import TimeTip from '#lib/components/timeTip.svelte';
	import LogViewer from '#lib/components/logViewer.svelte';
	import { currentInstance, act } from '#lib/session.svelte.js';
	import { api } from '#lib/api';
	import { formatRange, isoFromUnix, ago, formatBytes } from '#lib/format';

	// Lines kept on screen; older ones are still in the log files below
	const MAX_LINES = 1000;

	let name = $derived(currentInstance()?.name);
	let phase = $derived(currentInstance()?.phase ?? 'stopped');
	let running = $derived(phase === 'running');
	let lines = $state([]);
	let logs = $state([]);
	let socket;
	let viewer;

	// While running: the live console. Otherwise: the last run's log. Re-runs only when the instance or its
	// running state changes, not on every refresh
	$effect(() => {
		const instance = name;
		lines = [];
		loadLogs(instance);
		if (!running) {
			api.logs(instance)
				.then((list) => (list[0] ? api.log(instance, list[0].id) : ''))
				.then((text) => { if (instance === name) lines = text.split('\n').slice(-MAX_LINES); })
				.catch(() => {});
			return;
		}
		socket = api.console(instance);
		socket.onmessage = (e) => {
			lines.push(e.data);
			if (lines.length > MAX_LINES) lines.splice(0, lines.length - MAX_LINES);
		};
		return () => socket.close();
	});

	async function loadLogs(instance) {
		const list = await api.logs(instance).catch(() => []);
		if (instance !== name) return;
		logs = list.map((entry) => ({
			id: entry.id,
			age: ago(entry.start),
			start: isoFromUnix(entry.start),
			end: entry.end && isoFromUnix(entry.end),
			size: formatBytes(entry.size)
		}));
	}

	async function view(entry, label) {
		const text = await api.log(name, entry.id).catch((e) => e.message);
		viewer.open(entry.end ? formatRange(entry.start, entry.end) : label, text);
	}
</script>

<svelte:head>
	<link rel="stylesheet" href="/css/console.css"/>
</svelte:head>

<InstanceHeader page="Console"/>
<p class="historyHeaderActions">
	{#if phase === 'stopped'}
		<button onclick={() => act(() => api.start(name))}>Start</button>
	{:else}
		<button onclick={() => act(() => api.stop(name))} disabled={phase !== 'running'}>Stop</button>
		<button onclick={() => act(() => api.restart(name))} disabled={phase !== 'running'}>Restart</button>
		{#if phase !== 'running'}<span>{phase[0].toUpperCase() + phase.slice(1)}...</span>{/if}
	{/if}
</p>
<Console log={lines.join('\n')} {running} oncommand={(command) => socket?.send(command)}/>

<HistoryList title="Logs" items={logs} emptyText="No logs yet.">
	{#snippet label(entry, isNewest)}
		{isNewest ? (running ? 'Latest' : 'Last') : entry.age}
	{/snippet}
	{#snippet range(entry)}
		<!-- The newest log has no end yet: its label says enough, no dates -->
		{#if entry.end}<TimeTip iso={entry.start}/> - <TimeTip iso={entry.end}/>{/if}
	{/snippet}
	{#snippet rowActions(entry)}
		<button onclick={() => view(entry, running ? 'Latest' : 'Last')}>View</button>
	{/snippet}
</HistoryList>

<LogViewer bind:this={viewer}/>
