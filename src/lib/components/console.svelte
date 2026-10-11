<script>
	import LogLines from '#lib/components/logLines.svelte';

	let { log } = $props();

	let output;
	$effect(() => {
		log;
		output.scrollTop = output.scrollHeight; // Show the newest line
	});
</script>

<div class="console pixelBox">
	<div class="consoleOutput" bind:this={output}>
		<LogLines {log}/>
	</div>
	<form class="consoleInput" onsubmit={(e) => e.preventDefault()}>
		<img src="/media/icons/enter.png" alt="" class="noImgStyle consolePrompt" draggable="false">
		<input type="text" aria-label="Server command" spellcheck="false" autocomplete="off">
	</form>
</div>
