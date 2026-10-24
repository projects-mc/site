<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import Title from '#lib/components/title.svelte';

	// Unknown pages go straight to the homepage; replaceState keeps the dead URL out of history
	let isNotFound = $derived(page.status === 404);
	onMount(() => { if (isNotFound) void goto(resolve('/'), { replaceState: true }); });
</script>

{#if !isNotFound}
	<Title name="Error {page.status}" dontShowHeader/>

	<h1>Error {page.status}: {page.error?.message}</h1>
	<p>Something went wrong. Try <a href={resolve('/')}>heading back to the homepage.</a></p>
{/if}
