<script lang="ts">
	import Title from '#lib/components/title.svelte';
	import MotdEditor from '#lib/components/motdEditor.svelte';
	import { session, currentInstance, act } from '#lib/session.svelte.ts';
	import { api } from '#lib/api.ts';
	import { formatBytes } from '#lib/format.ts';
	import type { Player } from '#lib/types.ts';

	let instance = $derived(currentInstance());
	// Members can do everything but delete the instance and change its members
	let isOwner = $derived(instance?.owner?.id === session.user?.id || session.user?.admin);
	let player = $state('');

	function remove() {
		if (!instance) return;
		const name = instance.name;
		const typed = prompt(`This deletes ${name}, its files and its backups for good. Type its name to confirm:`);
		if (typed?.trim().toLowerCase() === name) void act(() => api.remove(name));
	}

	async function addMember(e: SubmitEvent) {
		e.preventDefault();
		const name = instance?.name;
		if (!name) return;
		await act(() => api.addMember(name, player.trim()));
		player = '';
	}

	async function removeMember(member: Player) {
		const name = instance?.name;
		if (!name) return;
		const leaving = member.id === session.user?.id;
		if (!confirm(leaving ? `Leave ${name}? You won't see it here any more.` : `Remove ${member.name || member.id}?`)) return;
		await act(() => api.removeMember(name, member.id));
	}

	// A whole new settings file; aspen refuses one with anything players can't set
	async function uploadSettings(e: Event & { currentTarget: HTMLInputElement }) {
		const file = e.currentTarget.files?.[0];
		e.currentTarget.value = '';
		const name = instance?.name;
		if (file && name) await act(async () => api.putSettings(name, await file.text()));
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
	<h2>Settings</h2>
	<p>The server's settings (view distances, world height, its description) are kept beside its files, where scripts
		can't change them. Download them, edit them and upload them again; they apply when the server next starts.</p>
	<p><button onclick={() => location.assign(api.settingsLink(instance.name))}>Download settings.toml</button>
		<label>Upload <input type="file" accept=".toml,text/plain" onchange={uploadSettings}></label></p>
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
