<script lang="ts">
	import { session, select } from '#lib/session.svelte.ts';
	import { api } from '#lib/api.ts';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	function open(name: string) {
		select(name);
		void goto(resolve('/console'));
	}

	async function logOut() {
		await api.logout();
		location.reload();
	}
</script>

<svelte:head>
	<title>Playboard</title>
</svelte:head>

<h1>Playboard</h1>
{#if !session.loaded}
	<!-- Blank until the session is known, rather than flashing a loading line -->
{:else if !session.user}
	<p>Free Minecraft servers you build with Skript.</p>
	<p>To manage your servers, join <code>playboardmc.com</code> in Minecraft and type <code>/dashboard</code> in the lobby.</p>
{:else}
	<p>Logged in as <b>{session.user.name || session.user.id}</b>. <button onclick={logOut}>Log out</button></p>
	{#if session.instances.length === 0}
		<p>You don't have a server yet. <a href={resolve('/console')}>Open the dashboard</a> and make one with <b>New</b> in the server box.</p>
	{:else}
		<ul class="historyList">
			{#each session.instances as instance (instance.name)}
				<li class="historyItem pixelBox" style="--historyColumns: 2fr 1fr auto">
					<span class="historyLabel">{instance.name}</span>
					<span>{instance.phase}{instance.players ? `, ${instance.players} playing` : ''}</span>
					<span class="historyActions"><button onclick={() => open(instance.name)}>Open</button></span>
				</li>
			{/each}
		</ul>
	{/if}
{/if}
