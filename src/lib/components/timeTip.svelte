<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { tooltip } from '#lib/tooltip.ts';
	import { formatDay, formatTime, formatDateTime } from '#lib/format.ts';

	// Text with a tooltip of when it happened. Given no children it shows the day and the tooltip gives the time;
	// given children (a backup's name, say) the tooltip gives the full date and time
	let { iso, children }: { iso: string; children?: Snippet } = $props();

	let isClient = $state(false); // the server prerenders in UTC; the visitor's locale and timezone apply once loaded
	onMount(() => { isClient = true; });
	let when = $derived(isClient ? (children ? formatDateTime(iso) : formatTime(iso)) : '');
</script>

<span class="timeTipAnchor" tabindex="0" role="button" {...{ "aria-description": when }} use:tooltip={when}
	>{#if children}{@render children()}{:else}{formatDay(iso, isClient)}{/if}</span
>
