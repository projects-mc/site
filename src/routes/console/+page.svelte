<script>
	import InstanceHeader from '#lib/components/instanceHeader.svelte';
	import Console from '#lib/components/console.svelte';
	import HistoryList from '#lib/components/historyList.svelte';
	import TimeTip from '#lib/components/timeTip.svelte';
	import LogViewer from '#lib/components/logViewer.svelte';
	import { currentInstance, act } from '#lib/session.svelte.js';
	import { api } from '#lib/api';
	import { formatRange, isoFromUnix, ago, formatBytes } from '#lib/format';

	// Lines kept on screen; older ones are still in the log files below. Kept small so a flood of errors can't
	// lag the page
	const MAX_LINES = 100;

	let name = $derived(currentInstance()?.name);
	let phase = $derived(currentInstance()?.phase ?? 'stopped');
	let running = $derived(phase === 'running');
	let live = $derived(phase !== 'stopped'); // aspen has the server's process, and so a console
	let lines = $state([]);
	let trimmed = $state(false); // older lines were dropped, so the console points to the full log
	let logs = $state([]);
	let socket;
	let viewer;

	// While the server is up (starting, running or stopping): the live console, which aspen serves from the moment it
	// starts, so startup output shows straight away. Otherwise: the last run's log. Re-runs only when the instance or
	// whether it's up changes, not on every refresh
	$effect(() => {
		const instance = name;
		lines = [];
		trimmed = false;
		loadLogs(instance);
		if (!live) {
			api.logs(instance)
				.then((list) => (list[0] ? api.log(instance, list[0].id) : ''))
				.then((text) => {
					if (instance !== name || live) return;
					const all = text.split('\n');
					lines = all.slice(-MAX_LINES);
					trimmed = all.length > MAX_LINES;
				})
				.catch(() => {});
			return;
		}
		// Lines arriving together (a stack trace, a burst of errors) are added once per frame, not one by one
		let pending = [];
		let frame = 0;
		let retry = 0;
		let isDone = false;
		// aspen closes the console when the server stops; a restart can stop and start again between refreshes, so
		// reconnect until this effect is torn down. Each connection resends the recent lines, so start from empty
		function connect() {
			lines = [];
			trimmed = false;
			socket = api.console(instance);
			socket.onmessage = (e) => {
				pending.push(e.data);
				frame ||= requestAnimationFrame(() => {
					const all = lines.concat(pending);
					lines = all.slice(-MAX_LINES);
					trimmed ||= all.length > MAX_LINES;
					pending = [];
					frame = 0;
				});
			};
			socket.onclose = () => { if (!isDone) retry = setTimeout(connect, 1000); };
		}
		connect();
		return () => {
			isDone = true;
			cancelAnimationFrame(frame);
			clearTimeout(retry);
			socket.close();
		};
	});

	// Start clears the console at once rather than leaving the last run's log up until the server reports in
	function start() {
		lines = [];
		trimmed = false;
		act(() => api.start(name), true);
	}

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
		<button onclick={start}>Start</button>
	{:else}
		<button onclick={() => act(() => api.stop(name), true)} disabled={phase !== 'running'}>Stop</button>
		<button onclick={() => act(() => api.restart(name), true)} disabled={phase !== 'running'}>Restart</button>
		{#if phase !== 'running'}<span>{phase[0].toUpperCase() + phase.slice(1)}...</span>{/if}
	{/if}
</p>
<Console
	log={lines.join('\n')}
	{running}
	{trimmed}
	oncommand={(command) => socket?.send(command)}
	onopenlog={() => logs[0] && view(logs[0], running ? 'Latest' : 'Last')}
/>

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
