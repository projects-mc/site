<script>
	// A titled list of dated entries (backups, logs), newest first and outlined as the latest.
	// Snippets, each optional: headerAction beside the title; label (given the entry and whether it's the latest)
	// replacing the "Latest"/age text; range replacing the entry's range text; rowActions at the end of each row.
	// Columns with nothing to show (no range, no sizes) are left out
	let { title, items, emptyText, headerAction, label, range, rowActions } = $props();
	let hasRange = $derived(!!range || items.some((item) => item.range));
	let hasSize = $derived(items.some((item) => item.size));
	let columns = $derived(['2fr', hasRange && '3fr', hasSize && '1fr', 'auto'].filter(Boolean).join(' '));
</script>

<svelte:head>
	<link rel="stylesheet" href="/css/history.css"/>
</svelte:head>

<section>
	<div class="historyHeader">
		<h2>{title}</h2>
		{#if headerAction}<div class="historyHeaderActions">{@render headerAction()}</div>{/if}
	</div>

	{#if items.length === 0}
		<p>{emptyText}</p>
	{:else}
		<ul class="historyList" style="--historyColumns: {columns}">
			{#each items as item, i (item.id ?? i)}
				<li class="historyItem pixelBox" class:latest={i === 0}>
					<span class="historyLabel">{#if label}{@render label(item, i === 0)}{:else}{i === 0 ? 'Latest' : item.age}{/if}</span>
					{#if hasRange}<span class="historyRange">{#if range}{@render range(item)}{:else}{item.range}{/if}</span>{/if}
					{#if hasSize}<span class="historySize">{item.size}</span>{/if}
					<span class="historyActions">{@render rowActions?.(item)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>
