<script>
	import { untrack } from 'svelte';
	import { act } from '#lib/session.svelte.js';
	import { api } from '#lib/api';
	import { preview, toRows, fromRows, LINES, WIDTH } from '#lib/minimessage';

	// Edits a server's description in the lobby's game picker, with a preview of how the game shows it
	let { instance } = $props();
	let rows = $state('');
	let saved = $state('');
	let saving = $state(false);
	let shown = $derived(preview(fromRows(rows)));

	let lastName = '';
	// Picks up the saved value when switching servers, or when it changed elsewhere and there are no unsaved edits
	$effect(() => {
		const current = instance.motd ?? '';
		const name = instance.name;
		untrack(() => {
			if (name !== lastName || fromRows(rows) === saved) rows = toRows(current);
			saved = current;
			lastName = name;
		});
	});

	const css = (style) =>
		[
			style.color && `color:${style.color}`,
			style.bold && 'font-weight:bold',
			style.italic && 'font-style:italic',
			(style.underlined || style.strikethrough) &&
				`text-decoration:${[style.underlined && 'underline', style.strikethrough && 'line-through'].filter(Boolean).join(' ')}`
		]
			.filter(Boolean)
			.join(';');

	async function save(e) {
		e.preventDefault();
		saving = true;
		await act(() => api.setMotd(instance.name, fromRows(rows)));
		saving = false;
	}
</script>

<form onsubmit={save}>
	<p>Shown for this server in the lobby's game picker: up to {LINES} lines of {WIDTH} characters, in
		<a href="https://docs.advntr.dev/minimessage/format.html" target="_blank" rel="noreferrer">MiniMessage</a>.
		Colors, styles, gradients, <code>&lt;sprite:item/diamond&gt;</code> and <code>&lt;head:Notch&gt;</code> work
		(each sprite or head counts as one character); clicks and hovers don't. It's the <code>motd</code> line in
		<code>server.toml</code>.</p>
	<div class="motd">
		<textarea bind:value={rows} rows={LINES} cols={WIDTH + 10} spellcheck="false" placeholder="&lt;gold&gt;Bed wars!"></textarea>
		<div class="preview" aria-label="Preview">
			{#each shown.lines as line, i (i)}
				<div>{#each line.segments as segment, j (j)}{#if segment.sprite}<span class="sprite" title={segment.sprite} style={css(segment.style)}>■</span>{:else}<span style={css(segment.style)}>{segment.text}</span>{/if}{/each}&#8203;</div>
			{/each}
		</div>
	</div>
	{#if shown.clipped}<p>Too long: the game cuts what's past {LINES} lines or {WIDTH} characters a line.</p>{/if}
	<button disabled={saving || fromRows(rows) === saved}>{saving ? 'Saving...' : 'Save'}</button>
</form>

<style>
	.motd {
		display: flex;
		gap: 1em;
		flex-wrap: wrap;
	}
	.preview {
		background: #1e1e1e;
		color: #ffffff;
		font-family: monospace;
		padding: 0.5em;
		min-width: 32ch;
		white-space: pre;
	}
	.sprite {
		opacity: 0.7;
	}
</style>
