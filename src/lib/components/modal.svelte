<script>
	// A dialog over the page (the browser's <dialog>: focus stays inside, Escape closes it). Open while `open` is true;
	// closing it any way sets `open` back to false
	let { open = $bindable(false), title, children } = $props();
	let dialog;

	$effect(() => {
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} aria-labelledby="modalTitle">
	<h2 id="modalTitle">{title}</h2>
	{#if open}{@render children?.()}{/if}
</dialog>

<style>
	dialog {
		max-width: min(36rem, 90vw);
		padding: 1rem 1.25rem;
		border: 2px solid var(--darkest4);
		background: var(--darkest1);
		color: inherit;
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 60%);
	}
</style>
