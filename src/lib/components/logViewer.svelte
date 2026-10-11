<script>
	import { tick } from 'svelte';
	import LogLines from '#lib/components/logLines.svelte';

	// Modal log reader with find. Open with viewer.open(title, log)
	let dialog, findBox, body;
	let title = $state('');
	let log = $state('');
	let query = $state('');
	let current = $state(0);
	let matchCount = $state(0);

	export async function open(newTitle, newLog) {
		title = newTitle;
		log = newLog;
		query = '';
		dialog.showModal();
		await tick();
		body.scrollTop = 0;
	}

	// Re-count matches whenever the text being found changes, and jump to the first
	$effect(() => {
		query;
		log;
		tick().then(() => {
			matchCount = body ? body.querySelectorAll('mark').length : 0;
			current = 0;
			focusMatch();
		});
	});

	function focusMatch() {
		const marks = body.querySelectorAll('mark');
		marks.forEach((mark, i) => mark.classList.toggle('current', i === current));
		marks[current]?.scrollIntoView({ block: 'center' });
	}

	function step(by) {
		if (!matchCount) return;
		current = (current + by + matchCount) % matchCount;
		focusMatch();
	}

	// Ctrl+F / Cmd+F finds inside the log instead of the page behind it
	function onKeydown(e) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
			e.preventDefault();
			findBox.focus();
			findBox.select();
		}
	}

	function onFindKeydown(e) {
		// Escape in a search box would only clear it; close the viewer straight away instead
		if (e.key === 'Escape') {
			e.preventDefault();
			dialog.close();
		}
		if (e.key === 'Enter') {
			e.preventDefault();
			step(e.shiftKey ? -1 : 1);
		}
	}

	// A click on the dimmed backdrop (the dialog element itself, outside its box) closes it
	const onClick = (e) => { if (e.target === dialog) dialog.close(); };
</script>

<svelte:head>
	<link rel="stylesheet" href="/css/log-viewer.css"/>
</svelte:head>

<dialog class="logViewer" bind:this={dialog} onkeydown={onKeydown} onclick={onClick} aria-label="Log from {title}">
	<div class="logViewerBox pixelBox">
		<header class="logViewerHeader">
			<h2>{title}</h2>
			<div class="logViewerFind">
				<input
					type="text"
					placeholder="Find (Ctrl+F)"
					aria-label="Find in log"
					spellcheck="false"
					bind:value={query}
					bind:this={findBox}
					onkeydown={onFindKeydown}
				>
				{#if query}<span class="logViewerCount">{matchCount ? current + 1 : 0}/{matchCount}</span>{/if}
			</div>
			<button class="logViewerClose" onclick={() => dialog.close()} aria-label="Close log">&times;</button>
		</header>
		<div class="logViewerBody" bind:this={body}>
			<LogLines {log} {query}/>
		</div>
	</div>
</dialog>
