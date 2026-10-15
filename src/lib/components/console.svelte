<script>
	import LogLines from '#lib/components/logLines.svelte';

	// running: the server is up, so the prompt is / (a command) rather than >
	// oncommand: called with each command typed
	let { log, running, oncommand } = $props();

	let output;
	$effect(() => {
		log;
		output.scrollTop = output.scrollHeight; // Show the newest line
	});

	// The browser's text cursor can't be resized, so the input hides it and draws a pixel one.
	// Monocraft is monospaced, so the cursor sits at (characters before it) x (character width) along
	let input;
	let caretColumn = $state(0);
	let isCaretShown = $state(false);
	let scrollLeft = $state(0);

	function trackCaret() {
		caretColumn = input.selectionStart;
		isCaretShown = document.activeElement === input && input.selectionStart === input.selectionEnd;
		scrollLeft = input.scrollLeft;
	}
	// Keys move the cursor after the event, so read it on the next frame
	const trackCaretSoon = () => requestAnimationFrame(trackCaret);

	function submit(e) {
		e.preventDefault();
		const command = input.value.trim().replace(/^\//, '');
		if (!command || !running) return;
		oncommand?.(command);
		input.value = '';
		trackCaret();
	}
</script>

<div class="console pixelBox">
	<div class="consoleOutput" bind:this={output}>
		<LogLines {log}/>
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
				onkeydown={trackCaretSoon}
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
