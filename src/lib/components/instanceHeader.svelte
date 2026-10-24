<script lang="ts">
	import Title from '#lib/components/title.svelte';
	import { currentInstance } from '#lib/session.svelte.ts';

	// page: what the browser tab calls this page; the visible header is the instance's name
	let { page }: { page: string } = $props();
	let name = $derived(currentInstance()?.name ?? '');
</script>

<Title name="{page} - {name}" dontShowHeader/>

<h1 class="instanceTitle">[{name}]</h1>
