<script>
	import Title from '#lib/components/title.svelte';
	import MotdEditor from '#lib/components/motdEditor.svelte';
	import { session, currentInstance, act } from '#lib/session.svelte.js';
	import { api } from '#lib/api';
	import { formatBytes } from '#lib/format';

	let instance = $derived(currentInstance());
	// Members can do everything but delete the instance and change its members
	let isOwner = $derived(instance?.owner?.id === session.user?.id || session.user?.admin);
	let player = $state('');

	function remove() {
		const typed = prompt(`This deletes ${instance.name}, its files and its backups for good. Type its name to confirm:`);
		if (typed?.trim().toLowerCase() === instance.name) act(() => api.remove(instance.name));
	}

	async function addMember(e) {
		e.preventDefault();
		await act(() => api.addMember(instance.name, player.trim()));
		player = '';
	}

	async function removeMember(member) {
		const leaving = member.id === session.user?.id;
		if (!confirm(leaving ? `Leave ${instance.name}? You won't see it here any more.` : `Remove ${member.name || member.id}?`)) return;
		await act(() => api.removeMember(instance.name, member.id));
	}
</script>

<Title name="Instance"/>
{#if instance}
	<p><b>{instance.name}</b> is {instance.phase}.</p>
	{#if instance.owner && instance.owner.id !== session.user?.id}
		<p>Owned by {instance.owner.name || instance.owner.id}.</p>
	{/if}
	<p>Files: {formatBytes(instance.disk)} of {formatBytes(instance.diskMax)}</p>
	<p>Memory limit: {formatBytes(instance.memoryMax)}</p>
	<p>Players join it from the lobby's compass, or anyone on another server can be sent with
		<code>send player to server "{instance.name}"</code>.</p>
	{#if !instance.lobby}
		<h2>Game picker</h2>
		<MotdEditor {instance}/>
		<h2>Members</h2>
		<p>Members can do everything here except delete the server and change its members, and get the owner's
			<code>/pb</code> controls in game.</p>
		{#if instance.members?.length}
			<ul>
				{#each instance.members as member (member.id)}
					<li>{member.name || member.id}
						{#if isOwner || member.id === session.user?.id}
							<button onclick={() => removeMember(member)}>{member.id === session.user?.id ? 'Leave' : 'Remove'}</button>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p>No members yet.</p>
		{/if}
		{#if isOwner}
			<form onsubmit={addMember}>
				<label>Player <input type="text" bind:value={player} placeholder="name or UUID" required size="36"></label>
				<button>Add</button>
			</form>
			<p>By name, the player must have opened the dashboard once (<code>/dashboard</code> in the lobby).</p>
			<h2>Delete</h2>
			<p><button onclick={remove} disabled={instance.phase !== 'stopped'}>Delete {instance.name}</button>
				{#if instance.phase !== 'stopped'}Stop it first.{/if}</p>
		{/if}
	{/if}
{/if}
