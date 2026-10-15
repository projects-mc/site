<script>
	import { session, select } from '#lib/session.svelte.js';
	import { api } from '#lib/api';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	function open(name) {
		select(name);
		goto(resolve('/console'));
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
	<p>Loading...</p>
{:else if !session.user}
	<p>Free Minecraft servers you build with Skript.</p>
	<p>To manage your servers, join <code>playboardmc.com</code> in Minecraft and type <code>/dashboard</code> in the lobby.</p>
{:else}
	<p>Logged in as <b>{session.user.name || session.user.id}</b>. <button onclick={logOut}>Log out</button></p>
	{#if session.instances.length === 0}
		<p>You don't have a server yet. Make one with <b>New</b> in the server box on the left.</p>
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
