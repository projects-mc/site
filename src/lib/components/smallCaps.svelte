<script>
	import { smallCaps } from '#lib/smallCaps';

	// Shows text in small caps; screen readers get the plain text, not the odd letters
	let { text } = $props();
</script>

<span aria-hidden="true">{smallCaps(text)}</span><span class="srOnly">{text}</span>
