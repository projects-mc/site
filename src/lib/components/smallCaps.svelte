<script lang="ts">
	import { smallCaps } from '#lib/smallCaps.ts';

	// Shows text in small caps; screen readers get the plain text, not the odd letters
	let { text }: { text: string } = $props();
</script>

<span aria-hidden="true">{smallCaps(text)}</span><span class="srOnly">{text}</span>
