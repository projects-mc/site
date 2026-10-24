<script lang="ts">
	import Title from '#lib/components/title.svelte';
	import MotdEditor from '#lib/components/motdEditor.svelte';
	import { session, currentInstance, act, can } from '#lib/session.svelte.ts';
	import { api } from '#lib/api.ts';
	import { formatBytes } from '#lib/format.ts';
	import { PERMISSIONS, type Permission } from '#lib/permissions.ts';
	import type { Member } from '#lib/types.ts';

	let instance = $derived(currentInstance());
	// Members do only what the owner lets them (see #lib/permissions.ts), and never delete the instance or change members
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

	async function removeMember(member: Member) {
		const name = instance?.name;
		if (!name) return;
		const leaving = member.id === session.user?.id;
		if (!confirm(leaving ? `Leave ${name}? You won't see it here any more.` : `Remove ${member.name || member.id}?`)) return;
		await act(() => api.removeMember(name, member.id));
	}

	// Saved as soon as a box is ticked; the instance list comes back with the change
	function toggle(member: Member, permission: Permission, on: boolean) {
		const name = instance?.name;
		if (!name) return;
		const permissions = on ? [...member.permissions, permission] : member.permissions.filter((p) => p !== permission);
		void act(() => api.setMemberPermissions(name, member.id, permissions));
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
	{#if can('settings')}
		<h2>Settings</h2>
		<p>The server's settings (view distances, world height, its description) are kept beside its files, where scripts
			can't change them. Download them, edit them and upload them again; they apply when the server next starts.</p>
		<p><button onclick={() => location.assign(api.settingsLink(instance.name))}>Download settings.toml</button>
			<label>Upload <input type="file" accept=".toml,text/plain" onchange={uploadSettings}></label></p>
	{/if}
	{#if !instance.lobby}
		{#if can('settings')}
			<h2>Game picker</h2>
			<MotdEditor {instance}/>
		{/if}
		<h2>Members</h2>
		<p>Members help run the server, doing only what the owner ticks for them, and get <code>/pb</code> controls in game
			to match. They can never delete the server or change its members. An indented permission also needs the one
			above it.</p>
		{#if instance.members?.length}
			{#each instance.members as member (member.id)}
				<fieldset>
					<legend>{member.name || member.id}
						{#if isOwner || member.id === session.user?.id}
							<button onclick={() => removeMember(member)}>{member.id === session.user?.id ? 'Leave' : 'Remove'}</button>
						{/if}
					</legend>
					{#each PERMISSIONS as [permission, label] (permission)}
						<label class:indented={permission.includes('.')}>
							<input
								type="checkbox"
								checked={member.permissions.includes(permission)}
								disabled={!isOwner}
								onchange={(e) => toggle(member, permission, e.currentTarget.checked)}
							>
							{label}
						</label>
					{/each}
				</fieldset>
			{/each}
		{:else}
			<p>No members yet.</p>
		{/if}
		{#if isOwner}
			<form onsubmit={addMember}>
				<label>Player <input type="text" bind:value={player} placeholder="name or UUID" required size="36"></label>
				<button>Add</button>
			</form>
			<p>By name, the player must have opened the dashboard once (<code>/dashboard</code> in the lobby). New members
				can start, stop and restart the server until you tick more.</p>
			<h2>Delete</h2>
			<p><button onclick={remove} disabled={instance.phase !== 'stopped'}>Delete {instance.name}</button>
				{#if instance.phase !== 'stopped'}Stop it first.{/if}</p>
		{/if}
	{/if}
{/if}

<style>
	label {
		display: block;
	}

	.indented {
		padding-left: 1.5em;
	}
</style>
