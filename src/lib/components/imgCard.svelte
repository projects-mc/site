<script>
	let { children } = $props();
</script>

<div class="flex card">
	{@render children?.()}
</div>