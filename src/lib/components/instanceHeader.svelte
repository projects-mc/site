<script>
	import Title from '#lib/components/title.svelte';
	import { currentInstance } from '#lib/instance.svelte.js';

	// page: what the browser tab calls this page; the visible header is the instance's name
	let { page } = $props();
	let instance = $derived(currentInstance());
</script>

<Title name="{page} - {instance.name}" dontShowHeader/>

<h1 class="instanceTitle">[{instance.name}]</h1>
