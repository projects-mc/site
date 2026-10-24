<script lang="ts">
	let { name, dontShowHeader = false }: { name: string; dontShowHeader?: boolean } = $props();
</script>
<svelte:head>
	<title>{ name } - Playboard</title>
</svelte:head>

{#if !dontShowHeader}<h1>{name}</h1>{/if}
