<script>
	import { parseLog } from '#lib/console';

	// query: text to highlight (case-insensitive), as the log viewer's find box does
	let { log, query = '' } = $props();
	let lines = $derived(parseLog(log));
	let needle = $derived(query.toLowerCase());

	// Splits text into plain and matching parts for <mark>
	function parts(text) {
		if (!needle) return [{ text }];
		const out = [];
		const lower = text.toLowerCase();
		let at = 0;
		for (let i = lower.indexOf(needle); i !== -1; i = lower.indexOf(needle, at)) {
			if (i > at) out.push({ text: text.slice(at, i) });
			out.push({ text: text.slice(i, i + needle.length), isMatch: true });
			at = i + needle.length;
		}
		if (at < text.length) out.push({ text: text.slice(at) });
		return out;
	}
</script>

<svelte:head>
	<link rel="stylesheet" href="/css/log.css"/>
</svelte:head>

{#snippet highlighted(text)}{#each parts(text) as part, i (i)}{#if part.isMatch}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}{/snippet}

<div class="logLines">
	{#each lines as line, i (i)}
		<div class="logLine" class:continuation={!line.time}>
			{#if line.time}
				<span class="logTime">{@render highlighted(line.time)}</span>
				<span class="logLevel {line.level.toLowerCase()}">{@render highlighted(line.level)}</span>
			{/if}
			{#if line.source}<span class="logSource">[{@render highlighted(line.source)}]</span>{/if}
			<span class="logMessage">{@render highlighted(line.message)}</span>
		</div>
	{/each}
</div>
