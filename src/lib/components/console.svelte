<script lang="ts">
	import { track } from '#lib/track.ts';
	import { onMount } from 'svelte';
	import LogLines from '#lib/components/logLines.svelte';
	import { readStored } from '#lib/session.svelte.ts';

	// running: the server is up, so the prompt is / (a command) rather than >
	// oncommand: called with each command typed
	// trimmed: older lines were dropped; scrolling to the top offers onopenlog, which opens the full log
	let {
		log,
		running,
		oncommand,
		trimmed = false,
		onopenlog
	}: {
		log: string;
		running: boolean;
		oncommand: (command: string) => void;
		trimmed?: boolean;
		onopenlog?: () => void;
	} = $props();

	// The output is laid out bottom up (column-reverse), so the browser shows the newest line from the very first frame
	// and stays there as lines arrive; scrollTop is 0 at the bottom and negative going up. If the player has scrolled
	// up to read, new lines would push the view along with them, so scroll back by however much was added
	let output: HTMLElement | undefined;
	let isAtBottom = true;
	let previousHeight = 0;
	$effect.pre(() => {
		track(log);
		if (!output) return;
		isAtBottom = output.scrollTop > -32;
		previousHeight = output.scrollHeight;
	});
	$effect(() => {
		track(log);
		if (output && !isAtBottom) output.scrollTop -= output.scrollHeight - previousHeight;
	});

	// The browser's text cursor can't be resized, so the input hides it and draws a pixel one.
	// Monocraft is monospaced, so the cursor sits at (characters before it) x (character width) along
	let input: HTMLInputElement;
	let caretColumn = $state(0);
	let isCaretShown = $state(false);
	let scrollLeft = $state(0);

	function trackCaret() {
		caretColumn = input.selectionStart ?? 0;
		isCaretShown = document.activeElement === input && input.selectionStart === input.selectionEnd;
		scrollLeft = input.scrollLeft;
	}
	// Keys move the cursor after the event, so read it on the next frame
	const trackCaretSoon = () => requestAnimationFrame(trackCaret);

	function submit(e: SubmitEvent) {
		e.preventDefault();
		const command = input.value.trim().replace(/^\//, '');
		if (!command || !running) return;
		oncommand(command);
		if (history.at(-1) !== command) history = [...history, command].slice(-HISTORY_SIZE);
		localStorage.setItem('consoleHistory', JSON.stringify(history));
		historyAt = history.length;
		input.value = '';
		trackCaret();
	}

	// Up and down step through earlier commands, like a terminal; remembered across visits. Stepping down past the
	// newest brings back whatever was being typed
	const HISTORY_SIZE = 100;
	let history: string[] = [];
	let historyAt = 0;
	let draft = '';
	onMount(() => {
		const stored = readStored('consoleHistory', []);
		history = Array.isArray(stored) ? stored.filter((entry): entry is string => typeof entry === 'string') : [];
		historyAt = history.length;
	});

	function onkeydown(e: KeyboardEvent) {
		const by = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
		const to = historyAt + by;
		if (by && to >= 0 && to <= history.length) {
			e.preventDefault();
			if (historyAt === history.length) draft = input.value;
			historyAt = to;
			input.value = to === history.length ? draft : (history[to] ?? '');
			input.setSelectionRange(input.value.length, input.value.length);
			input.scrollLeft = input.scrollWidth;
		}
		trackCaretSoon();
	}
</script>

<div class="console pixelBox">
	<div class="consoleOutput" bind:this={output}>
		<div>
			{#if trimmed}
				<p class="consoleOlder">Only the latest lines show here. <button onclick={onopenlog}>Open full log</button></p>
			{/if}
			<LogLines {log}/>
		</div>
	</div>
	<form class="consoleInput" onsubmit={submit}>
		<span class="consolePrompt" aria-hidden="true">{running ? '/' : '> '}</span>
		<span class="consoleField">
			<input
				type="text"
				aria-label="Server command"
				placeholder={running ? '' : 'Start the server to run commands'}
				disabled={!running}
				spellcheck="false"
				autocomplete="off"
				bind:this={input}
				oninput={trackCaret}
				{onkeydown}
				onpointerup={trackCaretSoon}
				onselect={trackCaret}
				onfocus={trackCaretSoon}
				onblur={trackCaret}
				onscroll={trackCaret}
			>
			{#if isCaretShown}
				{#key caretColumn}
					<span class="consoleCaret" style="left: calc({caretColumn} * var(--monoAdvance) - {scrollLeft}px)"></span>
				{/key}
			{/if}
		</span>
	</form>
</div>
