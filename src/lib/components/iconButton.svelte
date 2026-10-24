<script lang="ts">
	import { tooltip } from '#lib/tooltip.ts';

	// A pixel art icon as a button, named by a tooltip above it
	let { icon, label, onclick }: { icon: string; label: string; onclick: (event: MouseEvent) => void } = $props();
</script>

<button class="iconButton" aria-label={label} use:tooltip={label} {onclick}>
	<img src="/media/icons/{icon}.png" alt="">
</button>
