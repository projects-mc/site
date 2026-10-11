<script>
	import { onMount } from 'svelte';
	import { formatDay, formatTime, formatDateTime } from '#lib/format';

	// Text with a popover of when it happened, shown on hover or keyboard focus.
	// Given no children it shows the day and the popover gives the time; given children (a backup's name, say)
	// the popover gives the full date and time. The popover sits in the top layer so clipped pixel boxes can't cut it off
	let { iso, children } = $props();

	let isClient = $state(false); // the server prerenders in UTC; the visitor's locale and timezone apply once loaded
	onMount(() => { isClient = true; });
	let when = $derived(isClient ? (children ? formatDateTime(iso) : formatTime(iso)) : '');

	let anchor, tip;
	function show() {
		const box = anchor.getBoundingClientRect();
		tip.showPopover();
		tip.style.left = `${box.left + box.width / 2 - tip.offsetWidth / 2}px`;
		tip.style.top = `${box.top - tip.offsetHeight - 6}px`;
	}
	const hide = () => tip.hidePopover();
</script>

<span
	class="timeTipAnchor"
	bind:this={anchor}
	tabindex="0"
	role="button"
	aria-description={when}
	onmouseenter={show}
	onmouseleave={hide}
	onfocus={show}
	onblur={hide}
>{#if children}{@render children()}{:else}{formatDay(iso, isClient)}{/if}</span>
<span class="timeTip pixelBox" popover="manual" bind:this={tip}>{when}</span>
