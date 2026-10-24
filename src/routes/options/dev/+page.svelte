<script lang="ts">
	import Title from '#lib/components/title.svelte';
	import { currentInstance, can } from '#lib/session.svelte.ts';
	import { api } from '#lib/api.ts';
	import { checkout } from '#lib/git.ts';
	import { ago } from '#lib/format.ts';
	import type { GitSettings, GitState } from '#lib/types.ts';

	// The server's files can follow a branch of a git repository; aspen keeps the settings and does the git work
	let name = $derived(currentInstance()?.name ?? '');
	let running = $derived(currentInstance()?.phase === 'running');
	let maySee = $derived(can('git'));
	let repo: GitState | null = $state(null);
	let settings: GitSettings = $state({ url: '', branch: 'main', autoReload: false, pullOnStart: false });
	let commit = $state('');
	let busy = $state('');
	let error = $state('');

	$effect(() => {
		const loading = name;
		repo = null;
		error = '';
		if (!loading || !maySee) return;
		// Fetching takes a moment: only for the server still selected
		api.git(loading).then(
			(reply) => {
				if (loading === name) show(reply);
			},
			(e: unknown) => {
				if (loading === name) error = e instanceof Error ? e.message : String(e);
			}
		);
	});

	function show(reply: GitState) {
		repo = reply;
		settings = { url: reply.url, branch: reply.branch, autoReload: reply.autoReload, pullOnStart: reply.pullOnStart };
		commit = reply.head?.hash ?? reply.latest?.hash ?? '';
	}

	async function run(what: string, action: () => Promise<GitState | null>) {
		busy = what;
		error = '';
		try {
			const reply = await action();
			if (reply) show(reply);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
		busy = '';
	}

	function save(e: SubmitEvent) {
		e.preventDefault();
		void run('save', () => api.gitSettings(name, { ...settings, url: settings.url.trim(), branch: settings.branch.trim() }));
	}

	function remove() {
		if (confirm('Stop following this repository? The files stay as they are.'))
			void run('save', () => api.gitSettings(name, { url: '', branch: '' }));
	}

	function rollBack() {
		const notes: string[] = [];
		if (repo?.autoReload) notes.push('Auto-update is on: the server stays on this commit until a new commit is pushed, then updates to that.');
		if (repo?.pullOnStart) notes.push('Update on start is on: the next time the server starts, it goes back to the latest commit.');
		if (notes.length && !confirm(`${notes.join('\n\n')}\n\nRoll back anyway?`)) return;
		void run('rollback', () => checkout(name, commit));
	}

	const short = (hash: string) => hash.slice(0, 7);
</script>

<Title name="Development"/>
<h2>Git</h2>
<p>Puts this server's files on a branch of a git repository: update when it has new commits, or roll back to an earlier
	one. If the server is running, the scripts that changed (and those that depend on them) are reloaded. Files the
	repository doesn't have are left alone.</p>
{#if !maySee}<p>The owner hasn't let you see this server's git settings.</p>{/if}
{#if error}<p>{error}</p>{/if}
{#if repo?.warning}<p>{repo.warning}</p>{/if}

{#if maySee && repo?.url}
	{#if repo.error}
		<p>Couldn't reach the repository: {repo.error}</p>
	{:else}
		<p>On {#if repo.head}<code>{short(repo.head.hash)}</code> {repo.head.message}{:else}no commit yet{/if}.</p>
		{#if repo.updateAvailable && repo.latest && can('git.update')}
			<p>New: <code>{short(repo.latest.hash)}</code> {repo.latest.message}
				<button onclick={() => run('update', () => checkout(name, null))} disabled={!!busy}>
					{busy === 'update' ? 'Updating...' : running ? 'Update and reload' : 'Update'}
				</button></p>
		{/if}
		{#if repo.dirty?.length}
			<p>Changed on this server since (updating overwrites them): {repo.dirty.join(', ')}</p>
		{/if}
		{#if repo.commits.length && can('git.update')}
			<h3>Roll back</h3>
			<p>
				<select bind:value={commit}>
					{#each repo.commits as c (c.hash)}
						<option value={c.hash}>{short(c.hash)} {c.message} ({c.author}, {ago(c.time)})</option>
					{/each}
				</select>
				<button onclick={rollBack} disabled={!!busy || commit === repo.head?.hash}>
					{busy === 'rollback' ? 'Rolling back...' : 'Roll back to it'}
				</button>
			</p>
			{#if repo.autoReload || repo.pullOnStart}
				<p>Rolling back with
					{repo.autoReload && repo.pullOnStart ? 'auto-update and update on start' : repo.autoReload ? 'auto-update' : 'update on start'}
					on:
					{#if repo.autoReload}the server stays on that commit until a new one is pushed, then updates to it.{/if}
					{#if repo.pullOnStart}The next start goes back to the latest commit.{/if}</p>
			{/if}
		{/if}
	{/if}
{/if}

{#if can('git.settings')}
<h3>Settings</h3>
<form onsubmit={save}>
	<label>Repository <input type="text" bind:value={settings.url} placeholder="https://github.com/you/your-server.git" required size="50"></label>
	<label>Branch <input type="text" bind:value={settings.branch} required size="12"></label>
	<label><input type="checkbox" bind:checked={settings.autoReload}> Update and reload on every new commit
		(checked every 5 minutes while the server runs)</label>
	<label><input type="checkbox" bind:checked={settings.pullOnStart}> Update when the server starts (starts a bit slower)</label>
	<p>For a private repository, put an access token in the address: <code>https://TOKEN@github.com/you/repo.git</code>.
		It's never shown again; leave the <code>***</code> to keep it. Automatic updates overwrite changes made to the
		repository's files on this server.</p>
	<button disabled={!!busy}>{busy === 'save' ? 'Saving...' : 'Save'}</button>
	{#if repo?.url}<button type="button" onclick={remove} disabled={!!busy}>Remove</button>{/if}
</form>
{/if}
