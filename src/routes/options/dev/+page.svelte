<script>
	import Title from '#lib/components/title.svelte';
	import { currentInstance } from '#lib/session.svelte.js';
	import { api } from '#lib/api';

	// Pulls a git branch into the server's files. The repository and branch are remembered per server in this browser
	let name = $derived(currentInstance()?.name);
	let url = $state('');
	let branch = $state('main');
	let output = $state('');
	let pulling = $state(false);

	$effect(() => {
		const saved = JSON.parse(localStorage.getItem(`git:${name}`) ?? '{}');
		url = saved.url ?? '';
		branch = saved.branch ?? 'main';
		output = '';
	});

	async function pull(e) {
		e.preventDefault();
		localStorage.setItem(`git:${name}`, JSON.stringify({ url, branch }));
		pulling = true;
		try {
			output = (await api.gitPull(name, url.trim(), branch.trim())).output || 'Up to date.';
		} catch (error) {
			output = error.message;
		}
		pulling = false;
	}
</script>

<Title name="Development"/>
<h2>Pull from git</h2>
<p>Makes this server's files match a branch of a git repository. Files the repository doesn't have are left alone.
	For a private repository, put an access token in the address: <code>https://TOKEN@github.com/you/repo.git</code>.</p>
<form onsubmit={pull}>
	<label>Repository <input type="url" bind:value={url} placeholder="https://github.com/you/your-server.git" required size="50"></label>
	<label>Branch <input type="text" bind:value={branch} required size="12"></label>
	<button disabled={pulling}>{pulling ? 'Pulling...' : 'Pull'}</button>
</form>
{#if output}<pre>{output}</pre>{/if}
