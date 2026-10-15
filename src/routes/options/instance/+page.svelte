<script>
	import Title from '#lib/components/title.svelte';
	import { currentInstance, act } from '#lib/session.svelte.js';
	import { api } from '#lib/api';
	import { formatBytes } from '#lib/format';

	let instance = $derived(currentInstance());

	function remove() {
		const typed = prompt(`This deletes ${instance.name}, its files and its backups for good. Type its name to confirm:`);
		if (typed?.trim().toLowerCase() === instance.name) act(() => api.remove(instance.name));
	}
</script>

<Title name="Instance"/>
{#if instance}
	<p><b>{instance.name}</b> is {instance.phase}.</p>
	<p>Files: {formatBytes(instance.disk)} of {formatBytes(instance.diskMax)}</p>
	<p>Memory limit: {formatBytes(instance.memoryMax)}</p>
	<p>Players join it from the lobby's compass, or anyone on another server can be sent with
		<code>send player to server "{instance.name}"</code>.</p>
	{#if !instance.lobby}
		<h2>Delete</h2>
		<p><button onclick={remove} disabled={instance.phase !== 'stopped'}>Delete {instance.name}</button>
			{#if instance.phase !== 'stopped'}Stop it first.{/if}</p>
	{/if}
{/if}
