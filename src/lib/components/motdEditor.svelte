<script>
	import { untrack } from 'svelte';
	import { act } from '#lib/session.svelte.js';
	import { api } from '#lib/api';
	import { preview, toRows, fromRows, headId, headImage, HEAD_TAG, LINES, WIDTH } from '#lib/minimessage';

	// Edits a server's description in the lobby's game picker, with a preview of how the game shows it
	let { instance } = $props();
	let rows = $state('');
	let saved = $state('');
	let saving = $state(false);
	let shown = $derived(preview(fromRows(rows)));

	// The editor is plain text except that each whole <head:...> tag shows as just the face, so a texture value's
	// long base64 never fills it. The tag is kept on the face and is what's saved
	let editor = $state();
	let typed = null;

	function face(tag) {
		const chip = document.createElement('span');
		chip.className = 'head';
		chip.contentEditable = 'false';
		chip.dataset.tag = tag;
		const id = headId(tag.slice(6, -1));
		const img = document.createElement('img');
		img.alt = id && id.length <= 16 ? `${id}'s head` : 'head';
		img.title = img.alt;
		if (id) img.src = headImage(id);
		chip.append(img);
		return chip;
	}

	function render(text) {
		const nodes = [];
		let at = 0;
		for (const match of text.matchAll(HEAD_TAG)) {
			nodes.push(document.createTextNode(text.slice(at, match.index)), face(match[0]));
			at = match.index + match[0].length;
		}
		nodes.push(document.createTextNode(text.slice(at)));
		// Svelte renders nothing inside the editor, so its contents are this code's alone
		// eslint-disable-next-line svelte/no-dom-manipulating
		editor.replaceChildren(...nodes);
	}

	// The editor's text, with faces back as their tags and line breaks however the browser made them
	function read(node = editor) {
		let text = '';
		for (const child of node.childNodes) {
			if (child.nodeType === Node.TEXT_NODE) text += child.nodeValue;
			else if (child.dataset?.tag) text += child.dataset.tag;
			else if (child.nodeName === 'BR') text += '\n';
			else {
				if (text && !text.endsWith('\n') && /^(DIV|P)$/.test(child.nodeName)) text += '\n';
				text += read(child);
			}
		}
		return text;
	}

	function oninput() {
		const text = read();
		typed = rows = text;
		// A head tag was just finished or pasted: turn it into its face, the cursor staying where it was
		if ((text.match(HEAD_TAG)?.length ?? 0) !== editor.querySelectorAll('.head').length) {
			const before = text.length - caretFromEnd();
			render(text);
			placeCaret(before);
		}
	}

	function replace(text, caret) {
		typed = rows = text;
		render(text);
		placeCaret(caret);
	}

	// The face next to the cursor on one side, if there is one and nothing is selected
	function faceBeside(before) {
		const selection = getSelection();
		if (!selection.rangeCount || !selection.isCollapsed) return null;
		let { startContainer: node, startOffset: offset } = selection.getRangeAt(0);
		if (node.nodeType === Node.TEXT_NODE) {
			if (offset !== (before ? 0 : node.nodeValue.length)) return null;
			const next = before ? node.previousSibling : node.nextSibling;
			return next?.dataset?.tag ? next : null;
		}
		const next = node.childNodes[before ? offset - 1 : offset];
		return next?.dataset?.tag ? next : null;
	}

	// A face is its tag condensed: deleting next to it takes off the tag's last (or first) character, unfolding it
	// back into text to edit. Enter adds a line break as text
	function onkeydown(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			document.execCommand('insertText', false, '\n');
			return;
		}
		// Left and right step over a face like over one character, the cursor landing right beside it
		if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
			const left = e.key === 'ArrowLeft';
			const chip = faceBeside(left);
			if (!chip) return;
			e.preventDefault();
			// In the text beside it (render always leaves some, if empty), where browsers draw the cursor reliably
			const range = document.createRange();
			const beside = left ? chip.previousSibling : chip.nextSibling;
			if (beside?.nodeType === Node.TEXT_NODE) range.setStart(beside, left ? beside.nodeValue.length : 0);
			else if (left) range.setStartBefore(chip);
			else range.setStartAfter(chip);
			range.collapse(true);
			getSelection().removeAllRanges();
			getSelection().addRange(range);
			return;
		}
		if (e.key !== 'Backspace' && e.key !== 'Delete') return;
		const backwards = e.key === 'Backspace';
		if (!faceBeside(backwards)) return;
		e.preventDefault();
		// Not a whole tag any more, so it renders as text
		const text = read();
		const at = text.length - caretFromEnd();
		if (backwards) replace(text.slice(0, at - 1) + text.slice(at), at - 1);
		else replace(text.slice(0, at) + text.slice(at + 1), at);
	}

	// Copying or cutting takes the faces as their whole tags
	function selected() {
		const selection = getSelection();
		if (!selection.rangeCount) return '';
		const holder = document.createElement('div');
		holder.append(selection.getRangeAt(0).cloneContents());
		return read(holder);
	}
	function oncopy(e) {
		e.preventDefault();
		e.clipboardData.setData('text/plain', selected());
	}
	function oncut(e) {
		oncopy(e);
		getSelection().deleteFromDocument();
		oninput();
	}

	// Characters (tags counted whole) between the cursor and the end, so it can be put back after rendering
	function caretFromEnd() {
		const selection = getSelection();
		if (!selection.rangeCount) return 0;
		const range = document.createRange();
		range.selectNodeContents(editor);
		range.setStart(selection.getRangeAt(0).endContainer, selection.getRangeAt(0).endOffset);
		const after = document.createElement('div');
		after.append(range.cloneContents());
		return read(after).length;
	}

	function placeCaret(offset) {
		let left = offset;
		const range = document.createRange();
		range.selectNodeContents(editor);
		range.collapse(false);
		for (const child of editor.childNodes) {
			const length = child.nodeType === Node.TEXT_NODE ? child.nodeValue.length : child.dataset.tag.length;
			if (left <= length) {
				if (child.nodeType === Node.TEXT_NODE) range.setStart(child, left);
				else range.setStartAfter(child);
				range.collapse(true);
				break;
			}
			left -= length;
		}
		getSelection().removeAllRanges();
		getSelection().addRange(range);
	}

	// Text set from outside (another server, or saved elsewhere) is drawn again; what was just typed already is
	$effect(() => {
		const text = rows;
		if (editor && text !== typed) untrack(() => render(text));
	});

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
			// Monocraft has no bold face: the game draws bold text twice, a font pixel apart
			style.bold && 'text-shadow:var(--fontPixel) 0 0 currentColor,var(--boldShadow)',
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
		<div
			class="editor field"
			class:empty={!rows}
			bind:this={editor}
			contenteditable="plaintext-only"
			role="textbox"
			tabindex="0"
			aria-multiline="true"
			aria-label="Description"
			spellcheck="false"
			{oninput}
			{onkeydown}
			{oncopy}
			{oncut}
		></div>
		<div class="preview pixelBox" aria-label="Preview">
			{#each shown.lines as line, i (i)}
				<div>{#each line.segments as segment, j (j)}{#if segment.head !== undefined}<span class="head" style={css(segment.style)}>{#if segment.head}<img src={headImage(segment.head)} alt="">{:else}■{/if}</span>{:else if segment.sprite}<span class="sprite" title={segment.sprite} style={css(segment.style)}>■</span>{:else}<span style={css(segment.style)}>{segment.text}</span>{/if}{/each}&#8203;</div>
			{/each}
		</div>
	</div>
	{#if shown.clipped}<p>Too long: the game cuts what's past {LINES} lines or {WIDTH} characters a line.</p>{/if}
	<button disabled={saving || fromRows(rows) === saved}>{saving ? 'Saving...' : 'Save'}</button>
</form>

<style>
	.motd {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		flex-wrap: wrap;
	}

	/* Both ten lines tall, as many as the game shows */
	.editor,
	.preview {
		min-height: calc(10lh + 2 * var(--pc) + 20px);
		padding: 10px 12px;
		white-space: pre; /* lines as the game has them: no wrapping, scrolls sideways */
	}

	/* A text field (.field), one that shows heads as their faces */
	.editor {
		width: calc(40ch + 24px + 2 * var(--pc)); /* the 30 characters a line, and room to spare for tags */
		margin: 0;
		overflow-x: auto;
		cursor: text;
	}
	.editor.empty::before {
		content: '<gold>Bed wars!';
		color: var(--lightest3);
		opacity: 0.5;
		pointer-events: none;
	}

	/* The game's dark panel, as a pixel box */
	.preview {
		min-width: calc(30ch + 24px + 2 * var(--pc));
		background-color: color-mix(in srgb, var(--darkest1) 45%, black);
		color: #ffffff;
		--boldShadow: var(--fontPixel) var(--fontPixel) 0 color-mix(in srgb, currentColor 15%, black),
			calc(2 * var(--fontPixel)) var(--fontPixel) 0 color-mix(in srgb, currentColor 15%, black);
	}
	.sprite {
		opacity: 0.7;
	}

	/* A head: its 8x8 face, as big as the game draws it next to the text */
	:is(.editor, .preview) :global(.head img) {
		display: inline; /* in the line of text, not the reset's block */
		width: calc(8 * var(--fontPixel));
		height: calc(8 * var(--fontPixel));
		vertical-align: calc(-1 * var(--fontPixel));
	}
	.editor :global(.head) {
		display: inline-block; /* one unit the cursor sits beside */
		margin: 0 var(--fontPixel);
	}
</style>
