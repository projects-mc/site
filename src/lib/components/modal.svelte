<script lang="ts">
	import type { Snippet } from 'svelte';

	// A dialog over the page (the browser's <dialog>: focus stays inside, Escape closes it), centred, as a pixel box
	// like the log viewer. Open while `open` is true; closing it any way sets `open` back to false
	let { open = $bindable(false), title, children }: { open?: boolean; title: string; children: Snippet } = $props();
	let dialog: HTMLDialogElement;

	$effect(() => {
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} aria-labelledby="modalTitle">
	<div class="modalBox pixelBox">
		<header>
			<h2 id="modalTitle">{title}</h2>
			<button class="closeButton" onclick={() => dialog.close()} aria-label="Close">&times;</button>
		</header>
		{#if open}{@render children?.()}{/if}
	</div>
</dialog>

<style>
	dialog {
		width: min(36rem, 90vw);
		max-width: none;
		margin: auto; /* the global margin reset would pin it to the top left */
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		overflow: visible; /* room for the box's drop shadow */
	}

	dialog::backdrop {
		background: rgb(46 52 64 / 0.85);
	}

	.modalBox {
		padding: 12px 20px 16px;
		background-color: var(--darkest1);
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	h2 {
		margin: 0;
		color: var(--lightest1);
	}
</style>
